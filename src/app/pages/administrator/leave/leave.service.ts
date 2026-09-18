import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, of } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';
import { NotificationService } from '../../../services/notification.service';

export interface LeaveRequest {
  id?: string;
  _id?: string;
  employeeId: string;
  name: string;
  image?: string;
  department: string;
  type: string;
  from: string;
  to: string;
  days: number;
  priority?: string;
  manager?: string;
  reason?: string;
  contact?: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  createdAt?: string;
  email?: string;
}

export interface LeaveBalance {
  id?: string;
  _id?: string;
  employeeId: string;
  name: string;
  image?: string;
  department: string;
  casual: number;
  sick: number;
  annual: number;
  used: number;
  remaining: number;
}

@Injectable({
  providedIn: 'root'
})
export class LeaveService {
  private apiUrl = `${environment.apiUrl}/leaves`;



  private requestsSubject = new BehaviorSubject<LeaveRequest[]>(this.getStoredRequests());
  public requests$ = this.requestsSubject.asObservable();

  private balancesSubject = new BehaviorSubject<LeaveBalance[]>(this.getStoredBalances());
  public balances$ = this.balancesSubject.asObservable();

  constructor(
    private http: HttpClient,
    private notificationService: NotificationService
  ) {
    this.recalculateAllBalances();
  }

