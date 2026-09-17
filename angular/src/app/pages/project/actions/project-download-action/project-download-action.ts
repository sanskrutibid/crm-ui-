import { Component, EventEmitter, Input, OnInit, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { ProjectsService } from '../../projects.service';

@Component({
  selector: 'app-project-download-action',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './project-download-action.html',
  styleUrl: './project-download-action.css',
})
export class ProjectDownloadAction implements OnInit {
  @Input() totalRecords = 0;
  @Input() projectIds: string[] = [];
  @Output() close = new EventEmitter<void>();

  selectedLimit = 4000;
  isProcessing = false;
  queryParams: any = {};

  private readonly route = inject(ActivatedRoute);
  private readonly projectsService = inject(ProjectsService);

  ngOnInit() {
    this.selectedLimit = this.totalRecords || 4000;
    this.route.queryParams.subscribe(params => {
      this.queryParams = { ...params };
    });
  }

  startDownload(type: 'excel' | 'google-drive') {
    if (this.isProcessing) return;

    if (type === 'google-drive') {
      alert('Google Drive export is not implemented for projects. Please download locally.');
      return;
    }

    const query: any = { ...this.queryParams };
    if (this.selectedLimit) {
      query.limit = this.selectedLimit;
    }
    if (this.projectIds && this.projectIds.length > 0) {
      query.projectIds = this.projectIds.join(',');
    }

    this.isProcessing = true;
    this.projectsService.getProjects(query).subscribe({
      next: (res: any) => {
        this.isProcessing = false;
        const payload = res.data || res;
        const projects = payload.projects || payload || [];
        this.generateLocalFile(projects);
        alert('Download started!');
        this.closePanel();
      },
      error: (err) => {
        this.isProcessing = false;
        console.error('Failed to export projects:', err);
        alert('Error exporting projects. Please try again.');
      }
    });
  }

  private generateLocalFile(projects: any[]) {
    if (!projects || projects.length === 0) {
      alert('No projects data to export.');
      return;
    }

    const dataToExport = projects.map(p => {
      const contact = p.contactId || {};
      const ownerName = contact.firstName
        ? `${contact.firstName} ${contact.lastName || ''}`.trim()
        : 'Unknown';
      const ownerMobile = contact.mobile || '';
      const ownerEmail = contact.email || '';

      return {
        'Project ID': p.id || p._id?.toString() || '',
        'Project Name': p.projectName || '',
        'Developer Name': p.developerName || '',
        'Owner Name': ownerName,
        'Owner Mobile': ownerMobile,
        'Owner Email': ownerEmail,
        'Launch Date': p.launchDate || '',
        'RERA Number': p.reraNumber || '',
        'District Code': p.districtCode || '',
        'Locking Duration (Days)': p.lockingDuration != null ? p.lockingDuration.toString() : '',
        'Project Area': p.projectArea != null ? p.projectArea.toString() : '',
        'Area Unit': p.areaUnit || '',
        'Type': p.type || '',
        'Total Room / Units': p.totalRoom || '',
        'Price': p.price != null ? p.price.toString() : '',
        'Interested In': p.interestedIn || '',
        'Transaction Type': p.transactionType || '',
        'Description': p.description || '',
        'Remark': p.remark || '',
        'Address': p.address || '',
        'City': p.city || '',
        'Locality': p.locality || '',
        'Pin Code': p.pinCode || '',
        'Branch': p.branch || '',
        'Status': p.status || '',
        'Commencement Certificate': p.commencementCertificate ? 'Yes' : 'No',
        'Occupancy Certificate': p.occupancyCertificate ? 'Yes' : 'No',
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
    link.setAttribute('download', `Projects_Export_${new Date().toISOString().slice(0, 10)}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  closePanel() {
    this.close.emit();
  }
}
