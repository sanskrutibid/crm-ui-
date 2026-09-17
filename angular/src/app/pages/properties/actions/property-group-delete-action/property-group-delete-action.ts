import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PropertiesService } from '../../properties.service';

@Component({
  selector: 'app-property-group-delete-action',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './property-group-delete-action.html',
  styleUrl: './property-group-delete-action.css',
})
export class PropertyGroupDeleteAction {
  
  @Input() totalRecords = 0;
  @Input() propertyIds: string[] = [];
  @Output() close = new EventEmitter<void>();

  confirmCount: number | null = null;
  isSubmitting = false;

  private readonly propertiesService = inject(PropertiesService);

  closePage() {
    this.close.emit();
  }




  confirmDelete() {
    if (this.confirmCount !== this.totalRecords) {
      alert(`Please enter exactly ${this.totalRecords} to confirm deletion.`);
      return;
    }

    this.isSubmitting = true;
    this.propertiesService.groupDelete({ propertyIds: this.propertyIds }).subscribe({
      next: (res: any) => {
        this.isSubmitting = false;
        alert(`Successfully deleted ${res.count || this.totalRecords} properties.`);
        this.close.emit();
        window.location.reload();
      },
      error: (err: any) => {
        this.isSubmitting = false;
        alert('Failed to delete properties: ' + (err.error?.message || err.message));
      }
    });
  }
}
