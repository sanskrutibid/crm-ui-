import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { MailboxService } from '../mailbox.service';

@Component({
  selector: 'app-mail-delivery-reports',
  standalone: true,
  templateUrl: './delivery-reports.html',
  styleUrls: ['./delivery-reports.css'],
  imports: [CommonModule, FormsModule, RouterModule]
})
export class MailDeliveryReports implements OnInit {
  emails: any[] = [];
  totalCount: number = 0;
  searchQuery: string = '';
  statusFilter: string = '';
  
  page: number = 1;
  limit: number = 10;
  
  isLoading: boolean = false;
  selectedEmail: any = null;

  constructor(private readonly mailboxService: MailboxService) {}

  ngOnInit(): void {
    this.loadReports();
  }

  loadReports(): void {
    this.isLoading = true;
    this.mailboxService.getEmailReports({
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
        // Filter out Pending status in frontend to only show Sent/Failed delivery reports
        const rawEmails = payload.emails || payload || [];
        this.emails = rawEmails.filter((e: any) => e.status !== 'Pending');
        this.totalCount = payload.total || this.emails.length;
      },
      error: (err) => {
        this.isLoading = false;
        console.error('Failed to load email delivery reports:', err);
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

  viewDetails(email: any): void {
    this.selectedEmail = email;
  }

  closeDetails(): void {
    this.selectedEmail = null;
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
