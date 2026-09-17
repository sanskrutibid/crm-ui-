import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { MessagesService } from '../messages.service';

@Component({
  selector: 'app-scheduled-sms',
  standalone: true,
  templateUrl: './scheduled-sms.html',
  styleUrls: ['./scheduled-sms.css'],
  imports: [CommonModule, FormsModule, RouterModule]
})
export class ScheduledSms implements OnInit {
  smsReports: any[] = [];
  totalCount: number = 0;
  searchQuery: string = '';

  page: number = 1;
  limit: number = 10;

  isLoading: boolean = false;
  selectedSms: any = null;

  constructor(private readonly messagesService: MessagesService) {}

  ngOnInit(): void {
    this.loadScheduledSms();
  }

  loadScheduledSms(): void {
    this.isLoading = true;
    this.messagesService.getSmsReports({
      search: this.searchQuery,
      status: 'Pending',
      page: this.page,
      limit: this.limit,
      sortBy: 'scheduleTime',
      sortOrder: 'asc'
    }).subscribe({
      next: (res: any) => {
        this.isLoading = false;
        const payload = res.data || res;
        this.smsReports = payload.smsReports || payload || [];
        this.totalCount = payload.total || this.smsReports.length;
      },
      error: (err) => {
        this.isLoading = false;
        console.error('Failed to load scheduled SMS:', err);
      }
    });
  }

  search(): void {
    this.page = 1;
    this.loadScheduledSms();
  }

  viewDetails(sms: any): void {
    this.selectedSms = sms;
  }

  closeDetails(): void {
    this.selectedSms = null;
  }

  nextPage(): void {
    if (this.page * this.limit < this.totalCount) {
      this.page++;
      this.loadScheduledSms();
    }
  }

  prevPage(): void {
    if (this.page > 1) {
      this.page--;
      this.loadScheduledSms();
    }
  }

  get totalPages(): number {
    return Math.ceil(this.totalCount / this.limit) || 1;
  }
}
