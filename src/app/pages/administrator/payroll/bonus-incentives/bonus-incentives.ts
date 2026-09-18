import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { EmployeesService } from '../../employees/employees.service';
import { PayrollService } from '../payroll.service';

export interface BonusItem {
  id: string;
  employeeId: string;
  name: string;
  image: string;
  department: string;
  type: string;
  calculationType: 'percentage' | 'fixed';
  totalEarning: number;
  percentage: number;
  amount: number;
  status: 'Approved' | 'Pending' | 'Processing';
  month: string;
  year: number;
  remarks?: string;
  createdAt?: string;
}

@Component({
  selector: 'app-bonus-incentives',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './bonus-incentives.html',
  styleUrl: './bonus-incentives.css'
})
export class BonusIncentives implements OnInit {

  // State List
  bonuses: BonusItem[] = [];
  employeesList: Array<{ id: string; name: string; department?: string; grossSalary?: number }> = [];

  // Filter States
  filterType: string = 'All';
  filterDepartment: string = 'All Departments';
  filterMonth: string = 'All';
  searchTerm: string = '';

  // Options lists
  bonusTypes: string[] = [
    'Performance Bonus',
    'Festival Bonus',
    'Sales Incentive',
    'Joining Bonus',
    'Referral Bonus',
    'Quarterly Bonus',
    'Annual Bonus'
  ];

  departments: string[] = ['IT', 'HR', 'Sales', 'Accounts', 'Marketing', 'Operations'];
  months: string[] = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  years: number[] = [2024, 2025, 2026, 2027];
  presetPercentages: number[] = [5, 8.33, 10, 15, 20];

  // Modal Form State
  isModalOpen: boolean = false;
  isEditMode: boolean = false;
  editingBonusId: string | null = null;

  // Form Model
  formEmployeeId: string = '';
  formEmployeeName: string = '';
  formDepartment: string = 'IT';
  formBonusType: string = 'Performance Bonus';
  formCalculationType: 'percentage' | 'fixed' = 'percentage';
  formTotalEarning: number = 50000;
  formPercentage: number = 10;
  formAmount: number = 5000;
  formStatus: 'Approved' | 'Pending' | 'Processing' = 'Pending';
  formMonth: string = 'July';
  formYear: number = 2026;
  formRemarks: string = '';

  constructor(
    private employeesService: EmployeesService,
    private payrollService: PayrollService
  ) {}

  ngOnInit(): void {
    this.loadEmployees();
    this.loadBonuses();
  }

  // -------------------------------------------------------------
  // Data Loading & Persistence
  // -------------------------------------------------------------
  loadEmployees(): void {
    const structures = this.payrollService.getStoredStructures();

    this.employeesService.getEmployees().subscribe({
      next: (res: any) => {
        let list: any[] = [];
        if (Array.isArray(res)) list = res;
        else if (Array.isArray(res?.data)) list = res.data;
        else if (Array.isArray(res?.employees)) list = res.employees;

        if (!list || list.length === 0) {
          const cached = localStorage.getItem('crm_employees_cache') || localStorage.getItem('crm_employees');
          if (cached) {
            try { list = JSON.parse(cached); } catch (e) {}
          }
        }

        this.processEmployeeList(list || [], structures);
      },
      error: () => {
        const cached = localStorage.getItem('crm_employees_cache') || localStorage.getItem('crm_employees');
        let list: any[] = [];
        if (cached) {
          try { list = JSON.parse(cached); } catch (e) {}
        }
        this.processEmployeeList(list, structures);
      }
    });
  }

