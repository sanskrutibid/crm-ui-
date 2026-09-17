import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LeaveService, LeaveRequest as LeaveRequestModel } from '../leave.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-leave-request',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './leave-request.html',
  styleUrl: './leave-request.css'
})
export class LeaveRequest implements OnInit, OnDestroy {

  allRequests: LeaveRequestModel[] = [];
  leaveRequests: LeaveRequestModel[] = [];
  private sub?: Subscription;

  // Filter properties
  filterType = 'All';
  filterStatus = 'All';
  filterDept = 'All Departments';
  filterSearch = '';

  constructor(private leaveService: LeaveService) {}

  ngOnInit(): void {
    this.sub = this.leaveService.requests$.subscribe(requests => {
      this.allRequests = requests || [];
      this.applyFilters();
    });
    this.loadLeaveRequests();
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }

  loadLeaveRequests(): void {
    const params = {
      type: this.filterType,
      status: this.filterStatus,
      department: this.filterDept,
      search: this.filterSearch
    };

    this.leaveService.getLeaveRequests(params).subscribe({
      next: (res) => {
        if (res?.leaves) {
          this.allRequests = res.leaves;
          this.applyFilters();
        }
      },
      error: (err) => {
        console.error('Failed to load leave requests:', err);
      }
    });
  }

  applyFilters(): void {
    this.leaveRequests = this.allRequests.filter(r => {
      const matchesType = this.filterType === 'All' || r.type === this.filterType;
      const matchesStatus = this.filterStatus === 'All' || r.status === this.filterStatus;
      const matchesDept = this.filterDept === 'All Departments' || r.department === this.filterDept;
      const searchLower = this.filterSearch.toLowerCase();
      const matchesSearch = !this.filterSearch ||
        r.name.toLowerCase().includes(searchLower) ||
        r.employeeId.toLowerCase().includes(searchLower);

      return matchesType && matchesStatus && matchesDept && matchesSearch;
    });
  }

  approveLeave(leave: LeaveRequestModel): void {
    const id = leave.id || leave._id;
    if (!id) return;
    if (confirm(`Are you sure you want to APPROVE leave request for ${leave.name}?`)) {
      this.leaveService.updateLeaveRequest(id, { status: 'Approved' }).subscribe({
        next: () => {
          this.loadLeaveRequests();
        },
        error: (err) => {
          console.error('Error approving leave:', err);
          alert('Failed to approve leave request.');
        }
      });
    }
  }

  rejectLeave(leave: LeaveRequestModel): void {
    const id = leave.id || leave._id;
    if (!id) return;
    if (confirm(`Are you sure you want to REJECT leave request for ${leave.name}?`)) {
      this.leaveService.updateLeaveRequest(id, { status: 'Rejected' }).subscribe({
        next: () => {
          this.loadLeaveRequests();
        },
        error: (err) => {
          console.error('Error rejecting leave:', err);
          alert('Failed to reject leave request.');
        }
      });
    }
  }

  viewLeaveDetails(leave: LeaveRequestModel): void {
    alert(`Leave Request Details:
-----------------------------
Employee ID: ${leave.employeeId}
Employee Name: ${leave.name}
Department: ${leave.department}
Leave Type: ${leave.type}
Duration: ${leave.from} to ${leave.to} (${leave.days} days)
Priority: ${leave.priority || 'Normal'}
Manager: ${leave.manager || 'HR Manager'}
Reason: ${leave.reason || 'Not provided'}
Contact Info: ${leave.contact || 'Not provided'}
Status: ${leave.status}`);
  }
}