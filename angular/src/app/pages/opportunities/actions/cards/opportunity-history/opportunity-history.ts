import { Component, Input, Output, EventEmitter, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ContactsService } from '../../../../contacts/contacts.service';

@Component({
  selector: 'app-opportunity-history',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './opportunity-history.html',
  styleUrl: './opportunity-history.css',
})
export class OpportunityHistory implements OnInit {
  @Input() contact: any;
  @Output() close = new EventEmitter<void>();

  private contactsService = inject(ContactsService);

  historyList: any[] = [];
  loading: boolean = true;
  errorMsg: string = '';

  ngOnInit() {
    // contact can be a full contact object or just a string ID
    const contactId = this.contact?._id || this.contact?.id || (typeof this.contact === 'string' ? this.contact : null);
    
    if (contactId) {
      this.loadHistory(contactId);
    } else {
      this.loading = false;
      this.errorMsg = 'No contact details available';
    }
  }

  loadHistory(contactId: string) {
    this.contactsService.getDetailedHistory(contactId).subscribe({
      next: (res: any) => {
        const rawList = res && res.data ? res.data : (Array.isArray(res) ? res : []);
        // Filter out email and SMS sent logs, but keep follow-ups and other updates
        this.historyList = rawList.filter((item: any) => {
          const action = (item.action || '').toLowerCase();
          return !action.includes('sms') && !action.includes('email');
        });
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
    if (!this.contact) return 'Customer';
    if (typeof this.contact === 'string') return 'Customer';
    return `${this.contact.salutation ? this.contact.salutation + ' ' : ''}${this.contact.firstName || ''} ${this.contact.lastName || ''}`.trim() || 'Customer';
  }
}
