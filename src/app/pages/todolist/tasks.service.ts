import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface Task {
  id?: string;
  _id?: string;
  task: string;
  description?: string;
  scheduledDate: string;
  scheduleTime: string;
  branch?: string;
  status: 'Open' | 'Closed';
  assignedTo?: any;
  createdAt?: string;
  updatedAt?: string;
}

@Injectable({
  providedIn: 'root'
})
export class TasksService {
  private apiUrl = `${environment.apiUrl}/tasks`;

  constructor(private http: HttpClient) {}

  /**
   * Get filtered, sorted list of tasks
   */
  getTasks(query: {
    status?: 'Open' | 'Closed';
    search?: string;
    assignedTo?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    branch?: string;
    startDate?: string;
    endDate?: string;
    page?: number;
    limit?: number;
  } = {}): Observable<{ tasks: Task[]; total: number }> {
    let params = new HttpParams();

    Object.keys(query).forEach(key => {
      const val = (query as any)[key];
      if (val !== undefined && val !== null && val !== '') {
        params = params.set(key, val.toString());
      }
    });

    return this.http.get<{ tasks: Task[]; total: number }>(this.apiUrl, { params });
  }

  /**
   * Get task counts (all, open, closed)
   */
  getTaskCounts(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/counts`);
  }

  /**
   * Retrieve a detailed task by ID
   */
  getTaskById(id: string): Observable<Task> {
    return this.http.get<Task>(`${this.apiUrl}/${id}`);
  }

  /**
   * Create a new task
   */
  createTask(taskData: any): Observable<Task> {
    return this.http.post<Task>(this.apiUrl, taskData);
  }

  /**
   * Update an existing task's properties
   */
  updateTask(id: string, taskData: any): Observable<Task> {
    return this.http.patch<Task>(`${this.apiUrl}/${id}`, taskData);
  }

  /**
   * Delete a task by ID
   */
  deleteTask(id: string): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/${id}`);
  }
}
