import { Component, Input, Output, EventEmitter, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

@Component({
  selector: 'app-matching-opportunities-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './matching-opportunities-modal.html',
  styleUrls: ['./matching-opportunities-modal.css']
})
export class MatchingOpportunitiesModalComponent {
  @Input() matchingOpportunities: any[] = [];
  @Input() itemTitle: string = 'Property/Project';
  @Output() close = new EventEmitter<void>();

  private router = inject(Router);

  closeModal() {
    this.close.emit();
  }

  getFormattedBudget(opp: any): string {
    if (!opp) return 'Budget N/A';
    if (opp.budget) return String(opp.budget);

    const min = opp.minBudget ?? opp.budgetMin;
    const max = opp.maxBudget ?? opp.budgetMax;
    const unit = opp.budgetUnit ? ` ${opp.budgetUnit}` : '';

    if (min != null && max != null) {
      return `${min} - ${max}${unit}`;
    }
    if (min != null) {
      return `>= ${min}${unit}`;
    }
    if (max != null) {
      return `<= ${max}${unit}`;
    }
    return 'Budget N/A';
  }

  getContactName(opp: any): string {
    if (!opp) return 'Client Lead';
    if (opp.contactId && typeof opp.contactId === 'object') {
      return opp.contactId.fullName || opp.contactId.name || opp.customerName || opp.name || 'Client Lead';
    }
    return opp.customerName || opp.name || 'Client Lead';
  }

  getContactPhone(opp: any): string {
    if (!opp) return 'Contact N/A';
    if (opp.contactId && typeof opp.contactId === 'object') {
      return opp.contactId.mobile || opp.contactId.phone || opp.phone || opp.contactNumber || 'Contact N/A';
    }
    return opp.phone || opp.contactNumber || 'Contact N/A';
  }

  viewOpportunity(opp: any) {
    this.closeModal();
    const name = this.getContactName(opp);
    const phone = this.getContactPhone(opp);
    const queryTerm = name !== 'Client Lead' ? name : (phone !== 'Contact N/A' ? phone : (opp.locality || opp.city || ''));
    this.router.navigate(['/all-opp'], { queryParams: { search: queryTerm } });
  }
}
