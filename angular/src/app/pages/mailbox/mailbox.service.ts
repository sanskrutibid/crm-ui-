import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class MailboxService {
  private apiUrl = `${environment.apiUrl}/emails`;

  constructor(private http: HttpClient) {}

  scheduleEmail(emailData: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/schedule`, emailData);
  }

  getEmailReports(query: {
    search?: string;
    status?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    page?: number;
    limit?: number;
  } = {}): Observable<{ emails: any[]; total: number }> {
    let params = new HttpParams();

    Object.keys(query).forEach(key => {
      const val = (query as any)[key];
      if (val !== undefined && val !== null && val !== '') {
        params = params.set(key, val.toString());
      }
    });

    return this.http.get<{ emails: any[]; total: number }>(`${this.apiUrl}/reports`, { params });
  }

  getEmailReportById(id: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/reports/${id}`);
  }

  getEmailHtmlUrl(id: string): string {
    return `${this.apiUrl}/${id}/html`;
  }
}
