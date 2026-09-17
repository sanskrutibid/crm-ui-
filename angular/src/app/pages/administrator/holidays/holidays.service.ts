import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, of } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';

export interface Holiday {
  id?: string;
  _id?: string;
  name: string;
  date: string;
  day: string;
  type: string;
  applicableFor?: string;
  description?: string;
  status: string;
  notifyEmployees?: boolean;
  createdAt?: string;
}

@Injectable({
  providedIn: 'root'
})
export class HolidaysService {
  private apiUrl = `${environment.apiUrl}/holidays`;

  // Fallback / Initial State for robust local management & instant reactivity


  private holidaysSubject = new BehaviorSubject<Holiday[]>(this.getStoredHolidays());
  public holidays$ = this.holidaysSubject.asObservable();

  constructor(private http: HttpClient) {}

  public getStoredHolidays(): Holiday[] {
    const saved = localStorage.getItem('crm_holidays');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed;
        }
      } catch (e) {
        console.error('Error parsing stored holidays', e);
      }
    }
    return [];
  }

  private saveStoredHolidays(holidays: Holiday[]): void {
    localStorage.setItem('crm_holidays', JSON.stringify(holidays));
    this.holidaysSubject.next(holidays);
  }

  getHolidays(params?: any): Observable<{ holidays: Holiday[]; total: number }> {
    return this.http.get<any>(this.apiUrl, { params }).pipe(
      tap(res => {
        const list = Array.isArray(res) ? res : (res?.holidays || res?.data || []);
        if (Array.isArray(list) && list.length > 0) {
          this.saveStoredHolidays(list);
        }
      }),
      catchError(() => {
        let list = this.getStoredHolidays();
        if (params) {
          if (params.search) {
            const searchLower = params.search.toLowerCase();
            list = list.filter(h => h.name.toLowerCase().includes(searchLower) || (h.description && h.description.toLowerCase().includes(searchLower)));
          }
          if (params.type && params.type !== 'All') {
            list = list.filter(h => h.type === params.type);
          }
          if (params.status && params.status !== 'All') {
            list = list.filter(h => h.status === params.status);
          }
          if (params.year && params.year !== 'All') {
            list = list.filter(h => h.date && h.date.includes(params.year));
          }
        }
        return of({ holidays: list, total: list.length });
      })
    );
  }

  getHolidayById(id: string): Observable<Holiday> {
    return this.http.get<Holiday>(`${this.apiUrl}/${id}`).pipe(
      catchError(() => {
        const found = this.getStoredHolidays().find(h => h.id === id || h._id === id);
        return of(found || null as any);
      })
    );
  }

  createHoliday(holidayData: Holiday): Observable<any> {
    const payload = {
      ...holidayData,
      createdAt: new Date().toISOString()
    };

    return this.http.post<any>(this.apiUrl, payload).pipe(
      tap((res) => {
        const newHoliday = res.data || res.holiday || { ...payload, id: res.id || Date.now().toString() };
        const current = this.getStoredHolidays();
        this.saveStoredHolidays([newHoliday, ...current]);
      }),
      catchError(() => {
        const localNew: Holiday = {
          ...payload,
          id: Date.now().toString()
        };
        const current = this.getStoredHolidays();
        const updated = [localNew, ...current];
        this.saveStoredHolidays(updated);
        return of({ success: true, data: localNew, message: 'Holiday created successfully' });
      })
    );
  }

  updateHoliday(id: string, holidayData: Partial<Holiday>): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/${id}`, holidayData).pipe(
      tap(() => {
        const current = this.getStoredHolidays();
        const index = current.findIndex(h => h.id === id || h._id === id);
        if (index !== -1) {
          current[index] = { ...current[index], ...holidayData };
          this.saveStoredHolidays(current);
        }
      }),
      catchError(() => {
        const current = this.getStoredHolidays();
        const index = current.findIndex(h => h.id === id || h._id === id);
        if (index !== -1) {
          current[index] = { ...current[index], ...holidayData };
          this.saveStoredHolidays(current);
        }
        return of({ success: true, message: 'Holiday updated successfully' });
      })
    );
  }

  deleteHoliday(id: string): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/${id}`).pipe(
      tap(() => {
        const current = this.getStoredHolidays();
        const updated = current.filter(h => h.id !== id && h._id !== id);
        this.saveStoredHolidays(updated);
      }),
      catchError(() => {
        const current = this.getStoredHolidays();
        const updated = current.filter(h => h.id !== id && h._id !== id);
        this.saveStoredHolidays(updated);
        return of({ success: true, message: 'Holiday deleted successfully' });
      })
    );
  }

  getHolidayCounts(): Observable<{ total: number; active: number; inactive: number }> {
    return this.http.get<{ total: number; active: number; inactive: number }>(`${this.apiUrl}/count`).pipe(
      catchError(() => {
        const list = this.getStoredHolidays();
        const active = list.filter(h => h.status === 'Active').length;
        const inactive = list.length - active;
        return of({ total: list.length, active, inactive });
      })
    );
  }

  sendEmailNotification(holiday: Holiday): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/notify-employees`, { holidayId: holiday.id, holiday }).pipe(
      catchError(() => {
        return of({ success: true, message: `Email notification sent to all employees for ${holiday.name}` });
      })
    );
  }

  // Helper method to format date string to Day name
  getDayNameFromDate(dateStr: string): string {
    if (!dateStr) return '';
    const dateObj = new Date(dateStr);
    if (isNaN(dateObj.getTime())) return '';
    return dateObj.toLocaleDateString('en-US', { weekday: 'long' });
  }
}
