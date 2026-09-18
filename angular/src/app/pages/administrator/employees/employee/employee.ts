import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { EmployeeAdd } from '../employee-add/employee-add';
import { EmployeeDetails } from '../employee-details/employee-details';
import { EmployeeEdit } from '../employee-edit/employee-edit';
import { EmployeeList } from '../employee-list/employee-list';
import { EmployeeProfile } from '../employee-profile/employee-profile';

@Component({
  selector: 'app-employee',
  imports: [CommonModule,RouterModule,FormsModule,EmployeeAdd,EmployeeDetails,
    EmployeeList,EmployeeProfile,EmployeeEdit,
  ],
  templateUrl: './employee.html',
  styleUrl: './employee.css',
})
export class Employee {

  selectedTab = 'list';
  selectedEmployeeId?: string;

  changeTab(tab: string) {
    this.selectedTab = tab;
  }

  viewEmployee(employee: any) {
    this.selectedEmployeeId = employee.id || employee.employeeId;
    this.changeTab('details');
  }

  editEmployee(employee: any) {
    this.selectedEmployeeId = employee.id || employee.employeeId;
    this.changeTab('edit');
  }

  onEmployeeAdded() {
    this.changeTab('list');
  }

  onEmployeeUpdated() {
    this.changeTab('list');
  }
}
