import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class MessagesService {
  private apiUrl = `${environment.apiUrl}/sms`;

  constructor(private http: HttpClient) {}

  scheduleSms(smsData: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/schedule`, smsData);
  }

  getSmsReports(query: {
    search?: string;
    status?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    page?: number;
    limit?: number;
  } = {}): Observable<{ smsReports: any[]; total: number }> {
    let params = new HttpParams();

    Object.keys(query).forEach(key => {
      const val = (query as any)[key];
      if (val !== undefined && val !== null && val !== '') {
        params = params.set(key, val.toString());
      }
    });

    return this.http.get<{ smsReports: any[]; total: number }>(`${this.apiUrl}/reports`, { params });
  }

  getSmsReportById(id: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/reports/${id}`);
  }
}
