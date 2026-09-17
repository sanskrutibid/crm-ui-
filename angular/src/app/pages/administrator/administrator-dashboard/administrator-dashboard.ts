import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { EmployeesService } from '../employees/employees.service';
import { HolidaysService, Holiday } from '../holidays/holidays.service';
import { AttendanceService } from '../../attendance/attendance.service';
import { LeaveService } from '../leave/leave.service';
import { DashboardService } from '../../../layout/dashboard/dashboard.service';

export interface StatCard {
  id: string;
  title: string;
  value: number;
  icon: string;
  colorClass: string;
  bgGradient: string;
  subtext: string;
}

export interface DashboardEmployee {
  id: string;
  employeeId: string;
  name: string;
  department: string;
  role: string;
  email: string;
  mobile: string;
  status: string;
}

export interface DashboardAttendance {
  name: string;
  department: string;
  checkIn: string;
  checkOut: string;
  status: 'Present' | 'Late' | 'Leave' | 'Absent';
}

export interface DashboardLeave {
  employeeName: string;
  department: string;
  leaveType: string;
  dates: string;
  days: number;
  status: 'Pending' | 'Approved' | 'Rejected';
}

export interface DashboardActivity {
  title: string;
  time: string;
  icon: string;
  typeClass: string;
}

@Component({
  selector: 'app-administrator-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './administrator-dashboard.html',
  styleUrl: './administrator-dashboard.css'
})
export class AdministratorDashboard implements OnInit {
  currentDate = new Date();
  activeTab: 'all' | 'employees' | 'holidays' | 'attendance' | 'leaves' = 'all';
  searchQuery: string = '';

  stats: StatCard[] = [
    { id: 'emp', title: 'Total Employees', value: 0, icon: 'fas fa-users', colorClass: 'stat-blue', bgGradient: 'linear-gradient(135deg, #3b82f6, #1d4ed8)', subtext: 'Active workforce' },
    { id: 'present', title: 'Present Today', value: 0, icon: 'fas fa-user-check', colorClass: 'stat-green', bgGradient: 'linear-gradient(135deg, #10b981, #047857)', subtext: 'On-time & checked in' },
    { id: 'absent', title: 'Absent Today', value: 0, icon: 'fas fa-user-times', colorClass: 'stat-red', bgGradient: 'linear-gradient(135deg, #ef4444, #b91c1c)', subtext: 'Unexcused absences' },
    { id: 'leave', title: 'On Leave', value: 0, icon: 'fas fa-plane-departure', colorClass: 'stat-amber', bgGradient: 'linear-gradient(135deg, #f59e0b, #b45309)', subtext: 'Approved leaves' },
    { id: 'holidays', title: 'Active Holidays', value: 0, icon: 'fas fa-calendar-alt', colorClass: 'stat-purple', bgGradient: 'linear-gradient(135deg, #8b5cf6, #6d28d9)', subtext: 'Scheduled upcoming' },
    { id: 'pending_leaves', title: 'Pending Leave Req.', value: 0, icon: 'fas fa-clock', colorClass: 'stat-indigo', bgGradient: 'linear-gradient(135deg, #6366f1, #4338ca)', subtext: 'Awaiting approval' },
    { id: 'payroll', title: 'Payroll Pending', value: 12, icon: 'fas fa-file-invoice-dollar', colorClass: 'stat-teal', bgGradient: 'linear-gradient(135deg, #14b8a6, #0f766e)', subtext: 'Monthly cycles' },
    { id: 'assets', title: 'Assigned Assets', value: 48, icon: 'fas fa-laptop-house', colorClass: 'stat-rose', bgGradient: 'linear-gradient(135deg, #f43f5e, #be123c)', subtext: 'Laptops & devices' }
  ];

  // Lists Data
  employees: DashboardEmployee[] = [];
  holidays: Holiday[] = [];
  attendance: DashboardAttendance[] = [];
  leaveRequests: DashboardLeave[] = [];
  activities: DashboardActivity[] = [];

  private attendanceService = inject(AttendanceService);
  private leaveService = inject(LeaveService);
  private dashboardService = inject(DashboardService);

  constructor(
    private readonly employeesService: EmployeesService,
    private readonly holidaysService: HolidaysService
  ) {}

  ngOnInit(): void {
    this.loadEmployeesData();
    this.loadHolidaysData();
    this.loadAttendanceData();
    this.loadLeavesData();
    this.loadActivitiesData();
  }

  setActiveTab(tab: 'all' | 'employees' | 'holidays' | 'attendance' | 'leaves'): void {
    this.activeTab = tab;
  }

