import { Component, Input, Output, EventEmitter, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LeadsService } from '../leads.service';

@Component({
  selector: 'app-change-requirement',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './change-requirement.html',
  styleUrl: './change-requirement.css'
})
export class ChangeRequirement implements OnInit {
  @Input() leadId = '';
  @Input() leadDetails: any;
  @Output() close = new EventEmitter<void>();
  @Output() requirementChanged = new EventEmitter<void>();

  private leadsService = inject(LeadsService);

  requirement = '';

  ngOnInit() {
    if (this.leadDetails) {
      this.requirement = this.leadDetails.requirements || this.leadDetails.requirement || '';
    }
  }

  updateRequirement() {
    if (!this.leadId) {
      alert('Error: No Lead Selected');
      return;
    }
    if (!this.requirement) {
      alert('Please enter requirement text');
      return;
    }

    this.leadsService.updateRequirement(this.leadId, { requirement: this.requirement }).subscribe({
      next: () => {
        alert('Requirement updated successfully');
        this.requirementChanged.emit();
        this.close.emit();
      },
      error: (err) => {
        console.error('Failed to update requirement:', err);
        alert('Error updating requirement');
      }
    });
  }

  cancel() {
    this.close.emit();
  }
}