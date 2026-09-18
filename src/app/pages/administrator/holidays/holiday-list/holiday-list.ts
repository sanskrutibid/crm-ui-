import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HolidaysService, Holiday } from '../holidays.service';

@Component({
  selector: 'app-holiday-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './holiday-list.html',
  styleUrl: './holiday-list.css'
})
export class HolidayList implements OnInit {
  @Output() navigateToAdd = new EventEmitter<void>();
  @Output() editHoliday = new EventEmitter<Holiday>();

  holidays: Holiday[] = [];
  filteredHolidays: Holiday[] = [];
  isLoading = false;

  // View Details Modal State
  selectedHolidayForView: Holiday | null = null;

  // Filters (Default year to 'All' so all holidays display immediately)
  selectedYear = 'All';
  selectedType = 'All';
  selectedStatus = 'All';
  searchQuery = '';

  totalCount = 0;
  activeCount = 0;

  constructor(private holidaysService: HolidaysService) {}

  ngOnInit(): void {
    // Initial fetch from stored/fallback holidays
    this.holidays = this.holidaysService.getStoredHolidays();
    this.applyFilters();

    this.loadHolidays();
    
    // Subscribe to reactive subject in service
    this.holidaysService.holidays$.subscribe(list => {
      if (list && list.length > 0) {
        this.holidays = list;
      } else {
        this.holidays = this.holidaysService.getStoredHolidays();
      }
      this.applyFilters();
    });
  }

  loadHolidays(): void {
    this.isLoading = true;
    this.holidaysService.getHolidays().subscribe({
      next: (res: any) => {
        this.isLoading = false;
        const list = Array.isArray(res) ? res : (res?.holidays || res?.data || []);
        if (list && list.length > 0) {
          this.holidays = list;
        } else {
          this.holidays = this.holidaysService.getStoredHolidays();
        }
        this.applyFilters();
      },
      error: (err) => {
        this.isLoading = false;
        this.holidays = this.holidaysService.getStoredHolidays();
        this.applyFilters();
      }
    });
  }

  applyFilters(): void {
    let result = [...this.holidays];

    // Filter by Year
    if (this.selectedYear && this.selectedYear !== 'All') {
      result = result.filter(h => h.date && h.date.includes(this.selectedYear));
    }

    // Filter by Type
    if (this.selectedType && this.selectedType !== 'All') {
      result = result.filter(h => h.type === this.selectedType);
    }

    // Filter by Status
    if (this.selectedStatus && this.selectedStatus !== 'All') {
      result = result.filter(h => h.status === this.selectedStatus);
    }

    // Search Query
    if (this.searchQuery && this.searchQuery.trim() !== '') {
      const q = this.searchQuery.toLowerCase().trim();
      result = result.filter(h =>
        h.name.toLowerCase().includes(q) ||
        (h.description && h.description.toLowerCase().includes(q)) ||
        (h.day && h.day.toLowerCase().includes(q))
      );
    }

    this.filteredHolidays = result;
    this.totalCount = this.holidays.length;
    this.activeCount = this.holidays.filter(h => h.status === 'Active').length;
  }

  onAddClick(): void {
    this.navigateToAdd.emit();
  }

  onViewClick(holiday: Holiday): void {
    this.selectedHolidayForView = holiday;
  }

  closeViewModal(): void {
    this.selectedHolidayForView = null;
  }

  onEditClick(holiday: Holiday): void {
    if (this.selectedHolidayForView) {
      this.closeViewModal();
    }
    this.editHoliday.emit(holiday);
  }

  onDeleteClick(holiday: Holiday): void {
    const confirmDelete = confirm(`Are you sure you want to delete the holiday "${holiday.name}"?`);
    if (!confirmDelete) return;

    const id = holiday.id || holiday._id;
    if (!id) return;

    this.holidaysService.deleteHoliday(id).subscribe({
      next: () => {
        alert(`Holiday "${holiday.name}" has been deleted successfully.`);
        if (this.selectedHolidayForView) {
          this.closeViewModal();
        }
        this.loadHolidays();
      },
      error: (err) => {
        console.error('Delete error:', err);
        alert('Failed to delete holiday.');
      }
    });
  }

  onSendEmailClick(holiday: Holiday): void {
    this.holidaysService.sendEmailNotification(holiday).subscribe({
      next: () => {
        alert(`📧 Automated formatted email notification for "${holiday.name}" has been sent to all employees!`);
      },
      error: (err) => {
        console.error('Email error:', err);
        alert('Failed to send email notification.');
      }
    });
  }
}