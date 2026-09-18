import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

import { PayrollDashboard } from '../payroll-dashboard/payroll-dashboard';
import { SalaryStructure } from '../salary-structure/salary-structure';
import { ProcessPayroll } from '../process-payroll/process-payroll';
import { Payslips } from '../payslips/payslips';
import { BonusIncentives } from '../bonus-incentives/bonus-incentives';
import { Deductions } from '../deductions/deductions';
import { PfEsicTax } from '../pf-esic-tax/pf-esic-tax';
import { PayrollReport } from '../payroll-report/payroll-report';

@Component({
  selector: 'app-payroll',
  standalone: true,
  imports: [
    CommonModule,
    PayrollDashboard,
    SalaryStructure,
    ProcessPayroll,
    Payslips,
    BonusIncentives,
    Deductions,
    PfEsicTax,
    PayrollReport
  ],
  templateUrl: './payroll.html',
  styleUrl: './payroll.css'
})
export class Payroll {

  selectedTab = 'dashboard';

  changeTab(tab: string) {

    this.selectedTab = tab;

  }

}