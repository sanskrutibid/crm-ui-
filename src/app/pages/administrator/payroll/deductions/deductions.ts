import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-deductions',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './deductions.html',
  styleUrl: './deductions.css'
})
export class Deductions {

  deductions = [

    {

      id:'EMP001',

      name:'Rahul Sharma',

      image:'assets/images/user.png',

      department:'IT',

      type:'Professional Tax',

      amount:'200',

      month:'July 2026',

      status:'Applied'

    },

    {

      id:'EMP002',

      name:'Priya Patel',

      image:'assets/images/user.png',

      department:'HR',

      type:'Loan EMI',

      amount:'2,500',

      month:'July 2026',

      status:'Applied'

    },

    {

      id:'EMP003',

      name:'Amit Singh',

      image:'assets/images/user.png',

      department:'Sales',

      type:'Advance Salary',

      amount:'5,000',

      month:'July 2026',

      status:'Applied'

    }

  ];

}