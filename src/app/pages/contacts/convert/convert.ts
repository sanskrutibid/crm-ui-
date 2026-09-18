import { Component, OnInit, ViewEncapsulation, inject } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common'; 
import { FormsModule } from '@angular/forms';
import { ContactsService } from '../contacts.service';
import { LeadsService } from '../../leads/leads.service';
import { AuthService } from '../../auth/auth.service';

@Component({
  selector: 'app-convert',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule], 
  templateUrl: './convert.html',
  styleUrls: ['./convert.css'],
  encapsulation: ViewEncapsulation.None
})
export class ConvertComponent implements OnInit {
  selectedContact: any | null = null;
  contactIdFromRoute: string | null = null;
  
  isConvertMode: boolean = false;
  formStep: number = 1; 
  leadScore: number = 50; 
  
  showFolderDropdown = false;
  showSortDropdown = false;
  showOrderDropdown = false;

  contactsList: any[] = [];
  totalRecords: number = 0;
  agentsList: any[] = [];
  selectedContactIds: string[] = [];
  previousLeads: any[] = [];

  formData = {
    comment: '',
    interestedIn: '',
    scheduleDate: '2026-06-02',
    scheduleTime: '3:46pm',
    folder: 'Select',
    source: 'Unknown',
    branch: 'Global Team',
    assignedTo: 'Select',
    visibility: 'Private',
    smsToAssignee: false,
    emailToAssignee: false,
    smsToCustomer: false,
    emailToCustomer: false,
    termsShared: false
  };

  private contactsService = inject(ContactsService);
  private leadsService = inject(LeadsService);
  private authService = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  ngOnInit(): void {
    this.loadAgents();
    this.loadContacts(() => {
      this.route.paramMap.subscribe(params => {
        const id = params.get('id');
        if (id) {
          this.contactIdFromRoute = id;
          this.fetchContactDetails(id);
        } else if (this.contactsList.length > 0) {
          this.selectContact(this.contactsList[0]);
        }
      });
    });
  }

  loadAgents(): void {
    this.authService.getAgents().subscribe({
      next: (res: any) => {
        const payload = res.data || res;
        this.agentsList = payload || [];
      },
      error: (err) => {
        console.error('Failed to load agents:', err);
      }
    });
  }

  isContactSelected(id: string): boolean {
    return this.selectedContactIds.includes(id);
  }

  toggleContactSelection(id: string): void {
    if (this.selectedContactIds.includes(id)) {
      this.selectedContactIds = this.selectedContactIds.filter(item => item !== id);
    } else {
      this.selectedContactIds.push(id);
    }
  }

  loadContacts(callback?: () => void): void {
    this.contactsService.getContacts({ limit: 100 }).subscribe({
      next: (res: any) => {
        const payload = res.data || res;
        this.contactsList = payload.contacts || [];
        this.totalRecords = payload.total || this.contactsList.length;
        if (callback) callback();
      },
      error: (err) => {
        console.error('Failed to load contacts for convert sidebar:', err);
        if (callback) callback();
      }
    });
  }

  fetchContactDetails(id: string): void {
    this.contactsService.getContactById(id).subscribe({
      next: (res: any) => {
        const payload = res.data || res;
        this.selectedContact = payload;
        this.contactIdFromRoute = payload.id;
        this.loadPreviousLeads(payload.id);
      },
      error: (err) => {
        console.error('Failed to load contact details:', err);
      }
    });
  }

  loadPreviousLeads(contactId: string): void {
    this.leadsService.getConversionHistory(contactId).subscribe({
      next: (res: any) => {
        const payload = res.data || res;
        this.previousLeads = payload || [];
      },
      error: (err) => {
        console.error('Failed to load previous conversion logs:', err);
      }
    });
  }

  get selectedContactName(): string {
    return this.selectedContact ? this.getContactName(this.selectedContact) : '';
  }

  selectContact(contact: any) {
    if (typeof contact === 'string') {
      this.fetchContactDetails(contact);
    } else if (contact && contact.id) {
      this.fetchContactDetails(contact.id);
    } else {
      this.selectedContact = contact;
    }
    this.formStep = 1; 
  }

  goBackToAllContacts(): void {
    const targetId = this.contactIdFromRoute || (this.selectedContact ? this.selectedContact.id : null);
    if (targetId) {
      this.router.navigate(['/all-contacts'], { queryParams: { returnTo: targetId } });
    } else {
      this.router.navigate(['/all-contacts']);
    }
  }

  proceedToForm(): void {
    this.formStep = 2; 
  }

  cancelWorkflow(): void {
    this.formStep = 1; 
  }

  processLeadSave(): void {
    const contactIds = this.selectedContactIds.length > 0
      ? this.selectedContactIds
      : (this.selectedContact ? [this.selectedContact.id] : []);

    if (contactIds.length === 0) {
      alert('No contact selected to convert');
      return;
    }

    const payload = {
      contactIds,
      requirement: this.formData.comment || 'No requirement specified',
      interestedIn: this.formData.interestedIn || undefined,
      scheduleDate: this.formData.scheduleDate || new Date().toISOString().split('T')[0],
      scheduleTime: this.formData.scheduleTime || '12:00pm',
      folder: this.formData.folder === 'Select' ? undefined : this.formData.folder,
      source: this.formData.source || 'Unknown',
      branch: this.formData.branch || 'Global Team',
      assignedTo: this.formData.assignedTo === 'Select' ? undefined : this.formData.assignedTo,
      score: Number(this.leadScore) || 50,
      sendWhatsAppToAssignee: this.formData.smsToAssignee || false,
      sendEmailToAssignee: this.formData.emailToAssignee || false,
      sendWhatsAppToCustomer: this.formData.smsToCustomer || false,
      sendEmailToCustomer: this.formData.emailToCustomer || false,
      visibility: this.formData.visibility || 'Private',
      termsShared: this.formData.termsShared || false
    };

    this.leadsService.convertContactsToLeads(payload).subscribe({
      next: (res) => {
        alert(`${contactIds.length} contact(s) successfully converted to Lead(s)!`);
        this.goBackToAllContacts();
      },
      error: (err) => {
        console.error('Failed to convert contacts to leads:', err);
        const errMsg = err.error?.message || err.message || 'Error occurred';
        alert('Error converting contacts to leads: ' + (Array.isArray(errMsg) ? errMsg.join(', ') : errMsg));
      }
    });
  }

  onConvertLeadTrigger(contactId: string | number): void {
    if (!contactId) return;
    this.router.navigate(['/previous-leads', contactId]);
  }

  clearSelection() {
    this.selectedContact = null;
    this.contactIdFromRoute = null;
    this.previousLeads = [];
  }
  
  isStarred(contactId: string): boolean {
    if (typeof window === 'undefined') return false;
    const starred = JSON.parse(localStorage.getItem('starred_contacts') || '[]');
    return starred.includes(contactId);
  }

  toggleFavorite() {
    if (this.selectedContact && typeof window !== 'undefined') {
      const contactId = this.selectedContact.id;
      let starred = JSON.parse(localStorage.getItem('starred_contacts') || '[]');
      if (starred.includes(contactId)) {
        starred = starred.filter((id: string) => id !== contactId);
      } else {
        starred.push(contactId);
      }
      localStorage.setItem('starred_contacts', JSON.stringify(starred));
    }
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
}