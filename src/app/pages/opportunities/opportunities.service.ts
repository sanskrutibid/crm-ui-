import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class OpportunitiesService {
  private apiUrl = `${environment.apiUrl}/opportunities`;

  constructor(private http: HttpClient) {}

  /**
   * Get list of filtered opportunities
   */
  getOpportunities(query: {
    viewType?: string;
    search?: string;
    assignedTo?: string;
    updatedSince?: string;
    sortBy?: string;
    orderBy?: 'Asc' | 'Desc';
    customerType?: string;
    contactType?: string;
    followupDateFrom?: string;
    followupDateTo?: string;
    createDateFrom?: string;
    createDateTo?: string;
    assignedDateFrom?: string;
    assignedDateTo?: string;
    updateDateFrom?: string;
    updateDateTo?: string;
    submittedBy?: string;
    city?: string;
    location?: string;
    purpose?: string;
    source?: string;
    branch?: string;
    status?: string;
    permission?: string;
    page?: number;
    limit?: number;
  } = {}): Observable<{ opportunities: any[]; total: number }> {
    let params = new HttpParams();

    Object.keys(query).forEach(key => {
      const val = (query as any)[key];
      if (val !== undefined && val !== null && val !== '') {
        params = params.set(key, val.toString());
      }
    });

    return this.http.get<{ opportunities: any[]; total: number }>(this.apiUrl, { params });
  }

  /**
   * Get my opportunities
   */
  getMyOpportunities(query: {
    sortBy?: string;
    orderBy?: 'Asc' | 'Desc';
    page?: number;
    limit?: number;
  } = {}): Observable<{ opportunities: any[]; totalRecords: number }> {
    let params = new HttpParams();

    Object.keys(query).forEach(key => {
      const val = (query as any)[key];
      if (val !== undefined && val !== null && val !== '') {
        params = params.set(key, val.toString());
      }
    });

    return this.http.get<{ opportunities: any[]; totalRecords: number }>(`${this.apiUrl}/my-opportunities`, { params });
  }

  /**
   * Get today's follow-up opportunities
   */
  getTodayFollowup(query: {
    assignedTo?: string;
    sortBy?: string;
    orderBy?: 'Asc' | 'Desc';
    page?: number;
    limit?: number;
  } = {}): Observable<any> {
    let params = new HttpParams();

    Object.keys(query).forEach(key => {
      const val = (query as any)[key];
      if (val !== undefined && val !== null && val !== '') {
        params = params.set(key, val.toString());
      }
    });

    return this.http.get<any>(`${this.apiUrl}/today-followup`, { params });
  }

  /**
   * Get active pipeline open opportunities
   */
  getOpenOpportunities(query: {
    assignedTo?: string;
    branch?: string;
    sortBy?: string;
    orderBy?: 'Asc' | 'Desc';
    page?: number;
    limit?: number;
  } = {}): Observable<any> {
    let params = new HttpParams();

    Object.keys(query).forEach(key => {
      const val = (query as any)[key];
      if (val !== undefined && val !== null && val !== '') {
        params = params.set(key, val.toString());
      }
    });

    return this.http.get<any>(`${this.apiUrl}/open`, { params });
  }

  /**
   * Retrieve single opportunity details by ID
   */
  getOpportunityById(id: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${id}`);
  }

  /**
   * Create a new opportunity
   */
  createOpportunity(opportunityData: any): Observable<any> {
    return this.http.post<any>(this.apiUrl, opportunityData);
  }

  /**
   * Update an existing opportunity
   */
  updateOpportunity(id: string, opportunityData: any): Observable<any> {
    return this.http.patch<any>(`${this.apiUrl}/${id}`, opportunityData);
  }

  /**
   * Delete an opportunity record
   */
  deleteOpportunity(id: string): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/${id}`);
  }

  groupDelete(data: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/actions/group-delete`, data);
  }

  exportToGoogleDrive(data: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/actions/google-drive`, data);
  }

  importOpportunities(opportunities: any[]): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/actions/import`, opportunities);
  }

  changeStatus(id: string, data: { status: string; outcome: string }): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/${id}/actions/change-status`, data);
  }

  addQuickNote(id: string, data: { commentType: string; comment: string }): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/${id}/actions/quick-note`, data);
  }

  updateRequirement(id: string, data: { requirement: string }): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/${id}/actions/update-requirement`, data);
  }

  sendSms(id: string, data: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/${id}/actions/send-sms`, data);
  }

  sendEmail(id: string, data: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/${id}/actions/send-email`, data);
  }

  sendProposal(id: string, data: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/${id}/actions/send-proposal`, data);
  }
}
