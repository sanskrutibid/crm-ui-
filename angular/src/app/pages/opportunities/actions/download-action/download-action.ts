import { Component, EventEmitter, Input, OnInit, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { OpportunitiesService } from '../../opportunities.service';
import * as XLSX from 'xlsx';

@Component({
  selector: 'app-download-action',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './download-action.html',
  styleUrl: './download-action.css'
})
export class DownloadAction implements OnInit {
  @Input() totalRecords = 0;
  @Input() opportunityIds: string[] = [];
  @Output() close = new EventEmitter<void>();

  selectedLimit = 4000;
  isProcessing = false;
  queryParams: any = {};

  private readonly route = inject(ActivatedRoute);
  private readonly opportunitiesService = inject(OpportunitiesService);

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
    if (this.opportunityIds && this.opportunityIds.length > 0) {
      query.opportunityIds = this.opportunityIds.join(',');
    }

    if (type === 'excel') {
      this.isProcessing = true;
      this.opportunitiesService.getOpportunities(query).subscribe({
        next: (res: any) => {
          this.isProcessing = false;
          const payload = res.data || res;
          const opportunities = payload.opportunities || payload || [];
          this.generateLocalFile(opportunities);
          alert('Download started!');
          this.closePanel();
        },
        error: (err) => {
          this.isProcessing = false;
          console.error('Failed to export opportunities:', err);
          alert('Error exporting opportunities. Please try again.');
        }
      });
    } else if (type === 'google-drive') {
      this.isProcessing = true;
      alert('Export and Google Drive upload triggered. Please wait...');

      this.opportunitiesService.exportToGoogleDrive(query).subscribe({
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

  private generateLocalFile(opportunities: any[]) {
    if (!opportunities || opportunities.length === 0) {
      alert('No data to export.');
      return;
    }

    const dataToExport = opportunities.map(o => {
      const contact = o.contactId || {};
      const customerName = `${contact.salutation ? contact.salutation + ' ' : ''}${contact.firstName || ''} ${contact.lastName || ''}`.trim();
      const mobileVal = contact.mobile || '';
      const emailVal = contact.email || '';
      const assignedToVal = o.assignedTo ? `${o.assignedTo.firstName || ''} ${o.assignedTo.lastName || ''}`.trim() : '';

      return {
        'Opportunity ID': o.id || o._id?.toString() || '',
        'Customer Name': customerName || 'Unknown Customer',
        'Mobile Number': mobileVal,
        'Email Address': emailVal,
        'Request Date': o.requestDate || '',
        'Est Close Date': o.estCloseDate || '',
        'For (Purpose)': o.purpose || '',
        'Looking For': o.lookingFor || '',
        'Min Budget': o.minBudget != null ? o.minBudget.toString() : '',
        'Max Budget': o.maxBudget != null ? o.maxBudget.toString() : '',
        'Budget Unit': o.budgetUnit || '',
        'Min Area': o.minArea != null ? o.minArea.toString() : '',
        'Max Area': o.maxArea != null ? o.maxArea.toString() : '',
        'Area Unit': o.areaUnit || '',
        'City': o.city || '',
        'Locality': o.locality || '',
        'Bedroom': o.bedroom || '',
        'Furnishing': o.furnishing || '',
        'Transaction': o.transaction || '',
        'Preferences': o.purposePref || '',
        'Property Age': o.propertyAge || '',
        'Description': o.description || '',
        'Internal Note': o.internalNote || '',
        'Stage/Purpose': o.schedulePurpose || '',
        'Schedule Date': o.scheduleDate || '',
        'Schedule Time': o.scheduleTime || '',
        'Schedule Where': o.scheduleWhere || '',
        'Schedule Remark': o.scheduleRemark || '',
        'Keyword': o.keyword || '',
        'Refer By': o.referBy || '',
        'Folder': o.folder || '',
        'Source': o.source || '',
        'Branch': o.branch || '',
        'Assigned To': assignedToVal,
        'Status': o.status || '',
        'Created At': o.createdAt ? new Date(o.createdAt).toLocaleString() : ''
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Opportunities');

    const fileName = `Opportunities_Export_${new Date().toISOString().slice(0, 10)}`;
    XLSX.writeFile(workbook, `${fileName}.csv`, { bookType: 'csv' });
  }

  closePanel() {
    this.close.emit();
  }
}