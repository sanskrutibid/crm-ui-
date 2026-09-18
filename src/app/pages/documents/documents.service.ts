import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface DocumentClass {
  id?: string;
  _id?: string;
  type: string;
  title: string;
  description?: string;
  rating?: number;
  fileUrl: string;
  folder?: string;
  branch: string;
  assignee: any; // User ID or populated object
  createdBy?: any; // User ID or populated object
  isPublic?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

@Injectable({
  providedIn: 'root'
})
export class DocumentsService {
  private apiUrl = `${environment.apiUrl}/documents`;

  constructor(private http: HttpClient) {}

  /**
   * Get list of documents (all, filtered by type/search/etc.)
   */
  getDocuments(query: {
    type?: string;
    search?: string;
    folder?: string;
    branch?: string;
    assignee?: string;
    page?: number;
    limit?: number;
    sortBy?: string;
    orderBy?: 'Asc' | 'Desc';
  } = {}): Observable<{ documents: DocumentClass[]; total: number }> {
    let params = new HttpParams();

    Object.keys(query).forEach(key => {
      const val = (query as any)[key];
      if (val !== undefined && val !== null && val !== '') {
        params = params.set(key, val.toString());
      }
    });

    return this.http.get<{ documents: DocumentClass[]; total: number }>(this.apiUrl, { params });
  }

  /**
   * Get legal documents only
   */
  getLegalDocuments(query: {
    search?: string;
    page?: number;
    limit?: number;
    sortBy?: string;
    orderBy?: 'Asc' | 'Desc';
  } = {}): Observable<{ documents: DocumentClass[]; total: number }> {
    let params = new HttpParams();

    Object.keys(query).forEach(key => {
      const val = (query as any)[key];
      if (val !== undefined && val !== null && val !== '') {
        params = params.set(key, val.toString());
      }
    });

    return this.http.get<{ documents: DocumentClass[]; total: number }>(`${this.apiUrl}/legal`, { params });
  }

  /**
   * Get document details by ID
   */
  getDocumentById(id: string): Observable<DocumentClass> {
    return this.http.get<DocumentClass>(`${this.apiUrl}/${id}`);
  }

  /**
   * Create new document
   */
  createDocument(docData: any): Observable<DocumentClass> {
    return this.http.post<DocumentClass>(this.apiUrl, docData);
  }

  /**
   * Update document
   */
  updateDocument(id: string, docData: any): Observable<DocumentClass> {
    return this.http.patch<DocumentClass>(`${this.apiUrl}/${id}`, docData);
  }

  /**
   * Delete document
   */
  deleteDocument(id: string): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/${id}`);
  }
}
