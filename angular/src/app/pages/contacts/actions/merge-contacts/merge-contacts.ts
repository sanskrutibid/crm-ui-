import { Component, EventEmitter, Output, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ContactsService } from '../../contacts.service';

@Component({
  selector: 'app-merge-contacts',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './merge-contacts.html',
  styleUrl: './merge-contacts.css'
})
export class MergeContacts implements OnInit {

  @Output() close = new EventEmitter<void>();

  totalRecords = 0;
  private contactsService = inject(ContactsService);

  ngOnInit() {
    this.loadDuplicateCount();
  }

  loadDuplicateCount() {
    this.contactsService.getDuplicateCount().subscribe({
      next: (res: any) => {
        const payload = res.data || res;
        this.totalRecords = payload.totalDuplicates !== undefined ? payload.totalDuplicates : (payload.count || 0);
      },
      error: (err) => {
        console.error('Failed to load duplicate count:', err);
      }
    });
  }

  closeMergeContacts() {
    this.close.emit();
  }

  mergeContacts() {
    this.contactsService.autoMerge().subscribe({
      next: (res: any) => {
        alert('Duplicate contacts auto merged successfully!');
        this.loadDuplicateCount();
        this.closeMergeContacts();
      },
      error: (err: any) => {
        console.error('Failed to merge contacts:', err);
        const errMsg = err.error?.message || err.message || 'Error occurred';
        alert('Failed to merge contacts: ' + (Array.isArray(errMsg) ? errMsg.join(', ') : errMsg));
      }
    });
  }
}