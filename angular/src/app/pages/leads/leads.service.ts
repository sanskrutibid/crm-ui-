import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class LeadsService {
  private apiUrl = `${environment.apiUrl}/leads`;

  constructor(private http: HttpClient) {}

  /**
   * Get list of filtered leads
   */
  getLeads(query: {
    search?: string;
    assignedTo?: string;
    branch?: string;
    status?: string;
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

    return this.http.get<any>(this.apiUrl, { params });
  }

  /**
   * Get today's follow-up leads
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
   * Get open/active pipeline leads
   */
  getOpenLeads(query: {
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

    return this.http.get<any>(`${this.apiUrl}/open-leads`, { params });
  }

  /**
   * Retrieve a single lead details by ID
   */
  getLeadById(id: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${id}`);
  }

  /**
   * Create a new lead
   */
  createLead(leadData: any): Observable<any> {
    return this.http.post<any>(this.apiUrl, leadData);
  }

  /**
   * Update an existing lead profile
   */
  updateLead(id: string, leadData: any): Observable<any> {
    return this.http.patch<any>(`${this.apiUrl}/${id}`, leadData);
  }

  /**
   * Delete a lead record
   */
  deleteLead(id: string): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/${id}`);
  }

  /**
   * Convert one or more contacts to leads
   */
  convertContactsToLeads(data: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/actions/convert-contacts`, data);
  }

  /**
   * Get lead conversion history for a contact
   */
  getConversionHistory(contactId?: string): Observable<any> {
    let params = new HttpParams();
    if (contactId) {
      params = params.set('contactId', contactId);
    }
    return this.http.get<any>(`${this.apiUrl}/actions/convert-history`, { params });
  }

  /**
   * Get all folders from the backend
   */
  getFolders(): Observable<any> {
    return this.http.get<any>(`${environment.apiUrl}/folders`);
  }

  sendGroupSms(data: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/actions/send-sms`, data);
  }

  sendGroupEmail(data: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/actions/send-email`, data);
  }

  groupDelete(data: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/actions/group-delete`, data);
  }

  importLeads(leads: any[]): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/actions/import`, leads);
  }

  exportToGoogleDrive(data: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/actions/google-drive`, data);
  }

  removeDuplicates(): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/actions/remove-duplicates`, {});
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

