import { Component, OnInit, ViewEncapsulation, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ContactsService } from '../contacts.service';
import { AdvancedSearch } from '../../shared/advanced-search/advanced-search';
import { CreateAudience } from '../actions/create-audience/create-audience';
import { SendGroupSms } from '../actions/send-group-sms/send-group-sms';
import { SendGroupEmail } from '../actions/send-group-email/send-group-email';
import { GroupDelete } from '../actions/group-delete/group-delete';
import { DownloadContacts } from '../actions/download-contacts/download-contacts';
import { ImportContacts } from '../actions/import-contacts/import-contacts';
import { MarkDndNumbers } from '../actions/mark-dnd-numbers/mark-dnd-numbers';
import { EmailVerification } from '../actions/email-verification/email-verification';
import { MergeContacts } from '../actions/merge-contacts/merge-contacts';
import { GroupTransfer } from '../../shared/group-transfer/group-transfer';
import { CreateFolder } from '../../shared/create-folder/create-folder';
import { CustomerHistory } from '../actions/customer-history/customer-history';

@Component({
  selector: 'app-all-contacts',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, AdvancedSearch, CreateAudience, SendGroupSms, SendGroupEmail, GroupDelete, DownloadContacts, ImportContacts, MarkDndNumbers, GroupTransfer, CreateFolder, CustomerHistory],
  templateUrl: './all-contacts.html',
  styleUrl: './all-contacts.css',
  encapsulation: ViewEncapsulation.None
})
export class AllContacts implements OnInit {
  selectedContact: any | null = null;
  isConvertMode: boolean = false;
  currentStep: number = 1;
  showFolderDropdown = false;
  showSortDropdown = false;
  showOrderDropdown = false;
  showCreateAudience: boolean = false;
  showMergeContacts: boolean = false;
  showSendEmail: boolean = false;
  showGroupDelete: boolean = false;
  showImportContacts: boolean = false;
  showMarkDndNumbers: boolean = false;
  showEmailVerification: boolean = false;
  showDownload: boolean = false;
  showCreateFolder: boolean = false;
  showSendSms: boolean = false;
  rawContactsList: any[] = [];
  totalRecords: number = 0;
  searchQuery: string = '';
  sortBy: string = 'createdAt';
  sortOrder: 'asc' | 'desc' = 'desc';
  showGroupTransfer: boolean = false;
  showCustomerHistory: boolean = false;
  todayContactsCount: number = 0;
  shortlistedContactsCount: number = 0;

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private cdr: ChangeDetectorRef,
    private contactsService: ContactsService
  ) { }

  routeQueryParams: any = {};

  isActionDropdownOpen = false;

  toggleActionDropdown() {
    this.isActionDropdownOpen = !this.isActionDropdownOpen;
  }

  closeActionDropdown() {
    this.isActionDropdownOpen = false;
  }

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      this.routeQueryParams = { ...params };
      this.searchQuery = params['search'] || '';
      this.loadContacts(params);
    });
  }

  loadContacts(params?: any, callback?: () => void) {
    const query = {
      search: this.searchQuery || undefined,
      sortBy: this.sortBy,
      sortOrder: this.sortOrder,
      limit: 100,
      ...params
    };

    delete query.type;
    const returnId = query.returnTo;
    delete query.returnTo;

    this.contactsService.getContacts(query).subscribe({
      next: (res: any) => {
        const payload = res.data || res;
        this.rawContactsList = payload.contacts || [];
        this.totalRecords = payload.total || this.rawContactsList.length;
        this.todayContactsCount = payload.todayCount || 0;
        this.shortlistedContactsCount = payload.shortlistedCount || 0;
        if (returnId) {
          const found = this.rawContactsList.find(c => c.id === returnId);
          if (found) {
            this.selectContact(found);
          }
        }
        if (callback) {
          callback();
        }
      },
      error: (err) => {
        console.error('Failed to load contacts:', err);
        if (callback) {
          callback();
        }
      }
    });
  }

  get contactsList(): any[] {
    return this.rawContactsList;
  }

  selectContact(contact: any) {

    this.isActionDropdownOpen = false;
    this.closeAllPopups();
    if (typeof contact === 'string') {
      this.selectedContact = this.rawContactsList.find(c => c.id === contact) || null;
    } else if (contact && contact.id) {
      this.selectedContact = contact;
    } else {
      this.selectedContact = contact;
    }
  }

  clearSelection() {
    this.isActionDropdownOpen = false;
    this.selectedContact = null;
    this.router.navigate([], { queryParams: { returnTo: null }, queryParamsHandling: 'merge' });
  }

  isStarred(contactId: string): boolean {
    const contact = this.rawContactsList.find(c => c.id === contactId);
    if (contact) {
      return !!contact.isStarred;
    }
    if (this.selectedContact && this.selectedContact.id === contactId) {
      return !!this.selectedContact.isStarred;
    }
    return false;
  }

  toggleFavorite() {
    if (this.selectedContact) {
      const contactId = this.selectedContact.id;
      const newStarredStatus = !this.selectedContact.isStarred;
      this.contactsService.updateContact(contactId, { isStarred: newStarredStatus }).subscribe({
        next: (updatedContact: any) => {
          const payload = updatedContact.data || updatedContact;
          this.selectedContact.isStarred = payload.isStarred;
          const index = this.rawContactsList.findIndex(c => c.id === contactId);
          if (index !== -1) {
            this.rawContactsList[index].isStarred = payload.isStarred;
          }
          this.loadContacts(this.routeQueryParams);
        },
        error: (err) => {
          console.error('Failed to update favorite status:', err);
        }
      });
    }
  }

  navigateToConvert(contactId: string) {
    if (!contactId) {
      console.warn('No contact selected');
      return;
    }
    this.router.navigate(['/convert', contactId], { queryParams: { returnTo: contactId } });
  }

  navigateToEdit(contactId: string) {
    if (!contactId) {
      console.warn('No contact selected');
      return;
    }
    this.router.navigate(['/edit-contact', contactId]);
  }

  getContactName(contact: any): string {
    if (!contact) return '';
    return `${contact.salutation ? contact.salutation + ' ' : ''}${contact.firstName} ${contact.lastName || ''}`.trim();
  }

  getContactPhone(contact: any): string {
    if (!contact) return '';
    const mobile = contact.mobile || '';
    if (contact.isConfidential && mobile.length > 5) {
      return mobile.substring(0, 5) + '*******' + mobile.substring(mobile.length - 3);
    }
    return mobile;
  }

  setSortBy(field: string) {
    this.sortBy = field;
    this.loadContacts();
  }

  setSortOrder(order: 'asc' | 'desc') {
    this.sortOrder = order;
    this.loadContacts();
  }

  onSearch() {
    this.loadContacts();
  }

  get hasActiveFilters(): boolean {
    const params = this.route.snapshot.queryParams;
    const filterKeys = Object.keys(params).filter(k => !['sortBy', 'sortOrder', 'page', 'limit', 'returnTo'].includes(k));
    return filterKeys.length > 0 || !!this.searchQuery;
  }

  clearFilters() {
    this.searchQuery = '';
    this.router.navigate([], { queryParams: {} });
  }

  showAdvancedSearch = false;

  openAdvancedSearch() {
    this.router.navigate(['/advanced-search'], {
      queryParams: { type: 'contacts' }
    });
  }

  hideAdvancedSearch() {
    this.showAdvancedSearch = false;
  }

  onAdvancedSearch(event: any) {
    console.log('Advanced Search:', event);
    // Backend API call
  }

  // dropdown
  isDropdownOpen: boolean = false;


  toggleDropdown(): void {
    this.isDropdownOpen = !this.isDropdownOpen;
  }


  closeDropdown(): void {
    this.isDropdownOpen = false;
  }


  closeAllPopups() {
    this.isActionDropdownOpen = false;
    this.showAdvancedSearch = false;
    this.showCreateAudience = false;
    this.showSendSms = false;
    this.showSendEmail = false;
    this.showGroupDelete = false;
    this.showDownload = false;
    this.showImportContacts = false;
    this.showMarkDndNumbers = false;
    this.showEmailVerification = false;
    this.showMergeContacts = false;
    this.showGroupTransfer = false;
    this.showCreateFolder = false;
    this.showCustomerHistory = false;
  }

  openCustomerHistory() {
    this.closeAllPopups();
    this.showCustomerHistory = true;
  }

  hideCustomerHistory() {
    this.showCustomerHistory = false;
  }

  openCreateAudience() {
    this.selectedContact = null;
    this.closeAllPopups();
    this.showCreateAudience = true;
  }

  hideCreateAudience() {
    this.showCreateAudience = false;
  }

  openSendSms() {
    this.selectedContact = null;
    this.closeAllPopups();
    this.showSendSms = true;
  }

  hideSendSms() {
    this.showSendSms = false;
  }



  openSendEmail() {
    this.selectedContact = null;
    this.closeAllPopups();
    this.showSendEmail = true;
  }

  hideSendEmail() {
    this.showSendEmail = false;
  }

  openGroupDelete() {
    this.selectedContact = null;
    this.closeAllPopups();
    this.showGroupDelete = true;
  }

  hideGroupDelete() {
    this.showGroupDelete = false;
  }

  openDownload() {
    this.selectedContact = null;
    this.closeAllPopups();
    this.showDownload = true;
  }

  hideDownload() {
    this.showDownload = false;
  }



  openImportContacts() {
    this.selectedContact = null;
    this.closeAllPopups();
    this.showImportContacts = true;
  }

  hideImportContacts() {
    this.showImportContacts = false;
    this.loadContacts();
  }

  goToComposeMail() {
    this.router.navigate(['/compose-mail']);
  }


  openMarkDndNumbers() {
    this.selectedContact = null;
    this.closeAllPopups();
    this.showMarkDndNumbers = true;
  }

  hideMarkDndNumbers() {
    this.showMarkDndNumbers = false;
  }

  openEmailVerification() {
    this.selectedContact = null;
    this.closeAllPopups();
    this.showEmailVerification = true;
  }


  hideEmailVerification() {
    this.showEmailVerification = false;
  }

  openMergeContacts() {
    this.selectedContact = null;
    this.closeAllPopups();
    this.showMergeContacts = true;
  }


  hideMergeContacts() {
    this.showMergeContacts = false;
  }


  openGroupTransfer() {
    this.selectedContact = null;
    this.closeAllPopups();
    this.showGroupTransfer = true;
  }

  hideGroupTransfer() {
    this.showGroupTransfer = false;
  }


  openCreateFolder() {
    this.selectedContact = null;
    this.closeAllPopups();
    this.showCreateFolder = true;
  }

  hideCreateFolder() {
    this.showCreateFolder = false;
  }

  makeCall(contact: any) {
    if (!contact || !contact.mobile) {
      alert('No mobile number available');
      return;
    }
    window.open(`tel:${contact.mobile}`, '_self');
  }

  navigateToSms(contact: any) {
    if (!contact || !contact.mobile) {
      alert('No mobile number available');
      return;
    }
    const countryCode = contact.countryCode || '';
    const mobile = contact.mobile;
    const fullPhone = countryCode ? `${countryCode}${mobile}` : mobile;
    this.router.navigate(['/send-sms'], { queryParams: { mobiles: fullPhone } });
  }

  navigateToEmail(contact: any) {
    if (!contact || !contact.email) {
      alert('No email address available');
      return;
    }
    this.router.navigate(['/compose-mail'], { queryParams: { to: contact.email } });
  }

  openWhatsapp(contact: any) {
    if (!contact || !contact.mobile) {
      alert('No mobile number available');
      return;
    }
    const countryCode = contact.countryCode ? contact.countryCode.replace('+', '') : '91';
    const mobile = contact.mobile.replace(/\s+/g, '');
    const fullPhone = mobile.startsWith('+') ? mobile.replace('+', '') : (mobile.length === 10 ? countryCode + mobile : mobile);

    const name = `${contact.firstName} ${contact.lastName || ''}`.trim();
    const text = encodeURIComponent(`Hello ${name}`);
    window.open(`https://api.whatsapp.com/send?phone=${fullPhone}&text=${text}`, '_blank');
  }

}
