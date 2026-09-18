import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LeaveService, LeaveBalance as LeaveBalanceModel } from '../leave.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-leave-balance',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './leave-balance.html',
  styleUrl: './leave-balance.css'
})
export class LeaveBalance implements OnInit, OnDestroy {

  allBalances: LeaveBalanceModel[] = [];
  employees: LeaveBalanceModel[] = [];
  private sub?: Subscription;

  // Filter properties
  filterDept = 'All Departments';
  filterSearch = '';
  filterYear = '2026';

  constructor(private leaveService: LeaveService) {}

  ngOnInit(): void {
    this.sub = this.leaveService.balances$.subscribe(balances => {
      this.allBalances = balances || [];
      this.applyFilters();
    });
    this.loadBalances();
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }

  loadBalances(): void {
    this.leaveService.getLeaveBalances().subscribe({
      next: (res) => {
        if (res && Array.isArray(res)) {
          this.allBalances = res;
          this.applyFilters();
        }
      },
      error: (err) => {
        console.error('Failed to load leave balances:', err);
      }
    });
  }

  applyFilters(): void {
    this.employees = this.allBalances.filter(balance => {
      const matchesDept = this.filterDept === 'All Departments' || balance.department === this.filterDept;

      const searchLower = this.filterSearch.toLowerCase();
      const matchesSearch = !this.filterSearch ||
        balance.name.toLowerCase().includes(searchLower) ||
        balance.employeeId.toLowerCase().includes(searchLower);

      return matchesDept && matchesSearch;
    });
  }
}