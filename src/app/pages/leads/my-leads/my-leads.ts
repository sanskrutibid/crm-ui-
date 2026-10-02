import { Component, OnInit, ViewEncapsulation, inject, ChangeDetectorRef, HostListener, ElementRef } from '@angular/core';
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
import { ContactsService } from '../../contacts/contacts.service';
import { Subject, of } from 'rxjs';
import { debounceTime, distinctUntilChanged, switchMap, tap, catchError, startWith, filter, map } from 'rxjs/operators';

@Component({
  selector: 'app-my-leads',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, AdvancedSearch, CreateAudience,
    SendGroupSms, SendGroupEmail, GroupDelete, DownloadLeads, ImportLeads, RemoveDuplicate,
    ChangeStatus, ChangeRequirement, SendSms, SendEmail, QuickNote, SendProposal, DeleteLead,
    TermsConditions, Followup, TransferLeads, CustomerHistory],
  templateUrl: './my-leads.html',
  styleUrl: './my-leads.css',
  encapsulation: ViewEncapsulation.None
})
export class MyLeads implements OnInit {
  selectedLead: any | null = null;
  leadsListRaw: any[] = [];
  totalRecords: number = 0;
  todayLeadsCount: number = 0;
  showCustomerHistory: boolean = false;

  private leadsService = inject(LeadsService);
  public permissionService = inject(PermissionService);
  private cdr = inject(ChangeDetectorRef);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private elRef = inject(ElementRef);
  private contactsService = inject(ContactsService);

  // =========================================================
  // SEARCHABLE LEAD DROPDOWN (type lead name / number inside dropdown)
  // =========================================================

  leadDropdownOpen = false;
  leadSearchText = '';

  // Leads filtered by what the user typed (name / phone / email)
  get filteredLeads(): any[] {
    const term = (this.leadSearchText || '').trim().toLowerCase();
    const list = this.leadsArray;

    if (!term) {
      return list.slice(0, 50);
    }

    return list
      .filter(l =>
        [l.name, l.phone, l.email].some(v =>
          String(v || '').toLowerCase().includes(term)
        )
      )
      .slice(0, 50);
  }

  openLeadDropdown() {
    this.leadDropdownOpen = true;
  }

  closeLeadDropdown() {
    this.leadDropdownOpen = false;
  }

  onLeadSearchTyping(event: any) {
    this.leadSearchText = event.target.value || '';
    this.leadDropdownOpen = true;
    this.contactSearch$.next(this.leadSearchText);
  }

  // ---------------------------------------------------------
  // CONTACT API SEARCH (debounced, server-side)
  // ---------------------------------------------------------
  contactSearch$ = new Subject<string>();
  contactsLoading = false;
  contactResults: { id: string; name: string; phone?: string }[] = [];

  private setupContactSearch() {
    this.contactSearch$
      .pipe(
        startWith(''),
        debounceTime(300),
        map(term => (term || '').trim()),
        filter(term => term.length === 0 || term.length >= 2),
        distinctUntilChanged(),
        tap(() => { this.contactsLoading = true; }),
        switchMap(term =>
          this.contactsService
            .getContacts({ search: term, limit: 20 })
            .pipe(catchError(() => of({ contacts: [], total: 0 } as any)))
        )
      )
      .subscribe((res: any) => {
        const payload = res?.data || res;
        const raw: any[] = payload?.contacts || [];
        this.contactResults = raw.map((c: any) => ({
          id: String(c.id || c._id),
          name: this.getContactName({ contactId: c }),
          phone: this.getContactPhone({ contactId: c })
        }));
        this.contactsLoading = false;
        this.cdr.detectChanges();
      });
  }

  private leadContactId(lead: any): string {
    const c = lead?.contactId;
    if (!c) return '';
    return String(typeof c === 'string' ? c : (c._id || c.id || ''));
  }

