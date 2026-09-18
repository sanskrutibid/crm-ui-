import { Component } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule
} from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-change-password',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule
  ],
  templateUrl: './change-password.html',
  styleUrls: ['./change-password.css']
})
export class ChangePassword {

  passwordForm: FormGroup;

  constructor(private fb: FormBuilder){

    this.passwordForm = this.fb.group({

      currentPassword:['',Validators.required],

      newPassword:[
        '',
        [
          Validators.required,
          Validators.minLength(8),
          Validators.pattern(
            /^(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&]).+$/
          )
        ]
      ],

      confirmPassword:['',Validators.required]

    });

  }

  changePassword(){

    if(this.passwordForm.invalid){
      this.passwordForm.markAllAsTouched();
      return;
    }

    console.log(this.passwordForm.value);

  }

}