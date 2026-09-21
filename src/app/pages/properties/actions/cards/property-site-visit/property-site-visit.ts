import { CommonModule } from '@angular/common';
import { Component, Output, EventEmitter, Input, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { SiteVisitsService } from '../../../../site-visits/site-visits.service';

@Component({
  selector: 'app-property-site-visit',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './property-site-visit.html',
  styleUrl: './property-site-visit.css',
})
export class PropertySiteVisit implements OnInit {

  @Input() property: any;
  @Output() close = new EventEmitter<void>();

  private siteVisitsService = inject(SiteVisitsService);
  private router = inject(Router);

  siteVisits: any[] = [];
  loading = true;
  errorMsg = '';

  showDetailsModal = false;
  selectedVisit: any = null;

  ngOnInit() {
    this.loadSiteVisits();
  }

  loadSiteVisits() {
    const targetLeadId = this.property?.id || this.property?._id;
    const targetContactId = this.property?.contactId?._id || this.property?.contactId?.id || this.property?.contactId;
    if (!targetLeadId && !targetContactId) {
      this.loading = false;
      this.errorMsg = 'No opportunity or contact ID provided.';
      return;
    }

    this.loading = true;
    this.errorMsg = '';
    // Fetch site visits
    this.siteVisitsService.getSiteVisits({ limit: 1000 }).subscribe({
      next: (res: any) => {
        const payload = res.data || res;
        const allVisits = payload.siteVisits || payload || [];
        
        // Filter visits belonging to this opportunity/lead or its contact
        const filtered = allVisits.filter((v: any) => {
          const vLeadId = v.leadId?._id || v.leadId?.id || v.leadId;
          const vContactId = v.contactId?._id || v.contactId?.id || v.contactId;
          return (targetLeadId && vLeadId === targetLeadId) || (targetContactId && vContactId === targetContactId);
        });

        // Map visits to table-friendly format
        this.siteVisits = filtered.map((v: any, index: number) => this.mapVisitProperties(v, index));
        this.loading = false;
      },
      error: (err) => {
        console.error('Failed to load site visits for opportunity:', err);
        this.errorMsg = 'Failed to load site visits.';
        this.loading = false;
      }
    });
  }

  mapVisitProperties(visit: any, index: number): any {
    if (!visit) return null;
    const contact = visit.contactId || {};
    const lead = visit.leadId || {};

    let assigneeName = '—';
    if (visit.assignee && typeof visit.assignee === 'object') {
      assigneeName = `${visit.assignee.firstName || ''} ${visit.assignee.lastName || ''}`.trim() || '—';
    } else if (visit.assignee) {
      assigneeName = visit.assignee;
    }

    return {
      id: visit.id || visit._id,
      visitNo: index + 1,
      siteName: visit.siteName || '—',
      visitedBy: assigneeName,
      date: visit.visitDate ? new Date(visit.visitDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—',
      lockDays: visit.lockDays || 0,
      status: visit.visitStatus || '—',
      raw: visit
    };
  }

  createVisit() {
    const targetLeadId = this.property?.id || this.property?._id;
    if (targetLeadId) {
      this.router.navigate(['/create-visit'], { queryParams: { leadId: targetLeadId } });
    } else {
      this.router.navigate(['/create-visit']);
    }
  }

  viewDetails(visit: any) {
    if (!visit || !visit.raw) return;
    const v = visit.raw;
    const contact = v.contactId || {};
    const lead = v.leadId || {};

    let assigneeName = '—';
    if (v.assignee && typeof v.assignee === 'object') {
      assigneeName = `${v.assignee.firstName || ''} ${v.assignee.lastName || ''}`.trim() || '—';
    } else if (v.assignee) {
      assigneeName = v.assignee;
    }

    this.selectedVisit = {
      ...v,
      id: v.id || v._id,
      visitorName: v.visitor || 'Unknown Visitor',
      mobile: contact.mobile || v.mobile || '—',
      email: contact.email || '—',
      visitDate: v.visitDate ? new Date(v.visitDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—',
      availability: v.visitStatus === 'Completed' ? 'Completed' : 'Pending',
      timeIn: v.timeIn || '—',
      timeOut: v.timeOut || '—',
      siteName: v.siteName || '—',
      branch: v.branch || '—',
      assigneeName: assigneeName,
      visitType: v.visitType || '—',
      visitStatus: v.visitStatus || '—',
      module: v.module || 'Project',
      otherName: v.otherName || '—',
      siteManager: v.siteManager || '—',
      sourcingManager: v.sourcingManager || '—',
      closingManager: v.closingManager || '—',
      source: v.source || '—',
      remark: v.remark || '—',
      gps: (v.latitude && v.longitude) ? `${v.latitude}, ${v.longitude}` : '—',
      privacyText: v.isPrivate ? 'Private' : 'Branch',
      smsNotificationText: v.sendSmsNotification ? 'Enabled' : 'Disabled',
      emailNotificationText: v.sendEmailNotification ? 'Enabled' : 'Disabled',
      photograph: v.photograph || null
    };

    this.showDetailsModal = true;
  }

  closeDetailsModal() {
    this.showDetailsModal = false;
    this.selectedVisit = null;
  }
}