  private processEmployeeList(list: any[], structures: any[]): void {
    const empMap = new Map<string, { id: string; name: string; department: string; grossSalary: number }>();

    // Add employees from Defined Salary Structures first
    if (structures && structures.length > 0) {
      structures.forEach(s => {
        if (s.employeeId) {
          empMap.set(s.employeeId, {
            id: s.employeeId,
            name: s.employeeName || `Employee ${s.employeeId}`,
            department: s.department || 'IT',
            grossSalary: Number(s.grossSalary || 0)
          });
        }
      });
    }

    // Add from main employees list
    if (list && list.length > 0) {
      list.forEach((emp, index) => {
        const empId = emp.employeeId || emp.empId || emp.id || emp._id || `EMP${String(index + 1).padStart(3, '0')}`;
        let empName = '';
        if (emp.firstName || emp.lastName) {
          empName = `${emp.firstName || ''} ${emp.lastName || ''}`.trim();
        } else if (emp.name) {
          empName = emp.name;
        } else {
          empName = `Employee ${empId}`;
        }
        const dept = typeof emp.department === 'string' ? emp.department : (emp.department?.name || emp.dept || 'IT');
        const struct = structures.find(s => s.employeeId === empId);
        const gross = struct?.grossSalary || Number(emp.grossSalary || emp.basicSalary || 0);

        empMap.set(empId, {
          id: empId,
          name: empName,
          department: dept,
          grossSalary: gross
        });
      });
    }

    this.employeesList = Array.from(empMap.values());
    if (this.employeesList.length > 0) {
      const depts = Array.from(new Set(this.employeesList.map(e => e.department).filter((d): d is string => !!d)));
      if (depts.length > 0) {
        this.departments = depts;
      }
    }
  }

