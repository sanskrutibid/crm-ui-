import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, of } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { environment } from '../../environments/environment';

export interface SourceItem {
  _id?: string;
  id?: string | number;
  sourceId?: number;
  displayId?: number;
  name: string;
  isActive: boolean;
  status?: 'Active' | 'Inactive' | string;
  createdAt?: string;
  updatedAt?: string;
}

@Injectable({
  providedIn: 'root'
})
export class SourcesService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/sources`;

  private sourcesSubject = new BehaviorSubject<SourceItem[]>([]);
  public sources$ = this.sourcesSubject.asObservable();

  /**
   * Fetch all sources directly from backend DB API
   */
  getSources(): Observable<SourceItem[]> {
    return this.http.get<any>(this.apiUrl).pipe(
      map(res => {
        const list = Array.isArray(res) ? res : (res?.data || res?.sources || res?.results || []);
        if (Array.isArray(list)) {
          const normalized: SourceItem[] = list.map((item, idx) => {
            const rawId = item._id || item.id || item.sourceId;
            const isAct = item.isActive !== undefined ? !!item.isActive : true;
            return {
              _id: item._id || item.id || String(rawId),
              id: item.id || item._id || rawId,
              sourceId: item.sourceId || item.source_id || (idx + 1),
              displayId: idx + 1,
              name: (item.name || item.sourceName || item.source_name || item.source || item.label || '').trim(),
              isActive: isAct,
              status: isAct ? 'Active' : 'Inactive',
              createdAt: item.createdAt || new Date().toISOString(),
              updatedAt: item.updatedAt || new Date().toISOString()
            };
          }).filter(s => !!s.name);

          normalized.sort((a, b) => {
            const numA = Number(a.sourceId) || 0;
            const numB = Number(b.sourceId) || 0;
            if (numA !== numB && numA > 0 && numB > 0) return numA - numB;
            if (a.createdAt && b.createdAt) {
              return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
            }
            return 0;
          });
          return normalized.map((item, idx) => ({ ...item, displayId: idx + 1 }));
        }
        return [];
      }),
      tap(list => {
        this.sourcesSubject.next(list);
      })
    );
  }

  /**
   * Get single source by ID
   */
  getSourceById(id: string | number): Observable<SourceItem | null> {
    return this.http.get<any>(`${this.apiUrl}/${id}`).pipe(
      map(res => {
        const item = res?.data || res?.source || res;
        if (item && (item.name || item.sourceName)) {
          const isAct = item.isActive !== undefined ? !!item.isActive : true;
          return {
            _id: item._id || item.id || String(id),
            id: item.id || item._id || id,
            sourceId: item.sourceId || item.source_id,
            name: (item.name || item.sourceName || '').trim(),
            isActive: isAct,
            status: isAct ? 'Active' : 'Inactive',
            createdAt: item.createdAt,
            updatedAt: item.updatedAt
          };
        }
        return null;
      })
    );
  }

  /**
   * Get only names of active sources for dropdowns across the CRM
   */
  getSourceNames(): Observable<string[]> {
    return this.getSources().pipe(
      map(sources => {
        const names = sources
          .filter(s => s.isActive !== false)
          .map(s => s.name)
          .filter((name): name is string => !!name && typeof name === 'string');
        return Array.from(new Set(names));
      })
    );
  }

  /**
   * Create a new source via API POST { name, isActive } matching backend DTO exactly
   */
  createSource(sourceData: { name: string; isActive?: boolean }): Observable<any> {
    const payload = {
      name: (sourceData.name || '').trim(),
      isActive: sourceData.isActive !== undefined ? !!sourceData.isActive : true
    };

    return this.http.post<any>(this.apiUrl, payload).pipe(
      tap(() => {
        this.getSources().subscribe();
      })
    );
  }

  /**
   * Update an existing source via API PATCH { name, isActive }
   */
  updateSource(id: string | number, sourceData: { name?: string; isActive?: boolean }): Observable<any> {
    const payload: any = {};
    if (sourceData.name !== undefined) {
      payload.name = sourceData.name.trim();
    }
    if (sourceData.isActive !== undefined) {
      payload.isActive = !!sourceData.isActive;
    }

    return this.http.patch<any>(`${this.apiUrl}/${id}`, payload).pipe(
      tap(() => {
        this.getSources().subscribe();
      })
    );
  }

  /**
   * Delete a source from backend API DELETE /api/v1/sources/:id
   */
  deleteSource(id: string | number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/${id}`).pipe(
      tap(() => {
        this.getSources().subscribe();
      })
    );
  }

  /**
   * Toggle Active/Inactive status
   */
  toggleStatus(id: string | number, currentActive: boolean): Observable<any> {
    return this.updateSource(id, { isActive: !currentActive });
  }
}
