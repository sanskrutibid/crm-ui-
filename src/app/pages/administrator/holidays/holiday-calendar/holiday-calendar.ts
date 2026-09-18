import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HolidaysService, Holiday } from '../holidays.service';

interface CalendarDay {
  dateNumber: number | null;
  fullDateStr: string | null;
  isWeekend: boolean;
  holiday: Holiday | null;
}

@Component({
  selector: 'app-holiday-calendar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './holiday-calendar.html',
  styleUrl: './holiday-calendar.css'
})
export class HolidayCalendar implements OnInit {
  currentDate = new Date();
  currentMonthIndex = 6; // 0-based index (6 = July)
  currentYear = 2026;

  monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  holidays: Holiday[] = [];
  calendarWeeks: CalendarDay[][] = [];

  constructor(private holidaysService: HolidaysService) {}

  ngOnInit(): void {
    this.holidaysService.holidays$.subscribe(list => {
      this.holidays = list;
      this.generateCalendar();
    });
  }

  get currentMonthName(): string {
    return this.monthNames[this.currentMonthIndex];
  }

  prevMonth(): void {
    if (this.currentMonthIndex === 0) {
      this.currentMonthIndex = 11;
      this.currentYear--;
    } else {
      this.currentMonthIndex--;
    }
    this.generateCalendar();
  }

  nextMonth(): void {
    if (this.currentMonthIndex === 11) {
      this.currentMonthIndex = 0;
      this.currentYear++;
    } else {
      this.currentMonthIndex++;
    }
    this.generateCalendar();
  }

  generateCalendar(): void {
    const firstDay = new Date(this.currentYear, this.currentMonthIndex, 1);
    const lastDay = new Date(this.currentYear, this.currentMonthIndex + 1, 0);

    const startDayOfWeek = firstDay.getDay(); // 0 = Sun, 1 = Mon ...
    const totalDaysInMonth = lastDay.getDate();

    const weeks: CalendarDay[][] = [];
    let currentWeek: CalendarDay[] = [];

    // Empty cells before the 1st
    for (let i = 0; i < startDayOfWeek; i++) {
      currentWeek.push({
        dateNumber: null,
        fullDateStr: null,
        isWeekend: false,
        holiday: null
      });
    }

    // Days of the month
    for (let day = 1; day <= totalDaysInMonth; day++) {
      const monthStr = String(this.currentMonthIndex + 1).padStart(2, '0');
      const dayStr = String(day).padStart(2, '0');
      const fullDateStr = `${this.currentYear}-${monthStr}-${dayStr}`;

      const dateObj = new Date(this.currentYear, this.currentMonthIndex, day);
      const dayOfWeek = dateObj.getDay();
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

      // Find matching holiday
      const matchedHoliday = this.holidays.find(h => {
        if (!h.date) return false;
        // Accept both YYYY-MM-DD or formatted date string matching date
        return h.date.startsWith(fullDateStr) || h.date === fullDateStr;
      }) || null;

      currentWeek.push({
        dateNumber: day,
        fullDateStr,
        isWeekend,
        holiday: matchedHoliday
      });

      if (currentWeek.length === 7) {
        weeks.push(currentWeek);
        currentWeek = [];
      }
    }

    // Fill remaining empty cells for last week
    if (currentWeek.length > 0) {
      while (currentWeek.length < 7) {
        currentWeek.push({
          dateNumber: null,
          fullDateStr: null,
          isWeekend: false,
          holiday: null
        });
      }
      weeks.push(currentWeek);
    }

    this.calendarWeeks = weeks;
  }

  getHolidayClass(type?: string): string {
    if (!type) return '';
    switch (type) {
      case 'National Holiday':
        return 'national';
      case 'Festival Holiday':
        return 'festival';
      case 'Company Holiday':
        return 'company';
      default:
        return 'optional';
    }
  }
}