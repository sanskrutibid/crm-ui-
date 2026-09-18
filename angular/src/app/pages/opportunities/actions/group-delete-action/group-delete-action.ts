import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { OpportunitiesService } from '../../opportunities.service';

@Component({
  selector: 'app-group-delete-action',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './group-delete-action.html',
  styleUrl: './group-delete-action.css'
})
export class GroupDeleteAction {
  @Input() totalRecords = 0;
  @Input() opportunityIds: string[] = [];
  @Output() close = new EventEmitter<void>();

  confirmCount: number | null = null;
  isSubmitting = false;

  private readonly opportunitiesService = inject(OpportunitiesService);

  closePage() {
    this.close.emit();
  }

  confirmDelete() {
    if (this.confirmCount !== this.totalRecords) {
      alert(`Please enter exactly ${this.totalRecords} to confirm deletion.`);
      return;
    }

    this.isSubmitting = true;
    this.opportunitiesService.groupDelete({ opportunityIds: this.opportunityIds }).subscribe({
      next: (res: any) => {
        this.isSubmitting = false;
        alert(`Successfully deleted ${res.count || this.totalRecords} opportunities.`);
        this.close.emit();
        window.location.reload();
      },
      error: (err: any) => {
        this.isSubmitting = false;
        alert('Failed to delete opportunities: ' + (err.error?.message || err.message));
      }
    });
  }
}