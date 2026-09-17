import { Component, Input, Output, EventEmitter, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LeadsService } from '../leads.service';

@Component({
  selector: 'app-delete-lead',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './delete-lead.html',
  styleUrl: './delete-lead.css'
})
export class DeleteLead {
  @Input() leadId = '';
  @Input() leadDetails: any;
  @Output() close = new EventEmitter<void>();
  @Output() leadDeleted = new EventEmitter<void>();

  private leadsService = inject(LeadsService);

  confirmDelete() {
    if (!this.leadId) {
      alert('Error: No Lead Selected');
      return;
    }
    this.leadsService.deleteLead(this.leadId).subscribe({
      next: () => {
        alert('Lead deleted successfully');
        this.leadDeleted.emit();
        this.close.emit();
      },
      error: (err) => {
        console.error('Failed to delete lead:', err);
        alert('Error deleting lead');
      }
    });
  }

  cancelDelete() {
    this.close.emit();
  }
}