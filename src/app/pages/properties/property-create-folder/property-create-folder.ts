import { Component, OnInit, inject } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PropertiesService } from '../properties.service';

@Component({
  selector: 'app-property-create-folder',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './property-create-folder.html',
  styleUrl: './property-create-folder.css',
})
export class PropertyCreateFolder implements OnInit {
  folderName = '';
  orderNumber = 0;
  permission = '';
  onlyAssigned = false;
  smartFolder = false;
  categoryProperty = '';

  totalPropertiesCount = 0;
  isSubmitting = false;

  private readonly router = inject(Router);
  private readonly propertiesService = inject(PropertiesService);

  ngOnInit() {
    this.loadPropertiesCount();
  }

  loadPropertiesCount() {
    this.propertiesService.getMyProperties({ limit: 1 }).subscribe({
      next: (res: any) => {
        const payload = res.data || res;
        this.totalPropertiesCount = payload.total || 0;
      },
      error: (err) => {
        console.error('Failed to load properties count:', err);
      }
    });
  }

  goBack() {
    this.router.navigate(['/my-properties']);
  }

  submitFolder() {
    if (!this.folderName.trim()) {
      alert('Folder Name is required.');
      return;
    }

    this.isSubmitting = true;

    const payload = {
      folderName: this.folderName,
      module: 'Property',
      permission: this.permission || 'public',
      orderNumber: this.orderNumber,
      onlyAssigned: this.onlyAssigned,
      smartFolder: this.smartFolder,
      categoryProperty: this.categoryProperty || undefined
    };

    this.propertiesService.createFolder(payload).subscribe({
      next: (res: any) => {
        this.isSubmitting = false;
        alert('Folder created successfully!');
        this.goBack();
      },
      error: (err: any) => {
        this.isSubmitting = false;
        const msg = err.error?.message || err.message || 'Failed to create folder';
        alert('Error creating folder: ' + (Array.isArray(msg) ? msg.join(', ') : msg));
      }
    });
  }
}
