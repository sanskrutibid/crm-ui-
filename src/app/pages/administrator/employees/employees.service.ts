import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, of } from 'rxjs';
import { catchError, tap, map } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class EmployeesService {
  private apiUrl = `${environment.apiUrl}/employees`;



  private employeesSubject = new BehaviorSubject<any[]>(this.getStoredEmployees());
  public employees$ = this.employeesSubject.asObservable();

  constructor(private http: HttpClient) {}

  public getStoredEmployees(): any[] {
    const saved = localStorage.getItem('crm_employees');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed;
        }
      } catch (e) {
        console.error('Error parsing stored employees', e);
      }
    }
    return [];
  }

  private saveStoredEmployees(employees: any[]): void {
    localStorage.setItem('crm_employees', JSON.stringify(employees));
    this.employeesSubject.next(employees);
  }

  getEmployees(): Observable<any> {
    return this.http.get<any>(this.apiUrl).pipe(
      map((res: any) => {
        const list = Array.isArray(res) ? res : (res?.data || res?.employees || []);
        const stored = this.getStoredEmployees();
        if (Array.isArray(list) && list.length > 0) {
          const combined = [...list];
          stored.forEach(localEmp => {
            const exists = combined.some(s => 
              (s.id && (String(s.id) === String(localEmp.id) || String(s.id) === String(localEmp._id))) ||
              (s._id && (String(s._id) === String(localEmp.id) || String(s._id) === String(localEmp._id))) ||
              (s.employeeId && localEmp.employeeId && String(s.employeeId) === String(localEmp.employeeId)) ||
              (s.officialEmail && localEmp.officialEmail && String(s.officialEmail).toLowerCase() === String(localEmp.officialEmail).toLowerCase())
            );
            if (!exists) {
              combined.push(localEmp);
            }
          });
          this.saveStoredEmployees(combined);
          return combined;
        }
        return stored;
      }),
      catchError(() => {
        return of(this.getStoredEmployees());
      })
    );
  }

  getNextEmployeeId(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/next-id`).pipe(
      catchError(() => {
        const nextNum = this.getStoredEmployees().length + 1;
        return of({ success: true, nextId: `EMP${String(nextNum).padStart(3, '0')}` });
      })
    );
  }

  getEmployee(id: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${id}`).pipe(
      map((res: any) => {
        const data = res?.data || res;
        if (data && (data.id || data._id || data.employeeId || data.firstName || data.officialEmail)) {
          return data;
        }
        const found = this.getStoredEmployees().find(emp => 
          String(emp.id) === String(id) || 
          String(emp._id) === String(id) || 
          String(emp.employeeId) === String(id)
        );
        return found || null;
      }),
      catchError(() => {
        const found = this.getStoredEmployees().find(emp => 
          String(emp.id) === String(id) || 
          String(emp._id) === String(id) || 
          String(emp.employeeId) === String(id)
        );
        return of(found || null);
      })
    );
  }

  createEmployee(employeeData: any): Observable<any> {
    const officialEmail = (employeeData.officialEmail || employeeData.email || '').trim();
    const payload = {
      ...employeeData,
      email: officialEmail,
      officialEmail: officialEmail,
      name: `${employeeData.firstName || ''} ${employeeData.lastName || ''}`.trim(),
      status: employeeData.status || 'Active'
    };

    return this.http.post<any>(this.apiUrl, payload).pipe(
      tap(res => {
        const newEmp = res?.data || res?.employee || { ...payload, id: res?.id || payload.employeeId || `EMP${Date.now()}` };
        const current = this.getStoredEmployees();
        const filtered = current.filter(e => 
          String(e.email || e.officialEmail || '').toLowerCase() !== officialEmail.toLowerCase() &&
          String(e.employeeId || '') !== String(newEmp.employeeId || '')
        );
        this.saveStoredEmployees([newEmp, ...filtered]);
      }),
      catchError(err => {
        console.warn('Employees API notice (saved locally):', err?.message || err);
        const localNew = {
          ...payload,
          id: payload.id || payload.employeeId || `EMP${Date.now()}`,
          employeeId: payload.employeeId || payload.id || `EMP${Date.now()}`
        };
        const current = this.getStoredEmployees();
        const filtered = current.filter(e => 
          String(e.email || e.officialEmail || '').toLowerCase() !== officialEmail.toLowerCase() &&
          String(e.employeeId || '') !== String(localNew.employeeId || '')
        );
        this.saveStoredEmployees([localNew, ...filtered]);
        return of({ success: true, data: localNew, message: 'Employee added successfully' });
      })
    );
  }

  updateEmployee(id: string, employeeData: any): Observable<any> {
    const officialEmail = (employeeData.officialEmail || employeeData.email || '').trim();
    const payload = {
      ...employeeData,
      email: officialEmail,
      officialEmail: officialEmail,
      name: `${employeeData.firstName || ''} ${employeeData.lastName || ''}`.trim()
    };

    const updateLocal = () => {
      const current = this.getStoredEmployees();
      let index = current.findIndex(emp => 
        String(emp.id) === String(id) || 
        String(emp._id) === String(id) || 
        String(emp.employeeId) === String(id)
      );
      if (index === -1 && officialEmail) {
        index = current.findIndex(emp => 
          String(emp.email || emp.officialEmail || '').toLowerCase() === officialEmail.toLowerCase()
        );
      }
      if (index !== -1) {
        current[index] = { ...current[index], ...payload };
      } else {
        current.unshift({ id: id, employeeId: id, ...payload });
      }
      this.saveStoredEmployees(current);
    };

    return this.http.put<any>(`${this.apiUrl}/${id}`, payload).pipe(
      tap(() => {
        updateLocal();
      }),
      catchError(() => {
        updateLocal();
        return of({ success: true, message: 'Employee updated successfully' });
      })
    );
  }

  deleteEmployee(id: string): Observable<any> {
    const deleteLocal = () => {
      const current = this.getStoredEmployees();
      const updated = current.filter(emp => 
        String(emp.id) !== String(id) && 
        String(emp._id) !== String(id) && 
        String(emp.employeeId) !== String(id)
      );
      this.saveStoredEmployees(updated);
    };

    return this.http.delete<any>(`${this.apiUrl}/${id}`).pipe(
      tap(() => deleteLocal()),
      catchError(() => {
        deleteLocal();
        return of({ success: true, message: 'Employee deleted successfully' });
      })
    );
  }
}
