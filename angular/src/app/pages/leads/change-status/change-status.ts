import { Component, Input, Output, EventEmitter, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LeadsService } from '../leads.service';

@Component({
  selector: 'app-change-status',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './change-status.html',
  styleUrl: './change-status.css',
})
export class ChangeStatus {
  @Input() leadId = '';
  @Output() close = new EventEmitter<void>();
  @Output() statusChanged = new EventEmitter<void>();

  private leadsService = inject(LeadsService);

  selectedStatus = '';
  finalOutcome = '';

  statusOptions = [
    'In Progress',
    'Disqualified/Cancelled',
    'Qualified/Completed',
    'Rejected/Out of Business',
    'On Hold/Park'
  ];

  saveStatus() {
    if (!this.leadId) {
      alert('Error: No Lead Selected');
      return;
    }
    if (!this.selectedStatus) {
      alert('Please select status');
      return;
    }
    if (!this.finalOutcome) {
      alert('Please enter final outcome');
      return;
    }

    // Map UI status options to backend expected LeadStatus enum values ('In Progress', 'Won', 'Lost')
    let apiStatus = 'In Progress';
    if (this.selectedStatus === 'Qualified/Completed') {
      apiStatus = 'Won';
    } else if (this.selectedStatus === 'Disqualified/Cancelled' || this.selectedStatus === 'Rejected/Out of Business') {
      apiStatus = 'Lost';
    }

    this.leadsService.changeStatus(this.leadId, {
      status: apiStatus,
      outcome: this.finalOutcome
    }).subscribe({
      next: (res) => {
        alert('Status changed successfully!');
        this.statusChanged.emit();
        this.close.emit();
      },
      error: (err) => {
        console.error('Failed to change lead status:', err);
        const errMsg = err.error?.message || err.message || 'Status change failed';
        alert('Error: ' + (Array.isArray(errMsg) ? errMsg.join(', ') : errMsg));
      }
    });
  }

  cancel() {
    this.close.emit();
  }
}