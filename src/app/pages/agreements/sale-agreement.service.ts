import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class SaleAgreementService {
  private apiUrl = `${environment.apiUrl}/sale-agreements`;

  constructor(private http: HttpClient) { }

  /**
   * Get list of filtered sale agreements
   */
  getSaleAgreements(query: {
    search?: string;
    sortBy?: string;
    orderBy?: 'Asc' | 'Desc';
    page?: number;
    limit?: number;
  } = {}): Observable<{ saleAgreements: any[]; total: number }> {
    let params = new HttpParams();

    Object.keys(query).forEach(key => {
      const val = (query as any)[key];
      if (val !== undefined && val !== null && val !== '') {
        params = params.set(key, val.toString());
      }
    });

    return this.http.get<{ saleAgreements: any[]; total: number }>(this.apiUrl, { params });
  }

  /**
   * Retrieve single sale agreement details by ID
   */
  getSaleAgreementById(id: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${id}`);
  }

  /**
   * Create a new sale agreement
   */
  createSaleAgreement(agreementData: any): Observable<any> {
    return this.http.post<any>(this.apiUrl, agreementData);
  }

  /**
   * Update an existing sale agreement
   */
  updateSaleAgreement(id: string, agreementData: any): Observable<any> {
    return this.http.patch<any>(`${this.apiUrl}/${id}`, agreementData);
  }

  /**
   * Delete a sale agreement record
   */
  deleteSaleAgreement(id: string): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/${id}`);
  }
}
