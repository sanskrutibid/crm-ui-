import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { EmployeesService } from '../../employees/employees.service';
import { PayrollService, ProcessedPayrollData, SalaryStructureData } from '../payroll.service';

@Component({
  selector: 'app-process-payroll',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './process-payroll.html',
  styleUrl: './process-payroll.css'
})
export class ProcessPayroll implements OnInit {
  selectedMonth = 'July';
  selectedYear = 2026;
  selectedDepartment = 'All';
  selectedStatus = 'All';
  searchQuery = '';

  months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  years = [2026, 2025, 2024];

  payrollList: ProcessedPayrollData[] = [];
  filteredPayrollList: ProcessedPayrollData[] = [];
  selectedEmpIds = new Set<string>();
  isAllSelected = false;

  // View Detailed Breakdown Modal State
  selectedPayrollForView: ProcessedPayrollData | null = null;
  isLoading = false;

  constructor(
    private employeesService: EmployeesService,
    private payrollService: PayrollService
  ) {}

  ngOnInit(): void {
    this.loadPayrollData();

    // Re-load when saved structures change
    this.payrollService.salaryStructures$.subscribe(() => {
      this.loadPayrollData();
    });
  }

  departmentsList: string[] = [];

  loadPayrollData(): void {
    this.isLoading = true;
    this.employeesService.getEmployees().subscribe({
      next: (res: any) => {
        this.isLoading = false;
        const payload = res.data || res;
        const employeesList = Array.isArray(payload) ? payload : [];

        this.departmentsList = Array.from(new Set(employeesList.map((e: any) => e.department || 'General').filter(Boolean) as string[]));

        const storedPayrolls = this.payrollService.getStoredPayrolls();

        this.payrollList = employeesList.map((emp: any, index: number) => {
          const empId = emp.employeeId || emp.id || emp._id || `EMP${String(index + 1).padStart(3, '0')}`;
          const empName = emp.firstName ? `${emp.firstName} ${emp.lastName || ''}`.trim() : (emp.name || 'Employee');
          const dept = emp.department || 'General';

          // Check if employee has saved salary structure
          let structure = this.payrollService.getSalaryStructureByEmployee(empId);
          if (!structure) {
            // Default calculation using standard formulas if no structure saved yet
            const defaultBasic = 30000;
            const computed = this.payrollService.calculateStandardSalary(defaultBasic);
            structure = {
              employeeId: empId,
              employeeName: empName,
              department: dept,
              designation: emp.designation || 'Staff',
              salaryType: 'Monthly',
              effectiveDate: new Date().toISOString().split('T')[0],
              basicSalary: computed.basicSalary || defaultBasic,
              hra: computed.hra || 0,
              da: computed.da || 0,
              conveyance: computed.conveyance || 0,
              medical: computed.medical || 0,
              specialAllowance: computed.specialAllowance || 0,
              bonus: computed.bonus || 0,
              otherAllowance: computed.otherAllowance || 0,
              pf: computed.pf || 0,
              esic: computed.esic || 0,
              professionalTax: computed.professionalTax || 0,
              tds: computed.tds || 0,
              loan: 0,
              advanceSalary: 0,
              otherDeduction: 0,
              grossSalary: computed.grossSalary || 0,
              totalDeduction: computed.totalDeduction || 0,
              netSalary: computed.netSalary || 0
            };
          }

          // Check if already processed in storage
          const existingProcessed = storedPayrolls.find(
            p => p.employeeId === empId && p.month === this.selectedMonth && p.year === Number(this.selectedYear)
          );

          return {
            id: existingProcessed ? existingProcessed.id : `PAY_${empId}_${this.selectedMonth}_${this.selectedYear}`,
            employeeId: empId,
            employeeName: empName,
            department: dept,
            month: this.selectedMonth,
            year: Number(this.selectedYear),
            gross: existingProcessed ? existingProcessed.gross : structure.grossSalary,
            deduction: existingProcessed ? existingProcessed.deduction : structure.totalDeduction,
            net: existingProcessed ? existingProcessed.net : structure.netSalary,
            status: existingProcessed ? existingProcessed.status : 'Pending',
            processedDate: existingProcessed?.processedDate,
            salaryBreakdown: structure
          };
        });

        this.applyFilters();
      },
      error: (err) => {
        this.isLoading = false;
        console.error('Failed to load employees for process payroll:', err);
        this.payrollList = [];
        this.applyFilters();
      }
    });
  }

  applyFilters(): void {
    let list = [...this.payrollList];

    if (this.selectedDepartment && this.selectedDepartment !== 'All') {
      list = list.filter(item => item.department === this.selectedDepartment);
    }

    if (this.selectedStatus && this.selectedStatus !== 'All') {
      list = list.filter(item => item.status === this.selectedStatus);
    }

    if (this.searchQuery && this.searchQuery.trim() !== '') {
      const q = this.searchQuery.toLowerCase().trim();
      list = list.filter(item =>
        item.employeeName.toLowerCase().includes(q) ||
        item.employeeId.toLowerCase().includes(q)
      );
    }

    this.filteredPayrollList = list;
    this.checkAllSelectionState();
  }

  onMonthOrYearChange(): void {
    this.loadPayrollData();
  }

  toggleSelectAll(event: any): void {
    const isChecked = event.target.checked;
    this.isAllSelected = isChecked;
    this.selectedEmpIds.clear();
    if (isChecked) {
      this.filteredPayrollList.forEach(item => this.selectedEmpIds.add(item.employeeId));
    }
  }

  toggleSelectEmp(empId: string): void {
    if (this.selectedEmpIds.has(empId)) {
      this.selectedEmpIds.delete(empId);
    } else {
      this.selectedEmpIds.add(empId);
    }
    this.checkAllSelectionState();
  }

  checkAllSelectionState(): void {
    if (this.filteredPayrollList.length > 0) {
      this.isAllSelected = this.filteredPayrollList.every(item => this.selectedEmpIds.has(item.employeeId));
    } else {
      this.isAllSelected = false;
    }
  }

  processPayroll(): void {
    if (this.filteredPayrollList.length === 0) {
      alert('No employees available to process.');
      return;
    }

    const toProcess = this.selectedEmpIds.size > 0
      ? this.filteredPayrollList.filter(item => this.selectedEmpIds.has(item.employeeId))
      : this.filteredPayrollList;

    const updatedItems: ProcessedPayrollData[] = toProcess.map(item => ({
      ...item,
      status: 'Processed',
      processedDate: new Date().toISOString().split('T')[0]
    }));

    this.payrollService.saveProcessedPayrolls(updatedItems).subscribe({
      next: () => {
        alert(`🎉 Payroll processed successfully for ${updatedItems.length} employee(s) for ${this.selectedMonth} ${this.selectedYear}!`);
        this.loadPayrollData();
      }
    });
  }

  lockPayroll(): void {
    if (confirm(`Are you sure you want to lock payroll for ${this.selectedMonth} ${this.selectedYear}? No further changes will be allowed.`)) {
      this.processPayroll();
    }
  }

  viewBreakdown(emp: ProcessedPayrollData): void {
    this.selectedPayrollForView = emp;
  }

  closeBreakdownModal(): void {
    this.selectedPayrollForView = null;
  }

  printPayslip(): void {
    window.print();
  }
}