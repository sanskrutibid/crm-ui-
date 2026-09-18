import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LeaveService, LeaveRequest } from '../leave.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-leave-calendar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './leave-calendar.html',
  styleUrl: './leave-calendar.css'
})
export class LeaveCalendar implements OnInit, OnDestroy {

  currentDate = new Date();
  currentMonth = '';
  currentYear = 2026;

  weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  calendarDays: { date: number; leaveCount: number; employees: string[] }[] = [];
  allRequests: LeaveRequest[] = [];
  private sub?: Subscription;

  months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  constructor(private leaveService: LeaveService) {}

  ngOnInit(): void {
    this.sub = this.leaveService.requests$.subscribe(requests => {
      this.allRequests = requests || [];
      this.generateCalendar();
    });
    this.loadLeaves();
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }

  loadLeaves(): void {
    this.leaveService.getLeaveRequests().subscribe({
      next: (res) => {
        if (res?.leaves) {
          this.allRequests = res.leaves;
          this.generateCalendar();
        }
      },
      error: (err) => {
        console.error('Failed to load leave requests for calendar:', err);
      }
    });
  }

  generateCalendar(): void {
    this.calendarDays = [];
    const year = this.currentDate.getFullYear();
    const month = this.currentDate.getMonth();
    this.currentMonth = this.months[month];
    this.currentYear = year;

    const firstDayIndex = new Date(year, month, 1).getDay();
    const totalDays = new Date(year, month + 1, 0).getDate();

    for (let i = 0; i < firstDayIndex; i++) {
      this.calendarDays.push({
        date: 0,
        leaveCount: 0,
        employees: []
      });
    }

    for (let day = 1; day <= totalDays; day++) {
      const activeDate = new Date(year, month, day);
      activeDate.setHours(0, 0, 0, 0);

      const employeesOnLeave: string[] = [];

      this.allRequests.forEach(req => {
        if (req.status === 'Approved') {
          const fromDate = new Date(req.from);
          const toDate = new Date(req.to);
          fromDate.setHours(0, 0, 0, 0);
          toDate.setHours(23, 59, 59, 999);

          if (activeDate >= fromDate && activeDate <= toDate) {
            const shortName = req.name.split(' ')[0];
            employeesOnLeave.push(shortName);
          }
        }
      });

      this.calendarDays.push({
        date: day,
        leaveCount: employeesOnLeave.length,
        employees: employeesOnLeave
      });
    }
  }

  prevMonth(): void {
    const currentMonth = this.currentDate.getMonth();
    this.currentDate.setMonth(currentMonth - 1);
    this.generateCalendar();
  }

  nextMonth(): void {
    const currentMonth = this.currentDate.getMonth();
    this.currentDate.setMonth(currentMonth + 1);
    this.generateCalendar();
  }
}