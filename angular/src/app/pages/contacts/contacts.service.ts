import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ContactsService {
  private apiUrl = `${environment.apiUrl}/contacts`;

  constructor(private http: HttpClient) {}

  getCountries(): Observable<any[]> {
    return this.http.get<any[]>(`${environment.apiUrl}/locations/countries`);
  }

  getCities(countryIso: string): Observable<string[]> {
    const params = new HttpParams().set('countryIso', countryIso);
    return this.http.get<string[]>(`${environment.apiUrl}/locations/cities`, { params });
  }

  getPincodes(countryIso: string, city: string): Observable<any[]> {
    const params = new HttpParams().set('countryIso', countryIso).set('city', city);
    return this.http.get<any[]>(`${environment.apiUrl}/locations/pincodes`, { params });
  }

  validatePincode(countryIso: string, city: string, pincode: string): Observable<any> {
    const params = new HttpParams()
      .set('countryIso', countryIso)
      .set('city', city)
      .set('pincode', pincode);
    return this.http.get<any>(`${environment.apiUrl}/locations/validate-pincode`, { params });
  }

  /**
   * Get all contacts with optional filter, sorting, searching and pagination.
   */
  getContacts(query: any = {}): Observable<{ contacts: any[]; total: number; todayCount?: number; shortlistedCount?: number }> {
    let params = new HttpParams();

    Object.keys(query).forEach(key => {
      const val = query[key];
      if (val !== undefined && val !== null && val !== '') {
        params = params.set(key, val.toString());
      }
    });

    return this.http.get<{ contacts: any[]; total: number; todayCount?: number; shortlistedCount?: number }>(this.apiUrl, { params });
  }

  /**
   * Retrieve a detailed contact profile by ID.
   */
  getContactById(id: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${id}`);
  }

  /**
   * Create a new contact.
   */
  createContact(contactData: any): Observable<any> {
    return this.http.post<any>(this.apiUrl, contactData);
  }

  /**
   * Update an existing contact profile.
   */
  updateContact(id: string, contactData: any): Observable<any> {
    return this.http.patch<any>(`${this.apiUrl}/${id}`, contactData);
  }

  /**
   * Delete a contact by ID.
   */
  deleteContact(id: string): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/${id}`);
  }

  sendGroupEmail(data: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/actions/send-email`, data);
  }

  sendGroupSms(data: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/actions/send-sms`, data);
  }

  sendEmailOtp(email: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/email-verification/send`, { email });
  }

  verifyEmailOtp(email: string, otp: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/email-verification/verify`, { email, otp });
  }

  createAudience(data: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/actions/create-audience`, data);
  }

  groupDelete(data: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/actions/group-delete`, data);
  }

  /**
   * Import contacts in bulk from spreadsheet JSON data.
   */
  importContacts(contacts: any[]): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/actions/import`, contacts);
  }

  /**
   * Retrieve detailed creation, conversion, and activity history for a contact.
   */
  getDetailedHistory(id: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/${id}/detailed-history`);
  }

  getDuplicateCount(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/actions/duplicate-count`);
  }

  autoMerge(): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/actions/auto-merge`, {});
  }
}
