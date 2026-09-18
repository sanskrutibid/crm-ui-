import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';
import { EmployeesService } from '../../employees/employees.service';
import { LeaveService, LeaveRequest } from '../leave.service';

@Component({
  selector: 'app-leave-apply',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule
  ],
  templateUrl: './leave-apply.html',
  styleUrl: './leave-apply.css'
})
export class LeaveApply implements OnInit {

  leaveForm: FormGroup;
  employees: any[] = [];

  // Notification Modal State
  showEmailModal = false;
  selectedEmployeeName = '';
  selectedEmployeeId = '';
  selectedEmployeeEmail = '';
  leaveDetails = {
    type: '',
    from: '',
    to: '',
    days: 0,
    reason: '',
    priority: ''
  };

  constructor(
    private fb: FormBuilder,
    private employeesService: EmployeesService,
    private leaveService: LeaveService
  ) {
    this.leaveForm = this.fb.group({
      employee: ['', Validators.required],
      leaveType: ['', Validators.required],
      priority: ['Normal'],
      fromDate: ['', Validators.required],
      toDate: ['', Validators.required],
      days: [{ value: '', disabled: false }],
      manager: ['HR Manager'],
      reason: ['', Validators.required],
      contact: ['']
    });
  }

  ngOnInit(): void {
    this.loadEmployees();

    this.leaveForm.get('fromDate')?.valueChanges.subscribe(() => this.calculateDays());
    this.leaveForm.get('toDate')?.valueChanges.subscribe(() => this.calculateDays());
  }

  loadEmployees(): void {
    this.employeesService.getEmployees().subscribe({
      next: (res: any) => {
        const payload = res.data || res;
        const mapped = (payload || []).map((emp: any) => ({
          id: emp.id || emp._id || emp.employeeId,
          employeeId: emp.employeeId || emp.id || emp._id,
          name: `${emp.firstName || ''} ${emp.lastName || ''}`.trim() || emp.name || 'Unknown',
          department: emp.department || 'General',
          email: emp.personalEmail || emp.officialEmail || emp.email || 'employee@company.com'
        }));

        if (mapped.length > 0) {
          this.employees = mapped;
        } else {
          this.fallbackEmployees();
        }
      },
      error: (err) => {
        console.error('Failed to load employees for leave application:', err);
        this.fallbackEmployees();
      }
    });
  }

  fallbackEmployees(): void {
    const balances = this.leaveService.getStoredBalances();
    if (balances && balances.length > 0) {
      this.employees = balances.map(b => ({
        id: b.employeeId,
        employeeId: b.employeeId,
        name: b.name,
        department: b.department,
        email: `${b.name.toLowerCase().replace(/\s+/g, '.')}@company.com`
      }));
    } else {
      this.employees = [
        { id: 'EMP001', employeeId: 'EMP001', name: 'Rahul Sharma', department: 'IT', email: 'rahul.sharma@company.com' },
        { id: 'EMP002', employeeId: 'EMP002', name: 'Priya Patel', department: 'HR', email: 'priya.patel@company.com' },
        { id: 'EMP003', employeeId: 'EMP003', name: 'Amit Singh', department: 'Sales', email: 'amit.singh@company.com' },
        { id: 'EMP004', employeeId: 'EMP004', name: 'Sneha Verma', department: 'Accounts', email: 'sneha.verma@company.com' }
      ];
    }
  }

  calculateDays() {
    const from = this.leaveForm.get('fromDate')?.value;
    const to = this.leaveForm.get('toDate')?.value;
    if (from && to) {
      const fromDate = new Date(from);
      const toDate = new Date(to);
      const diffTime = toDate.getTime() - fromDate.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
      this.leaveForm.get('days')?.setValue(diffDays > 0 ? diffDays : 0, { emitEvent: false });
    } else {
      this.leaveForm.get('days')?.setValue('', { emitEvent: false });
    }
  }

  saveLeave() {
    if (this.leaveForm.invalid) {
      this.leaveForm.markAllAsTouched();
      return;
    }

    const formValues = this.leaveForm.value;
    const selectedEmp = this.employees.find(emp => emp.id === formValues.employee || emp.employeeId === formValues.employee);

    const empName = selectedEmp ? selectedEmp.name : 'Unknown Employee';
    const empId = selectedEmp ? selectedEmp.employeeId : formValues.employee;
    const empEmail = selectedEmp ? selectedEmp.email : 'employee@company.com';

    const leaveRequest: LeaveRequest = {
      employeeId: empId,
      name: empName,
      department: selectedEmp ? selectedEmp.department : 'General',
      type: formValues.leaveType,
      from: formValues.fromDate,
      to: formValues.toDate,
      days: formValues.days || 1,
      priority: formValues.priority,
      manager: formValues.manager,
      reason: formValues.reason,
      contact: formValues.contact,
      status: 'Pending',
      email: empEmail
    };

    this.leaveService.createLeaveRequest(leaveRequest).subscribe({
      next: () => {
        // Setup data for confirmation modal
        this.selectedEmployeeName = empName;
        this.selectedEmployeeId = empId;
        this.selectedEmployeeEmail = empEmail;
        this.leaveDetails = {
          type: formValues.leaveType,
          from: formValues.fromDate,
          to: formValues.toDate,
          days: formValues.days || 1,
          reason: formValues.reason,
          priority: formValues.priority
        };
        this.showEmailModal = true;

        this.leaveForm.reset({
          employee: '',
          leaveType: '',
          priority: 'Normal',
          fromDate: '',
          toDate: '',
          days: '',
          manager: 'HR Manager',
          reason: '',
          contact: ''
        });
      },
      error: (err) => {
        console.error('Failed to apply leave:', err);
        alert('Error applying leave. Please try again.');
      }
    });
  }

  closeEmailModal(): void {
    this.showEmailModal = false;
  }
}