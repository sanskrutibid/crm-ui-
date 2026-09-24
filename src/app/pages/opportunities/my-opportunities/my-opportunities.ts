import { PropertiesService } from '../../properties/properties.service';
import { ProjectsService } from '../../project/projects.service';
import { RequirementMatcherService } from '../../../services/requirement-matcher.service';
import { MatchingInventoryModalComponent } from '../../shared/matching-inventory-modal/matching-inventory-modal';
import { Component, OnInit, ViewEncapsulation, inject, ChangeDetectorRef, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { OpportunitiesService } from '../opportunities.service';
import { CreateAudienceAction } from '../actions/create-audience-action/create-audience-action';
import { SendGroupSmsAction } from '../actions/send-group-sms-action/send-group-sms-action';
import { SendGroupEmailAction } from '../actions/send-group-email-action/send-group-email-action';
import { GroupDeleteAction } from '../actions/group-delete-action/group-delete-action';
import { DownloadAction } from '../actions/download-action/download-action';
import { ImportOpportunityAction } from '../actions/import-opportunity-action/import-opportunity-action';
import { OpportunityFollowup } from '../actions/cards/opportunity-followup/opportunity-followup';
import { OpportunityTransfer } from '../actions/cards/opportunity-transfer/opportunity-transfer';
import { OpportunityChangeStatus } from '../actions/cards/opportunity-change-status/opportunity-change-status';
import { OpportunitySendSms } from '../actions/cards/opportunity-send-sms/opportunity-send-sms';
import { OpportunitySendEmail } from '../actions/cards/opportunity-send-email/opportunity-send-email';
import { OpportunityQuickNote } from '../actions/cards/opportunity-quick-note/opportunity-quick-note';
import { OpportunityHistory } from '../actions/cards/opportunity-history/opportunity-history';
import { OpportunityShortlistedProjects } from '../actions/cards/opportunity-shortlisted-projects/opportunity-shortlisted-projects';
import { OpportunitySiteVisits } from '../actions/cards/opportunity-site-visits/opportunity-site-visits';
import { OpportunityDelete } from '../actions/cards/opportunity-delete/opportunity-delete';
import { OpportunityAttachDocument } from '../actions/cards/opportunity-attach-document/opportunity-attach-document';
import { OpportunityTermsCondition } from '../actions/cards/opportunity-terms-condition/opportunity-terms-condition';
import { OpportunityShortlistedProperties } from '../actions/cards/opportunity-shortlisted-properties/opportunity-shortlisted-properties';

@Component({
  selector: 'app-my-opportunities',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule,
    CreateAudienceAction, SendGroupSmsAction, SendGroupEmailAction,
    GroupDeleteAction, DownloadAction, ImportOpportunityAction,OpportunityFollowup,
    OpportunityTransfer,OpportunityChangeStatus,OpportunitySendSms,OpportunitySendEmail,
    OpportunityQuickNote,OpportunityHistory,OpportunityShortlistedProjects,OpportunityShortlistedProperties,
    OpportunitySiteVisits,OpportunityDelete,OpportunityAttachDocument,OpportunityTermsCondition,
    MatchingInventoryModalComponent
  ],
  templateUrl: './my-opportunities.html',
  styleUrl: './my-opportunities.css',
  encapsulation: ViewEncapsulation.None
})
export class MyOpportunities implements OnInit {
  allPropertiesList: any[] = [];
  allProjectsList: any[] = [];
  matchingProperties: any[] = [];
  matchingProjects: any[] = [];
  totalInventoryMatches: number = 0;
  showInventoryModal: boolean = false;

  private propertiesService = inject(PropertiesService);
  private projectsService = inject(ProjectsService);
  private matcherService = inject(RequirementMatcherService);

  searchQuery: string = '';
  selectedLead: any | null = null;
  leadsListRaw: any[] = [];
  totalRecords: number = 0;
  showActions = false;
  showSortDropdown = false;
  showOrderDropdown = false;

  currentSortKey: string = 'Create Date';
  currentOrder: 'Asc' | 'Desc' = 'Desc';

  private opportunitiesService = inject(OpportunitiesService);
  private cdr = inject(ChangeDetectorRef);

