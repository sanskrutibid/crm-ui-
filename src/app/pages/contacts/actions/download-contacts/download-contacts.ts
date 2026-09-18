import { Component, EventEmitter, Output, OnInit, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { environment } from '../../../../../environments/environment';

@Component({
  selector: 'app-download-contacts',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './download-contacts.html',
  styleUrl: './download-contacts.css',
})
export class DownloadContacts implements OnInit {
  @Output() close = new EventEmitter<void>();
  @Input() totalRecords = 0;
  queryParams: any = {};
  isProcessing = false;
  selectedLimit = 4000;

  constructor(
    private route: ActivatedRoute,
    private http: HttpClient
  ) {}

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      this.queryParams = { ...params };
    });
  }

  startDownload(type: 'excel' | 'google-drive') {
    if (this.isProcessing) return;

    if (type === 'excel') {
      let queryString = '';
      const params = new URLSearchParams();
      Object.keys(this.queryParams).forEach(key => {
        if (this.queryParams[key] !== undefined && this.queryParams[key] !== null && this.queryParams[key] !== '') {
          params.set(key, this.queryParams[key].toString());
        }
      });
      // Set limit parameter
      if (this.selectedLimit) {
        params.set('limit', this.selectedLimit.toString());
      }
      queryString = params.toString();
      const downloadUrl = `${environment.apiUrl}/contacts/actions/download${queryString ? '?' + queryString : ''}`;
      
      window.open(downloadUrl, '_blank');
      alert('Download started! Contacts are also being backed up to Google Drive in the background.');
      this.closePanel();

    } else if (type === 'google-drive') {
      this.isProcessing = true;
      alert('Export and Google Drive upload triggered. Please wait...');

      this.http.post(`${environment.apiUrl}/contacts/actions/google-drive`, {
        filters: this.queryParams,
        limit: this.selectedLimit
      }).subscribe({
        next: (res: any) => {
          this.isProcessing = false;
          alert(res.message || 'Export uploaded to Google Drive successfully!');
          this.closePanel();
        },
        error: (err) => {
          this.isProcessing = false;
          const errMsg = err.error?.message || err.message || 'Google Drive export failed';
          alert('Error: ' + errMsg);
        }
      });
    }
  }

  closePanel() {
    this.close.emit(); 
  }
}
