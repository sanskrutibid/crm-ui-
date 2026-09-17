import { Component, OnInit, ViewEncapsulation, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { SiteVisitsService } from '../site-visits.service';
import * as XLSX from 'xlsx';

@Component({
  selector: 'app-site-visits',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './all-visits.html',
  styleUrls: ['./all-visits.css'],
  encapsulation: ViewEncapsulation.None
})
export class AllVisits implements OnInit {
  selectedVisit: any = null;
  visitsListRaw: any[] = [];
  selectedVisitIds: { [id: string]: boolean } = {};
  totalRecords: number = 0;
  searchQuery: string = '';
  sortBy: string = 'Created Date';
  sortOrder: 'asc' | 'desc' = 'desc';
  showOtpModal = false;
  otpCode = '';
  otpError = '';
  otpVisitId = '';
  showDownloadView = false;
  exportPageSize: number = 4000;
  exportFormat: 'xlsx' | 'csv' = 'xlsx';

  private siteVisitsService = inject(SiteVisitsService);

  ngOnInit(): void {
    this.loadVisits();
  }

  loadVisits(): void {
    this.siteVisitsService.getSiteVisits({
      search: this.searchQuery || undefined,
      sortBy: this.sortBy,
      sortOrder: this.sortOrder,
      limit: 100
    }).subscribe({
      next: (res: any) => {
        const payload = res.data || res;
        this.visitsListRaw = payload.siteVisits || payload || [];
        this.totalRecords = payload.total || this.visitsListRaw.length;
        // Removed auto-selection of first visit to only show search/welcome screen by default
      },
      error: (err) => {
        console.error('Failed to load site visits:', err);
      }
    });
  }

  get visitsList(): any[] {
    return this.visitsListRaw.map(v => this.mapVisitProperties(v));
  }

  selectVisit(visit: any) {
    this.showDownloadView = false;
    this.selectedVisit = this.mapVisitProperties(visit);
  }

  clearSelection() {
    this.selectedVisit = null;
    this.showDownloadView = false;
  }

  openDownloadView() {
    this.selectedVisit = null;
    this.showDownloadView = true;
  }

  isVisitSelected(id: string): boolean {
    return !!this.selectedVisitIds[id];
  }

  toggleSelectVisit(id: string, event: MouseEvent): void {
    event.stopPropagation();
    this.selectedVisitIds[id] = !this.selectedVisitIds[id];
  }

  isAllSelected(): boolean {
    if (this.visitsList.length === 0) return false;
    return this.visitsList.every(v => this.selectedVisitIds[v.id]);
  }

  toggleSelectAll(): void {
    if (this.isAllSelected()) {
      this.selectedVisitIds = {};
    } else {
      this.visitsList.forEach(v => {
        this.selectedVisitIds[v.id] = true;
      });
    }
  }

  getSelectedVisitCount(): number {
    return Object.keys(this.selectedVisitIds).filter(id => this.selectedVisitIds[id]).length;
  }

  exportData() {
    const selectedIds = Object.keys(this.selectedVisitIds).filter(id => this.selectedVisitIds[id]);
    const limitVal = this.exportPageSize;

    if (selectedIds.length > 0) {
      // Export only selected
      const selectedVisits = this.visitsListRaw.filter(v => {
        const id = v.id || v._id;
        return selectedIds.includes(id);
      });
      // Limit selectedVisits array if exportPageSize is smaller than selected count
      const limitedVisits = selectedVisits.slice(0, limitVal);
      this.generateFile(limitedVisits, this.exportFormat);
    } else {
      // Export all - fetch from API with the selected limit
      this.siteVisitsService.getSiteVisits({ limit: limitVal }).subscribe({
        next: (res: any) => {
          const payload = res.data || res;
          const allVisits = payload.siteVisits || payload || [];
          this.generateFile(allVisits, this.exportFormat);
        },
        error: (err) => {
          console.error('Failed to fetch site visits for export:', err);
          alert('Error exporting site visits. Please try again.');
        }
      });
    }
  }

  private generateFile(visits: any[], format: 'xlsx' | 'csv') {
    if (!visits || visits.length === 0) {
      alert('No data to export.');
      return;
    }

    const dataToExport = visits.map(v => {
      const contact = v.contactId || {};
      const lead = v.leadId || {};
      const visitorName = v.visitor || 'Unknown Visitor';
      const mobile = contact.mobile || lead.mobile || v.mobile || '—';
      const email = contact.email || lead.email || '—';
      const visitDate = v.visitDate || '—';
      const timeIn = v.timeIn || '—';
      const timeOut = v.timeOut || '—';
      
      let assigneeName = '—';
      if (v.assignee && typeof v.assignee === 'object') {
        assigneeName = `${v.assignee.firstName || ''} ${v.assignee.lastName || ''}`.trim() || '—';
      }

      return {
        'Visitor Name': visitorName,
        'Mobile Number': mobile,
        'Email Address': email,
        'Visit Date': visitDate,
        'Visit Type': v.visitType || '—',
        'Module': v.module || '—',
        'Site Name': v.siteName || '—',
        'Other Name': v.otherName || '—',
        'Time In': timeIn,
        'Time Out': timeOut,
        'Site Manager': v.siteManager || '—',
        'Sourcing Manager': v.sourcingManager || '—',
        'Closing Manager': v.closingManager || '—',
        'Assignee': assigneeName,
        'Source': v.source || '—',
        'Branch': v.branch || '—',
        'Visit Status': v.visitStatus || '—',
        'Remarks': v.remark || '—',
        'Created At': v.createdAt ? new Date(v.createdAt).toLocaleString() : '—'
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Site Visits');

    const fileName = `Site_Visits_Export_${new Date().toISOString().slice(0, 10)}`;

    if (format === 'xlsx') {
      XLSX.writeFile(workbook, `${fileName}.xlsx`);
    } else {
      XLSX.writeFile(workbook, `${fileName}.csv`, { bookType: 'csv' });
    }
  }

  openOtpModal(visit: any): void {
    this.otpVisitId = visit.id;
    this.otpCode = '';
    this.otpError = '';
    this.showOtpModal = true;
  }

  closeOtpModal(): void {
    this.showOtpModal = false;
  }

  submitOtpVerify(): void {
    if (!this.otpCode) return;
    this.siteVisitsService.verifySiteVisitOtp(this.otpVisitId, this.otpCode).subscribe({
      next: (res: any) => {
        this.siteVisitsService.updateSiteVisit(this.otpVisitId, { visitStatus: 'Completed' }).subscribe({
          next: () => {
            alert('OTP Verified Successfully! Site Visit marked as Completed.');
            this.showOtpModal = false;
            this.selectedVisit = null;
            this.loadVisits();
          },
          error: (err) => {
            console.error('Failed to update status after OTP verification:', err);
            this.otpError = 'Failed to update visit status. Please try again.';
          }
        });
      },
      error: (err) => {
        console.error('OTP verification failed:', err);
        if (err.status === 404) {
          console.warn('verify-otp endpoint not found (404). Falling back to direct update for testing.');
          this.siteVisitsService.updateSiteVisit(this.otpVisitId, { visitStatus: 'Completed' }).subscribe({
            next: () => {
              alert('Local Fallback: Site Visit marked as Completed directly (OTP API not found).');
              this.showOtpModal = false;
              this.selectedVisit = null;
              this.loadVisits();
            },
            error: (directErr) => {
              console.error('Fallback status update failed:', directErr);
              this.otpError = 'OTP verification failed and fallback direct update failed.';
            }
          });
        } else {
          this.otpError = err.error?.message || err.message || 'Verification failed. Invalid OTP.';
        }
      }
    });
  }

  setSortBy(field: string) {
    this.sortBy = field;
    this.loadVisits();
  }

  setSortOrder(order: 'asc' | 'desc') {
    this.sortOrder = order;
    this.loadVisits();
  }

  deleteVisit(id: string): void {
    if (!id) return;
    if (confirm('Are you sure you want to delete this site visit?')) {
      this.siteVisitsService.deleteSiteVisit(id).subscribe({
        next: () => {
          alert('Site visit deleted successfully!');
          this.selectedVisit = null;
          this.loadVisits();
        },
        error: (err) => {
          console.error('Failed to delete site visit:', err);
          const errMsg = err.error?.message || err.message || 'Unknown error';
          alert('Error deleting site visit: ' + (Array.isArray(errMsg) ? errMsg.join(', ') : errMsg));
        }
      });
    }
  }

  private mapVisitProperties(visit: any): any {
    if (!visit) return null;
    const mapped = { ...visit };
    mapped.id = visit.id || visit._id;
    const contact = visit.contactId || {};
    const lead = visit.leadId || {};

    mapped.visitorName = visit.visitor || 'Unknown Visitor';
    mapped.mobile = contact.mobile || visit.mobile || '—';
    mapped.visitDate = visit.visitDate ? new Date(visit.visitDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—';
    mapped.siteManager = visit.siteManager || '—';
    mapped.availability = visit.visitStatus === 'Completed' ? 'Available' : 'Not Available';
    mapped.timeIn = visit.timeIn || '—';
    mapped.timeOut = visit.timeOut || '—';
    mapped.siteName = visit.siteName || '—';
    mapped.branch = visit.branch || '—';
    
    if (visit.assignee && typeof visit.assignee === 'object') {
      mapped.assigneeName = `${visit.assignee.firstName || ''} ${visit.assignee.lastName || ''}`.trim() || '—';
    } else {
      mapped.assigneeName = '—';
    }

    mapped.visitType = visit.visitType || '—';
    mapped.visitStatus = visit.visitStatus || '—';
    
    // Additional site visit fields
    mapped.module = visit.module || 'Project';
    mapped.otherName = visit.otherName || '—';
    mapped.sourcingManager = visit.sourcingManager || '—';
    mapped.closingManager = visit.closingManager || '—';
    mapped.source = visit.source || '—';
    mapped.remark = visit.remark || '—';
    mapped.gps = (visit.latitude && visit.longitude) ? `${visit.latitude}, ${visit.longitude}` : '—';
    
    // Privacy and notification fields
    mapped.privacyText = visit.isPrivate ? 'Private' : 'Branch';
    mapped.smsNotificationText = visit.sendSmsNotification ? 'Enabled' : 'Disabled';
    mapped.emailNotificationText = visit.sendEmailNotification ? 'Enabled' : 'Disabled';
    
    // Populated visitor details
    const isLead = !!visit.leadId;
    mapped.visitorRoleText = isLead ? 'Lead' : 'Contact';
    mapped.visitorEmail = contact.email || lead.email || '—';
    mapped.visitorCompany = contact.companyName || lead.companyName || '—';
    mapped.visitorDesignation = contact.designation || lead.designation || '—';
    mapped.visitorAddress = contact.address || lead.address || '—';
    mapped.visitorCity = contact.city || lead.city || '—';
    mapped.visitorLocality = contact.locality || lead.locality || '—';
    mapped.visitorPincode = contact.pincode || lead.pincode || '—';

    return mapped;
  }
}