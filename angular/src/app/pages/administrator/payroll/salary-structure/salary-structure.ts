import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';
import { EmployeesService } from '../../employees/employees.service';
import { PayrollService, SalaryStructureData } from '../payroll.service';

@Component({
  selector: 'app-salary-structure',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule
  ],
  templateUrl: './salary-structure.html',
  styleUrl: './salary-structure.css'
})
export class SalaryStructure implements OnInit {
  salaryForm: FormGroup;
  employees: { id: string; name: string; department?: string; designation?: string }[] = [];
  savedStructures: SalaryStructureData[] = [];
  isEditMode = false;

  constructor(
    private fb: FormBuilder,
    private employeesService: EmployeesService,
    private payrollService: PayrollService
  ) {
    this.salaryForm = this.fb.group({
      employeeId: ['', Validators.required],
      employeeName: [''],
      department: ['IT'],
      designation: [''],
      salaryType: ['Monthly'],
      effectiveDate: [new Date().toISOString().split('T')[0]],
      basicSalary: [0, [Validators.required, Validators.min(0)]],
      hra: [0],
      da: [0],
      conveyance: [0],
      medical: [0],
      specialAllowance: [0],
      bonus: [0],
      otherAllowance: [0],
      pf: [0],
      esic: [0],
      professionalTax: [0],
      tds: [0],
      loan: [0],
      advanceSalary: [0],
      otherDeduction: [0],
      grossSalary: [0],
      totalDeduction: [0],
      netSalary: [0],
      remarks: ['']
    });
  }

  ngOnInit(): void {
    this.loadEmployeesList();
    this.loadSavedStructures();

    // Subscribe to real-time salary structures updates
    this.payrollService.salaryStructures$.subscribe({
      next: (structures) => {
        if (structures) {
          this.savedStructures = structures;
        }
      }
    });

    // Recalculate totals on form value change
    this.salaryForm.valueChanges.subscribe(() => {
      this.calculateTotals();
    });
  }

  departmentsList: string[] = [];

  loadEmployeesList(): void {
    this.employeesService.getEmployees().subscribe({
      next: (res: any) => {
        let list: any[] = [];
        if (Array.isArray(res)) {
          list = res;
        } else if (Array.isArray(res?.data)) {
          list = res.data;
        } else if (Array.isArray(res?.employees)) {
          list = res.employees;
        } else if (Array.isArray(res?.data?.employees)) {
          list = res.data.employees;
        } else if (res && typeof res === 'object') {
          const possibleArr = Object.values(res).find(v => Array.isArray(v));
          if (possibleArr) {
            list = possibleArr as any[];
          }
        }

        if ((!list || list.length === 0)) {
          const saved = localStorage.getItem('crm_employees_cache') || localStorage.getItem('crm_employees');
          if (saved) {
            try {
              const parsed = JSON.parse(saved);
              if (Array.isArray(parsed) && parsed.length > 0) {
                list = parsed;
              }
            } catch (e) {}
          }
        } else {
          localStorage.setItem('crm_employees_cache', JSON.stringify(list));
        }

        this.processEmployeesList(list);
      },
      error: (err) => {
        console.error('Failed to load employees for salary structure:', err);
        let list: any[] = [];
        const saved = localStorage.getItem('crm_employees_cache') || localStorage.getItem('crm_employees');
        if (saved) {
          try {
            const parsed = JSON.parse(saved);
            if (Array.isArray(parsed)) {
              list = parsed;
            }
          } catch (e) {}
        }
        this.processEmployeesList(list);
      }
    });
  }

  private processEmployeesList(list: any[]): void {
    if (list && list.length > 0) {
      this.employees = list.map((emp: any, index: number) => {
        const empId = emp.employeeId || emp.empId || emp.id || emp._id || `EMP${String(index + 1).padStart(3, '0')}`;
        
        let empName = '';
        if (emp.firstName || emp.lastName) {
          empName = `${emp.firstName || ''} ${emp.lastName || ''}`.trim();
        } else if (emp.name) {
          empName = emp.name;
        } else if (emp.fullName) {
          empName = emp.fullName;
        } else {
          empName = `Employee ${empId}`;
        }

        let dept = 'General';
        if (typeof emp.department === 'string' && emp.department.trim()) {
          dept = emp.department;
        } else if (typeof emp.department === 'object' && emp.department?.name) {
          dept = emp.department.name;
        } else if (emp.dept) {
          dept = emp.dept;
        }

        let desig = 'Staff';
        if (typeof emp.designation === 'string' && emp.designation.trim()) {
          desig = emp.designation;
        } else if (typeof emp.designation === 'object' && emp.designation?.name) {
          desig = emp.designation.name;
        } else if (emp.role) {
          desig = typeof emp.role === 'string' ? emp.role : (emp.role?.name || 'Staff');
        } else if (emp.position) {
          desig = emp.position;
        }

        return {
          id: empId,
          name: empName,
          department: dept,
          designation: desig
        };
      });
      this.departmentsList = Array.from(new Set(this.employees.map(e => e.department).filter(Boolean) as string[]));
    } else {
      this.employees = [];
      this.departmentsList = [];
    }
  }

