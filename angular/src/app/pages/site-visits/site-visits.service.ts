import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class SiteVisitsService {
  private apiUrl = `${environment.apiUrl}/site-visits`;

  constructor(private http: HttpClient) {}

  /**
   * Get all site visits with optional query parameters for search/sorting/filtering.
   */
  getSiteVisits(query: {
    search?: string;
    visitType?: string;
    module?: string;
    visitStatus?: string;
    source?: string;
    branch?: string;
    assignee?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    page?: number;
    limit?: number;
  } = {}): Observable<{ siteVisits: any[]; total: number }> {
    let params = new HttpParams();

    Object.keys(query).forEach(key => {
      const val = (query as any)[key];
      if (val !== undefined && val !== null && val !== '') {
        params = params.set(key, val.toString());
      }
    });

    return this.http.get<{ siteVisits: any[]; total: number }>(this.apiUrl, { params });
  }

  /**
   * Retrieve single site visit details by ID.
   */
  getSiteVisitById(id: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${id}`);
  }

  /**
   * Create a new site visit.
   */
  createSiteVisit(visitData: any): Observable<any> {
    return this.http.post<any>(this.apiUrl, visitData);
  }

  /**
   * Update an existing site visit profile.
   */
  updateSiteVisit(id: string, visitData: any): Observable<any> {
    return this.http.patch<any>(`${this.apiUrl}/${id}`, visitData);
  }

  /**
   * Verify site visit OTP.
   */
  verifySiteVisitOtp(id: string, otp: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/${id}/verify-otp`, { otp });
  }

  /**
   * Delete a site visit record.
   */
  deleteSiteVisit(id: string): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/${id}`);
  }
}