  ngOnInit() {
    this.loadInventory();
    this.loadMyOpportunities();
  }

  @HostListener('document:click', ['$event'])
onDocumentClick(event: MouseEvent) {

  const target = event.target as HTMLElement;

  if (!target.closest('.action-dropdown')) {
    this.showActions = false;
  }

}

toggleActionMenu() {
  this.showActions = !this.showActions;
  console.log(this.showActions);
}
  toggleSortDropdown() {
    this.showSortDropdown = !this.showSortDropdown;
    if (this.showSortDropdown) this.showOrderDropdown = false;
  }

  toggleOrderDropdown() {
    this.showOrderDropdown = !this.showOrderDropdown;
    if (this.showOrderDropdown) this.showSortDropdown = false;
  }

  setSortBy(key: string) {
    this.currentSortKey = key;
    this.showSortDropdown = false;
    this.loadMyOpportunities();
  }

  setSortOrder(order: 'Asc' | 'Desc') {
    this.currentOrder = order;
    this.showOrderDropdown = false;
    this.loadMyOpportunities();
  }

  onSearch() {
    // client-side search is reactive via leadsList getter
  }

  loadMyOpportunities() {
    const query = {
      sortBy: this.currentSortKey,
      orderBy: this.currentOrder,
      limit: 100
    };

    this.opportunitiesService.getMyOpportunities(query).subscribe({
      next: (res: any) => {
        const payload = res.data || res;
        this.leadsListRaw = payload.opportunities || [];
        this.totalRecords = payload.totalRecords || this.leadsListRaw.length;
        // if (this.leadsListRaw.length > 0) {
        //   if (!this.selectedLead || !this.leadsListRaw.some(o => (o.id || o._id) === (this.selectedLead?.id || this.selectedLead?._id))) {
        //     this.selectLead(this.leadsListRaw[0]);
        //   }
        // } else {
        //   this.selectedLead = null;
        // }
        if (this.leadsListRaw.length > 0) {
          this.selectedLead = null;
        } else {
          this.selectedLead = null;
        }
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Failed to load my opportunities:', err);
      }
    });
  }

  selectLead(lead: any) {
    const id = lead.id || lead._id;
    this.opportunitiesService.getOpportunityById(id).subscribe({
      next: (res: any) => {
        const payload = res.data || res;
        this.selectedLead = this.mapOpportunityProperties(payload);
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Failed to get opportunity details:', err);
        this.selectedLead = this.mapOpportunityProperties(lead);
        this.cdr.detectChanges();
      }
    });
  }

  clearSelection() {
    this.selectedLead = null;
    this.showProfile();
  }

  get leadsList() {
    let list = this.leadsListRaw.map(o => this.mapOpportunityProperties(o));
    if (this.searchQuery) {
      const q = this.searchQuery.toLowerCase();
      list = list.filter(item =>
        (item.name && item.name.toLowerCase().includes(q)) ||
        (item.lookingFor && item.lookingFor.toLowerCase().includes(q)) ||
        (item.city && item.city.toLowerCase().includes(q)) ||
        (item.description && item.description.toLowerCase().includes(q))
      );
    }
    return list;
  }

  private mapOpportunityProperties(opp: any): any {
    if (!opp) return null;

    const contact = opp.contactId || {};

    return {
      ...opp,

      id: opp.id || opp._id,
      name: `${contact.salutation ? contact.salutation + ' ' : ''}${contact.firstName || ''} ${contact.lastName || ''}`.trim(),
      phone: contact.mobile || '—',

      stage: opp.schedulePurpose || opp.status || '—',
      followUpDate: `${opp.scheduleDate || ''} ${opp.scheduleTime || ''}`.trim(),

      requirements: opp.description || '—',
      interestedIn: `${opp.lookingFor || ''} for ${opp.purpose || ''}`,

      requestDate: opp.requestDate,
      estCloseDate: opp.estCloseDate,

      lookingFor: opp.lookingFor,
      purpose: opp.purpose,

      budget: `${opp.minBudget || opp.budgetMin || 0} - ${opp.maxBudget || opp.budgetMax || 0}`,

      area: `${opp.minArea || opp.areaMin || 0} - ${opp.maxArea || opp.areaMax || 0} ${opp.areaUnit || ''}`,

      city: opp.city,
      locality: opp.locality,

      bedroom: opp.bedroom,
      furnishing: opp.furnishing,
      transaction: opp.transaction,
      propertyAge: opp.propertyAge,

      description: opp.description,
      internalNote: opp.internalNote,

      remark: opp.scheduleRemark || opp.remark || '',
      whereFollowup: opp.scheduleWhere || opp.whereFollowup || '',

      source: opp.source,
      branch: opp.branch,

      assignedTo:
        opp.assignedTo?.firstName ||
        opp.assignee?.firstName ||
        'Administrator',

      estRevenue: opp.estRevenue,

      keyword: opp.keyword,
      referBy: opp.referBy,
      folder: opp.folder
    };
  }

