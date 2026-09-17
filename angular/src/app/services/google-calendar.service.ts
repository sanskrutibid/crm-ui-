import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class GoogleCalendarService {
  private apiUrl = `${environment.apiUrl}/google-calendar`;

  constructor(private http: HttpClient) {}

  /**
   * Get the Google Calendar OAuth redirect URL.
   */
  getAuthUrl(): Observable<{ url: string }> {
    return this.http.get<{ url: string }>(`${this.apiUrl}/auth-url`);
  }

  /**
   * Connect/exchange auth code for tokens on backend.
   */
  connect(code: string): Observable<{ success: boolean }> {
    return this.http.post<{ success: boolean }>(`${this.apiUrl}/connect`, { code });
  }

  /**
   * Disconnect Google Calendar account from backend.
   */
  disconnect(): Observable<{ success: boolean }> {
    return this.http.post<{ success: boolean }>(`${this.apiUrl}/disconnect`, {});
  }

  /**
   * Get Google Calendar connection status for the logged-in user.
   */
  getStatus(): Observable<{ isConnected: boolean; googleEmail?: string }> {
    return this.http.get<{ isConnected: boolean; googleEmail?: string }>(`${this.apiUrl}/status`);
  }
}
