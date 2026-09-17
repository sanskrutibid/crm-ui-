import { Component, EventEmitter, Output, OnInit, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { environment } from '../../../../environments/environment';
import { LeadsService } from '../leads.service';

@Component({
  selector: 'app-download-leads',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './download-leads.html',
  styleUrl: './download-leads.css'
})
export class DownloadLeads implements OnInit {
  @Input() totalRecords = 0;
  @Input() leadIds: string[] = [];
  @Output() close = new EventEmitter<void>();

  pageSize = 10;
  isProcessing = false;
  queryParams: any = {};

  constructor(
    private route: ActivatedRoute,
    private http: HttpClient,
    private leadsService: LeadsService
  ) { }

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      this.queryParams = { ...params };
    });
  }

  downloadExcel() {
    if (this.isProcessing) return;

    const params = new URLSearchParams();
    Object.keys(this.queryParams).forEach(key => {
      if (this.queryParams[key] !== undefined && this.queryParams[key] !== null && this.queryParams[key] !== '') {
        params.set(key, this.queryParams[key].toString());
      }
    });

    if (this.pageSize) {
      params.set('limit', this.pageSize.toString());
    }

    if (this.leadIds && this.leadIds.length > 0) {
      params.set('leadIds', this.leadIds.join(','));
    }

    const queryString = params.toString();
    const downloadUrl = `${environment.apiUrl}/leads/actions/download${queryString ? '?' + queryString : ''}`;

    window.open(downloadUrl, '_blank');
    alert('Download started! Leads are also being backed up to Google Drive in the background.');
    this.close.emit();
  }

  exportToDrive() {
    if (this.isProcessing) return;

    this.isProcessing = true;
    alert('Export and Google Drive upload triggered. Please wait...');

    const filters = { ...this.queryParams };
    if (this.leadIds && this.leadIds.length > 0) {
      filters.leadIds = this.leadIds.join(',');
    }

    this.leadsService.exportToGoogleDrive({
      filters,
      limit: this.pageSize
    }).subscribe({
      next: (res: any) => {
        this.isProcessing = false;
        alert(res.message || 'Export uploaded to Google Drive successfully!');
        this.close.emit();
      },
      error: (err) => {
        this.isProcessing = false;
        const errMsg = err.error?.message || err.message || 'Google Drive export failed';
        alert('Error: ' + errMsg);
      }
    });
  }
}