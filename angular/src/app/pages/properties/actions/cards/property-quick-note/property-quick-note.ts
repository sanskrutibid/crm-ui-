import { Component, Input, Output, EventEmitter, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { OpportunitiesService } from '../../../../opportunities/opportunities.service';

@Component({
  selector: 'app-property-quick-note',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './property-quick-note.html',
  styleUrl: './property-quick-note.css',
})
export class PropertyQuickNote {
    @Input() propertyId!: string;
  @Input() opportunityDetails: any;
  @Output() close = new EventEmitter<void>();
  @Output() noteSaved = new EventEmitter<void>();

  private opportunitiesService = inject(OpportunitiesService);

  commentType = '';

  comment = '';

  saveNote() {
    if (!this.propertyId) {
      alert('Error: No opportunity selected.');
      return;
    }

    if (!this.commentType || !this.comment.trim()) {

      alert('Please fill all required fields.');

      return;

    }

    this.opportunitiesService.addQuickNote(this.propertyId, {
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