  // Contact picked from dropdown -> open that contact's lead
  pickContact(contact: { id: string; name: string }) {
    this.leadDropdownOpen = false;
    this.leadSearchText = '';
    this.contactSearch$.next('');

    // 1) lead already loaded in the list
    const loaded = this.leadsListRaw.find(l => this.leadContactId(l) === contact.id);
    if (loaded) {
      this.selectLead(loaded.id || loaded._id);
      return;
    }

    // 2) not loaded -> ask the leads API
    this.leadsService.getOpenLeads({ search: contact.name, limit: 100 } as any).subscribe({
      next: (res: any) => {
        const payload = res?.data || res;
        const list: any[] = Array.isArray(payload?.leads)
          ? payload.leads
          : (Array.isArray(payload) ? payload : []);
        const found = list.find(l => this.leadContactId(l) === contact.id);
        if (found) {
          this.selectLead(found.id || found._id);
        } else {
          alert('No lead found for this contact');
        }
      },
      error: (err: any) => {
        console.error('Failed to search leads for contact:', err);
        alert('No lead found for this contact');
      }
    });
  }

  pickLead(lead: any) {
    this.leadDropdownOpen = false;
    this.leadSearchText = '';
    if (lead?.id || lead?._id) {
      this.selectLead(lead.id || lead._id);
    }
  }

  // Close the dropdown when the user clicks anywhere outside of it.
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event) {
    if (!this.leadDropdownOpen) {
      return;
    }
    const box = this.elRef.nativeElement.querySelector('.lead-combobox');
    if (box && !box.contains(event.target as Node)) {
      this.leadDropdownOpen = false;
    }
  }

  ngOnInit(): void {
    this.setupContactSearch();
    this.loadMyLeads();
    this.loadTodayLeadsCount();
    this.route.queryParams.subscribe(params => {
      const returnTo = params['returnTo'];
      const action = params['action'];
      if (returnTo) {
        this.selectLead(returnTo, () => {
          if (action) {
            this.triggerAction(action);
          }
        });
      }
    });
  }

  loadTodayLeadsCount(): void {
    this.leadsService.getTodayFollowup({ limit: 1 }).subscribe({
      next: (res: any) => {
        const payload = res.data || res;
        this.todayLeadsCount = payload.summary?.totalToday || 0;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Failed to load today leads count:', err);
      }
    });
  }

  loadMyLeads(): void {
    this.leadsService.getOpenLeads({ limit: 100 }).subscribe({
      next: (res: any) => {
        const payload = res.data || res;
        this.leadsListRaw = payload.leads || payload || [];
        this.totalRecords = payload.total || this.leadsListRaw.length;

        this.selectedLead = null;

        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Failed to load my open leads:', err);
      }
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

  clearSelection() {
    this.selectedLead = null;
    this.showChangeStatus = false;
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

  get leadsArray() {
    return this.leadsListRaw.map(l => this.mapLeadProperties(l));
  }

  private mapLeadProperties(lead: any): any {
    if (!lead) return null;
    const mapped = { ...lead };
    const contact = lead.contactId || {};

    mapped.name = this.getContactName(lead);
    mapped.phone = this.getContactPhone(lead);
    mapped.assignedToName = lead.assignedTo?.firstName || 'Administrator';
    mapped.assignedTo = lead.assignedTo;
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
    mapped.branch = lead.branch || contact.branch || 'Global Team';
    mapped.assignDateFormatted = lead.assignDate ? new Date(lead.assignDate).toLocaleString('en-US') : '—';

    return mapped;
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

  showAdvancedSearch = false;

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
    this.showFollowup = false;
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

  showChangeStatus = false;

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
    this.loadMyLeads();
  }

  onFollowupSaved() {
    if (this.selectedLead) {
      this.selectLead(this.selectedLead.id);
    }
    this.loadMyLeads();
    this.loadTodayLeadsCount();
  }

  onTransferCompleted() {
    // Lead is transferred, so it might change assignee/branch. Let's clear selection and reload
    this.clearSelection();
    this.loadMyLeads();
  }
}