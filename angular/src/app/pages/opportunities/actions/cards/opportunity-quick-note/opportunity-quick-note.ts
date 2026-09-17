import { Component, Input, Output, EventEmitter, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { OpportunitiesService } from '../../../opportunities.service';

@Component({
  selector: 'app-opportunity-quick-note',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './opportunity-quick-note.html',
  styleUrl: './opportunity-quick-note.css',
})
export class OpportunityQuickNote {
  @Input() opportunityId = '';
  @Input() opportunityDetails: any;
  @Output() close = new EventEmitter<void>();
  @Output() noteSaved = new EventEmitter<void>();

  private opportunitiesService = inject(OpportunitiesService);

  commentType = '';

  comment = '';

  saveNote() {
    if (!this.opportunityId) {
      alert('Error: No opportunity selected.');
      return;
    }

    if (!this.commentType || !this.comment.trim()) {

      alert('Please fill all required fields.');

      return;

    }

    this.opportunitiesService.addQuickNote(this.opportunityId, {
      commentType: this.commentType,
      comment: this.comment
    }).subscribe({
      next: (res) => {
        alert('Quick note saved successfully.');
        this.noteSaved.emit();
        this.close.emit();
      },
      error: (err) => {
        console.error('Failed to save quick note:', err);
        alert('Failed to save quick note.');
      }
    });

  }

  cancel() {
    this.close.emit();
  }
}