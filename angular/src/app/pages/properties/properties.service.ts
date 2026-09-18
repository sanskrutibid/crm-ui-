import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class PropertiesService {
  private apiUrl = `${environment.apiUrl}/properties`;

  constructor(private http: HttpClient) {}

  /**
   * Get list of filtered properties
   */
  getProperties(query: {
    status?: string;
    search?: string;
    updatedSince?: string;
    sortBy?: string;
    orderBy?: 'Asc' | 'Desc';
    page?: number;
    limit?: number;
  } = {}): Observable<{ properties: any[]; total: number }> {
    let params = new HttpParams();

    Object.keys(query).forEach(key => {
      const val = (query as any)[key];
      if (val !== undefined && val !== null && val !== '') {
        params = params.set(key, val.toString());
      }
    });

    return this.http.get<{ properties: any[]; total: number }>(this.apiUrl, { params });
  }

  /**
   * Get my properties
   */
  getMyProperties(query: {
    status?: string;
    search?: string;
    updatedSince?: string;
    sortBy?: string;
    orderBy?: 'Asc' | 'Desc';
    page?: number;
    limit?: number;
  } = {}): Observable<{ properties: any[]; total: number }> {
    let params = new HttpParams();

    Object.keys(query).forEach(key => {
      const val = (query as any)[key];
      if (val !== undefined && val !== null && val !== '') {
        params = params.set(key, val.toString());
      }
    });

    return this.http.get<{ properties: any[]; total: number }>(`${this.apiUrl}/my-properties`, { params });
  }

  /**
   * Get available properties
   */
  getAvailableProperties(query: {
    search?: string;
    updatedSince?: string;
    sortBy?: string;
    orderBy?: 'Asc' | 'Desc';
    page?: number;
    limit?: number;
  } = {}): Observable<{ properties: any[]; total: number }> {
    let params = new HttpParams();

    Object.keys(query).forEach(key => {
      const val = (query as any)[key];
      if (val !== undefined && val !== null && val !== '') {
        params = params.set(key, val.toString());
      }
    });

    return this.http.get<{ properties: any[]; total: number }>(`${this.apiUrl}/available-properties`, { params });
  }

  /**
   * Retrieve single property details by ID
   */
  getPropertyById(id: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${id}`);
  }

  /**
   * Create a new property
   */
  createProperty(propertyData: any): Observable<any> {
    return this.http.post<any>(this.apiUrl, propertyData);
  }

  /**
   * Update an existing property
   */
  updateProperty(id: string, propertyData: any): Observable<any> {
    return this.http.patch<any>(`${this.apiUrl}/${id}`, propertyData);
  }

  /**
   * Delete a property record
   */
  deleteProperty(id: string): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/${id}`);
  }

  groupDelete(data: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/actions/group-delete`, data);
  }

  exportToGoogleDrive(data: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/actions/google-drive`, data);
  }

  importProperties(properties: any[]): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/actions/import`, properties);
  }

  createFolder(folderData: any): Observable<any> {
    return this.http.post<any>(`${environment.apiUrl}/folders`, folderData);
  }
}
