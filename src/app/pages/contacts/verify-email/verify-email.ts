import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { ContactsService } from '../contacts.service';

@Component({
  selector: 'app-verify-email',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './verify-email.html',
  styleUrl: './verify-email.css'
})
export class VerifyEmailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private contactsService = inject(ContactsService);

  status: 'verifying' | 'success' | 'error' = 'verifying';
  email: string = '';
  errorMessage: string = '';

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      const token = params['token'];
      const email = params['email'];

      if (!token || !email) {
        this.status = 'error';
        this.errorMessage = 'Invalid verification link. Token or email address is missing.';
        return;
      }

      this.email = email;
      this.verifyToken(token, email);
    });
  }

  verifyToken(token: string, email: string): void {
    this.status = 'verifying';
    this.contactsService.confirmEmailVerification(token, email).subscribe({
      next: (res) => {
        this.status = 'success';
      },
      error: (err) => {
        this.status = 'error';
        const msg = err.error?.message || err.message || 'Unable to verify email address. The link may have expired or is invalid.';
        this.errorMessage = Array.isArray(msg) ? msg.join(', ') : msg;
      }
    });
  }
}
