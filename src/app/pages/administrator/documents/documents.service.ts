import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, of } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';

export interface EmpDocument {
  id?: string;
  _id?: string;
  employeeId: string;
  employeeName: string;
  department?: string;
  documentType: string;
  documentNumber: string;
  issueDate?: string;
  expiryDate?: string;
  frontFile?: string;
  backFile?: string;
  remarks?: string;
  uploadDate: string;
  status: 'Verified' | 'Pending' | 'Expired' | 'Rejected';
}

@Injectable({
  providedIn: 'root'
})

export class DocumentsService {
  private apiUrl = `${environment.apiUrl}/employee-documents`;

  private initialDocuments: EmpDocument[] = [];

  private documentsSubject = new BehaviorSubject<EmpDocument[]>(this.getStoredDocuments());
  public documents$ = this.documentsSubject.asObservable();

  constructor(private http: HttpClient) { }

  public getStoredDocuments(): EmpDocument[] {
    const saved = localStorage.getItem('crm_employee_documents');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          const clean = parsed.filter(d => !['DOC001', 'DOC002', 'DOC003', 'DOC004'].includes(d.id || ''));
          if (clean.length !== parsed.length) {
            localStorage.setItem('crm_employee_documents', JSON.stringify(clean));
          }
          return clean;
        }
      } catch (e) {
        console.error('Error parsing stored documents', e);
      }
    }
    return [];
  }

  private saveStoredDocuments(docs: EmpDocument[]): void {
    localStorage.setItem('crm_employee_documents', JSON.stringify(docs));
    this.documentsSubject.next(docs);
  }

  getDocuments(params?: any): Observable<any> {
    return this.http.get<any>(this.apiUrl, { params }).pipe(
      tap(res => {
        const list = Array.isArray(res) ? res : (res?.documents || res?.data || []);
        if (Array.isArray(list)) {
          this.saveStoredDocuments(list);
        }
      }),
      catchError(() => {
        let list = this.getStoredDocuments();
        if (params) {
          if (params.search) {
            const q = params.search.toLowerCase();
            list = list.filter(d =>
              d.employeeName.toLowerCase().includes(q) ||
              d.employeeId.toLowerCase().includes(q) ||
              d.documentNumber.toLowerCase().includes(q)
            );
          }
          if (params.type && params.type !== 'All') {
            list = list.filter(d => d.documentType === params.type);
          }
          if (params.status && params.status !== 'All') {
            list = list.filter(d => d.status === params.status);
          }
        }
        return of({ documents: list, total: list.length });
      })
    );
  }

  saveDocument(docData: EmpDocument): Observable<any> {
    const payload = {
      ...docData,
      id: docData.id || `DOC${Date.now().toString().slice(-4)}`,
      uploadDate: docData.uploadDate || new Date().toISOString().split('T')[0],
      status: docData.status || 'Verified'
    };

    return this.http.post<any>(this.apiUrl, payload).pipe(
      tap((res) => {
        const newDoc = res.data || res.document || payload;
        const current = this.getStoredDocuments();
        this.saveStoredDocuments([newDoc, ...current]);
      }),
      catchError(() => {
        const current = this.getStoredDocuments();
        const updated = [payload, ...current];
        this.saveStoredDocuments(updated);
        return of({ success: true, data: payload, message: 'Document uploaded successfully' });
      })
    );
  }

  updateDocument(id: string, docData: Partial<EmpDocument>): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/${id}`, docData).pipe(
      tap((res) => {
        const updatedDoc = res.data || docData;
        const current = this.getStoredDocuments();
        const index = current.findIndex(d => d.id === id || d._id === id);
        if (index !== -1) {
          current[index] = { ...current[index], ...updatedDoc };
          this.saveStoredDocuments(current);
        }
      }),
      catchError(() => {
        const current = this.getStoredDocuments();
        const index = current.findIndex(d => d.id === id || d._id === id);
        if (index !== -1) {
          current[index] = { ...current[index], ...docData };
          this.saveStoredDocuments(current);
        }
        return of({ success: true, message: 'Document updated successfully' });
      })
    );
  }

  deleteDocument(id: string): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/${id}`).pipe(
      tap(() => {
        const current = this.getStoredDocuments();
        const updated = current.filter(d => d.id !== id && d._id !== id);
        this.saveStoredDocuments(updated);
      }),
      catchError(() => {
        const current = this.getStoredDocuments();
        const updated = current.filter(d => d.id !== id && d._id !== id);
        this.saveStoredDocuments(updated);
        return of({ success: true, message: 'Document deleted successfully' });
      })
    );
  }
}
