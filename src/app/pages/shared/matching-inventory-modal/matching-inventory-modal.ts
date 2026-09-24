import { Component, Input, Output, EventEmitter, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

@Component({
  selector: 'app-matching-inventory-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './matching-inventory-modal.html',
  styleUrls: ['./matching-inventory-modal.css']
})
export class MatchingInventoryModalComponent {
  @Input() matchingProperties: any[] = [];
  @Input() matchingProjects: any[] = [];
  @Input() opportunityTitle: string = 'Opportunity';
  @Output() close = new EventEmitter<void>();

  activeTab: 'properties' | 'projects' = 'properties';

  private router = inject(Router);

  closeModal() {
    this.close.emit();
  }

  getFormattedPropertyPrice(prop: any): string {
    if (!prop) return 'Price N/A';
    const price = prop.expectedPrice || prop.price || prop.rent;
    return price ? String(price) : 'Price N/A';
  }

  getFormattedProjectPrice(proj: any): string {
    if (!proj) return 'Price N/A';
    if (proj.minPrice && proj.maxPrice) {
      return `${proj.minPrice} - ${proj.maxPrice}`;
    }
    if (proj.minPrice) return `>= ${proj.minPrice}`;
    if (proj.maxPrice) return `<= ${proj.maxPrice}`;
    if (proj.price) return String(proj.price);
    return 'Price N/A';
  }

  viewProperty(property: any) {
    this.closeModal();
    const title = property.title || property.propertyName || property.locality || '';
    this.router.navigate(['/all-properties'], { queryParams: { search: title } });
  }

  viewProject(project: any) {
    this.closeModal();
    const title = project.projectName || project.locality || '';
    this.router.navigate(['/all-projects'], { queryParams: { search: title } });
  }
}
