import { Component, Input, Output, EventEmitter, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { OpportunitiesService } from '../../../opportunities.service';

@Component({
  selector: 'app-opportunity-delete',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './opportunity-delete.html',
  styleUrl: './opportunity-delete.css',
})
export class OpportunityDelete {
  @Input() opportunityId = '';
  @Output() close = new EventEmitter<void>();
  @Output() opportunityDeleted = new EventEmitter<void>();

  private opportunitiesService = inject(OpportunitiesService);

  deleteOpportunity() {
    if (!this.opportunityId) {
      alert('Error: No opportunity selected.');
      return;
    }

    if (confirm('Are you sure you want to delete this opportunity? This action cannot be undone.')) {
      this.opportunitiesService.deleteOpportunity(this.opportunityId).subscribe({
        next: () => {
          alert('Opportunity deleted successfully.');
          this.opportunityDeleted.emit();
          this.close.emit();
        },
        error: (err) => {
          console.error('Failed to delete opportunity:', err);
          alert('Failed to delete opportunity.');
        }
      });
    }

  }

  cancel() {

    this.close.emit();

  }

}
