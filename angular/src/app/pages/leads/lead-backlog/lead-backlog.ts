import { Component, OnInit, ViewEncapsulation, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { LeadsService } from '../leads.service';
import { FormsModule } from '@angular/forms';
import { AdvancedSearch } from '../../shared/advanced-search/advanced-search';
import { CreateAudience } from '../create-audience/create-audience';
import { SendGroupSms } from '../send-group-sms/send-group-sms';
import { SendGroupEmail } from '../send-group-email/send-group-email';
import { GroupDelete } from '../group-delete/group-delete';
import { DownloadLeads } from '../download-leads/download-leads';
import { ImportLeads } from '../import-leads/import-leads';
import { RemoveDuplicate } from '../remove-duplicate/remove-duplicate';
import { ChangeStatus } from '../change-status/change-status';
import { ChangeRequirement } from '../change-requirement/change-requirement';
import { SendSms } from '../send-sms/send-sms';
import { SendEmail } from '../send-email/send-email';
import { QuickNote } from '../quick-note/quick-note';
import { SendProposal } from '../send-proposal/send-proposal';
import { DeleteLead } from '../delete-lead/delete-lead';
import { TermsConditions } from '../terms-conditions/terms-conditions';
import { Followup } from '../followup/followup';
import { TransferLeads } from '../transfer-leads/transfer-leads';
import { CustomerHistory } from '../../contacts/actions/customer-history/customer-history';
import { PermissionService } from '../../control-panel/services/permission.service';

@Component({
  selector: 'app-lead-backlog',
 standalone: true,
   imports: [CommonModule, RouterModule, FormsModule, AdvancedSearch, CreateAudience,
     SendGroupSms, SendGroupEmail, GroupDelete, DownloadLeads, ImportLeads, RemoveDuplicate,
     ChangeStatus, ChangeRequirement, SendSms, SendEmail, QuickNote, SendProposal, DeleteLead,
     TermsConditions, Followup, TransferLeads, CustomerHistory],
  templateUrl: './lead-backlog.html',
  styleUrl: './lead-backlog.css',
  encapsulation: ViewEncapsulation.None
})
export class LeadBacklog implements OnInit {
  isConvertMode: boolean = false;
  currentStep: number = 1;
  showFolderDropdown = false;
  showSortDropdown = false;
  showOrderDropdown = false;
  selectedLead: any = null; 
  showAdvancedSearch: boolean = false;
  leadsListRaw: any[] = [];
  totalRecords: number = 0;
  searchQuery: string = '';
  sortBy: string = 'Create Date';
  orderBy: 'Asc' | 'Desc' = 'Desc';
  todayLeadsCount: number = 0;
  showCustomerHistory: boolean = false;
  showChangeStatus: boolean = false;

  private leadsService = inject(LeadsService);
  public permissionService = inject(PermissionService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private cdr = inject(ChangeDetectorRef);

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      const returnTo = params['returnTo'];
      const action = params['action'];
      this.loadLeads(() => {
        if (returnTo) {
          this.selectLead(returnTo, () => {
            if (action) {
              this.triggerAction(action);
            }
          });
        }
      });
    });
  }

  loadLeads(callback?: () => void) {
    this.leadsService.getTodayFollowup({
      sortBy: this.sortBy,
      orderBy: this.orderBy,
      limit: 100
    }).subscribe({
      next: (res: any) => {
        const payload = res.data || res;
        this.leadsListRaw = payload.overdueLeads || [];
        this.totalRecords = this.leadsListRaw.length;
        if (callback) callback();
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Failed to load backlog leads from API:', err);
        if (callback) callback();
      }
    });
  }

  setSortBy(field: string) {
    this.sortBy = field;
    this.loadLeads();
  }

  setOrderBy(order: 'Asc' | 'Desc') {
    this.orderBy = order;
    this.loadLeads();
  }

  get contactsList(): any[] {
    if (!this.searchQuery) return this.leadsListRaw;
    const query = this.searchQuery.toLowerCase();
    return this.leadsListRaw.filter(lead => {
      const name = this.getContactName(lead).toLowerCase();
      const phone = this.getContactPhone(lead).toLowerCase();
      const remark = (lead.requirement || lead.followupNote || '').toLowerCase();
      const branch = (lead.branch || '').toLowerCase();
      return name.includes(query) || phone.includes(query) || remark.includes(query) || branch.includes(query);
    });
  }

  selectLead(id: string, callback?: () => void) {
    this.showChangeStatus = false;

    this.leadsService.getLeadById(id).subscribe({
      next: (res: any) => {
        const payload = res.data || res;
        this.selectedLead = this.mapLeadProperties(payload);
        if (callback) {
          callback();
        }
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Failed to load lead details:', err);
      }
    });
  }

  get leadsArray() {
    return this.leadsListRaw.map(l => this.mapLeadProperties(l));
  }

  private mapLeadProperties(lead: any): any {
    if (!lead) return null;
    const mapped = { ...lead };
    const contact = lead.contactId || {};

    mapped.name = this.getContactName(lead);
    mapped.phone = this.getContactPhone(lead);
    mapped.branch = lead.branch || contact.branch || 'Global Team';
    mapped.assignedToName = lead.assignedTo?.firstName || 'Administrator';
    mapped.assignedTo = lead.assignedTo?.firstName || 'Administrator';
    mapped.followUpDate = `${lead.scheduleDate || ''} ${lead.scheduleTime || ''}`.trim() || '—';
    mapped.requirements = lead.requirement || '—';
    mapped.interestedIn = lead.interestedIn || lead.requirement || '—';

    // Map metadata for HTML list cards
    mapped.dateHeader = lead.createdAt ? new Date(lead.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '—';
    mapped.action = lead.purpose || 'Follow-Up Scheduled';

    // Map additional properties for full details
    mapped.nextRemark = lead.nextRemark || '—';
    mapped.outcome = lead.outcome || '—';
    mapped.purpose = lead.purpose || '—';
    mapped.folder = lead.folder || '—';
    mapped.updatedAtFormatted = lead.updatedAt ? new Date(lead.updatedAt).toLocaleString('en-US') : '—';
    mapped.updatedByName = lead.updatedBy ? `${lead.updatedBy.firstName || ''} ${lead.updatedBy.lastName || ''}`.trim() : (lead.assignedTo?.firstName || 'Administrator');
    mapped.createdAtFormatted = lead.createdAt ? new Date(lead.createdAt).toLocaleDateString('en-US') : '—';
    mapped.createdByName = lead.createdBy ? `${lead.createdBy.firstName || ''} ${lead.createdBy.lastName || ''}`.trim() : 'Administrator';
    mapped.email = contact.email || '—';
    mapped.assignDateFormatted = lead.assignDate ? new Date(lead.assignDate).toLocaleString('en-US') : '—';

    // Map personal and professional details nested objects expected by HTML
    mapped.personalDetails = {
      address: contact.address || '—',
      city: contact.city || '—',
      locality: contact.locality || '—',
      pincode: contact.pincode || '—',
      gender: contact.salutation === 'Mr' ? 'Male' : (contact.salutation === 'Mrs' || contact.salutation === 'Miss' ? 'Female' : '—'),
      dob: contact.dob || '—',
      anniversary: contact.anniversary || '—'
    };

    mapped.businessDetails = {
      companyName: contact.companyName || '—',
      businessDomain: contact.businessDomain || '—',
      businessType: contact.companyType || '—',
      designation: contact.designation || '—',
      website: contact.website || '—',
      fax: contact.faxNumber || '—',
      businessAddress: contact.professionalAddress || '—',
      city: contact.professionalCity || '—',
      locality: contact.professionalLocality || '—',
      pincode: '—'
    };

    mapped.bankingDetails = {
      accountName: contact.bankAccountName || '—',
      bankName: contact.bankName || '—',
      ifscCode: contact.ifscCode || '—'
    };

    mapped.auditLogs = {
      updatedBy: lead.updatedBy?.firstName || lead.assignedTo?.firstName || 'Administrator',
      updatedDate: lead.updatedAt,
      createdDate: lead.createdAt,
      createdBy: lead.createdBy?.firstName || lead.assignedTo?.firstName || 'Administrator'
    };

    return mapped;
  }

  clearSelection() {
    this.selectedLead = null;
    this.showChangeStatus = false;
  }

  isStarred(leadId: string): boolean {
    if (typeof window === 'undefined') return false;
    const starred = JSON.parse(localStorage.getItem('starred_leads') || '[]');
    return starred.includes(leadId);
  }

  toggleFavorite() {
    if (this.selectedLead && typeof window !== 'undefined') {
      const leadId = this.selectedLead.id;
      let starred = JSON.parse(localStorage.getItem('starred_leads') || '[]');
      if (starred.includes(leadId)) {
        starred = starred.filter((id: string) => id !== leadId);
      } else {
        starred.push(leadId);
      }
      localStorage.setItem('starred_leads', JSON.stringify(starred));
      this.cdr.detectChanges();
    }
  }

  navigateToConvert(contactId: string) {
    if (!contactId) {
      console.warn('No contact selected');
      return;
    }
    this.router.navigate(['/convert', contactId], { queryParams: { returnTo: contactId } });
  }

  getContactName(lead: any): string {
    if (!lead) return '';
    const contact = lead.contactId;
    if (!contact) return lead.name || 'Unknown Customer';
    return `${contact.salutation ? contact.salutation + ' ' : ''}${contact.firstName} ${contact.lastName || ''}`.trim();
  }

  getContactPhone(lead: any): string {
    if (!lead) return '';
    const contact = lead.contactId;
    if (!contact) return lead.mobile || '—';
    const mobile = contact.mobile || '';
    if (contact.isConfidential && mobile.length > 5) {
      return mobile.substring(0, 5) + '*******' + mobile.substring(mobile.length - 3);
    }
    return mobile;
  }

  openAdvancedSearch() {
    this.router.navigate(['/advanced-search'], {
      queryParams: { type: 'leads' }
    });
  }

  hideAdvancedSearch() {
    this.showAdvancedSearch = false;
  }

  onAdvancedSearch(event: any) {
    console.log('Advanced Search:', event);
    // Backend call yahan
  }

  makeCall() {
    if (!this.selectedLead) return;
    const contact = this.selectedLead.contactId || {};
    const mobile = contact.mobile || this.selectedLead.phone || '';
    if (!mobile || mobile === '—') {
      alert('No mobile number available');
      return;
    }
    window.open(`tel:${mobile}`, '_self');
  }

  openWhatsApp() {
    if (!this.selectedLead) return;
    const contact = this.selectedLead.contactId || {};
    const mobile = contact.mobile || this.selectedLead.phone || '';
    if (!mobile || mobile === '—') {
      alert('No mobile number available');
      return;
    }
    if (mobile.includes('*******')) {
      alert('Cannot send WhatsApp to confidential/masked number');
      return;
    }
    const countryCode = contact.countryCode ? contact.countryCode.replace('+', '') : '91';
    const cleanMobile = mobile.replace(/\s+/g, '');
    const fullPhone = cleanMobile.startsWith('+') ? cleanMobile.replace('+', '') : (cleanMobile.length === 10 ? countryCode + cleanMobile : cleanMobile);

    const name = this.selectedLead.name || '';
    const text = encodeURIComponent(`Hello ${name}`);
    window.open(`https://api.whatsapp.com/send?phone=${fullPhone}&text=${text}`, '_blank');
  }

  matchProperties() {
    if (!this.selectedLead) return;
    const req = this.selectedLead.requirements || '';
    this.router.navigate(['/available-properties'], { queryParams: { search: req } });
  }

  triggerAction(action: string) {
    if (action === 'sms') this.openSendSms();
    else if (action === 'email') this.openSendEmail();
    else if (action === 'call') this.openQuickNote();
    else if (action === 'proposal') this.openSendProposal();
    else if (action === 'transfer') this.openTransfer();
    else if (action === 'requirement') this.openChangeRequirement();
    else if (action === 'history') this.openCustomerHistory();
  }

  openCustomerHistory() {
    this.showCustomerHistory = true;
    this.cdr.detectChanges();
  }

  hideCustomerHistory() {
    this.showCustomerHistory = false;
    this.cdr.detectChanges();
  }

  onStatusChanged() {
    if (this.selectedLead) {
      this.selectLead(this.selectedLead.id);
    }
    this.loadLeads();
  }

  onFollowupSaved() {
    if (this.selectedLead) {
      this.selectLead(this.selectedLead.id);
    }
    this.loadLeads();
  }

  onTransferCompleted() {
    this.clearSelection();
    this.loadLeads();
  }

  showCreateAudience = false;
  showGroupSms = false;
  showGroupEmail = false;
  showGroupDelete = false;
  showDownloadLeads = false;
  showImportLeads = false;
  showRemoveDuplicate = false;

  private hideAllPanels() {
    this.showCreateAudience = false;
    this.showGroupSms = false;
    this.showGroupEmail = false;
    this.showGroupDelete = false;
    this.showDownloadLeads = false;
    this.showImportLeads = false;
    this.showRemoveDuplicate = false;
    this.showAdvancedSearch = false;
  }

  openCreateAudience() {
    this.hideAllPanels();
    this.showCreateAudience = true;
  }

  openGroupSms() {
    this.hideAllPanels();
    this.showGroupSms = true;
  }

  openGroupEmail() {
    this.hideAllPanels();
    this.showGroupEmail = true;
  }

  openGroupDelete() {
    this.hideAllPanels();
    this.showGroupDelete = true;
  }

  openDownloadLeads() {
    this.hideAllPanels();
    this.showDownloadLeads = true;
  }

  openImportLeads() {
    this.hideAllPanels();
    this.showImportLeads = true;
  }

  openRemoveDuplicate() {
    this.hideAllPanels();
    this.showRemoveDuplicate = true;
  }

  closeCreateAudience() {
    this.showCreateAudience = false;
  }

  closeGroupSms() {
    this.showGroupSms = false;
  }

  closeGroupEmail() {
    this.showGroupEmail = false;
  }

  closeGroupDelete() {
    this.showGroupDelete = false;
  }

  closeDownloadLeads() {
    this.showDownloadLeads = false;
  }

  closeImportLeads() {
    this.showImportLeads = false;
  }

  closeRemoveDuplicate() {
    this.showRemoveDuplicate = false;
  }

  openChangeStatus() {
    this.showChangeStatus = true;
  }

  closeChangeStatus() {
    this.showChangeStatus = false;
  }

  showChangeRequirement = false;

  openChangeRequirement() {
    this.showChangeRequirement = true;
    this.showChangeStatus = false;
  }

  showSendSms = false;
  openSendSms() {
    this.showSendSms = true;

    this.showChangeStatus = false;
    this.showChangeRequirement = false;
  }

  showSendEmail = false;

  openSendEmail() {
    this.showSendEmail = true;

    this.showChangeStatus = false;
    this.showChangeRequirement = false;
    this.showSendSms = false;
  }

  showQuickNote = false;

  openQuickNote() {
    this.showQuickNote = true;

    this.showChangeStatus = false;
    this.showChangeRequirement = false;
    this.showSendSms = false;
    this.showSendEmail = false;
  }

  showSendProposal = false;

  openSendProposal() {
    this.showSendProposal = true;

    this.showChangeStatus = false;
    this.showChangeRequirement = false;
    this.showSendSms = false;
    this.showSendEmail = false;
    this.showQuickNote = false;
  }

  showProfile() {
    this.showQuickNote = false;
    this.showChangeStatus = false;
    this.showChangeRequirement = false;
    this.showSendSms = false;
    this.showSendEmail = false;
    this.showSendProposal = false;
    this.showDeleteLead = false;
    this.showTermsConditions = false;
    this.showFollowup = false;
    this.showTransfer = false;
  }

  showDeleteLead = false;

  openDeleteLead() {
    this.showDeleteLead = true;

    this.showChangeStatus = false;
    this.showChangeRequirement = false;
    this.showSendSms = false;
    this.showSendEmail = false;
    this.showQuickNote = false;
    this.showSendProposal = false;
  }

  showTermsConditions = false;

  openTermsConditions() {
    this.showTermsConditions = true;

    this.showChangeStatus = false;
    this.showChangeRequirement = false;
    this.showSendSms = false;
    this.showSendEmail = false;
    this.showQuickNote = false;
    this.showSendProposal = false;
    this.showDeleteLead = false;
  }

  showFollowup = false;

  openFollowup() {
    this.showFollowup = true;

    this.showChangeStatus = false;
    this.showChangeRequirement = false;
    this.showSendSms = false;
    this.showSendEmail = false;
    this.showQuickNote = false;
    this.showSendProposal = false;
    this.showDeleteLead = false;
    this.showTermsConditions = false;
  }

  showTransfer = false;

  openTransfer() {
    this.showTransfer = true;

    this.showFollowup = false;
    this.showChangeStatus = false;
    this.showChangeRequirement = false;
    this.showSendSms = false;
    this.showSendEmail = false;
    this.showQuickNote = false;
    this.showSendProposal = false;
    this.showDeleteLead = false;
    this.showTermsConditions = false;
  }

  getLeadContactIds(): string[] {
    return this.leadsListRaw
      .map(lead => lead.contactId?._id || lead.contactId?.id || (typeof lead.contactId === 'string' ? lead.contactId : ''))
      .filter(id => !!id);
  }

  getLeadIds(): string[] {
    return this.leadsListRaw
      .map(lead => lead._id || lead.id)
      .filter(id => !!id);
  }
}
