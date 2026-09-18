import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../auth/auth.service';
import { AttendanceService } from '../../../attendance/attendance.service';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

@Component({
  selector: 'app-attendance-dashboard',
  standalone: true,
  imports: [
    CommonModule
  ],
  templateUrl: './attendance-dashboard.html',
  styleUrl: './attendance-dashboard.css'
})
export class AttendanceDashboard implements OnInit {
  private authService = inject(AuthService);
  private attendanceService = inject(AttendanceService);
  private cdr = inject(ChangeDetectorRef);

  summaryCards: any[] = [];
  todayAttendance: any[] = [];
  leaveEmployees: string[] = [];
  lateEmployees: any[] = [];
  recentActivities: any[] = [];

  ngOnInit(): void {
    this.loadDashboardData();
  }

  loadDashboardData(): void {
    const todayStr = new Date().toISOString().split('T')[0];

    this.authService.getAgents().subscribe({
      next: (res: any) => {
        const list = res.data || res || [];
        if (list.length === 0) {
          this.calculateStats([], []);
          return;
        }

        // Fetch timeline for each user for today
        const timelineRequests = list.map((usr: any) => {
          const usrId = usr.id || usr._id;
          return this.attendanceService.getAgentTimeline(usrId, todayStr).pipe(
            catchError(() => of(null)) // return null if no timeline (Absent)
          );
        });

        forkJoin(timelineRequests as any).subscribe((timelines: any) => {
          this.calculateStats(list, timelines);
        });
      },
      error: (err) => {
        console.error('Failed to load users for dashboard:', err);
        this.calculateStats([], []);
      }
    });
  }

  private calculateStats(users: any[], timelines: any[]): void {
    let presentCount = 0;
    let absentCount = 0;
    let leaveCount = 0;
    let lateCount = 0;
    let halfDayCount = 0; // Mock calculation based on duration (< 5 hours)

    const todayList: any[] = [];
    const leaveList: string[] = [];
    const lateList: any[] = [];
    const activities: any[] = [];

    users.forEach((usr: any, index: number) => {
      const usrId = usr.id || usr._id;
      const timeline = timelines[index] && timelines[index].data !== undefined ? timelines[index].data : timelines[index];
      const name = `${usr.firstName} ${usr.lastName || ''}`;

      if (timeline) {
        presentCount++;

        const checkInTime = timeline.punchInTime
          ? new Date(timeline.punchInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          : '--';
        
        let status = 'Present';

        // Check if Late (checked in after 09:15 AM)
        if (timeline.punchInTime) {
          const pinTime = new Date(timeline.punchInTime);
          const limitTime = new Date(timeline.punchInTime);
          limitTime.setHours(9, 15, 0);
          if (pinTime.getTime() > limitTime.getTime()) {
            status = 'Late';
            lateCount++;
            lateList.push({ name, time: checkInTime });
          }
        }

        // Calculate if half day (working hours < 5 hours and checked out)
        if (timeline.punchInTime && timeline.punchOutTime) {
          const diffMs = new Date(timeline.punchOutTime).getTime() - new Date(timeline.punchInTime).getTime();
          const hours = diffMs / 3600000;
          if (hours < 5) {
            status = 'Half Day';
            halfDayCount++;
          }
        }

        todayList.push({
          name,
          department: usr.department || usr.role || 'Sales',
          checkIn: checkInTime,
          status
        });

        // Add check in activity
        if (timeline.punchInTime) {
          activities.push({
            employee: name,
            action: 'Checked In',
            time: checkInTime,
            timestamp: new Date(timeline.punchInTime).getTime()
          });
        }

        // Add check out activity if completed
        if (timeline.punchOutTime) {
          const checkOutTime = new Date(timeline.punchOutTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
          activities.push({
            employee: name,
            action: 'Checked Out',
            time: checkOutTime,
            timestamp: new Date(timeline.punchOutTime).getTime()
          });
        }
      } else {
        // No timeline, check if user status is 'Leave' or 'Inactive'
        if (usr.status === 'Leave') {
          leaveCount++;
          leaveList.push(name);
          todayList.push({
            name,
            department: usr.department || usr.role || 'Sales',
            checkIn: '--',
            status: 'Leave'
          });
        } else {
          absentCount++;
          todayList.push({
            name,
            department: usr.department || usr.role || 'Sales',
            checkIn: '--',
            status: 'Absent'
          });
        }
      }
    });

    // Sort activities by timestamp descending
    activities.sort((a, b) => b.timestamp - a.timestamp);

    this.summaryCards = [
      { title: 'Present', count: presentCount, icon: 'fas fa-user-check', class: 'present' },
      { title: 'Absent', count: absentCount, icon: 'fas fa-user-times', class: 'absent' },
      { title: 'Leave', count: leaveCount, icon: 'fas fa-plane', class: 'leave' },
      { title: 'Late', count: lateCount, icon: 'fas fa-clock', class: 'late' },
      { title: 'Half Day', count: halfDayCount, icon: 'fas fa-business-time', class: 'halfday' },
      { title: 'Total Users', count: users.length, icon: 'fas fa-users', class: 'total' }
    ];

    this.todayAttendance = todayList;
    this.leaveEmployees = leaveList;
    this.lateEmployees = lateList;
    this.recentActivities = activities.slice(0, 10); // show top 10 recent activities

    this.cdr.detectChanges();
  }
}