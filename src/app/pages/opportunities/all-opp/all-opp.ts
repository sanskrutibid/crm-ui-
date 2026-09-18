import { Component, OnInit, ViewEncapsulation, inject, ChangeDetectorRef, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute } from '@angular/router';
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
  selector: 'app-all-opp',
  standalone: true,
      imports: [CommonModule, RouterModule, FormsModule,
      CreateAudienceAction, SendGroupSmsAction, SendGroupEmailAction,
      GroupDeleteAction, DownloadAction, ImportOpportunityAction,OpportunityFollowup,
      OpportunityTransfer,OpportunityChangeStatus,OpportunitySendSms,OpportunitySendEmail,
      OpportunityQuickNote,OpportunityHistory,OpportunityShortlistedProjects,OpportunityShortlistedProperties,
      OpportunitySiteVisits,OpportunityDelete,OpportunityAttachDocument,OpportunityTermsCondition
    ],
  templateUrl: './all-opp.html',
  styleUrl: './all-opp.css',
  encapsulation: ViewEncapsulation.None
})
export class AllOpp implements OnInit {
  searchQuery: string = '';
  selectedLead: any | null = null;
  selectedLeadId: string | null = null;

  showSortDropdown = false;
  showOrderDropdown = false;

  currentSortKey: string = 'Create Date';
  currentOrder: 'Asc' | 'Desc' = 'Desc';

  leadsListRaw: any[] = [];

  private opportunitiesService = inject(OpportunitiesService);
  private cdr = inject(ChangeDetectorRef);
  private route = inject(ActivatedRoute);

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      this.searchQuery = params['search'] || '';
      this.applyFilterAndSort();
    });
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
    this.applyFilterAndSort();
  }

  setSortOrder(order: 'Asc' | 'Desc') {
    this.currentOrder = order;
    this.showOrderDropdown = false;
    this.applyFilterAndSort();
  }

  onSearch() {
    this.applyFilterAndSort();
  }

  applyFilterAndSort() {
    // Map currentSortKey to backend expectants:
    // 'Assigned Date' / 'Create Date' / 'FollowUp Date' / 'Updated Date' / 'Name'
    const query = {
      search: this.searchQuery,
      sortBy: this.currentSortKey,
      orderBy: this.currentOrder,
      limit: 100
    };

    this.opportunitiesService.getOpportunities(query).subscribe({
      next: (res: any) => {
        const payload = res.data || res;
        this.leadsListRaw = payload.opportunities || [];
        if (this.leadsListRaw.length > 0) {
          const firstLead = this.leadsListRaw[0];
          const firstId = firstLead.id || firstLead._id;
          if (!this.selectedLeadId || !this.leadsListRaw.some(o => (o.id || o._id) === this.selectedLeadId)) {
            this.selectLead(firstLead);
          }
        } else {
          this.selectedLead = null;
          this.selectedLeadId = null;
        }
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Failed to load opportunities:', err);
      }
    });
  }

  selectLead(lead: any) {
    this.selectedLeadId = lead.id || lead._id;
    this.selectedLead = this.mapOpportunityProperties(lead);
    this.cdr.detectChanges();

    this.opportunitiesService.getOpportunityById(this.selectedLeadId!).subscribe({
      next: (res: any) => {
        const payload = res.data || res;
        this.selectedLead = this.mapOpportunityProperties(payload);
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Failed to load opportunity details:', err);
      }
    });
  }

  clearSelection() {
    this.selectedLead = null;
    this.selectedLeadId = null;
  }

  get leadsList() {
    return this.leadsListRaw.map(o => this.mapOpportunityProperties(o));
  }

  private mapOpportunityProperties(opp: any): any {
    if (!opp) return null;
    const contact = opp.contactId || {};
    
    return {
      ...opp,
      id: opp.id || opp._id,
      name: `${contact.salutation ? contact.salutation + ' ' : ''}${contact.firstName} ${contact.lastName || ''}`.trim() || opp.name || 'Unknown Customer',
      phone: contact.mobile || '—',
      createdDate: opp.createdAt ? new Date(opp.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—',
      location: `${opp.locality || contact.locality || ''}, ${opp.city || contact.city || ''}`.trim().replace(/^,|,$/g, '') || '—',
      budget: `${opp.minBudget || 0} - ${opp.maxBudget || 0} ${opp.budgetUnit || ''}`.trim(),
      area: `${opp.minArea || 0} - ${opp.maxArea || 0} ${opp.areaUnit || ''}`.trim(),
      followUpDate: `${opp.scheduleDate || ''} ${opp.scheduleTime || ''}`.trim() || '—',
      assignedTo: opp.assignedTo?.firstName || 'Administrator',
      stage: opp.schedulePurpose || opp.status || 'In Progress',
      requirements: opp.description || opp.purposePref || opp.purposePrefDetail || '—',
      interestedIn: `${opp.lookingFor || 'Property'} for ${opp.purpose || 'Buy'}`
    };
  }

  showCreateAudience = false;
showSendSms = false;
showSendEmail = false;
groupDeleteAction = false;
showCreateFolder = false;
downloadAction = false;
showImportOpportunity = false;

showFollowup = false;
showTransfer = false;
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

showActions = false;

toggleActionMenu() {
  this.showActions = !this.showActions;
}

openFollowup() {
  this.resetPages();
  this.showFollowup = true;
}

openTransfer() {
  this.resetPages();
  this.showTransfer = true;
}

openChangeStatus() {
  this.resetPages();
  this.showChangeStatus = true;
}

openSendSmsopp() {
  this.resetPages();
  this.showSendSmsopp = true;
}

openSendEmailopp() {
  this.resetPages();
  this.showSendEmailopp = true;
}

openQuickNote() {
  this.resetPages();
  this.showQuickNote = true;
}

openHistory() {
  this.resetPages();
  this.showHistory = true;
}

openShortlistedProperties() {
  this.resetPages();
  this.showShortlistedProperties = true;
}

openShortlistedProjects() {
  this.resetPages();
  this.showShortlistedProjects = true;
}

openSiteVisit() {
  this.resetPages();
  this.showSiteVisit = true;
}

openAttachDocument() {
  this.resetPages();
  this.showAttachDocument = true;
}

openDelete() {
  this.resetPages();
  this.showDelete = true;
}

openTerms() {
  this.resetPages();
  this.showTerms = true;
}

resetPages() {

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

showProfile() {
  this.resetPages();
}


  showGroupTransfer = false;

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

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    const target = event.target as HTMLElement;
    if (!target.closest('.action-dropdown')) {
      this.showActions = false;
    }
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

  onFollowupSaved() {
    this.applyFilterAndSort();
    this.showProfile();
  }

  onStatusChanged() {
    if (this.selectedLead) {
      this.selectLead(this.selectedLead);
    }
    this.applyFilterAndSort();
    this.showProfile();
  }

  onTransferCompleted() {
    this.applyFilterAndSort();
    this.clearSelection();
  }

}