  showCreateAudience = false;
  showSendSms = false;
  showSendEmail = false;
  showGroupTransfer = false;
  showCreateFolder = false;
  groupDeleteAction = false;
  downloadAction = false;

  openCreateAudience() {
    this.showSendSms = false;
    this.showSendEmail = false;
    this.groupDeleteAction = false;
    this.downloadAction = false;
    this.showCreateFolder = false;
    this.showGroupTransfer = false;
    this.showImportOpportunity = false;

    this.showCreateAudience = true;
  }

  hideCreateAudience() {
    this.showCreateAudience = false;
  }

  openSendSms() {
    this.showCreateAudience = false;
    this.groupDeleteAction = false;
    this.downloadAction = false;
    this.showCreateFolder = false;
    this.showGroupTransfer = false;
    this.showImportOpportunity = false;
     this.showSendEmail = false;

    this.showSendSms = true;
  }

  hideSendSms() {
    this.showSendSms = false;
  }

  openSendEmail() {
    this.showCreateAudience = false;
    this.showSendSms = false;
    this.groupDeleteAction = false;
    this.downloadAction = false;
    this.showCreateFolder = false;
    this.showGroupTransfer = false;
    this.showImportOpportunity = false;

    this.showSendEmail = true;
  }

  hideSendEmail() {

    this.showSendEmail = false;
  }

  openGroupDelete() {
    this.showCreateAudience = false;
    this.showSendSms = false;
    this.showSendEmail = false;
    this.downloadAction = false;
    this.showCreateFolder = false;
    this.showGroupTransfer = false;
    this.showImportOpportunity = false;

    this.groupDeleteAction = true;
  }

  hideGroupTransfer() {
    this.showGroupTransfer = false;
  }

  openCreateFolder() {
    this.showCreateAudience = false;
    this.showSendSms = false;
    this.showSendEmail = false;
    this.groupDeleteAction = false;
    this.downloadAction = false;
    this.showGroupTransfer = false;
    this.showImportOpportunity = false;

    this.showCreateFolder = true;
  }

  hideCreateFolder() {
    this.showCreateFolder = false;
  }

  hideGroupDelete() {
    this.groupDeleteAction = false;
  }

  openDownload() {

    this.showCreateAudience = false;
    this.showSendSms = false;
    this.showSendEmail = false;
    this.groupDeleteAction = false;
    this.showCreateFolder = false;

    this.downloadAction = true;
  }

  hideDownload() {
    this.downloadAction = false;
  }

  showImportOpportunity = false;

  openImportOpportunity() {

    this.showCreateAudience = false;
    this.showSendSms = false;
    this.showSendEmail = false;
    this.groupDeleteAction = false;
    this.downloadAction = false;
    this.showCreateFolder = false;
    this.showGroupTransfer = false;

    this.showImportOpportunity = true;
  }

