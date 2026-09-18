import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

import { LeaveDashboard } from '../leave-dashboard/leave-dashboard';
import { LeaveRequest } from '../leave-request/leave-request';
import { LeaveApply } from '../leave-apply/leave-apply';
import { LeaveCalendar } from '../leave-calendar/leave-calendar';
import { LeaveBalance } from '../leave-balance/leave-balance';
import { LeaveReport } from '../leave-report/leave-report';

@Component({
  selector: 'app-leave',
  standalone: true,
  imports: [
    CommonModule,
    LeaveDashboard,
    LeaveRequest,
    LeaveApply,
    LeaveCalendar,
    LeaveBalance,
    LeaveReport
  ],
  templateUrl: './leave.html',
  styleUrl: './leave.css'
})
export class Leave {

  selectedTab = 'dashboard';

  changeTab(tab: string) {

    this.selectedTab = tab;

  }

}