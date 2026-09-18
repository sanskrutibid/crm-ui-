import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { MessagesService } from '../messages.service';

@Component({
  selector: 'app-sms-delivery-reports',
  standalone: true,
  templateUrl: './delivery-reports.html',
  styleUrls: ['./delivery-reports.css'],
  imports: [CommonModule, FormsModule, RouterModule]
})
export class SmsDeliveryReports implements OnInit {
  smsReports: any[] = [];
  totalCount: number = 0;
  searchQuery: string = '';
  statusFilter: string = '';

  page: number = 1;
  limit: number = 10;

  isLoading: boolean = false;
  selectedSms: any = null;

  constructor(private readonly messagesService: MessagesService) {}

  ngOnInit(): void {
    this.loadReports();
  }

  loadReports(): void {
    this.isLoading = true;
    this.messagesService.getSmsReports({
      search: this.searchQuery,
      status: this.statusFilter || undefined,
      page: this.page,
      limit: this.limit,
      sortBy: 'updatedAt',
      sortOrder: 'desc'
    }).subscribe({
      next: (res: any) => {
        this.isLoading = false;
        const payload = res.data || res;
        const rawReports = payload.smsReports || payload || [];
        // Only show processed reports (Sent or Failed)
        this.smsReports = rawReports.filter((e: any) => e.status !== 'Pending');
        this.totalCount = payload.total || this.smsReports.length;
      },
      error: (err) => {
        this.isLoading = false;
        console.error('Failed to load SMS delivery reports:', err);
      }
    });
  }

  search(): void {
    this.page = 1;
    this.loadReports();
  }

  onStatusFilterChange(): void {
    this.page = 1;
    this.loadReports();
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
      this.loadReports();
    }
  }

  prevPage(): void {
    if (this.page > 1) {
      this.page--;
      this.loadReports();
    }
  }

  get totalPages(): number {
    return Math.ceil(this.totalCount / this.limit) || 1;
  }
}
