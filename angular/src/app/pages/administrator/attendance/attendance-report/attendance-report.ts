import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../auth/auth.service';
import { AttendanceService } from '../../../attendance/attendance.service';

@Component({
  selector: 'app-attendance-report',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './attendance-report.html',
  styleUrl: './attendance-report.css'
})
export class AttendanceReport implements OnInit {
  private authService = inject(AuthService);
  private attendanceService = inject(AttendanceService);
  private cdr = inject(ChangeDetectorRef);

  selectedMonth: number = new Date().getMonth();
  selectedYear: number = new Date().getFullYear();
  selectedDepartment: string = 'All Departments';
  searchQuery: string = '';

  months = [
    { value: 0, name: 'January' },
    { value: 1, name: 'February' },
    { value: 2, name: 'March' },
    { value: 3, name: 'April' },
    { value: 4, name: 'May' },
    { value: 5, name: 'June' },
    { value: 6, name: 'July' },
    { value: 7, name: 'August' },
    { value: 8, name: 'September' },
    { value: 9, name: 'October' },
    { value: 10, name: 'November' },
    { value: 11, name: 'December' }
  ];

  years = [2024, 2025, 2026, 2027];

  cards = [
    { title: 'Present Days', count: 0, icon: 'fas fa-user-check' },
    { title: 'Absent Days', count: 0, icon: 'fas fa-user-times' },
    { title: 'Late Entries', count: 0, icon: 'fas fa-clock' },
    { title: 'Leave Days', count: 0, icon: 'fas fa-plane' }
  ];

  allUsersList: any[] = [];
  allAttendanceRecords: any[] = [];
  reports: any[] = [];

  ngOnInit(): void {
    this.loadReportData();
  }

  loadReportData(): void {
    this.authService.getAgents().subscribe({
      next: (userRes: any) => {
        this.allUsersList = userRes.data || userRes || [];

        this.attendanceService.getAllAttendance().subscribe({
          next: (attRes: any) => {
            this.allAttendanceRecords = attRes.data || attRes || [];
            this.generateReport();
          },
          error: (err) => {
            console.error('Failed to load all attendance for report view:', err);
            this.generateReport();
          }
        });
      },
      error: (err) => {
        console.error('Failed to load users for report view:', err);
      }
    });
  }

  generateReport(): void {
    const daysInMonth = new Date(this.selectedYear, this.selectedMonth + 1, 0).getDate();
    const today = new Date();

    const filteredUsers = this.allUsersList.filter(usr => {
      const department = usr.department || usr.role || 'Sales';
      const matchDept = this.selectedDepartment === 'All Departments' || department.toLowerCase() === this.selectedDepartment.toLowerCase();
      const name = `${usr.firstName} ${usr.lastName || ''}`.toLowerCase();
      const usrId = (usr.id || usr._id || '').toLowerCase();
      const matchSearch = !this.searchQuery || name.includes(this.searchQuery.toLowerCase()) || usrId.includes(this.searchQuery.toLowerCase());
      return matchDept && matchSearch;
    });

    let totalPresent = 0;
    let totalAbsent = 0;
    let totalLate = 0;
    let totalLeave = 0;

    this.reports = filteredUsers.map((usr: any) => {
      const usrId = usr.id || usr._id;
      const name = `${usr.firstName} ${usr.lastName || ''}`;
      const department = usr.department || usr.role || 'Sales';

      let present = 0;
      let absent = 0;
      let leave = 0;
      let late = 0;
      let halfday = 0;

      for (let day = 1; day <= daysInMonth; day++) {
        const currentDate = new Date(this.selectedYear, this.selectedMonth, day);
        const dateStr = `${this.selectedYear}-${String(this.selectedMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

        if (currentDate.getTime() > today.getTime()) {
          // Future date
          continue;
        }

        // Sunday or Saturday (Weekend check)
        const dayOfWeek = currentDate.getDay();
        const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

        // Find attendance record
        const record = this.allAttendanceRecords.find(r => {
          const rUserId = r.userId && typeof r.userId === 'object' ? r.userId.id || r.userId._id : r.userId;
          return rUserId === usrId && r.date === dateStr;
        });

        if (record) {
          present++;
          totalPresent++;

          // Check if Late
          if (record.punchInTime) {
            const pinTime = new Date(record.punchInTime);
            const limitTime = new Date(record.punchInTime);
            limitTime.setHours(9, 15, 0);
            if (pinTime.getTime() > limitTime.getTime()) {
              late++;
              totalLate++;
            }
          }

          // Check if Half Day
          if (record.punchInTime && record.punchOutTime) {
            const diffMs = new Date(record.punchOutTime).getTime() - new Date(record.punchInTime).getTime();
            const hours = diffMs / 3600000;
            if (hours < 5) {
              halfday++;
            }
          }
        } else {
          if (usr.status === 'Leave') {
            leave++;
            totalLeave++;
          } else if (!isWeekend) {
            absent++;
            totalAbsent++;
          }
        }
      }

      const totalWorkableDays = present + absent + leave;
      const percentage = totalWorkableDays > 0 ? Math.round((present / totalWorkableDays) * 100) : 0;

      return {
        name,
        department,
        present,
        absent,
        leave,
        late,
        halfday,
        percentage
      };
    });

    this.cards = [
      { title: 'Present Days', count: totalPresent, icon: 'fas fa-user-check' },
      { title: 'Absent Days', count: totalAbsent, icon: 'fas fa-user-times' },
      { title: 'Late Entries', count: totalLate, icon: 'fas fa-clock' },
      { title: 'Leave Days', count: totalLeave, icon: 'fas fa-plane' }
    ];

    this.cdr.detectChanges();
  }
}