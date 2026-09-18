import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../auth.service';

@Component({
  selector: 'app-signup',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './signup.html',
  styleUrls: ['./signup.css']
})
export class SignupComponent {
  private authService = inject(AuthService);
  private router = inject(Router);

  name = '';
  email = '';
  password = '';
  confirmPassword = '';
  agreeTerms = false;

  showPassword = false;
  showConfirmPassword = false;

  isLoading = false;
  errorMessage = '';
  successMessage = '';

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  toggleConfirmPasswordVisibility(): void {
    this.showConfirmPassword = !this.showConfirmPassword;
  }

  isPasswordValid(): boolean {
    return !!this.password && this.password.length >= 8;
  }

  onSubmit(): void {
    if (!this.name || !this.email || !this.password || !this.confirmPassword) {
      this.errorMessage = 'All fields are required';
      return;
    }

    if (!this.isPasswordValid()) {
      this.errorMessage = 'Password must be at least 8 characters long.';
      return;
    }

    if (this.password !== this.confirmPassword) {
      this.errorMessage = 'Passwords do not match';
      return;
    }

    if (!this.agreeTerms) {
      this.errorMessage = 'You must accept the terms and conditions';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';
    this.successMessage = '';

    const trimmedEmail = this.email.trim();

    this.authService.register({
      name: this.name.trim(),
      email: trimmedEmail,
      password: this.password,
      confirmPassword: this.confirmPassword,
      agreeTerms: this.agreeTerms
    }).subscribe({
      next: (res) => {
        this.isLoading = false;
        this.successMessage = 'Registration completed! Redirecting to login...';
        setTimeout(() => {
          this.router.navigate(['/login']);
        }, 1000);
      },
      error: (err) => {
        this.isLoading = false;
        let msg = 'Registration failed. Please try again.';
        if (typeof err === 'string') {
          msg = err;
        } else {
          const errorData = err?.error || err;
          if (typeof errorData === 'string') {
            msg = errorData;
          } else if (Array.isArray(errorData?.message)) {
            msg = errorData.message.join(', ');
          } else if (typeof errorData?.message === 'string') {
            msg = errorData.message;
          } else if (typeof errorData?.error === 'string') {
            msg = errorData.error;
          }
        }
        this.errorMessage = msg;
      }
    });
  }
}
