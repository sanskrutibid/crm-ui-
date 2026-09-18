import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-payroll-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './payroll-dashboard.html',
  styleUrl: './payroll-dashboard.css'
})
export class PayrollDashboard {

  cards = [

    {

      title:'Employees',

      count:125,

      icon:'fas fa-users',

      class:'blue'

    },

    {

      title:'Payroll Processed',

      count:110,

      icon:'fas fa-money-check',

      class:'green'

    },

    {

      title:'Pending Payroll',

      count:15,

      icon:'fas fa-clock',

      class:'orange'

    },

    {

      title:'Total Salary',

      count:'₹18.75L',

      icon:'fas fa-wallet',

      class:'red'

    }

  ];

  payrollHistory = [

    {

      month:'July 2026',

      employee:125,

      salary:'18,75,000',

      status:'Pending'

    },

    {

      month:'June 2026',

      employee:122,

      salary:'18,10,000',

      status:'Completed'

    },

    {

      month:'May 2026',

      employee:118,

      salary:'17,65,000',

      status:'Completed'

    }

  ];

}