  hideImportOpportunity() {
    this.showImportOpportunity = false;
  }

getOpportunityContactIds(): string[] {
  return this.leadsList
    .map(opp => opp.contactId?._id || opp.contactId?.id || (typeof opp.contactId === 'string' ? opp.contactId : ''))
    .filter(id => !!id);
}

getOpportunityIds(): string[] {
  return this.leadsList
    .map(opp => opp._id || opp.id)
    .filter(id => !!id);
}

showFollowup = false;
showTransfer = false;

openFollowup(){
    this.showTransfer = false;
    this.showFollowup = true;
}

showProfile() {

  this.showFollowup = false;
  this.showTransfer = false;
  this.showChangeStatus = false;
  this.showSendSmsopp = false;
  this.showSendEmailopp = false;
  this.showQuickNote = false;
  this.showHistory = false;
  this.showShortlistedProperties = false;
  this.showShortlistedProjects = false;
  this.showSiteVisit = false;
  this.showAttachDocument = false;
  this.showDelete = false;
  this.showTerms = false;

}

openTransfer() {

  this.showProfile();

  this.showTransfer = true;

}

showChangeStatus = false;
showSendSmsopp = false;
showSendEmailopp = false;
showQuickNote = false;
showHistory = false;
showShortlistedProperties = false;
showShortlistedProjects = false;
showSiteVisit = false;
showAttachDocument = false;
showDelete = false;
showTerms = false;

openChangeStatus() {

  this.showFollowup = false;
  this.showTransfer = false;

  this.showChangeStatus = true;

  this.showSendSmsopp = false;
  this.showSendEmailopp = false;
  this.showQuickNote = false;
  this.showHistory = false;
  this.showShortlistedProperties = false;
  this.showShortlistedProjects = false;
  this.showSiteVisit = false;
  this.showAttachDocument = false;
  this.showDelete = false;
  this.showTerms = false;

}

openSendSmsopp(){
    this.showFollowup = false;
  this.showTransfer = false;

  this.showChangeStatus = false;
this.showSendSmsopp = true;
this.showSendEmailopp = false;
this.showQuickNote = false;
this.showHistory = false;
this.showShortlistedProperties = false;
this.showShortlistedProjects = false;
this.showSiteVisit = false;
this.showAttachDocument = false;
this.showDelete = false;
this.showTerms = false;
}

openSendEmailopp(){
    this.showFollowup = false;
  this.showTransfer = false;

  this.showChangeStatus = false;

this.showSendSmsopp = false;
this.showSendEmailopp = true;
this.showQuickNote = false;
this.showHistory = false;
this.showShortlistedProperties = false;
this.showShortlistedProjects = false;
this.showSiteVisit = false;
this.showAttachDocument = false;
this.showDelete = false;
this.showTerms = false;
}

openQuickNote(){
    this.showFollowup = false;
  this.showTransfer = false;

  this.showChangeStatus = false;

this.showSendSmsopp = false;
this.showSendEmailopp = false;
this.showQuickNote = true;
this.showHistory = false;
this.showShortlistedProperties = false;
this.showShortlistedProjects = false;
this.showSiteVisit = false;
this.showAttachDocument = false;
this.showDelete = false;
this.showTerms = false;
}

openHistory(){
    this.showFollowup = false;
  this.showTransfer = false;

  this.showChangeStatus = false;

this.showSendSmsopp = false;
this.showSendEmailopp = false;
this.showQuickNote = false;
this.showHistory = true;
this.showShortlistedProperties = false;
this.showShortlistedProjects = false;
this.showSiteVisit = false;
this.showAttachDocument = false;
this.showDelete = false;
this.showTerms = false;
}

openShortlistedProperties(){
    this.showFollowup = false;
  this.showTransfer = false;

  this.showChangeStatus = false;

this.showSendSmsopp = false;
this.showSendEmailopp = false;
this.showQuickNote = false;
this.showHistory = false;
this.showShortlistedProperties = true;
this.showShortlistedProjects = false;
this.showSiteVisit = false;
this.showAttachDocument = false;
this.showDelete = false;
this.showTerms = false;
}

openShortlistedProjects(){
    this.showFollowup = false;
  this.showTransfer = false;

  this.showChangeStatus = false;

this.showSendSmsopp = false;
this.showSendEmailopp = false;
this.showQuickNote = false;
this.showHistory = false;
this.showShortlistedProperties = true;
this.showShortlistedProjects = false;
this.showSiteVisit = false;
this.showAttachDocument = false;
this.showDelete = false;
this.showTerms = false;
}

openSiteVisit(){
    this.showFollowup = false;
  this.showTransfer = false;

  this.showChangeStatus = false;

this.showSendSmsopp = false;
this.showSendEmailopp = false;
this.showQuickNote = false;
this.showHistory = false;
this.showShortlistedProperties = false;
this.showShortlistedProjects = false;
this.showSiteVisit = true;
this.showAttachDocument = false;
this.showDelete = false;
this.showTerms = false;
}

openAttachDocument(){
    this.showFollowup = false;
  this.showTransfer = false;

  this.showChangeStatus = false;

this.showSendSmsopp = false;
this.showSendEmailopp = false;
this.showQuickNote = false;
this.showHistory = false;
this.showShortlistedProperties = false;
this.showShortlistedProjects = false;
this.showSiteVisit = false;
this.showAttachDocument = true;
this.showDelete = false;
this.showTerms = false;
}

openDelete(){
    this.showFollowup = false;
  this.showTransfer = false;

  this.showChangeStatus = false;

this.showSendSmsopp = false;
this.showSendEmailopp = false;
this.showQuickNote = false;
this.showHistory = false;
this.showShortlistedProperties = false;
this.showShortlistedProjects = false;
this.showSiteVisit = false;
this.showAttachDocument = false;
this.showDelete = true;
this.showTerms = false;
}

openTerms(){
    this.showFollowup = false;
  this.showTransfer = false;

this.showChangeStatus = false;
this.showSendSmsopp = false;
this.showSendEmailopp = false;
this.showQuickNote = false;
this.showHistory = false;
this.showShortlistedProperties = false;
this.showShortlistedProjects = false;
this.showSiteVisit = false;
this.showAttachDocument = false;
this.showDelete = false;
this.showTerms = true;
}

