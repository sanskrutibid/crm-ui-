import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ProjectsService {
  private apiUrl = `${environment.apiUrl}/projects`;

  constructor(private http: HttpClient) {}

  /**
   * Get list of filtered projects
   */
  getProjects(query: {
    viewType?: string;
    search?: string;
    projectName?: string;
    reraNumber?: string;
    type?: string;
    totalRoom?: string;
    priceFrom?: number;
    priceTo?: number;
    areaFrom?: number;
    areaTo?: number;
    areaUnit?: string;
    city?: string;
    locality?: string;
    transaction?: string;
    customer?: string;
    submittedBy?: string;
    branch?: string;
    assignedTo?: string;
    dateFrom?: string;
    dateTo?: string;
    status?: string;
    sortBy?: string;
    orderBy?: 'Asc' | 'Desc';
    page?: number;
    limit?: number;
  } = {}): Observable<{ projects: any[]; total: number }> {
    let params = new HttpParams();

    Object.keys(query).forEach(key => {
      const val = (query as any)[key];
      if (val !== undefined && val !== null && val !== '') {
        params = params.set(key, val.toString());
      }
    });

    return this.http.get<{ projects: any[]; total: number }>(this.apiUrl, { params });
  }

  /**
   * Get available projects
   */
  getAvailableProjects(query: any = {}): Observable<{ projects: any[]; total: number }> {
    let params = new HttpParams();
    Object.keys(query).forEach(key => {
      const val = query[key];
      if (val !== undefined && val !== null && val !== '') {
        params = params.set(key, val.toString());
      }
    });
    return this.http.get<{ projects: any[]; total: number }>(`${this.apiUrl}/available`, { params });
  }

  /**
   * Get RERA/HIRA projects
   */
  getReraProjects(query: any = {}): Observable<{ projects: any[]; total: number }> {
    let params = new HttpParams();
    Object.keys(query).forEach(key => {
      const val = query[key];
      if (val !== undefined && val !== null && val !== '') {
        params = params.set(key, val.toString());
      }
    });
    return this.http.get<{ projects: any[]; total: number }>(`${this.apiUrl}/rera-hira`, { params });
  }

  /**
   * Retrieve single project details by ID
   */
  getProjectById(id: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${id}`);
  }

  /**
   * Create a new project profile
   */
  createProject(projectData: any): Observable<any> {
    return this.http.post<any>(this.apiUrl, projectData);
  }

  /**
   * Update an existing project
   */
  updateProject(id: string, projectData: any): Observable<any> {
    return this.http.patch<any>(`${this.apiUrl}/${id}`, projectData);
  }

  /**
   * Delete a project record
   */
  deleteProject(id: string): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/${id}`);
  }

  importProjects(projects: any[]): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/actions/import`, projects);
  }

  sendProposal(id: string, payload: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/${id}/actions/send-proposal`, payload);
  }
}
