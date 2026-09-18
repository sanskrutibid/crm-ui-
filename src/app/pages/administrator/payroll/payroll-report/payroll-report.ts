import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-payroll-report',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './payroll-report.html',
  styleUrl: './payroll-report.css'
})
export class PayrollReport {

  summaryCards = [

    {

      title:'Employees',

      value:125,

      icon:'fas fa-users',

      color:'blue'

    },

    {

      title:'Gross Payroll',

      value:'₹18.75L',

      icon:'fas fa-wallet',

      color:'green'

    },

    {

      title:'Total Deductions',

      value:'₹2.10L',

      icon:'fas fa-minus-circle',

      color:'orange'

    },

    {

      title:'Net Payroll',

      value:'₹16.65L',

      icon:'fas fa-money-check',

      color:'red'

    }

  ];

  reports = [

    {

      name:'Rahul Sharma',

      department:'IT',

      gross:'65000',

      bonus:'5000',

      deduction:'4500',

      net:'65500',

      status:'Paid'

    },

    {

      name:'Priya Patel',

      department:'HR',

      gross:'58000',

      bonus:'2500',

      deduction:'3900',

      net:'56600',

      status:'Paid'

    },

    {

      name:'Amit Singh',

      department:'Sales',

      gross:'72000',

      bonus:'8000',

      deduction:'5200',

      net:'74800',

      status:'Paid'

    }

  ];

}