  public getStoredRequests(): LeaveRequest[] {
    const saved = localStorage.getItem('crm_leave_requests');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed;
        }
      } catch (e) {
        console.error('Error parsing stored leave requests', e);
      }
    }
    return [];
  }

  private saveStoredRequests(requests: LeaveRequest[]): void {
    localStorage.setItem('crm_leave_requests', JSON.stringify(requests));
    this.requestsSubject.next(requests);
  }

  public getStoredBalances(): LeaveBalance[] {
    const saved = localStorage.getItem('crm_leave_balances');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed;
        }
      } catch (e) {
        console.error('Error parsing stored leave balances', e);
      }
    }
    return [];
  }

  private saveStoredBalances(balances: LeaveBalance[]): void {
    localStorage.setItem('crm_leave_balances', JSON.stringify(balances));
    this.balancesSubject.next(balances);
  }

  getLeaveRequests(params?: any): Observable<{ leaves: LeaveRequest[]; total: number }> {
    return this.http.get<any>(this.apiUrl, { params }).pipe(
      tap(res => {
        const list = Array.isArray(res) ? res : (res?.leaves || res?.data || []);
        if (Array.isArray(list) && list.length > 0) {
          this.saveStoredRequests(list);
          this.recalculateAllBalances();
        }
      }),
      catchError(() => {
        let list = this.getStoredRequests();
        if (params) {
          if (params.search) {
            const searchLower = params.search.toLowerCase();
            list = list.filter(r => r.name.toLowerCase().includes(searchLower) || r.employeeId.toLowerCase().includes(searchLower));
          }
          if (params.type && params.type !== 'All') {
            list = list.filter(r => r.type === params.type);
          }
          if (params.status && params.status !== 'All') {
            list = list.filter(r => r.status === params.status);
          }
          if (params.department && params.department !== 'All Departments') {
            list = list.filter(r => r.department === params.department);
          }
        }
        return of({ leaves: list, total: list.length });
      })
    );
  }

  getLeaveRequestById(id: string): Observable<LeaveRequest> {
    return this.http.get<LeaveRequest>(`${this.apiUrl}/${id}`).pipe(
      catchError(() => {
        const found = this.getStoredRequests().find(r => r.id === id || r._id === id);
        return of(found || null as any);
      })
    );
  }

  createLeaveRequest(leaveData: LeaveRequest): Observable<any> {
    const payload = {
      ...leaveData,
      createdAt: new Date().toISOString()
    };

    const handleSuccess = (newRequest: LeaveRequest) => {
      const current = this.getStoredRequests();
      const updatedRequests = [newRequest, ...current];
      this.saveStoredRequests(updatedRequests);

      // Ensure employee balance record exists
      this.ensureBalanceRecordExists(newRequest);

      // Recalculate balance for this employee
      this.recalculateBalances(newRequest.employeeId);

      // 1. Dispatch Notification to Admin
      this.notificationService.addNotification({
        title: `New Leave Request (${newRequest.name})`,
        message: `${newRequest.name} (${newRequest.department}) applied for ${newRequest.days} day(s) of ${newRequest.type} (${newRequest.from} to ${newRequest.to}).`,
        type: 'leave',
        recipientName: 'Admin',
        link: '/administrator/leave'
      });

      // 2. Dispatch Notification to Applicant Employee
      this.notificationService.addNotification({
        title: `Leave Application Submitted`,
        message: `Your ${newRequest.type} request for ${newRequest.days} day(s) (${newRequest.from} to ${newRequest.to}) was submitted successfully and is pending approval.`,
        type: 'leave',
        recipientId: newRequest.employeeId,
        recipientName: newRequest.name,
        link: '/administrator/leave'
      });
    };

    return this.http.post<any>(this.apiUrl, payload).pipe(
      tap((res) => {
        const newRequest = res.data || res.leave || { ...payload, id: res.id || `LR${Date.now()}` };
        handleSuccess(newRequest);
      }),
      catchError(() => {
        const localNew: LeaveRequest = {
          ...payload,
          id: `LR${Date.now()}`
        };
        handleSuccess(localNew);
        return of({ success: true, data: localNew, message: 'Leave request created successfully' });
      })
    );
  }

  updateLeaveRequest(id: string, leaveData: Partial<LeaveRequest>): Observable<any> {
    const handleUpdateSuccess = () => {
      const current = this.getStoredRequests();
      const index = current.findIndex(r => r.id === id || r._id === id);
      if (index !== -1) {
        const oldRequest = current[index];
        const oldStatus = oldRequest.status;
        const updatedRequest = { ...oldRequest, ...leaveData };
        current[index] = updatedRequest;
        this.saveStoredRequests(current);

        // Recalculate balance for employee
        this.recalculateBalances(updatedRequest.employeeId);

        // Notify user if status changed
        if (leaveData.status && leaveData.status !== oldStatus) {
          const isApproved = leaveData.status === 'Approved';
          const title = isApproved ? 'Leave Request Approved' : 'Leave Request Rejected';
          const iconMsg = isApproved ? 'has been APPROVED' : 'has been REJECTED';

          this.notificationService.addNotification({
            title: title,
            message: `Your ${updatedRequest.type} request (${updatedRequest.from} to ${updatedRequest.to}, ${updatedRequest.days} day(s)) ${iconMsg} by Admin/HR.`,
            type: 'leave',
            recipientId: updatedRequest.employeeId,
            recipientName: updatedRequest.name,
            link: '/administrator/leave'
          });
        }
      }
    };

    return this.http.put<any>(`${this.apiUrl}/${id}`, leaveData).pipe(
      tap(() => {
        handleUpdateSuccess();
      }),
      catchError(() => {
        handleUpdateSuccess();
        return of({ success: true, message: 'Leave request updated successfully' });
      })
    );
  }

  deleteLeaveRequest(id: string): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/${id}`).pipe(
      tap(() => {
        const current = this.getStoredRequests();
        const found = current.find(r => r.id === id || r._id === id);
        const updated = current.filter(r => r.id !== id && r._id !== id);
        this.saveStoredRequests(updated);
        if (found) {
          this.recalculateBalances(found.employeeId);
        }
      }),
      catchError(() => {
        const current = this.getStoredRequests();
        const found = current.find(r => r.id === id || r._id === id);
        const updated = current.filter(r => r.id !== id && r._id !== id);
        this.saveStoredRequests(updated);
        if (found) {
          this.recalculateBalances(found.employeeId);
        }
        return of({ success: true, message: 'Leave request deleted successfully' });
      })
    );
  }

  getLeaveBalances(): Observable<LeaveBalance[]> {
    return this.http.get<any>(`${this.apiUrl}/balances`).pipe(
      tap(res => {
        const list = Array.isArray(res) ? res : (res?.balances || res?.data || []);
        if (Array.isArray(list) && list.length > 0) {
          this.saveStoredBalances(list);
        }
      }),
      catchError(() => {
        return of(this.getStoredBalances());
      })
    );
  }

  updateLeaveBalance(id: string, balanceData: Partial<LeaveBalance>): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/balances/${id}`, balanceData).pipe(
      tap(() => {
        const current = this.getStoredBalances();
        const index = current.findIndex(b => b.id === id || b._id === id);
        if (index !== -1) {
          current[index] = { ...current[index], ...balanceData };
          this.saveStoredBalances(current);
        }
      }),
      catchError(() => {
        const current = this.getStoredBalances();
        const index = current.findIndex(b => b.id === id || b._id === id);
        if (index !== -1) {
          current[index] = { ...current[index], ...balanceData };
          this.saveStoredBalances(current);
        }
        return of({ success: true, message: 'Leave balance updated successfully' });
      })
    );
  }

  private ensureBalanceRecordExists(leave: LeaveRequest): void {
    const balances = this.getStoredBalances();
    let balance = balances.find(b => b.employeeId === leave.employeeId);
    if (!balance) {
      const newBal: LeaveBalance = {
        id: `LB_${Date.now()}`,
        employeeId: leave.employeeId,
        name: leave.name,
        image: leave.image || 'assets/images/user.png',
        department: leave.department,
        casual: 12,
        sick: 10,
        annual: 18,
        used: 0,
        remaining: 40
      };
      this.saveStoredBalances([...balances, newBal]);
    }
  }

  public recalculateAllBalances(): void {
    const requests = this.getStoredRequests();
    const employeeIds = Array.from(new Set(requests.map(r => r.employeeId)));
    employeeIds.forEach(empId => this.recalculateBalances(empId));
  }

  public recalculateBalances(employeeId: string): void {
    const balances = this.getStoredBalances();
    let balanceIndex = balances.findIndex(b => b.employeeId === employeeId);

    const allRequests = this.getStoredRequests();
    const empRequests = allRequests.filter(r => r.employeeId === employeeId);
    const firstReq = empRequests[0];

    if (balanceIndex === -1 && firstReq) {
      const newBal: LeaveBalance = {
        id: `LB_${Date.now()}`,
        employeeId: employeeId,
        name: firstReq.name,
        image: firstReq.image || 'assets/images/user.png',
        department: firstReq.department,
        casual: 12,
        sick: 10,
        annual: 18,
        used: 0,
        remaining: 40
      };
      balances.push(newBal);
      balanceIndex = balances.length - 1;
    }

    if (balanceIndex === -1) return;

    const balance = balances[balanceIndex];

    let casualAllocated = 12;
    let sickAllocated = 10;
    let annualAllocated = 18;

    let casualUsed = 0;
    let sickUsed = 0;
    let annualUsed = 0;
    let otherUsed = 0;

    const approvedRequests = empRequests.filter(r => r.status === 'Approved');

    approvedRequests.forEach(req => {
      const type = (req.type || '').toLowerCase();
      const days = req.days || 1;

      if (type.includes('casual')) {
        casualUsed += days;
      } else if (type.includes('sick')) {
        sickUsed += days;
      } else if (type.includes('annual')) {
        annualUsed += days;
      } else {
        otherUsed += days;
      }
    });

    balance.casual = Math.max(0, casualAllocated - casualUsed);
    balance.sick = Math.max(0, sickAllocated - sickUsed);
    balance.annual = Math.max(0, annualAllocated - annualUsed);

    balance.used = casualUsed + sickUsed + annualUsed + otherUsed;
    const totalAllocated = casualAllocated + sickAllocated + annualAllocated;
    balance.remaining = Math.max(0, totalAllocated - balance.used);

    this.saveStoredBalances(balances);
  }
}
