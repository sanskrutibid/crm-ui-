import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GoogleCalendarService } from '../../../services/google-calendar.service';

@Component({
  selector: 'app-google-calendar-settings',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './google-calendar.html',
  styleUrls: ['./google-calendar.css']
})
export class GoogleCalendarSettingsComponent implements OnInit {
  isConnected: boolean = false;
  googleEmail: string | undefined;
  loading: boolean = true;

  constructor(private calendarService: GoogleCalendarService) {}

  ngOnInit(): void {
    this.checkStatus();
  }

  checkStatus(): void {
    this.loading = true;
    this.calendarService.getStatus().subscribe({
      next: (res) => {
        this.isConnected = res.isConnected;
        this.googleEmail = res.googleEmail;
        this.loading = false;
      },
      error: (err) => {
        console.error('Failed to get connection status:', err);
        this.loading = false;
      }
    });
  }

  connect(): void {
    this.loading = true;
    this.calendarService.getAuthUrl().subscribe({
      next: (res) => {
        if (res && res.url) {
          window.location.href = res.url;
        } else {
          alert('Failed to get authentication URL from server.');
          this.loading = false;
        }
      },
      error: (err) => {
        console.error('Failed to connect Google Calendar:', err);
        alert('An error occurred while connecting Google Calendar.');
        this.loading = false;
      }
    });
  }

  disconnect(): void {
    if (confirm('Are you sure you want to disconnect Google Calendar? Site visits and leads will no longer sync.')) {
      this.loading = true;
      this.calendarService.disconnect().subscribe({
        next: (res) => {
          if (res.success) {
            this.isConnected = false;
            this.googleEmail = undefined;
            alert('Google Calendar disconnected successfully!');
          } else {
            alert('Failed to disconnect Google Calendar.');
          }
          this.loading = false;
        },
        error: (err) => {
          console.error('Failed to disconnect Google Calendar:', err);
          alert('An error occurred while disconnecting Google Calendar.');
          this.loading = false;
        }
      });
    }
  }
}
