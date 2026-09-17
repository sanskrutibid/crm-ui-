import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LeaveService, LeaveRequest } from '../leave.service';

@Component({
  selector: 'app-leave-report',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './leave-report.html',
  styleUrl: './leave-report.css'
})
export class LeaveReport implements OnInit {

  summaryCards = [
    {
      title: 'Total Leave',
      count: 0,
      icon: 'fas fa-calendar-check',
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

  allRequests: LeaveRequest[] = [];
  reports: any[] = [];

  // Filter properties
  filterMonth = 'July';
  filterYear = '2026';
  filterDept = 'All Departments';
  filterSearch = '';

  months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  constructor(private leaveService: LeaveService) {}

  ngOnInit(): void {
    this.loadRequests();
  }

  loadRequests(): void {
    this.leaveService.getLeaveRequests().subscribe({
      next: (res) => {
        this.allRequests = res.leaves || [];
        this.calculateReport();
      },
      error: (err) => {
        console.error('Failed to load leave requests for report:', err);
      }
    });
  }

  calculateReport(): void {
    // 1. Calculate summaries (based on all data or filtered data? Let's use all data for global context or filtered for month. Let's do month/year filtered summary so it's precise!)
    const yearNum = parseInt(this.filterYear);
    const monthIndex = this.months.indexOf(this.filterMonth);

    const filteredRequests = this.allRequests.filter(req => {
      const reqDate = new Date(req.from);
      const matchesYear = reqDate.getFullYear() === yearNum;
      const matchesMonth = reqDate.getMonth() === monthIndex;
      
      const matchesDept = this.filterDept === 'All Departments' || req.department === this.filterDept;
      
      const searchLower = this.filterSearch.toLowerCase();
      const matchesSearch = !this.filterSearch || 
        req.name.toLowerCase().includes(searchLower) || 
        req.employeeId.toLowerCase().includes(searchLower);

      return matchesYear && matchesMonth && matchesDept && matchesSearch;
    });

    const total = filteredRequests.reduce((sum, r) => sum + r.days, 0);
    const approved = filteredRequests.filter(r => r.status === 'Approved').reduce((sum, r) => sum + r.days, 0);
    const pending = filteredRequests.filter(r => r.status === 'Pending').reduce((sum, r) => sum + r.days, 0);
    const rejected = filteredRequests.filter(r => r.status === 'Rejected').reduce((sum, r) => sum + r.days, 0);

    this.summaryCards[0].count = total;
    this.summaryCards[1].count = approved;
    this.summaryCards[2].count = pending;
    this.summaryCards[3].count = rejected;

    // 2. Generate per-employee breakdown for approved leaves
    const employeeMap = new Map<string, any>();

    filteredRequests.forEach(req => {
      if (req.status !== 'Approved') return;

      const empId = req.employeeId;
      if (!employeeMap.has(empId)) {
        employeeMap.set(empId, {
          name: req.name,
          department: req.department,
          casual: 0,
          sick: 0,
          annual: 0,
          paid: 0,
          lop: 0,
          total: 0
        });
      }

      const empRecord = employeeMap.get(empId);
      const days = req.days;
      const type = req.type.toLowerCase();

      if (type.includes('casual')) {
        empRecord.casual += days;
      } else if (type.includes('sick')) {
        empRecord.sick += days;
      } else if (type.includes('annual')) {
        empRecord.annual += days;
      } else if (type.includes('lop') || type.includes('unpaid')) {
        empRecord.lop += days;
      } else {
        empRecord.paid += days; // default to paid
      }

      empRecord.total += days;
    });

    this.reports = Array.from(employeeMap.values());
  }

  exportExcel(): void {
    alert('Excel export initiated successfully.');
  }

  exportPdf(): void {
    alert('PDF export initiated successfully.');
  }

  printReport(): void {
    window.print();
  }
}