  private loadEmployeesData(): void {
    this.employeesService.getEmployees().subscribe({
      next: (res: any) => {
        const payload = res.data || res;
        const list = Array.isArray(payload) ? payload : [];
        
        if (list.length > 0) {
          this.employees = list.map((emp: any, index: number) => ({
            id: emp.id || emp._id || String(index + 1),
            employeeId: emp.employeeId || `EMP${String(index + 1).padStart(3, '0')}`,
            name: emp.firstName ? `${emp.firstName} ${emp.lastName || ''}`.trim() : (emp.name || 'Employee'),
            department: emp.department || 'General',
            role: emp.designation || emp.role || 'Team Member',
            email: emp.personalEmail || emp.email || 'employee@crm.com',
            mobile: emp.mobile || emp.phone || '+91 98765 43210',
            status: emp.status || 'Active'
          }));
        } else {
          this.useFallbackEmployees();
        }
        this.updateEmployeeStats();
      },
      error: (err) => {
        console.error('Failed to fetch employees, using default fallback list', err);
        this.useFallbackEmployees();
        this.updateEmployeeStats();
      }
    });
  }

  private useFallbackEmployees(): void {
    this.employees = [
      { id: '1', employeeId: 'EMP001', name: 'Rahul Sharma', department: 'IT / Engineering', role: 'Senior Developer', email: 'rahul.s@company.com', mobile: '+91 98765 01001', status: 'Active' },
      { id: '2', employeeId: 'EMP002', name: 'Priya Patel', department: 'Human Resources', role: 'HR Manager', email: 'priya.p@company.com', mobile: '+91 98765 01002', status: 'Active' },
      { id: '3', employeeId: 'EMP003', name: 'Amit Singh', department: 'Sales & Marketing', role: 'Sales Lead', email: 'amit.s@company.com', mobile: '+91 98765 01003', status: 'Active' },
      { id: '4', employeeId: 'EMP004', name: 'Sneha Reddy', department: 'Finance & Accounts', role: 'Financial Analyst', email: 'sneha.r@company.com', mobile: '+91 98765 01004', status: 'Active' },
      { id: '5', employeeId: 'EMP005', name: 'Vikram Verma', department: 'Operations', role: 'Operations Officer', email: 'vikram.v@company.com', mobile: '+91 98765 01005', status: 'Active' },
      { id: '6', employeeId: 'EMP006', name: 'Ananya Gupta', department: 'IT / Engineering', role: 'UI/UX Designer', email: 'ananya.g@company.com', mobile: '+91 98765 01006', status: 'Inactive' }
    ];
  }

  private loadHolidaysData(): void {
    this.holidaysService.holidays$.subscribe({
      next: (list: Holiday[]) => {
        this.holidays = list || [];
        this.updateHolidayStats();
      },
      error: (err) => {
        console.error('Failed to subscribe holidays:', err);
      }
    });

    this.holidaysService.getHolidays().subscribe();
  }

