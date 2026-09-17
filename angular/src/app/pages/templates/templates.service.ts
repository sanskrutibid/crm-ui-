import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class TemplatesService {
  private apiUrl = `${environment.apiUrl}/templates`;

  constructor(private http: HttpClient) {}

  /**
   * Fetch all templates with search/filtering parameters.
   */
  getTemplates(query: {
    search?: string;
    templateType?: string;
    layoutType?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    page?: number;
    limit?: number;
  } = {}): Observable<{ templates: any[]; total: number }> {
    let params = new HttpParams();

    Object.keys(query).forEach(key => {
      const val = (query as any)[key];
      if (val !== undefined && val !== null && val !== '') {
        params = params.set(key, val.toString());
      }
    });

    return this.http.get<{ templates: any[]; total: number }>(this.apiUrl, { params });
  }

  /**
   * Fetch a single template by its MongoDB ID.
   */
  getTemplateById(id: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${id}`);
  }

  /**
   * Create a new template.
   */
  createTemplate(templateData: any): Observable<any> {
    return this.http.post<any>(this.apiUrl, templateData);
  }

  /**
   * Update an existing template.
   */
  updateTemplate(id: string, templateData: any): Observable<any> {
    return this.http.patch<any>(`${this.apiUrl}/${id}`, templateData);
  }

  /**
   * Delete a template by ID.
   */
  deleteTemplate(id: string): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/${id}`);
  }
}
