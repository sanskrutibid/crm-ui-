import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { EmployeesService } from '../employees.service';

@Component({
  selector: 'app-employee-details',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './employee-details.html',
  styleUrl: './employee-details.css',
})
export class EmployeeDetails implements OnInit {
  @Input() employeeId?: string;
  @Output() backToList = new EventEmitter<void>();
  @Output() editEmployee = new EventEmitter<any>();

  employee: any = null;

  constructor(private readonly employeesService: EmployeesService) {}

  ngOnInit(): void {
    if (this.employeeId) {
      this.loadEmployeeDetails(this.employeeId);
    }
  }

  loadEmployeeDetails(id: string): void {
    this.employeesService.getEmployee(id).subscribe({
      next: (res: any) => {
        this.employee = res.data || res;
      },
      error: (err) => {
        console.error('Failed to load employee details:', err);
      }
    });
  }

  goBack(): void {
    this.backToList.emit();
  }

  onEdit(): void {
    if (this.employee) {
      this.editEmployee.emit({ id: this.employee.id || this.employee._id || this.employee.employeeId });
    }
  }
}
