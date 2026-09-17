import { Component, Input, Output, EventEmitter, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { OpportunitiesService } from '../../../../opportunities/opportunities.service';
@Component({
  selector: 'app-property-change-status',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './property-change-status.html',
  styleUrl: './property-change-status.css'
})
export class PropertyChangeStatus {

  @Input() propertyId!: string;

  @Output() close = new EventEmitter<void>();

  @Input() opportunityId = '';
  @Output() statusChanged = new EventEmitter<void>();

  private opportunitiesService = inject(OpportunitiesService);
  
  status: string = '';

  remark: string = '';

  changeStatus() {
    if (!this.opportunityId) {
      alert('Error: No opportunity selected.');
      return;
    }

    if (!this.status) {

      alert('Please select status.');

      return;

    }

    let apiStatus = 'In Progress';
    if (this.status === 'Won - Closed') {
      apiStatus = 'Won';
    } else if (this.status === 'Lost - Closed') {
      apiStatus = 'Lost';
    }

    this.opportunitiesService.changeStatus(this.opportunityId, {
      status: apiStatus,
      outcome: this.remark || 'Status updated'
    }).subscribe({
      next: (res) => {
        alert('Opportunity status updated successfully.');
        this.statusChanged.emit();
        this.close.emit();
      },
      error: (err) => {
        console.error('Failed to update status:', err);
        alert('Failed to update status.');
      }
    });

  }

  cancel() {
    this.close.emit();
  }

}