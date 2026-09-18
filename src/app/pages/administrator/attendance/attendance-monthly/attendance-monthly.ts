import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../auth/auth.service';
import { AttendanceService } from '../../../attendance/attendance.service';

@Component({
  selector: 'app-attendance-monthly',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './attendance-monthly.html',
  styleUrl: './attendance-monthly.css'
})
export class AttendanceMonthly implements OnInit {
  private authService = inject(AuthService);
  private attendanceService = inject(AttendanceService);
  private cdr = inject(ChangeDetectorRef);

  days: number[] = [];
  employees: any[] = [];
  allEmployeesList: any[] = [];
  allAttendanceRecords: any[] = [];

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

  selectedMonth: number = new Date().getMonth();
  selectedYear: number = new Date().getFullYear();
  selectedDepartment: string = 'All Departments';
  searchQuery: string = '';

  ngOnInit(): void {
    this.loadMonthlyData();
  }

  loadMonthlyData(): void {
    this.authService.getAgents().subscribe({
      next: (empRes: any) => {
        this.allEmployeesList = empRes.data || empRes || [];

        this.attendanceService.getAllAttendance().subscribe({
          next: (attRes: any) => {
            this.allAttendanceRecords = attRes.data || attRes || [];
            this.generateGrid();
          },
          error: (err) => {
            console.error('Failed to load all attendance for monthly view:', err);
            this.generateGrid();
          }
        });
      },
      error: (err) => {
        console.error('Failed to load users for monthly view:', err);
      }
    });
  }

  generateGrid(): void {
    // Generate days of the month
    const daysCount = new Date(this.selectedYear, this.selectedMonth + 1, 0).getDate();
    this.days = Array.from({ length: daysCount }, (_, i) => i + 1);

    const filteredEmps = this.allEmployeesList.filter(emp => {
      const department = emp.department || emp.role || 'Sales';
      const matchDept = this.selectedDepartment === 'All Departments' || department.toLowerCase() === this.selectedDepartment.toLowerCase();
      const name = `${emp.firstName} ${emp.lastName || ''}`.toLowerCase();
      const empId = (emp.id || emp._id || '').toLowerCase();
      const matchSearch = !this.searchQuery || name.includes(this.searchQuery.toLowerCase()) || empId.includes(this.searchQuery.toLowerCase());
      return matchDept && matchSearch;
    });

    this.employees = filteredEmps.map((emp: any) => {
      const empId = emp.id || emp._id;
      const name = `${emp.firstName} ${emp.lastName || ''}`;

      const attendanceGrid: string[] = [];
      const today = new Date();

      for (let day = 1; day <= daysCount; day++) {
        const currentDate = new Date(this.selectedYear, this.selectedMonth, day);
        const dateStr = `${this.selectedYear}-${String(this.selectedMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

        if (currentDate.getTime() > today.getTime()) {
          // Future date
          attendanceGrid.push('-');
          continue;
        }

        // Sunday or Saturday (Weekend check)
        const dayOfWeek = currentDate.getDay();
        const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

        // Find attendance record in database for this user and date
        const record = this.allAttendanceRecords.find(r => {
          const rUserId = r.userId && typeof r.userId === 'object' ? r.userId.id || r.userId._id : r.userId;
          return rUserId === empId && r.date === dateStr;
        });

        if (record) {
          let status = 'P'; // Present

          // Check if Late
          if (record.punchInTime) {
            const pinTime = new Date(record.punchInTime);
            const limitTime = new Date(record.punchInTime);
            limitTime.setHours(9, 15, 0);
            if (pinTime.getTime() > limitTime.getTime()) {
              status = 'L'; // Late -> L
            }
          }

          // Check if half day
          if (record.punchInTime && record.punchOutTime) {
            const diffMs = new Date(record.punchOutTime).getTime() - new Date(record.punchInTime).getTime();
            const hours = diffMs / 3600000;
            if (hours < 5) {
              status = 'HD'; // Half Day -> HD
            }
          }

          attendanceGrid.push(status);
        } else {
          if (emp.status === 'Leave') {
            attendanceGrid.push('LV'); // Leave -> LV
          } else if (isWeekend) {
            attendanceGrid.push('H'); // Holiday / Weekend
          } else {
            attendanceGrid.push('A'); // Absent
          }
        }
      }

      return {
        name,
        attendance: attendanceGrid
      };
    });

    this.cdr.detectChanges();
  }
}