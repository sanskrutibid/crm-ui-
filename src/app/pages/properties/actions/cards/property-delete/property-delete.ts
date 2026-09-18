import { Component, Input, Output, EventEmitter, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PropertiesService } from '../../../properties.service';

@Component({
  selector: 'app-property-delete',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './property-delete.html',
  styleUrl: './property-delete.css',
})
export class PropertyDelete {
  @Input() propertyId!: string;

  @Output() close = new EventEmitter<void>();
  @Output() propertyDeleted = new EventEmitter<void>();

  private propertiesService = inject(PropertiesService);
  isDeleting = false;

  deleteProperty() {
    if (!this.propertyId) {
      alert('Error: No property selected.');
      return;
    }

    this.isDeleting = true;
    this.propertiesService.deleteProperty(this.propertyId).subscribe({
      next: () => {
        this.isDeleting = false;
        this.propertyDeleted.emit();
        this.close.emit();
      },
      error: (err) => {
        this.isDeleting = false;
        console.error('Failed to delete property:', err);
        const errMsg = err?.error?.message || err?.message || 'Failed to delete property.';
        alert(errMsg);
      }
    });
  }

  cancel() {
    this.close.emit();
  }
}
