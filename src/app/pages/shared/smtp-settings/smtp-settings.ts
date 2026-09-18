import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-smtp-settings',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './smtp-settings.html',
  styleUrl: './smtp-settings.css'
})
export class SmtpSettingsComponent implements OnInit {
  smtpData: any = {
    fromName: '',
    user: '',
    host: '',
    port: 587,
    secure: false,
    pass: ''
  };

  useAuth: boolean = true;
  isLoading: boolean = false;
  statusMessage: string = '';
  statusType: 'success' | 'error' | '' = '';

  private http = inject(HttpClient);
  private router = inject(Router);

  ngOnInit(): void {
    this.loadSmtpConfig();
  }

  loadSmtpConfig(): void {
    this.isLoading = true;
    this.http.get<any>(`${environment.apiUrl}/emails/smtp-config`).subscribe({
      next: (res: any) => {
        const payload = res.data || res;
        if (payload) {
          this.smtpData = {
            fromName: payload.fromName || '',
            user: payload.user || '',
            host: payload.host || '',
            port: payload.port || 587,
            secure: payload.secure ?? false,
            pass: '••••••••••••' // Masked password placeholder
          };
        }
        this.isLoading = false;
      },
      error: (err: any) => {
        // If not configured yet, default settings are kept
        this.isLoading = false;
      }
    });
  }

  saveConfig(): void {
    if (!this.smtpData.host || !this.smtpData.user) {
      this.statusMessage = 'Host and Username/Email are required.';
      this.statusType = 'error';
      return;
    }

    this.isLoading = true;
    this.statusMessage = '';
    this.statusType = '';

    const payload = { ...this.smtpData };
    if (payload.pass === '••••••••••••') {
      delete payload.pass; // Do not overwrite with placeholder dots
    }

    this.http.post<any>(`${environment.apiUrl}/emails/smtp-config`, payload).subscribe({
      next: (res: any) => {
        this.statusMessage = 'SMTP configuration saved successfully!';
        this.statusType = 'success';
        this.isLoading = false;
        this.loadSmtpConfig();
      },
      error: (err: any) => {
        this.statusMessage = err.error?.message || 'Failed to save SMTP configuration.';
        this.statusType = 'error';
        this.isLoading = false;
      }
    });
  }

  cancel(): void {
    this.router.navigate(['/dashboard']);
  }

  verifyConfig(): void {
    if (!this.smtpData.host || !this.smtpData.user) {
      this.statusMessage = 'Host and Username/Email are required to verify.';
      this.statusType = 'error';
      return;
    }

    this.isLoading = true;
    this.statusMessage = '';
    this.statusType = '';

    const payload = { ...this.smtpData };

    this.http.post<any>(`${environment.apiUrl}/emails/smtp-config/verify`, payload).subscribe({
      next: (res: any) => {
        const data = res.data || res;
        if (data.success) {
          this.statusMessage = 'SMTP connection verified successfully!';
          this.statusType = 'success';
        } else {
          this.statusMessage = data.message || 'SMTP connection verification failed.';
          this.statusType = 'error';
        }
        this.isLoading = false;
      },
      error: (err: any) => {
        this.statusMessage = err.error?.message || 'SMTP connection verification failed.';
        this.statusType = 'error';
        this.isLoading = false;
      }
    });
  }
}
