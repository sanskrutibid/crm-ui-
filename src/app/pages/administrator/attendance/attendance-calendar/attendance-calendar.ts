import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../auth/auth.service';
import { AttendanceService } from '../../../attendance/attendance.service';

@Component({
  selector: 'app-attendance-calendar',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './attendance-calendar.html',
  styleUrl: './attendance-calendar.css'
})
export class AttendanceCalendar implements OnInit {
  private authService = inject(AuthService);
  private attendanceService = inject(AttendanceService);
  private cdr = inject(ChangeDetectorRef);

  currentMonth = 'July';
  currentYear = 2026;
  currentMonthIndex = 6; // July is index 6 (0-indexed)

  months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  calendarDays: any[] = [];
  employees: any[] = [];
  selectedEmployeeId = '';
  allAttendanceRecords: any[] = [];

  monthStats = {
    present: 0,
    absent: 0,
    halfday: 0,
    late: 0,
    holiday: 0,
    leave: 0,
    totalDays: 0
  };

  ngOnInit(): void {
    const today = new Date();
    this.currentMonthIndex = today.getMonth();
    this.currentMonth = this.months[this.currentMonthIndex];
    this.currentYear = today.getFullYear();

    this.loadEmployeesAndAttendance();
  }

  loadEmployeesAndAttendance(): void {
    this.authService.getAgents().subscribe({
      next: (empRes: any) => {
        const list = empRes.data || empRes || [];
        this.employees = list.map((emp: any) => ({
          id: emp.id || emp._id,
          name: `${emp.firstName} ${emp.lastName || ''}`,
          status: emp.status
        }));

        if (this.employees.length > 0) {
          this.selectedEmployeeId = this.employees[0].id;
        }

        this.attendanceService.getAllAttendance().subscribe({
          next: (attRes: any) => {
            this.allAttendanceRecords = attRes.data || attRes || [];
            this.loadCalendarDays();
          },
          error: (err) => {
            console.error('Failed to load all attendance for calendar view:', err);
            this.loadCalendarDays();
          }
        });
      },
      error: (err) => {
        console.error('Failed to load users for calendar view:', err);
      }
    });
  }

  prevMonth(): void {
    if (this.currentMonthIndex === 0) {
      this.currentMonthIndex = 11;
      this.currentYear--;
    } else {
      this.currentMonthIndex--;
    }
    this.currentMonth = this.months[this.currentMonthIndex];
    this.loadCalendarDays();
  }

  nextMonth(): void {
    if (this.currentMonthIndex === 11) {
      this.currentMonthIndex = 0;
      this.currentYear++;
    } else {
      this.currentMonthIndex++;
    }
    this.currentMonth = this.months[this.currentMonthIndex];
    this.loadCalendarDays();
  }

  loadCalendarDays(): void {
    if (!this.selectedEmployeeId) {
      this.calendarDays = [];
      this.monthStats = { present: 0, absent: 0, halfday: 0, late: 0, holiday: 0, leave: 0, totalDays: 0 };
      this.cdr.detectChanges();
      return;
    }

    const days: any[] = [];
    const firstDayIndex = new Date(this.currentYear, this.currentMonthIndex, 1).getDay();
    const daysInMonth = new Date(this.currentYear, this.currentMonthIndex + 1, 0).getDate();

    // Pad previous month days (empty slots)
    for (let p = 0; p < firstDayIndex; p++) {
      days.push({ date: null, status: 'empty', short: '', punchIn: '', punchOut: '' });
    }

    const today = new Date();
    const selectedEmp = this.employees.find(e => e.id === this.selectedEmployeeId);

    // Populate actual days of the month
    for (let date = 1; date <= daysInMonth; date++) {
      const currentDate = new Date(this.currentYear, this.currentMonthIndex, date);
      const dateStr = `${this.currentYear}-${String(this.currentMonthIndex + 1).padStart(2, '0')}-${String(date).padStart(2, '0')}`;

      // Check if Sunday or Saturday (Weekend)
      const dayOfWeek = currentDate.getDay();
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

      if (currentDate.getTime() > today.getTime()) {
        // Future date
        days.push({ date, status: 'future', short: '-', punchIn: '', punchOut: '' });
        continue;
      }

      // Find attendance record in database for this employee and date
      const record = this.allAttendanceRecords.find(r => {
        const rUserId = r.userId && typeof r.userId === 'object' ? r.userId.id || r.userId._id : r.userId;
        return rUserId === this.selectedEmployeeId && r.date === dateStr;
      });

      if (record) {
        let status = 'present';
        let short = 'P';
        let punchIn = '';
        let punchOut = '';

        if (record.punchInTime) {
          const pinTime = new Date(record.punchInTime);
          punchIn = pinTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
          
          const limitTime = new Date(record.punchInTime);
          limitTime.setHours(9, 15, 0);
          if (pinTime.getTime() > limitTime.getTime()) {
            status = 'late';
            short = 'L';
          }
        }

        if (record.punchOutTime) {
          const poutTime = new Date(record.punchOutTime);
          punchOut = poutTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        }

        // Check if Half Day
        if (record.punchInTime && record.punchOutTime) {
          const diffMs = new Date(record.punchOutTime).getTime() - new Date(record.punchInTime).getTime();
          const hours = diffMs / 3600000;
          if (hours < 5) {
            status = 'halfday';
            short = 'HD';
          }
        }

        days.push({ date, status, short, punchIn, punchOut });
      } else {
        if (selectedEmp && selectedEmp.status === 'Leave') {
          days.push({ date, status: 'leave', short: 'LV', punchIn: '', punchOut: '' });
        } else if (isWeekend) {
          days.push({ date, status: 'holiday', short: 'H', punchIn: '', punchOut: '' });
        } else {
          days.push({ date, status: 'absent', short: 'A', punchIn: '', punchOut: '' });
        }
      }
    }

    this.calendarDays = days;

    // Calculate month stats
    let present = 0;
    let absent = 0;
    let halfday = 0;
    let late = 0;
    let holiday = 0;
    let leave = 0;

    for (let day of days) {
      if (!day.date || day.status === 'future') continue;
      if (day.status === 'present') present++;
      else if (day.status === 'absent') absent++;
      else if (day.status === 'halfday') halfday++;
      else if (day.status === 'late') late++;
      else if (day.status === 'holiday') holiday++;
      else if (day.status === 'leave') leave++;
    }

    this.monthStats = {
      present,
      absent,
      halfday,
      late,
      holiday,
      leave,
      totalDays: present + absent + halfday + late + holiday + leave
    };

    this.cdr.detectChanges();
  }
}