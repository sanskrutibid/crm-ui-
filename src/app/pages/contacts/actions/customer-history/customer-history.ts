import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ContactsService } from '../../contacts.service';

@Component({
  selector: 'app-customer-history',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './customer-history.html',
  styleUrl: './customer-history.css',
})
export class CustomerHistory implements OnInit {
  @Input() contact: any;
  @Output() close = new EventEmitter<void>();

  historyList: any[] = [];
  loading: boolean = true;
  errorMsg: string = '';

  constructor(private contactsService: ContactsService) {}

  ngOnInit() {
    if (this.contact && this.contact.id) {
      this.loadHistory(this.contact.id);
    } else {
      this.loading = false;
      this.errorMsg = 'No contact details available';
    }
  }

  loadHistory(contactId: string) {
    this.contactsService.getDetailedHistory(contactId).subscribe({
      next: (res: any) => {
        this.historyList = res && res.data ? res.data : (Array.isArray(res) ? res : []);
        this.loading = false;
      },
      error: (err) => {
        console.error('Failed to load history:', err);
        this.errorMsg = 'Failed to load customer history logs.';
        this.loading = false;
      }
    });
  }

  getBadgeIcon(action: string): string {
    switch (action) {
      case 'Created':
        return 'fas fa-plus';
      case 'Converted to Lead':
        return 'fas fa-user-check';
      case 'Modified':
        return 'fas fa-edit';
      case 'Status':
        return 'fas fa-info-circle';
      case 'Transferred':
        return 'fas fa-exchange-alt';
      case 'Document':
        return 'fas fa-file-alt';
      case 'T&C Sent':
        return 'fas fa-file-signature';
      case 'SMS Sent':
        return 'fas fa-sms';
      case 'Email Sent':
        return 'fas fa-envelope';
      case 'Quick Note':
        return 'fas fa-sticky-note';
      case 'Follow-up':
      case 'Followup':
        return 'far fa-calendar-check';
      default:
        return 'fas fa-history';
    }
  }

  closeModal() {
    this.close.emit();
  }

  getContactName(): string {
    if (!this.contact) return '';
    return `${this.contact.salutation ? this.contact.salutation + ' ' : ''}${this.contact.firstName} ${this.contact.lastName || ''}`.trim();
  }
}
