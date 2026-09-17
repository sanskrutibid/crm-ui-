import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { GoogleCalendarService } from '../../../services/google-calendar.service';

@Component({
  selector: 'app-google-callback',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './google-callback.html',
  styles: [`
    .callback-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      background: #f4f7fb;
      color: #374151;
      font-family: sans-serif;
    }
    .spinner {
      width: 50px;
      height: 50px;
      border: 5px solid #e5e7eb;
      border-top: 5px solid #062b1b;
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin-bottom: 20px;
    }
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
    h2 {
      font-size: 20px;
      font-weight: 600;
      margin-bottom: 8px;
    }
    p {
      color: #6b7280;
    }
  `]
})
export class GoogleCallbackComponent implements OnInit {
  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private calendarService: GoogleCalendarService
  ) {}

  ngOnInit(): void {
    const code = this.route.snapshot.queryParamMap.get('code');
    if (code) {
      this.calendarService.connect(code).subscribe({
        next: (res) => {
          if (res.success) {
            alert('Google Calendar connected successfully!');
          } else {
            alert('Failed to connect Google Calendar.');
          }
          this.router.navigate(['/google-calendar']);
        },
        error: (err) => {
          console.error('OAuth token exchange failed:', err);
          alert('Failed to connect Google Calendar. Check server logs.');
          this.router.navigate(['/google-calendar']);
        }
      });
    } else {
      alert('Invalid or missing OAuth authorization code.');
      this.router.navigate(['/google-calendar']);
    }
  }
}
