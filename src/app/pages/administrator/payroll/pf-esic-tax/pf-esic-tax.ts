import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-pf-esic-tax',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './pf-esic-tax.html',
  styleUrl: './pf-esic-tax.css'
})
export class PfEsicTax {

  records = [

    {

      id:'EMP001',

      name:'Rahul Sharma',

      image:'assets/images/user.png',

      department:'IT',

      pf:1800,

      esic:750,

      tax:200,

      tds:1500,

      total:4250

    },

    {

      id:'EMP002',

      name:'Priya Patel',

      image:'assets/images/user.png',

      department:'HR',

      pf:1750,

      esic:650,

      tax:200,

      tds:1200,

      total:3800

    },

    {

      id:'EMP003',

      name:'Amit Singh',

      image:'assets/images/user.png',

      department:'Sales',

      pf:2000,

      esic:900,

      tax:200,

      tds:1800,

      total:4900

    }

  ];

}