import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AttendanceDashboard } from '../attendance-dashboard/attendance-dashboard';
import { AttendanceList } from '../attendance-list/attendance-list';
import { AttendanceMark } from '../attendance-mark/attendance-mark';
import { AttendanceMonthly } from '../attendance-monthly/attendance-monthly';
import { AttendanceCalendar } from '../attendance-calendar/attendance-calendar';
import { AttendanceRequest} from '../attendance-request/attendance-request';
import { AttendanceReport } from '../attendance-report/attendance-report';


@Component({
  selector: 'app-empattendance',
   imports: [
    CommonModule,
    AttendanceDashboard,
    AttendanceList,
    AttendanceMark,
    AttendanceMonthly,
    AttendanceCalendar,
    AttendanceRequest,
    AttendanceReport
  ],
  templateUrl: './empattendance.html',
  styleUrl: './empattendance.css',
})
export class Empattendance {

  summaryCards = [
    {
      title: 'Present',
      count: 42,
      icon: 'fas fa-user-check',
      class: 'present'
    },
    {
      title: 'Absent',
      count: 5,
      icon: 'fas fa-user-times',
      class: 'absent'
    },
    {
      title: 'Leave',
      count: 3,
      icon: 'fas fa-plane',
      class: 'leave'
    },
    {
      title: 'Late',
      count: 4,
      icon: 'fas fa-clock',
      class: 'late'
    },
    {
      title: 'Half Day',
      count: 2,
      icon: 'fas fa-business-time',
      class: 'halfday'
    },
    {
      title: 'Total Users',
      count: 52,
      icon: 'fas fa-users',
      class: 'total'
    }
  ];

  todayAttendance = [
    {
      name: 'Rahul Sharma',
      department: 'IT',
      checkIn: '09:05 AM',
      status: 'Present'
    },
    {
      name: 'Priya Patel',
      department: 'HR',
      checkIn: '09:32 AM',
      status: 'Late'
    },
    {
      name: 'Amit Singh',
      department: 'Sales',
      checkIn: '--',
      status: 'Absent'
    }
  ];

  leaveEmployees = [
    'Sneha Verma',
    'Mohit Jain',
    'Neha Sharma'
  ];

  lateEmployees = [
    {
      name: 'Priya Patel',
      time: '09:32 AM'
    },
    {
      name: 'Rahul Patil',
      time: '09:40 AM'
    },
    {
      name: 'Akash Jain',
      time: '09:28 AM'
    }
  ];

  recentActivities = [
    {
      employee: 'Rahul Sharma',
      action: 'Checked In',
      time: '09:05 AM'
    },
    {
      employee: 'Priya Patel',
      action: 'Checked In',
      time: '09:32 AM'
    },
    {
      employee: 'Amit Singh',
      action: 'Marked Absent',
      time: '10:00 AM'
    }
  ];

    selectedTab = 'dashboard';

  changeTab(tab: string) {

    this.selectedTab = tab;

  }

}