  loadBonuses(): void {
    const saved = localStorage.getItem('crm_bonus_incentives');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          // Filter out legacy static sample data if any existed
          this.bonuses = parsed.filter((b: BonusItem) => !['BON-101', 'BON-102', 'BON-103'].includes(b.id));
          return;
        }
      } catch (e) {
        console.error('Error loading saved bonuses:', e);
      }
    }

    // Completely dynamic initial state (no hardcoded static samples)
    this.bonuses = [];
  }

  saveBonusesToStorage(): void {
    localStorage.setItem('crm_bonus_incentives', JSON.stringify(this.bonuses));
  }

  // -------------------------------------------------------------
  // Filter & Search Computed Logic
  // -------------------------------------------------------------
  get filteredBonuses(): BonusItem[] {
    return this.bonuses.filter(item => {
      // Type Filter
      if (this.filterType !== 'All' && item.type !== this.filterType) {
        return false;
      }
      // Department Filter
      if (this.filterDepartment !== 'All Departments' && item.department !== this.filterDepartment) {
        return false;
      }
      // Month Filter
      if (this.filterMonth !== 'All' && item.month !== this.filterMonth) {
        return false;
      }
      // Search Term
      if (this.searchTerm.trim()) {
        const query = this.searchTerm.toLowerCase().trim();
        const matchName = item.name.toLowerCase().includes(query);
        const matchId = item.employeeId.toLowerCase().includes(query);
        const matchType = item.type.toLowerCase().includes(query);
        if (!matchName && !matchId && !matchType) {
          return false;
        }
      }
      return true;
    });
  }

  // -------------------------------------------------------------
  // Dynamic Calculation Handlers
  // -------------------------------------------------------------
  onEmployeeSelect(employeeId: string): void {
    const selected = this.employeesList.find(e => e.id === employeeId);
    if (selected) {
      this.formEmployeeName = selected.name;
      this.formDepartment = selected.department || 'IT';

      // Check if employee has salary structure in PayrollService
      const structure = this.payrollService.getSalaryStructureByEmployee(employeeId);
      if (structure && structure.grossSalary > 0) {
        this.formTotalEarning = structure.grossSalary;
      } else if (selected.grossSalary && selected.grossSalary > 0) {
        this.formTotalEarning = selected.grossSalary;
      } else {
        this.formTotalEarning = 0;
      }
    }
    this.recalculateBonus();
  }

  onCalculationTypeChange(type: 'percentage' | 'fixed'): void {
    this.formCalculationType = type;
    this.recalculateBonus();
  }

  onTotalEarningChange(): void {
    if (this.formTotalEarning < 0) this.formTotalEarning = 0;
    this.recalculateBonus();
  }

  onPercentageChange(): void {
    if (this.formPercentage < 0) this.formPercentage = 0;
    this.recalculateBonus();
  }

  applyPercentagePreset(pct: number): void {
    this.formCalculationType = 'percentage';
    this.formPercentage = pct;
    this.recalculateBonus();
  }

  onAmountChange(): void {
    if (this.formAmount < 0) this.formAmount = 0;
    if (this.formCalculationType === 'fixed') {
      if (this.formTotalEarning > 0) {
        this.formPercentage = Number(((this.formAmount / this.formTotalEarning) * 100).toFixed(2));
      } else {
        this.formPercentage = 0;
      }
    }
  }

  recalculateBonus(): void {
    const earning = Number(this.formTotalEarning) || 0;
    if (this.formCalculationType === 'percentage') {
      const pct = Number(this.formPercentage) || 0;
      this.formAmount = Math.round((earning * pct) / 100);
    } else {
      const amt = Number(this.formAmount) || 0;
      if (earning > 0) {
        this.formPercentage = Number(((amt / earning) * 100).toFixed(2));
      } else {
        this.formPercentage = 0;
      }
    }
  }

  // -------------------------------------------------------------
  // Modal Actions (Add / Edit / Delete)
  // -------------------------------------------------------------
  openAddModal(): void {
    this.isEditMode = false;
    this.editingBonusId = null;

    // Reset Form
    if (this.employeesList && this.employeesList.length > 0) {
      const defaultEmp = this.employeesList[0];
      this.formEmployeeId = defaultEmp.id;
      this.formEmployeeName = defaultEmp.name;
      this.formDepartment = defaultEmp.department || 'IT';

      const structure = this.payrollService.getSalaryStructureByEmployee(defaultEmp.id);
      this.formTotalEarning = structure?.grossSalary || defaultEmp.grossSalary || 0;
    } else {
      this.formEmployeeId = '';
      this.formEmployeeName = '';
      this.formDepartment = 'IT';
      this.formTotalEarning = 0;
    }

    this.formBonusType = 'Performance Bonus';
    this.formCalculationType = 'percentage';
    this.formPercentage = 10;
    this.formStatus = 'Approved';
    this.formMonth = 'July';
    this.formYear = 2026;
    this.formRemarks = '';

    this.recalculateBonus();
    this.isModalOpen = true;
  }

  openEditModal(item: BonusItem): void {
    this.isEditMode = true;
    this.editingBonusId = item.id;

    this.formEmployeeId = item.employeeId;
    this.formEmployeeName = item.name;
    this.formDepartment = item.department;
    this.formBonusType = item.type;
    this.formCalculationType = item.calculationType || 'percentage';
    this.formTotalEarning = item.totalEarning || 0;
    this.formPercentage = item.percentage || 10;
    this.formAmount = item.amount || 0;
    this.formStatus = item.status || 'Approved';
    this.formMonth = item.month || 'July';
    this.formYear = item.year || 2026;
    this.formRemarks = item.remarks || '';

    this.isModalOpen = true;
  }

  closeModal(): void {
    this.isModalOpen = false;
  }

  saveBonus(): void {
    if (!this.formEmployeeId) {
      alert('Please select an employee');
      return;
    }

    const emp = this.employeesList.find(e => e.id === this.formEmployeeId);
    const empName = emp ? emp.name : (this.formEmployeeName || 'Employee');

    if (this.isEditMode && this.editingBonusId) {
      // Update existing
      const index = this.bonuses.findIndex(b => b.id === this.editingBonusId);
      if (index !== -1) {
        this.bonuses[index] = {
          ...this.bonuses[index],
          employeeId: this.formEmployeeId,
          name: empName,
          department: this.formDepartment,
          type: this.formBonusType,
          calculationType: this.formCalculationType,
          totalEarning: Number(this.formTotalEarning),
          percentage: Number(this.formPercentage),
          amount: Number(this.formAmount),
          status: this.formStatus,
          month: this.formMonth,
          year: Number(this.formYear),
          remarks: this.formRemarks
        };
      }
    } else {
      // Create new
      const newBonus: BonusItem = {
        id: `BON-${Date.now().toString().slice(-6)}`,
        employeeId: this.formEmployeeId,
        name: empName,
        image: 'assets/images/user.png',
        department: this.formDepartment,
        type: this.formBonusType,
        calculationType: this.formCalculationType,
        totalEarning: Number(this.formTotalEarning),
        percentage: Number(this.formPercentage),
        amount: Number(this.formAmount),
        status: this.formStatus,
        month: this.formMonth,
        year: Number(this.formYear),
        remarks: this.formRemarks,
        createdAt: new Date().toISOString()
      };
      this.bonuses.unshift(newBonus);
    }

    this.saveBonusesToStorage();
    this.closeModal();
  }

  deleteBonus(id: string): void {
    if (confirm('Are you sure you want to delete this bonus entry?')) {
      this.bonuses = this.bonuses.filter(b => b.id !== id);
      this.saveBonusesToStorage();
    }
  }
}