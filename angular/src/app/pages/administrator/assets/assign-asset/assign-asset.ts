import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';

@Component({
  selector: 'app-assign-asset',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule
  ],
  templateUrl: './assign-asset.html',
  styleUrl: './assign-asset.css'
})
export class AssignAsset {

  assetForm: FormGroup;

  employees = [

    { id:'EMP001', name:'Rahul Sharma' },

    { id:'EMP002', name:'Priya Patel' },

    { id:'EMP003', name:'Amit Singh' },

    { id:'EMP004', name:'Sneha Verma' }

  ];

  constructor(
    private fb: FormBuilder
  ){

    this.assetForm = this.fb.group({

      employee:['',Validators.required],

      category:['',Validators.required],

      assetName:['',Validators.required],

      brand:[''],

      serialNumber:[''],

      condition:['New'],

      assignDate:[''],

      returnDate:[''],

      remarks:['']

    });

  }

  assignAsset(){

    if(this.assetForm.invalid){

      this.assetForm.markAllAsTouched();

      return;

    }

    console.log(this.assetForm.value);

    alert('Asset Assigned Successfully');

  }

}