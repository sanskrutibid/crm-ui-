import { Component, EventEmitter, Input, OnInit, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { PropertiesService } from '../../properties.service';

@Component({
  selector: 'app-property-downlaod-action',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './property-downlaod-action.html',
  styleUrl: './property-downlaod-action.css',
})
export class PropertyDownlaodAction implements OnInit {
  @Input() totalRecords = 0;
  @Input() propertyIds: string[] = [];
  @Output() close = new EventEmitter<void>();

  selectedLimit = 4000;
  isProcessing = false;
  queryParams: any = {};

  private readonly route = inject(ActivatedRoute);
  private readonly propertiesService = inject(PropertiesService);

  ngOnInit() {
    this.selectedLimit = this.totalRecords || 4000;
    this.route.queryParams.subscribe(params => {
      this.queryParams = { ...params };
    });
  }

  startDownload(type: 'excel' | 'google-drive') {
    if (this.isProcessing) return;

    const query: any = { ...this.queryParams };
    if (this.selectedLimit) {
      query.limit = this.selectedLimit;
    }
    if (this.propertyIds && this.propertyIds.length > 0) {
      query.propertyIds = this.propertyIds.join(',');
    }

    if (type === 'excel') {
      this.isProcessing = true;
      this.propertiesService.getMyProperties(query).subscribe({
        next: (res: any) => {
          this.isProcessing = false;
          const payload = res.data || res;
          const properties = payload.properties || payload || [];
          this.generateLocalFile(properties);
          alert('Download started!');
          this.closePanel();
        },
        error: (err) => {
          this.isProcessing = false;
          console.error('Failed to export properties:', err);
          alert('Error exporting properties. Please try again.');
        }
      });
    } else if (type === 'google-drive') {
      this.isProcessing = true;
      alert('Export and Google Drive upload triggered. Please wait...');

      this.propertiesService.exportToGoogleDrive(query).subscribe({
        next: (res: any) => {
          this.isProcessing = false;
          alert(res.message || 'Export uploaded to Google Drive successfully!');
          this.closePanel();
        },
        error: (err: any) => {
          this.isProcessing = false;
          const errMsg = err.error?.message || err.message || 'Google Drive export failed';
          alert('Error: ' + errMsg);
        }
      });
    }
  }

  private generateLocalFile(properties: any[]) {
    if (!properties || properties.length === 0) {
      alert('No data to export.');
      return;
    }

    const dataToExport = properties.map(p => {
      const owner = p.ownerLandlord || {};
      const ownerName = owner.firstName
        ? `${owner.firstName} ${owner.lastName || ''}`.trim()
        : (typeof p.ownerLandlord === 'string' ? p.ownerLandlord : 'Unknown');
      const ownerMobile = owner.mobile || '';
      const ownerEmail = owner.email || '';
      const assignedToVal = p.assignedTo ? `${p.assignedTo.firstName || ''} ${p.assignedTo.lastName || ''}`.trim() : 'Administrator';

      return {
        'Property ID': p.id || p._id?.toString() || '',
        'Property Name': p.name || p.buildingTowerProject || '',
        'Owner Name': ownerName,
        'Mobile Number': ownerMobile,
        'Email Address': ownerEmail,
        'Location': p.address || p.location || '',
        'Property Type': p.propertyType || '',
        'Category': p.category || '',
        'Transaction': p.transaction || '',
        'Price': p.expectedPrice != null ? p.expectedPrice.toString() : (p.price || ''),
        'Area (Sq. Ft.)': p.area != null ? p.area.toString() : (p.sqft || ''),
        'Builder': p.builder || p.projectDeveloperName || '',
        'Status': p.status || '',
        'Created At': p.createdAt ? new Date(p.createdAt).toLocaleString() : ''
      };
    });

    const headers = Object.keys(dataToExport[0]).join(',');
    const rows = dataToExport.map(row => 
      Object.values(row).map(val => `"${(val || '').toString().replace(/"/g, '""')}"`).join(',')
    );
    const csvContent = '\ufeff' + [headers, ...rows].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `Properties_Export_${new Date().toISOString().slice(0, 10)}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  closePanel() {
    this.close.emit();
  }
}