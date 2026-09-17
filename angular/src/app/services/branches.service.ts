import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, of } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { environment } from '../../environments/environment';

export interface BranchItem {
  id?: string | number;
  _id?: string;
  name: string;
  owner?: string;
  members?: number;
  assignee?: string;
  routing?: string;
  duration?: number;
}

@Injectable({
  providedIn: 'root'
})
export class BranchesService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/branches`;

  private branchesSubject = new BehaviorSubject<BranchItem[]>(this.getStoredBranches());
  public branches$ = this.branchesSubject.asObservable();

  public getStoredBranches(): BranchItem[] {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('crm_branches');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) {
            return parsed;
          }
        } catch (e) {
          console.error('Error parsing stored branches', e);
        }
      }
    }
    return [
      { id: '1', name: 'Global Team', members: 70, owner: 'Admin' },
      { id: '2', name: 'Nagpur Branch', members: 28, owner: 'Rahul' },
      { id: '3', name: 'Pune Branch', members: 16, owner: 'Neha' },
      { id: '4', name: 'Mumbai Branch', members: 11, owner: 'Amit' }
    ];
  }

  private saveStoredBranches(branches: BranchItem[]): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem('crm_branches', JSON.stringify(branches));
    }
    this.branchesSubject.next(branches);
  }

  getBranches(): Observable<BranchItem[]> {
    return this.http.get<any>(this.apiUrl).pipe(
      map(res => {
        const list = Array.isArray(res) ? res : (res?.data || res?.branches || []);
        return Array.isArray(list) && list.length > 0 ? list : this.getStoredBranches();
      }),
      tap(list => {
        if (Array.isArray(list) && list.length > 0) {
          this.saveStoredBranches(list);
        }
      }),
      catchError(() => {
        return of(this.getStoredBranches());
      })
    );
  }

  getBranchNames(): Observable<string[]> {
    return this.getBranches().pipe(
      map(branches => {
        const names = branches
          .map(b => (typeof b === 'string' ? b : b.name))
          .filter((name): name is string => !!name && typeof name === 'string');
        return Array.from(new Set(names));
      })
    );
  }

  createBranch(branchData: Partial<BranchItem>): Observable<any> {
    return this.http.post<any>(this.apiUrl, branchData).pipe(
      tap(res => {
        const current = this.getStoredBranches();
        const maxId = current.length > 0 ? Math.max(...current.map(b => Number(b.id) || 0), 0) : 0;
        const nextId = String(maxId + 1);
        const newBranch = res.data || res.branch || { ...branchData, id: res.id || nextId };
        const filtered = current.filter(b => String(b.id) !== String(newBranch.id));
        this.saveStoredBranches([...filtered, newBranch]);
      }),
      catchError(() => {
        const current = this.getStoredBranches();
        const maxId = current.length > 0 ? Math.max(...current.map(b => Number(b.id) || 0), 0) : 0;
        const nextId = String(maxId + 1);
        const localNew: BranchItem = {
          id: nextId,
          name: branchData.name || 'New Branch',
          owner: branchData.owner || 'Admin',
          members: branchData.members || 0,
          assignee: branchData.assignee,
          routing: branchData.routing,
          duration: branchData.duration
        };
        const updated = [...current, localNew];
        this.saveStoredBranches(updated);
        return of({ success: true, data: localNew, message: 'Branch created locally' });
      })
    );
  }
}