  loadSavedStructures(): void {
    this.payrollService.getSalaryStructures().subscribe({
      next: (data) => {
        this.savedStructures = data || [];
      }
    });
  }

  onEmployeeSelect(event: any): void {
    const selectedId = event.target.value;
    if (!selectedId) {
      this.salaryForm.patchValue({
        employeeName: '',
        department: '',
        designation: ''
      }, { emitEvent: false });
      return;
    }

    const emp = this.employees.find(e => e.id === selectedId);
    if (emp) {
      this.salaryForm.patchValue({
        employeeName: emp.name,
        department: emp.department || 'General',
        designation: emp.designation || 'Staff'
      }, { emitEvent: false });
    }

    // Check if employee already has a saved structure
    const existing = this.payrollService.getSalaryStructureByEmployee(selectedId);
    if (existing) {
      this.isEditMode = true;
      this.salaryForm.patchValue({
        ...existing,
        employeeName: emp ? emp.name : existing.employeeName,
        department: emp ? emp.department : existing.department,
        designation: emp ? emp.designation : existing.designation
      }, { emitEvent: false });
      this.calculateTotals();
    } else {
      this.isEditMode = false;
    }
  }

  /**
   * Applies standard Indian Payroll Formulas based on Basic Salary
   */
  applyStandardFormulas(): void {
    const basic = Number(this.salaryForm.get('basicSalary')?.value || 0);
    if (basic <= 0) {
      alert('Please enter a valid Basic Salary greater than 0.');
      return;
    }

    const calculated = this.payrollService.calculateStandardSalary(basic);
    this.salaryForm.patchValue(calculated);
  }

  onBasicSalaryChange(): void {
    const basic = Number(this.salaryForm.get('basicSalary')?.value || 0);
    if (basic > 0) {
      const calculated = this.payrollService.calculateStandardSalary(basic);
      this.salaryForm.patchValue(calculated);
    } else {
      this.calculateTotals();
    }
  }

  calculateTotals(): void {
    const v = this.salaryForm.value;

    const gross =
      Number(v.basicSalary || 0) +
      Number(v.hra || 0) +
      Number(v.da || 0) +
      Number(v.conveyance || 0) +
      Number(v.medical || 0) +
      Number(v.specialAllowance || 0) +
      Number(v.bonus || 0) +
      Number(v.otherAllowance || 0);

    const deduction =
      Number(v.pf || 0) +
      Number(v.esic || 0) +
      Number(v.professionalTax || 0) +
      Number(v.tds || 0) +
      Number(v.loan || 0) +
      Number(v.advanceSalary || 0) +
      Number(v.otherDeduction || 0);

    const net = Math.max(0, gross - deduction);

    this.salaryForm.patchValue({
      grossSalary: gross,
      totalDeduction: deduction,
      netSalary: net
    }, { emitEvent: false });
  }

  saveSalary(): void {
    if (this.salaryForm.invalid) {
      this.salaryForm.markAllAsTouched();
      alert('Please select an employee and specify basic salary.');
      return;
    }

    const val = this.salaryForm.value;
    const emp = this.employees.find(e => e.id === val.employeeId);
    const payload: SalaryStructureData = {
      ...val,
      employeeName: emp ? emp.name : (val.employeeName || 'Employee')
    };

    this.payrollService.saveSalaryStructure(payload).subscribe({
      next: (res) => {
        alert(`🎉 Salary Structure saved successfully for ${res.employeeName}!`);
        this.loadSavedStructures();
        this.resetForm();
      }
    });
  }

  editStructure(struct: SalaryStructureData): void {
    this.isEditMode = true;
    this.salaryForm.patchValue(struct);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  deleteStructure(employeeId: string, empName: string): void {
    if (confirm(`Are you sure you want to delete salary structure for ${empName}?`)) {
      this.payrollService.deleteSalaryStructure(employeeId).subscribe(() => {
        alert('Salary structure deleted successfully.');
        this.loadSavedStructures();
      });
    }
  }

  resetForm(): void {
    this.isEditMode = false;
    this.salaryForm.reset({
      employeeId: '',
      employeeName: '',
      department: 'IT',
      designation: '',
      salaryType: 'Monthly',
      effectiveDate: new Date().toISOString().split('T')[0],
      basicSalary: 0,
      hra: 0,
      da: 0,
      conveyance: 0,
      medical: 0,
      specialAllowance: 0,
      bonus: 0,
      otherAllowance: 0,
      pf: 0,
      esic: 0,
      professionalTax: 0,
      tds: 0,
      loan: 0,
      advanceSalary: 0,
      otherDeduction: 0,
      grossSalary: 0,
      totalDeduction: 0,
      netSalary: 0,
      remarks: ''
    });
  }

  printStructure(): void {
    window.print();
  }
}