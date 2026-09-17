import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { ContactsService } from '../../contacts/contacts.service';
import { LeadsService } from '../leads.service';
import { AuthService } from '../../auth/auth.service';
import { BranchesService } from '../../../services/branches.service';
import { SourcesService } from '../../../services/sources.service';

@Component({
  selector: 'app-edit-leads',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './edit-leads.html',
  styleUrl: './edit-leads.css',
})
export class EditLeads implements OnInit {
  private branchesService = inject(BranchesService);
  private sourcesService = inject(SourcesService);
  private route = inject(ActivatedRoute);

  leadForm!: FormGroup;
  currentStep: number = 1;
  contacts: any[] = [];

  folders: string[] = [];
  sources: string[] = [];
  branches: string[] = [];
  assignees: any[] = [];

  leadId: string | null = null;
  loading = true;
  loadError = '';

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private contactsService: ContactsService,
    private leadsService: LeadsService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.initForm();
    this.loadContacts();
    this.loadAgents();
    this.loadFolders();
    this.loadBranches();
    this.loadSources();
    this.setupAddCheckedListener();

    this.route.queryParams.subscribe(params => {
      const id = params['leadId'] || params['id'];
      if (id) {
        this.leadId = id;
        this.loadLead(id);
      } else {
        this.loading = false;
        this.loadError = 'No lead specified to edit.';
      }
    });
  }

  loadLead(id: string): void {
    this.loading = true;
    this.loadError = '';

    this.leadsService.getLeadById(id).subscribe({
      next: (res: any) => {
        const lead = res.data || res;
        this.patchFormFromLead(lead);
        this.loading = false;
      },
      error: (err) => {
        console.error('Failed to load lead for edit:', err);
        this.loadError = 'Could not load this lead. Please go back and try again.';
        this.loading = false;
      }
    });
  }

  private patchFormFromLead(lead: any): void {
    const contact = lead.contactId || {};
    const contactId = contact._id || contact.id || (typeof lead.contactId === 'string' ? lead.contactId : '');

    // Backend score is stored as 1.0 - 5.0; slider works in 0-100, so convert back.
    const rawScore = typeof lead.score === 'number' ? lead.score : 3;
    const sliderScore = Math.round(((rawScore - 1.0) / 4.0) * 100);

    this.leadForm.patchValue({
      contact: contactId,
      isAddChecked: false,
      requirement: lead.requirement || '',
      followupNote: lead.followupNote || lead.nextRemark || '',
      scheduleDate: lead.scheduleDate || this.getTodayDate(),
      scheduleTime: lead.scheduleTime || '14:23',
      score: isNaN(sliderScore) ? 50 : Math.min(100, Math.max(0, sliderScore)),

      keywords: lead.keywords || '',
      folder: lead.folder || '',
      source: lead.source || '',
      branch: lead.branch || contact.branch || '',
      assignee: lead.assignedTo?._id || lead.assignedTo?.id || (typeof lead.assignedTo === 'string' ? lead.assignedTo : ''),

      sendWhatsAppToAssignee: false,
      sendEmailToAssignee: false,
      sendWhatsAppToCustomer: false,
      sendEmailToCustomer: false,
      termsShared: !!lead.termsShared,
      privacyScope: lead.visibility === 'Branch' ? 'Branch' : 'Private'
    });
  }

  loadSources(): void {
    this.sourcesService.getSourceNames().subscribe({
      next: (names) => {
        if (names && names.length > 0) {
          this.sources = names;
        }
      },
      error: (err) => console.error('Error loading sources in EditLeads:', err)
    });
  }

  loadBranches(): void {
    this.branchesService.getBranchNames().subscribe({
      next: (names) => {
        this.branches = names;
      },
      error: (err) => console.error('Error loading branches in EditLeads:', err)
    });
  }

  initForm(): void {
    this.leadForm = this.fb.group({
      // Step 1
      contact: ['', Validators.required],
      isAddChecked: [false],
      name: [''],
      mobile: [''],
      email: [''],
      company: [''],
      requirement: ['', Validators.required],
      followupNote: ['', Validators.required],
      scheduleDate: [this.getTodayDate(), Validators.required],
      scheduleTime: ['14:23', Validators.required],
      score: [50],

      // Step 2
      keywords: [''],
      folder: [''],
      source: ['', Validators.required],
      branch: ['', Validators.required],
      assignee: [''],

      sendWhatsAppToAssignee: [false],
      sendEmailToAssignee: [false],
      sendWhatsAppToCustomer: [false],
      sendEmailToCustomer: [false],
      termsShared: [false],
      privacyScope: ['Private']
    });
  }

  setupAddCheckedListener(): void {
    this.leadForm.get('isAddChecked')?.valueChanges.subscribe(checked => {
      const contactControl = this.leadForm.get('contact');
      const nameControl = this.leadForm.get('name');
      const mobileControl = this.leadForm.get('mobile');

      if (checked) {
        contactControl?.clearValidators();
        contactControl?.setValue('');
        nameControl?.setValidators([Validators.required]);
        mobileControl?.setValidators([Validators.required]);
      } else {
        contactControl?.setValidators([Validators.required]);
        nameControl?.clearValidators();
        nameControl?.setValue('');
        mobileControl?.clearValidators();
        mobileControl?.setValue('');
        this.leadForm.get('email')?.setValue('');
        this.leadForm.get('company')?.setValue('');
      }
      contactControl?.updateValueAndValidity();
      nameControl?.updateValueAndValidity();
      mobileControl?.updateValueAndValidity();
    });
  }

  loadContacts(): void {
    this.contactsService.getContacts({ limit: 500, customerType: 'Customer' }).subscribe({
      next: (res: any) => {
        const payload = res.data || res;
        const rawContacts = payload.contacts || [];
        this.contacts = rawContacts.map((c: any) => ({
          id: c.id,
          name: `${c.salutation ? c.salutation + ' ' : ''}${c.firstName} ${c.lastName || ''}`.trim()
        }));
      },
      error: (err) => {
        console.error('Failed to load contacts for lead editing:', err);
      }
    });
  }

  loadAgents(): void {
    this.authService.getAgents().subscribe({
      next: (res: any) => {
        this.assignees = res.data || res || [];
      },
      error: (err) => {
        console.error('Failed to load agents for lead editing:', err);
      }
    });
  }

  loadFolders(): void {
    this.leadsService.getFolders().subscribe({
      next: (res: any) => {
        const payload = res.data || res || [];
        this.folders = payload
          .filter((f: any) => f.module && f.module.toLowerCase() === 'leads')
          .map((f: any) => f.folderName);
      },
      error: (err) => {
        console.error('Failed to load folders for lead editing:', err);
      }
    });
  }

  getTodayDate(): string {
    const today = new Date();
    return today.toISOString().split('T')[0];
  }

  nextStep() {
    this.currentStep = 2;
  }

  prevStep() {
    this.currentStep = 1;
  }

  goToStep(step: number) {
    this.currentStep = step;
  }

  onSubmit(): void {
    if (!this.leadId) {
      console.warn('No leadId set, cannot update.');
      return;
    }

    if (this.leadForm.valid) {
      const formVal = this.leadForm.value;

      // Convert slider range 0-100 back to backend expected score range 1.0 - 5.0
      const scaledScore = 1.0 + (formVal.score / 100) * 4.0;

      const payload: any = {
        requirement: formVal.requirement,
        followupNote: formVal.followupNote,
        scheduleDate: formVal.scheduleDate,
        scheduleTime: formVal.scheduleTime,
        score: Number(scaledScore.toFixed(2)),
        keywords: formVal.keywords || undefined,
        folder: formVal.folder || undefined,
        source: formVal.source,
        branch: formVal.branch,
        sendWhatsAppToAssignee: !!formVal.sendWhatsAppToAssignee,
        sendEmailToAssignee: !!formVal.sendEmailToAssignee,
        sendWhatsAppToCustomer: !!formVal.sendWhatsAppToCustomer,
        sendEmailToCustomer: !!formVal.sendEmailToCustomer,
        visibility: formVal.privacyScope === 'Private' ? 'Private' : 'Branch',
        termsShared: !!formVal.termsShared
      };

      if (formVal.isAddChecked) {
        payload.addNewContact = true;
        payload.name = formVal.name;
        payload.mobile = formVal.mobile;
        if (formVal.email) payload.email = formVal.email;
        if (formVal.company) payload.company = formVal.company;
      } else {
        payload.contactId = formVal.contact;
      }

      if (formVal.assignee && formVal.assignee.length === 24) {
        payload.assignedTo = formVal.assignee;
      }

      // NOTE: assumes LeadsService exposes an `updateLead(id, payload)` method
      // (PATCH/PUT to your backend). Rename this call if your service uses a
      // different method name.
      this.leadsService.updateLead(this.leadId, payload).subscribe({
        next: () => {
          alert('Lead updated successfully!');
          this.router.navigate(['/all-leads'], { queryParams: { returnTo: this.leadId } });
        },
        error: (err) => {
          console.error('Failed to update lead:', err);
          const errMsg = err.error?.message || err.message || 'Check inputs';
          alert('Error updating lead: ' + (Array.isArray(errMsg) ? errMsg.join(', ') : errMsg));
        }
      });
    } else {
      this.leadForm.markAllAsTouched();
      console.log('Form is invalid, please fill required fields');
    }
  }

  onCancel(): void {
    this.router.navigate(['/all-leads'], {
      queryParams: this.leadId ? { returnTo: this.leadId } : {}
    });
  }

  onlyLetters(event: any, field: string) {
    let value = event.target.value;
    value = value.replace(/[^a-zA-Z\s]/g, '');
    this.leadForm.patchValue({ [field]: value });
  }

  blockInvalidChars(event: KeyboardEvent) {
    const char = String.fromCharCode(event.keyCode);
    if (!/[a-zA-Z\s]/.test(char)) {
      event.preventDefault();
    }
  }

  onlyNumbers(event: any, field: string) {
    let value = event.target.value;
    value = value.replace(/[^0-9]/g, '');
    this.leadForm.patchValue({ [field]: value });
  }
}