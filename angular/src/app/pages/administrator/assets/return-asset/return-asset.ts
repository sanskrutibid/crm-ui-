import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';

@Component({
  selector: 'app-return-asset',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule
  ],
  templateUrl: './return-asset.html',
  styleUrl: './return-asset.css'
})
export class ReturnAsset {

  returnForm: FormGroup;

  employees = [

    { id:'EMP001', name:'Rahul Sharma' },

    { id:'EMP002', name:'Priya Patel' },

    { id:'EMP003', name:'Amit Singh' },

    { id:'EMP004', name:'Sneha Verma' }

  ];

  constructor(
    private fb: FormBuilder
  ){

    this.returnForm = this.fb.group({

      employee:['',Validators.required],

      asset:['',Validators.required],

      serialNumber:[''],

      assignDate:[''],

      returnDate:[''],

      condition:['Excellent'],

      status:['Returned'],

      remarks:['']

    });

  }

  returnAsset(){

    if(this.returnForm.invalid){

      this.returnForm.markAllAsTouched();

      return;

    }

    console.log(this.returnForm.value);

    alert('Asset Returned Successfully');

  }

}