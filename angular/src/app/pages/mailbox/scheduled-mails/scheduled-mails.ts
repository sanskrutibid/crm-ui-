import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { MailboxService } from '../mailbox.service';

@Component({
  selector: 'app-scheduled-mails',
  standalone: true,
  templateUrl: './scheduled-mails.html',
  styleUrls: ['./scheduled-mails.css'],
  imports: [CommonModule, FormsModule, RouterModule]
})
export class ScheduledMails implements OnInit {
  emails: any[] = [];
  totalCount: number = 0;
  searchQuery: string = '';
  
  page: number = 1;
  limit: number = 10;
  
  isLoading: boolean = false;
  selectedEmail: any = null;

  constructor(private readonly mailboxService: MailboxService) {}

  ngOnInit(): void {
    this.loadScheduledMails();
  }

  loadScheduledMails(): void {
    this.isLoading = true;
    this.mailboxService.getEmailReports({
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
        this.emails = payload.emails || payload || [];
        this.totalCount = payload.total || this.emails.length;
      },
      error: (err) => {
        this.isLoading = false;
        console.error('Failed to load scheduled emails:', err);
      }
    });
  }

  search(): void {
    this.page = 1;
    this.loadScheduledMails();
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
      this.loadScheduledMails();
    }
  }

  prevPage(): void {
    if (this.page > 1) {
      this.page--;
      this.loadScheduledMails();
    }
  }

  get totalPages(): number {
    return Math.ceil(this.totalCount / this.limit) || 1;
  }
}