  onFollowupSaved() {
    this.loadMyOpportunities();
    this.showProfile();
  }

  onStatusChanged() {
    if (this.selectedLead) {
      this.selectLead(this.selectedLead);
    }
    this.loadMyOpportunities();
    this.showProfile();
  }

  onTransferCompleted() {
    this.loadMyOpportunities();
    this.clearSelection();
  }

  isStarred(oppId: string): boolean {
    if (typeof window === 'undefined') return false;
    const starred = JSON.parse(localStorage.getItem('starred_opportunities') || '[]');
    return starred.includes(oppId);
  }

  toggleFavorite() {
    if (this.selectedLead && typeof window !== 'undefined') {
      const oppId = this.selectedLead.id;
      let starred = JSON.parse(localStorage.getItem('starred_opportunities') || '[]');
      if (starred.includes(oppId)) {
        starred = starred.filter((id: string) => id !== oppId);
      } else {
        starred.push(oppId);
      }
      localStorage.setItem('starred_opportunities', JSON.stringify(starred));
      this.cdr.detectChanges();
    }
  }


  loadInventory() {
    this.propertiesService.getProperties({ limit: 500 }).subscribe({
      next: (res: any) => {
        const payload = res.data || res;
        this.allPropertiesList = payload.properties || [];
        this.calculateInventoryMatches();
      },
      error: (err) => console.error('Failed to load properties:', err)
    });

    this.projectsService.getProjects({ limit: 500 }).subscribe({
      next: (res: any) => {
        const payload = res.data || res;
        this.allProjectsList = payload.projects || [];
        this.calculateInventoryMatches();
      },
      error: (err) => console.error('Failed to load projects:', err)
    });
  }

  calculateInventoryMatches() {
    if (!this.selectedLead) {
      this.matchingProperties = [];
      this.matchingProjects = [];
      this.totalInventoryMatches = 0;
      return;
    }
    const matches = this.matcherService.matchOpportunityWithInventory(this.selectedLead, this.allPropertiesList, this.allProjectsList);
    this.matchingProperties = matches.properties;
    this.matchingProjects = matches.projects;
    this.totalInventoryMatches = this.matchingProperties.length + this.matchingProjects.length;
    this.cdr.detectChanges();
  }

  openInventoryModal() {
    this.showInventoryModal = true;
  }

}