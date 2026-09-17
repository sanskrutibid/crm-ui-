import { CommonModule } from '@angular/common';
import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { EmployeesService } from '../employees.service';

@Component({
  selector: 'app-employee-list',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './employee-list.html',
  styleUrl: './employee-list.css',
})
export class EmployeeList implements OnInit {
  @Output() viewEmployee = new EventEmitter<any>();
  @Output() editEmployee = new EventEmitter<any>();
  @Output() addEmployee = new EventEmitter<void>();

  employees: any[] = [];
  rawEmployees: any[] = [];

  constructor(private readonly employeesService: EmployeesService) {}

  ngOnInit(): void {
    this.loadEmployees();
  }

  loadEmployees(): void {
    this.employeesService.getEmployees().subscribe({
      next: (res: any) => {
        const payload = Array.isArray(res) ? res : (res?.data || res?.employees || []);
        this.rawEmployees = Array.isArray(payload) ? payload : [];
        // Transform the database response to map standard fields needed by the view
        this.employees = this.rawEmployees.map((emp: any) => {
          const fullName = (emp.firstName || emp.lastName)
            ? `${emp.firstName || ''} ${emp.lastName || ''}`.trim()
            : (emp.name || emp.officialEmail || emp.email || 'Unnamed Employee');

          const officialOrPersonalEmail = emp.officialEmail || emp.email || emp.personalEmail || '—';

          return {
            id: emp.id || emp._id,
            employeeId: emp.employeeId || emp.id || emp._id,
            name: fullName,
            department: emp.department || 'General',
            designation: emp.designation || emp.role || 'Employee',
            mobile: emp.mobile || emp.phone || '—',
            email: officialOrPersonalEmail,
            password: emp.password || '••••••••',
            status: emp.status || 'Active'
          };
        });
      },
      error: (err) => {
        console.error('Failed to load employees:', err);
      }
    });
  }

  toggleStatus(emp: any): void {
    const newStatus = emp.status === 'Active' ? 'Inactive' : 'Active';
    const rawEmp = this.rawEmployees.find(r => (r.id || r._id) === emp.id);

    // Prepare updated data. Merge status into the original record if found.
    const updatedPayload = rawEmp ? { ...rawEmp, status: newStatus } : { ...emp, status: newStatus };

    // Optimistic UI update
    const originalStatus = emp.status;
    emp.status = newStatus;

    this.employeesService.updateEmployee(emp.id, updatedPayload).subscribe({
      next: () => {
        console.log(`Status of employee ${emp.name} updated to ${newStatus}`);
        if (rawEmp) {
          rawEmp.status = newStatus;
        }
      },
      error: (err) => {
        // Revert status on failure
        emp.status = originalStatus;
        console.error('Failed to update employee status:', err);
        alert('Failed to update employee status: ' + (err.error?.message || err.message));
      }
    });
  }

  viewProfile(emp: any): void {
    this.viewEmployee.emit(emp);
  }

  editProfile(emp: any): void {
    this.editEmployee.emit(emp);
  }

  deleteProfile(emp: any): void {
    if (confirm(`Are you sure you want to delete employee ${emp.name}?`)) {
      this.employeesService.deleteEmployee(emp.id).subscribe({
        next: () => {
          alert('Employee deleted successfully');
          this.loadEmployees();
        },
        error: (err) => {
          console.error('Failed to delete employee:', err);
          alert('Failed to delete employee: ' + (err.error?.message || err.message));
        }
      });
    }
  }

  onAddEmployee(): void {
    this.addEmployee.emit();
  }
}
