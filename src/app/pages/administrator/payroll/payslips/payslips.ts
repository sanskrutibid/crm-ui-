import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-payslips',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './payslips.html',
  styleUrl: './payslips.css'
})
export class Payslips {

  payslips = [

    {
      id:'EMP001',
      name:'Rahul Sharma',
      image:'assets/images/user.png',
      department:'IT',
      month:'July 2026',
      gross:65000,
      deduction:4500,
      net:60500,
      status:'Generated'
    },

    {
      id:'EMP002',
      name:'Priya Patel',
      image:'assets/images/user.png',
      department:'HR',
      month:'July 2026',
      gross:58000,
      deduction:3900,
      net:54100,
      status:'Generated'
    },

    {
      id:'EMP003',
      name:'Amit Singh',
      image:'assets/images/user.png',
      department:'Sales',
      month:'July 2026',
      gross:72000,
      deduction:5200,
      net:66800,
      status:'Generated'
    },

    {
      id:'EMP004',
      name:'Sneha Verma',
      image:'assets/images/user.png',
      department:'Accounts',
      month:'July 2026',
      gross:60000,
      deduction:4300,
      net:55700,
      status:'Generated'
    },

    {
      id:'EMP005',
      name:'Mohit Jain',
      image:'assets/images/user.png',
      department:'Marketing',
      month:'July 2026',
      gross:55000,
      deduction:3700,
      net:51300,
      status:'Generated'
    }

  ];

  viewPayslip(employee:any){

    console.log(employee);

    alert('View Payslip');

  }

  downloadPayslip(employee:any){

    console.log(employee);

    alert('Download Payslip');

  }

  printPayslip(employee:any){

    console.log(employee);

    alert('Print Payslip');

  }

}