import { Component, EventEmitter, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LeadsService } from '../leads.service';

@Component({
  selector: 'app-remove-duplicate',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './remove-duplicate.html',
  styleUrl: './remove-duplicate.css'
})
export class RemoveDuplicate {
  private leadsService = inject(LeadsService);

  confirmationText = '';

  @Output() close = new EventEmitter<void>();

  removeDuplicates() {
    if (this.confirmationText !== 'YES') {
      return;
    }

    this.leadsService.removeDuplicates().subscribe({
      next: (res: any) => {
        const payload = res.data || res;
        alert(payload.message || 'Duplicate leads processed successfully!');
        this.close.emit();
      },
      error: (err: any) => {
        console.error('Failed to remove duplicates:', err);
        const errMsg = err.error?.message || err.message || 'Server error';
        alert('Failed to remove duplicates: ' + errMsg);
      }
    });
  }
}