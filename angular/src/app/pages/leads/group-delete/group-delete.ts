import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { LeadsService } from '../leads.service';

@Component({
  selector: 'app-group-delete',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './group-delete.html',
  styleUrl: './group-delete.css'
})
export class GroupDelete {
  @Input() totalRecords = 0;
  @Input() leadIds: string[] = [];
  @Output() close = new EventEmitter<void>();

  confirmCount: number | null = null;
  isSubmitting = false;

  private leadsService = inject(LeadsService);

  confirmDelete() {
    if (this.confirmCount !== this.totalRecords) {
      alert(`Please enter exactly ${this.totalRecords} to confirm deletion.`);
      return;
    }

    this.isSubmitting = true;
    this.leadsService.groupDelete({ leadIds: this.leadIds }).subscribe({
      next: (res: any) => {
        this.isSubmitting = false;
        alert(`Successfully deleted ${res.count || this.totalRecords} leads.`);
        this.close.emit();
        // Trigger page refresh (reload leads) by location reload or let parent reload.
        // Direct page reload is safe and clean for bulk actions.
        window.location.reload();
      },
      error: (err) => {
        this.isSubmitting = false;
        alert('Failed to delete leads: ' + (err.error?.message || err.message));
      }
    });
  }
}