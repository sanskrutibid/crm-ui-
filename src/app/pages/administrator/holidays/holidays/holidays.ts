import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

import { HolidayList } from '../holiday-list/holiday-list';
import { AddHoliday } from '../add-holiday/add-holiday';
import { HolidayCalendar } from '../holiday-calendar/holiday-calendar';
import { Holiday } from '../holidays.service';

@Component({
  selector: 'app-holidays',
  standalone: true,
  imports: [
    CommonModule,
    HolidayList,
    AddHoliday,
    HolidayCalendar
  ],
  templateUrl: './holidays.html',
  styleUrl: './holidays.css'
})
export class Holidays {
  selectedTab = 'list';
  selectedHolidayForEdit: Holiday | null = null;

  changeTab(tab: string) {
    if (tab === 'add' && this.selectedTab !== 'add') {
      this.selectedHolidayForEdit = null;
    }
    this.selectedTab = tab;
  }

  onNavigateToAdd(): void {
    this.selectedHolidayForEdit = null;
    this.selectedTab = 'add';
  }

  onEditHoliday(holiday: Holiday): void {
    this.selectedHolidayForEdit = holiday;
    this.selectedTab = 'add';
  }

  onHolidaySaved(): void {
    this.selectedHolidayForEdit = null;
    this.selectedTab = 'list';
  }

  onCancelAdd(): void {
    this.selectedHolidayForEdit = null;
    this.selectedTab = 'list';
  }
}