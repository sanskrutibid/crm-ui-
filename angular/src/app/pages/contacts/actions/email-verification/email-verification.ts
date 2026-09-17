import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-email-verification',
  standalone: true,
   imports: [CommonModule],
  templateUrl: './email-verification.html',
  styleUrl: './email-verification.css'
})
export class EmailVerification {

  @Output() close = new EventEmitter<void>();

  
   totalEmails = 12531;
    isLoading = false;

  closeVerification() {
    this.close.emit();
  }

  verifyEmails() {
    console.log('Email verification started');
  }
}