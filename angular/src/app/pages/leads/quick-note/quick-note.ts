import { Component, Input, Output, EventEmitter, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LeadsService } from '../leads.service';

@Component({
  selector: 'app-quick-note',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './quick-note.html',
  styleUrl: './quick-note.css'
})
export class QuickNote {
  @Input() leadId = '';
  @Input() leadDetails: any;
  @Output() close = new EventEmitter<void>();
  @Output() noteSaved = new EventEmitter<void>();

  private leadsService = inject(LeadsService);

  commentType = '';

  comment = '';

  commentTypes = [
    'General Note',
    'Follow Up',
    'Interested',
    'Not Interested',
    'Call Back',
    'Site Visit',
    'Converted'
  ];

  saveNote() {
    if (!this.leadId) {
      alert('Error: No Lead Selected');
      return;
    }
    if (!this.commentType) {
      alert('Please select comment type');
      return;
    }
    if (!this.comment) {
      alert('Please enter comment');
      return;
    }

    const payload = {
      commentType: this.commentType,
      comment: this.comment
    };

    this.leadsService.addQuickNote(this.leadId, payload).subscribe({
      next: () => {
        alert('Quick note added successfully');
        this.noteSaved.emit();
        this.close.emit();
      },
      error: (err) => {
        console.error('Failed to save quick note:', err);
        alert('Error saving quick note');
      }
    });
  }

  cancelNote() {
    this.close.emit();
  }
}