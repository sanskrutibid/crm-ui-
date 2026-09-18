import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './login.html',
  styleUrls: ['./login.css']
})
export class LoginComponent {
  public authService = inject(AuthService);
  private router = inject(Router);

  email = '';
  password = '';
  rememberMe = false;
  showPassword = false;

  isLoading = false;
  errorMessage = '';
  successMessage = '';

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  onSubmit(): void {
    if (!this.email || !this.password) {
      this.errorMessage = 'Please enter both your official email address and password.';
      return;
    }

    const trimmedEmail = this.email.trim();
    if (!this.authService.isOfficialEmail(trimmedEmail)) {
      this.errorMessage = 'Please enter a valid email address.';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';
    this.successMessage = '';

    if (typeof window !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          this.performLogin(position.coords.latitude, position.coords.longitude);
        },
        (error) => {
          console.warn('Geolocation notice on login, proceeding without location:', error);
          this.performLogin();
        },
        { enableHighAccuracy: true, timeout: 5000 }
      );
    } else {
      this.performLogin();
    }
  }

  private performLogin(lat?: number, long?: number): void {
    const trimmedEmail = this.email.trim();
    if (lat && long) {
      localStorage.setItem('vaultstone_login_lat', String(lat));
      localStorage.setItem('vaultstone_login_lng', String(long));
    }
    this.authService.login({
      email: trimmedEmail,
      password: this.password
    }).subscribe({
      next: () => {
        this.isLoading = false;
        this.successMessage = 'Login successful! Redirecting to dashboard...';
        setTimeout(() => {
          this.router.navigate(['/dashboard']);
        }, 800);
      },
      error: (err) => {
        this.isLoading = false;
        let msg = 'Authentication failed. Please check your credentials.';
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
