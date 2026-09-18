import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HolidaysService, Holiday } from '../../holidays/holidays.service';
import { LeaveService, LeaveRequest } from '../leave.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-leave-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './leave-dashboard.html',
  styleUrl: './leave-dashboard.css'
})
export class LeaveDashboard implements OnInit, OnDestroy {

  summaryCards = [
    {
      title: 'Total Requests',
      count: 0,
      icon: 'fas fa-file-alt',
      class: 'blue'
    },
    {
      title: 'Approved',
      count: 0,
      icon: 'fas fa-check-circle',
      class: 'green'
    },
    {
      title: 'Pending',
      count: 0,
      icon: 'fas fa-clock',
      class: 'orange'
    },
    {
      title: 'Rejected',
      count: 0,
      icon: 'fas fa-times-circle',
      class: 'red'
    }
  ];

  pendingRequests: any[] = [];
  onLeave: any[] = [];
  holidays: { date: string; name: string }[] = [];
  private sub?: Subscription;

  constructor(
    private holidaysService: HolidaysService,
    private leaveService: LeaveService
  ) {}

  ngOnInit(): void {
    this.sub = this.leaveService.requests$.subscribe(requests => {
      this.processRequests(requests || []);
    });
    this.loadDashboardData();
    this.loadHolidays();
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }

  loadDashboardData(): void {
    this.leaveService.getLeaveRequests().subscribe({
      next: (res) => {
        if (res?.leaves) {
          this.processRequests(res.leaves);
        }
      },
      error: (err) => {
        console.error('Failed to load dashboard leave data:', err);
      }
    });
  }

  processRequests(requests: LeaveRequest[]): void {
    // 1. Calculate summaries
    const total = requests.length;
    const approved = requests.filter(r => r.status === 'Approved').length;
    const pending = requests.filter(r => r.status === 'Pending').length;
    const rejected = requests.filter(r => r.status === 'Rejected').length;

    this.summaryCards[0].count = total;
    this.summaryCards[1].count = approved;
    this.summaryCards[2].count = pending;
    this.summaryCards[3].count = rejected;

    // 2. Load pending requests (limit to 5)
    this.pendingRequests = requests
      .filter(r => r.status === 'Pending')
      .slice(0, 5)
      .map(r => ({
        employee: r.name,
        department: r.department,
        type: r.type,
        days: r.days
      }));

    // 3. Load currently on leave
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    this.onLeave = requests
      .filter(r => {
        if (r.status !== 'Approved') return false;
        const fromDate = new Date(r.from);
        const toDate = new Date(r.to);
        fromDate.setHours(0, 0, 0, 0);
        toDate.setHours(23, 59, 59, 999);
        return today >= fromDate && today <= toDate;
      })
      .map(r => ({
        name: r.name,
        department: r.department,
        image: r.image || 'assets/images/user.png'
      }));
  }

  loadHolidays(): void {
    this.holidaysService.holidays$.subscribe((list: Holiday[]) => {
      const activeHolidays = list.filter(h => h.status === 'Active');
      this.holidays = activeHolidays.slice(0, 5).map(h => ({
        date: h.date,
        name: h.name
      }));
    });
  }
}