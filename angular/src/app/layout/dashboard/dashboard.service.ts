import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class DashboardService {
  private apiUrl = `${environment.apiUrl}/dashboard`;

  constructor(private http: HttpClient) {}

  getStats(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/stats`);
  }

  getActivities(limit?: number): Observable<any> {
    let url = `${environment.apiUrl}/activities`;
    if (limit) {
      url += `?limit=${limit}`;
    }
    return this.http.get<any>(url);
  }
}
