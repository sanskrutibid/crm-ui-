import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { QuillModule } from 'ngx-quill';

@Component({
  selector: 'app-terms-conditions',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    QuillModule
  ],
  templateUrl: './terms-conditions.html',
  styleUrl: './terms-conditions.css'
})
export class TermsConditions {

  termsContent = '';

  saveTerms() {

    console.log(this.termsContent);

    // API Call
  }

  cancelTerms() {
    this.termsContent = '';
  }
}