  private loadAttendanceData(): void {
    this.attendanceService.getAllAttendance().subscribe({
      next: (res: any) => {
        const payload = res.data || res;
        const list = Array.isArray(payload) ? payload : [];
        this.attendance = list.map((record: any) => {
          const userObj = record.userId || {};
          const name = userObj.firstName ? `${userObj.firstName} ${userObj.lastName || ''}`.trim() : 'Unknown Employee';
          const punchIn = record.punchInTime ? new Date(record.punchInTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : '--';
          const punchOut = record.punchOutTime ? new Date(record.punchOutTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : '--';
          
          let status: 'Present' | 'Late' | 'Leave' | 'Absent' = 'Present';
          if (record.punchInTime) {
            const checkInHour = new Date(record.punchInTime).getHours();
            const checkInMinute = new Date(record.punchInTime).getMinutes();
            if (checkInHour > 9 || (checkInHour === 9 && checkInMinute > 15)) {
              status = 'Late';
            }
          } else {
            status = 'Absent';
          }

          return {
            name,
            department: userObj.role || 'IT',
            checkIn: punchIn,
            checkOut: punchOut,
            status
          };
        });
        this.updateEmployeeStats();
      },
      error: (err) => {
        console.error('Failed to load attendance logs:', err);
      }
    });
  }

  private loadLeavesData(): void {
    this.leaveService.getLeaveRequests().subscribe({
      next: (res: any) => {
        const payload = res.data || res;
        const list = payload.leaves || (Array.isArray(payload) ? payload : []);
        this.leaveRequests = list.map((req: any) => ({
          employeeName: req.name || 'Employee',
          department: req.department || 'General',
          leaveType: req.type || 'Casual Leave',
          dates: `${this.formatDate(req.from)} - ${this.formatDate(req.to)}`,
          days: req.days || 1,
          status: req.status || 'Pending'
        }));
        this.updateEmployeeStats();
      },
      error: (err) => {
        console.error('Failed to load leave requests:', err);
      }
    });
  }

  private loadActivitiesData(): void {
    this.dashboardService.getActivities(10).subscribe({
      next: (res: any) => {
        const payload = res.data || res;
        const list = payload.activities || (Array.isArray(payload) ? payload : []);
        this.activities = list.map((act: any) => {
          let timeAgo = 'Just now';
          if (act.timestamp) {
            const diffMs = Date.now() - new Date(act.timestamp).getTime();
            const diffMins = Math.floor(diffMs / 60000);
            const diffHrs = Math.floor(diffMins / 60);
            if (diffMins < 1) timeAgo = 'Just now';
            else if (diffMins < 60) timeAgo = `${diffMins} mins ago`;
            else if (diffHrs < 24) timeAgo = `${diffHrs} hours ago`;
            else timeAgo = `${Math.floor(diffHrs / 24)} days ago`;
          }

          let icon = 'fas fa-bullhorn';
          let typeClass = 'act-purple';
          if (act.type === 'LEAD') {
            icon = 'fas fa-user-plus';
            typeClass = 'act-green';
          } else if (act.type === 'TASK') {
            icon = 'fas fa-user-clock';
            typeClass = 'act-amber';
          } else if (act.type === 'PROPERTY') {
            icon = 'fas fa-coins';
            typeClass = 'act-blue';
          }

          return {
            title: act.description,
            time: timeAgo,
            icon,
            typeClass
          };
        });
      },
      error: (err) => {
        console.error('Failed to load activity logs:', err);
      }
    });
  }

  private updateEmployeeStats(): void {
    const totalEmp = this.employees.length;
    const empStat = this.stats.find(s => s.id === 'emp');
    if (empStat) empStat.value = totalEmp;

    const presentCount = this.attendance.filter(a => a.status === 'Present' || a.status === 'Late').length;
    const absentCount = this.attendance.filter(a => a.status === 'Absent').length;
    const leaveCount = this.attendance.filter(a => a.status === 'Leave').length;

    const presentStat = this.stats.find(s => s.id === 'present');
    if (presentStat) presentStat.value = presentCount;

    const absentStat = this.stats.find(s => s.id === 'absent');
    if (absentStat) absentStat.value = absentCount;

    const leaveStat = this.stats.find(s => s.id === 'leave');
    if (leaveStat) leaveStat.value = leaveCount;

    const pendingLeavesCount = this.leaveRequests.filter(l => l.status === 'Pending').length;
    const pendingLeaveStat = this.stats.find(s => s.id === 'pending_leaves');
    if (pendingLeaveStat) pendingLeaveStat.value = pendingLeavesCount;
  }

  private updateHolidayStats(): void {
    const activeHolidays = this.holidays.filter(h => h.status === 'Active');
    const holStat = this.stats.find(s => s.id === 'holidays');
    if (holStat) holStat.value = activeHolidays.length;
  }

  // Filter Helpers
  get filteredEmployees(): DashboardEmployee[] {
    if (!this.searchQuery) return this.employees;
    const q = this.searchQuery.toLowerCase();
    return this.employees.filter(e => 
      e.name.toLowerCase().includes(q) || 
      e.employeeId.toLowerCase().includes(q) ||
      e.department.toLowerCase().includes(q) ||
      e.role.toLowerCase().includes(q)
    );
  }

  get filteredHolidays(): Holiday[] {
    if (!this.searchQuery) return this.holidays;
    const q = this.searchQuery.toLowerCase();
    return this.holidays.filter(h => 
      h.name.toLowerCase().includes(q) || 
      h.type.toLowerCase().includes(q) ||
      h.date.includes(q)
    );
  }

  get filteredAttendance(): DashboardAttendance[] {
    if (!this.searchQuery) return this.attendance;
    const q = this.searchQuery.toLowerCase();
    return this.attendance.filter(a => 
      a.name.toLowerCase().includes(q) || 
      a.department.toLowerCase().includes(q) ||
      a.status.toLowerCase().includes(q)
    );
  }

  get filteredLeaves(): DashboardLeave[] {
    if (!this.searchQuery) return this.leaveRequests;
    const q = this.searchQuery.toLowerCase();
    return this.leaveRequests.filter(l => 
      l.employeeName.toLowerCase().includes(q) || 
      l.department.toLowerCase().includes(q) ||
      l.leaveType.toLowerCase().includes(q) ||
      l.status.toLowerCase().includes(q)
    );
  }

  formatDate(dateStr: string): string {
    if (!dateStr) return '';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' });
    } catch {
      return dateStr;
    }
  }

  getDayName(dateStr: string): string {
    if (!dateStr) return '';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('en-US', { weekday: 'short' });
    } catch {
      return '';
    }
  }
}

