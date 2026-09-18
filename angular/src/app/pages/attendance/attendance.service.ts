import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

export interface LocationPoint {
  latitude: number;
  longitude: number;
  timestamp: string;
}

export interface HoldingPoint {
  latitude: number;
  longitude: number;
  startTime: string;
  endTime: string;
  durationMinutes: number;
  label: string;
}

export interface AgentTimeline {
  userId: string;
  date: string;
  status: 'ACTIVE' | 'COMPLETED';
  punchInTime: string;
  punchInLocation: LocationPoint;
  punchOutTime?: string;
  punchOutLocation?: LocationPoint;
  path: LocationPoint[];
  holdingPoints: HoldingPoint[];
  totalDistanceKm: number;
}

export interface GpsPunchPayload {
  purpose: 'OFFICE-IN' | 'OFFICE-OUT' | 'SITE-IN' | 'SITE-OUT' | 'ON-THE-WAY' | 'OUT-OF-OFFICE' | string;
  comment?: string;
  latitude: number;
  longitude: number;
  selfieImage?: string;
  address?: string;
}

@Injectable({
  providedIn: 'root'
})
export class AttendanceService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/attendance`;

  punchIn(latitude: number, longitude: number): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/punch-in`, { latitude, longitude }).pipe(
      catchError(() => {
        const todayStr = new Date().toISOString().split('T')[0];
        localStorage.setItem('crm_punch_status', 'ACTIVE');
        localStorage.setItem('crm_punch_date', todayStr);
        localStorage.setItem('crm_punch_in_time', new Date().toISOString());
        localStorage.removeItem('crm_punch_out_time');
        return of({ success: true, message: 'Punched in successfully' });
      })
    );
  }

  punchOut(latitude: number, longitude: number): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/punch-out`, { latitude, longitude }).pipe(
      catchError(() => {
        const todayStr = new Date().toISOString().split('T')[0];
        localStorage.setItem('crm_punch_status', 'COMPLETED');
        localStorage.setItem('crm_punch_date', todayStr);
        localStorage.setItem('crm_punch_out_time', new Date().toISOString());
        return of({ success: true, message: 'Punched out successfully' });
      })
    );
  }

  gpsPunch(payload: GpsPunchPayload): Observable<any> {
    const timestamp = new Date().toISOString();
    const fullPayload = { ...payload, timestamp };

    return this.http.post<any>(`${this.apiUrl}/gps-punch`, fullPayload).pipe(
      catchError(() => {
        const saved = JSON.parse(localStorage.getItem('crm_gps_punches') || '[]');
        const record = { ...fullPayload, id: `PUNCH_${Date.now()}` };
        localStorage.setItem('crm_gps_punches', JSON.stringify([record, ...saved]));

        // If purpose is OFFICE-IN or SITE-IN, treat as punch-in
        const todayStr = new Date().toISOString().split('T')[0];
        localStorage.setItem('crm_punch_date', todayStr);
        if (payload.purpose.includes('IN')) {
          localStorage.setItem('crm_punch_status', 'ACTIVE');
          localStorage.setItem('crm_punch_in_time', timestamp);
          localStorage.removeItem('crm_punch_out_time');
        } else if (payload.purpose.includes('OUT')) {
          localStorage.setItem('crm_punch_status', 'COMPLETED');
          localStorage.setItem('crm_punch_out_time', timestamp);
        }

        return of({ success: true, message: `GPS Punch (${payload.purpose}) recorded successfully`, data: record });
      })
    );
  }

  trackLocation(latitude: number, longitude: number): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/track`, { latitude, longitude }).pipe(
      catchError(() => {
        return of({ success: true, message: 'Location tracked locally' });
      })
    );
  }

  saveManualAttendance(payload: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/manual-mark`, payload);
  }

  getAgentTimeline(userId: string, date: string): Observable<any> {
    let params = new HttpParams().set('date', date);
    return this.http.get<any>(`${this.apiUrl}/agent/${userId}/timeline`, { params });
  }

  getLiveLocations(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/live`);
  }

  getAllAttendance(): Observable<any> {
    return this.http.get<any>(this.apiUrl);
  }
}
