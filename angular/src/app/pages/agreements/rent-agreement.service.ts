import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class RentAgreementService {
  private apiUrl = `${environment.apiUrl}/rent-agreements`;

  constructor(private http: HttpClient) { }

  /**
   * Get list of filtered rent agreements
   */
  getRentAgreements(query: {
    search?: string;
    sortBy?: string;
    orderBy?: 'Asc' | 'Desc';
    page?: number;
    limit?: number;
  } = {}): Observable<{ rentAgreements: any[]; total: number }> {
    let params = new HttpParams();

    Object.keys(query).forEach(key => {
      const val = (query as any)[key];
      if (val !== undefined && val !== null && val !== '') {
        params = params.set(key, val.toString());
      }
    });

    return this.http.get<{ rentAgreements: any[]; total: number }>(this.apiUrl, { params });
  }

  /**
   * Retrieve single rent agreement details by ID
   */
  getRentAgreementById(id: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${id}`);
  }

  /**
   * Create a new rent agreement
   */
  createRentAgreement(agreementData: any): Observable<any> {
    return this.http.post<any>(this.apiUrl, agreementData);
  }

  /**
   * Update an existing rent agreement
   */
  updateRentAgreement(id: string, agreementData: any): Observable<any> {
    return this.http.patch<any>(`${this.apiUrl}/${id}`, agreementData);
  }

  /**
   * Delete a rent agreement record
   */
  deleteRentAgreement(id: string): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/${id}`);
  }
}