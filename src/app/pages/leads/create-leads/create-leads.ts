import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { Subject, of } from 'rxjs';
import {
  debounceTime,
  distinctUntilChanged,
  switchMap,
  tap,
  catchError,
  startWith,
  filter,
  map,
} from 'rxjs/operators';
import { ContactsService } from '../../contacts/contacts.service';
import { LeadsService } from '../leads.service';
import { AuthService } from '../../auth/auth.service';
import { BranchesService } from '../../../services/branches.service';
import { SourcesService } from '../../../services/sources.service';

interface ContactOption {
  id: string;
  name: string;
}

@Component({
  selector: 'app-create-leads',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './create-leads.html',
  styleUrl: './create-leads.css',
})
export class CreateLeads implements OnInit {
  private branchesService = inject(BranchesService);
  private sourcesService = inject(SourcesService);

  leadForm!: FormGroup;

  currentStep: number = 1;

  contacts: ContactOption[] = [];

  folders: string[] = [];

  sources: string[] = [];

  branches: string[] = [];

  assignees: any[] = [];

  // =========================================================
  // CONTACT SEARCH (debounced, server-side)
  // =========================================================

  contactSearch$ = new Subject<string>();
  contactsLoading = false;

  // Remembers every contact we have seen so the selected one never
  // disappears from the dropdown when the search results change.
  private contactCache = new Map<string, ContactOption>();

  // =========================================================
  // MULTIPLE KEYWORDS
  // =========================================================

  keywordList: string[] = [];
  keywordInput: string = '';

  // =========================================================
  // EDIT MODE
  // =========================================================

  isEditMode: boolean = false;
  editLeadId: string | null = null;

  private editContactId: string | null = null;
  private editContactName: string = '';
  private editContactRestored = false;

  private readonly DRAFT_KEY = 'leadDraft';

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private activatedRoute: ActivatedRoute,
    private contactsService: ContactsService,
    private leadsService: LeadsService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.initForm();

    const snapshotParams = this.activatedRoute.snapshot.queryParamMap;

    // Coming back from "ADD NEW CONTACT" -> restore what the user typed.
    // Must run BEFORE the add-checkbox listener is attached.
    if (!snapshotParams.get('leadId')) {
      this.restoreDraft();
    }

    // CHECK EDIT MODE
    this.activatedRoute.queryParamMap.subscribe(params => {
      const leadId = params.get('leadId');

      if (leadId) {
        this.isEditMode = true;
        this.editLeadId = leadId;
        this.loadLeadForEdit(leadId);
      } else {
        this.isEditMode = false;
        this.editLeadId = null;
      }
    });

    this.setupContactSearch();
    this.loadAgents();
    this.loadBranches();
    this.loadSources();
    this.setupAddCheckedListener();

    // A contact was just created on the create-contact page -> select it.
    const newContactId = snapshotParams.get('newContactId');
    if (newContactId) {
      this.selectNewContact(newContactId);
    }
  }

  // =========================================================
  // CONTACT SEARCH
  // =========================================================

  private setupContactSearch(): void {
    this.contactSearch$
      .pipe(
        startWith(''), // first load -> latest 20 contacts
        debounceTime(300),
        map(term => (term || '').trim()),
        // empty (show default list) or at least 2 characters
        filter(term => term.length === 0 || term.length >= 2),
        distinctUntilChanged(),
        tap(() => (this.contactsLoading = true)),
        switchMap(term =>
          this.contactsService
            .getContacts({
              search: term,
              limit: 20,
              customerType: 'Customer'
            })
            .pipe(catchError(() => of({ contacts: [], total: 0 } as any)))
        )
      )
      .subscribe((res: any) => {
        const payload = res?.data || res;
        const raw: any[] = payload?.contacts || [];

        const list: ContactOption[] = raw.map((c: any) => ({
          id: String(c.id || c._id),
          name: this.getContactName(c)
        }));

        list.forEach(c => this.contactCache.set(c.id, c));

        // Keep the currently selected contact in the list.
        const selectedId = this.leadForm.get('contact')?.value;
        if (selectedId && !list.some(c => c.id === String(selectedId))) {
          const cached = this.contactCache.get(String(selectedId));
          if (cached) {
            list.unshift(cached);
          } else {
            this.fetchContactById(String(selectedId));
          }
        }

        this.contacts = list;
        this.contactsLoading = false;

        this.restoreEditContact();
      });
  }

  // Loads a single contact by ID and makes sure it exists in the dropdown.
  private fetchContactById(id: string, select = false): void {
    this.contactsService.getContactById(id).subscribe({
      next: (res: any) => {
        const c = res?.data || res;
        if (!c) {
          return;
        }

        const item: ContactOption = {
          id: String(c.id || c._id),
          name: this.getContactName(c)
        };

        this.contactCache.set(item.id, item);

        if (!this.contacts.some(x => x.id === item.id)) {
          this.contacts = [item, ...this.contacts];
        }

        if (select) {
          this.leadForm.get('contact')?.setValue(item.id, { emitEvent: false });
        }
      },
      error: (err) => console.error('Failed to load contact by id:', err)
    });
  }

  // =========================================================
  // ADD NEW CONTACT (separate page) + RETURN FLOW
  // =========================================================

  goToCreateContact(): void {
    const draft = {
      form: this.leadForm.getRawValue(),
      keywordList: this.keywordList,
      step: this.currentStep
    };

    sessionStorage.setItem(this.DRAFT_KEY, JSON.stringify(draft));

    this.router.navigate(['/create-contact'], {
      queryParams: { returnUrl: this.router.url }
    });
  }

  private restoreDraft(): void {
    const raw = sessionStorage.getItem(this.DRAFT_KEY);
    if (!raw) {
      return;
    }

    sessionStorage.removeItem(this.DRAFT_KEY);

    try {
      const draft = JSON.parse(raw);

      this.leadForm.patchValue(draft.form || {});
      this.keywordList = draft.keywordList || [];
      this.currentStep = draft.step || 1;

      // Validators depend on the "Add" checkbox state.
      this.applyAddCheckedState(!!this.leadForm.get('isAddChecked')?.value, false);
    } catch {
      // ignore broken draft
    }
  }

  private selectNewContact(id: string): void {
    this.contactsService.getContactById(id).subscribe({
      next: (res: any) => {
        const c = res?.data || res;
        if (!c) {
          return;
        }

        const item: ContactOption = {
          id: String(c.id || c._id),
          name: this.getContactName(c)
        };

        this.contactCache.set(item.id, item);
        this.contacts = [item, ...this.contacts.filter(x => x.id !== item.id)];

        this.leadForm.patchValue({ isAddChecked: false });
        this.leadForm.patchValue({ contact: item.id });
        this.leadForm.get('contact')?.markAsTouched();
      },
      error: (err) => console.error('Failed to load new contact:', err)
    });

    // Remove ?newContactId from the URL.
    this.router.navigate([], {
      relativeTo: this.activatedRoute,
      queryParams: { newContactId: null },
      queryParamsHandling: 'merge',
      replaceUrl: true
    });
  }

  // =========================================================
  // MULTIPLE KEYWORDS METHODS
  // =========================================================

  onKeywordInput(event: any): void {
    this.keywordInput = event.target.value;
  }

  addKeyword(): void {
    const value = this.keywordInput.trim();

    if (!value) {
      return;
    }

    const alreadyExists = this.keywordList.some(
      keyword => keyword.toLowerCase() === value.toLowerCase()
    );

    if (!alreadyExists) {
      this.keywordList.push(value);
    }

    this.keywordInput = '';

    this.syncKeywordsControl();
  }

  removeKeyword(index: number): void {
    if (index >= 0 && index < this.keywordList.length) {
      this.keywordList.splice(index, 1);
      this.syncKeywordsControl();
    }
  }

  private syncKeywordsControl(): void {
    this.leadForm
      ?.get('keywords')
      ?.setValue(this.keywordList.join(', '));
  }

  private setKeywordsFromValue(value: any): void {
    if (Array.isArray(value)) {
      this.keywordList = value
        .map((keyword: any) => String(keyword).trim())
        .filter((keyword: string) => keyword.length > 0);
    } else if (typeof value === 'string' && value.trim()) {
      this.keywordList = value
        .split(',')
        .map((keyword: string) => keyword.trim())
        .filter((keyword: string) => keyword.length > 0);
    } else {
      this.keywordList = [];
    }
  }

  // =========================================================
  // LOAD LEAD FOR EDIT
  // =========================================================

  loadLeadForEdit(leadId: string): void {
    this.leadsService.getLeadById(leadId).subscribe({
      next: (res: any) => {
        const lead =
          res?.data?.lead ||
          res?.data ||
          res?.lead ||
          res;

        if (!lead) {
          alert('Lead details not found.');
          return;
        }

        this.patchLeadForm(lead);
      },

      error: (err: any) => {
        console.error('Failed to load lead for editing:', err);
        alert('Failed to load lead details.');
      }
    });
  }

  // =========================================================
  // PATCH LEAD FORM
  // =========================================================

  patchLeadForm(lead: any): void {
    const contactId =
      (typeof lead.contactId === 'object' && lead.contactId !== null
        ? lead.contactId?.id || lead.contactId?._id
        : lead.contactId) ||
      lead.contact?.id ||
      lead.contact?._id ||
      '';

    this.editContactId = contactId ? String(contactId) : null;
    this.editContactRestored = false;

    this.editContactName = this.getContactName(
      (typeof lead.contactId === 'object' ? lead.contactId : null) ||
      lead.contact ||
      lead.contactDetails ||
      lead.customer ||
      lead
    );

    // assignedTo is populated by the backend -> it is an object.
    const assignedTo =
      lead.assignedTo?.id ||
      lead.assignedTo?._id ||
      (typeof lead.assignedTo === 'string' ? lead.assignedTo : '') ||
      lead.assignee ||
      lead.assignedUser?.id ||
      lead.assignedUser?._id ||
      '';

    // Score is stored on the same 0-100 scale as the slider.
    const score =
      lead.score !== undefined && lead.score !== null && !isNaN(Number(lead.score))
        ? Math.max(0, Math.min(100, Number(lead.score)))
        : 50;

    const privacyScope =
      lead.visibility === 'Branch'
        ? 'Branch'
        : 'Private';

    this.setKeywordsFromValue(lead.keywords);

    this.leadForm.patchValue({

      // Step 1
      contact: this.editContactId || '',

      // Add-new-contact is not available while editing.
      isAddChecked: false,

      name: '',
      mobile: '',
      email: '',
      company: '',

      requirement: lead.requirement || '',

      followupNote: lead.followupNote || '',

      scheduleDate:
        this.formatDateForInput(lead.scheduleDate) ||
        this.getTodayDate(),

      scheduleTime: lead.scheduleTime || '14:23',

      score: score,

      // Step 2
      keywords: this.keywordList.join(', '),

      source: lead.source || '',

      branch: lead.branch || '',

      assignee: assignedTo,

      sendWhatsAppToAssignee: !!lead.sendWhatsAppToAssignee,
      sendEmailToAssignee: !!lead.sendEmailToAssignee,
      sendWhatsAppToCustomer: !!lead.sendWhatsAppToCustomer,
      sendEmailToCustomer: !!lead.sendEmailToCustomer,
      termsShared: !!lead.termsShared,

      privacyScope: privacyScope
    });

    this.applyAddCheckedState(false, false);

    // Make sure the saved contact is present & selected in the dropdown.
    this.restoreEditContact();
  }

  // =========================================================
  // DATE
  // =========================================================

  formatDateForInput(dateValue: any): string {
    if (!dateValue) {
      return '';
    }

    if (
      typeof dateValue === 'string' &&
      /^\d{4}-\d{2}-\d{2}$/.test(dateValue)
    ) {
      return dateValue;
    }

    const date = new Date(dateValue);

    if (isNaN(date.getTime())) {
      return '';
    }

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
  }

  // Local date (toISOString() returns UTC and gives yesterday after midnight IST)
  getTodayDate(): string {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }

  // =========================================================
  // SOURCES
  // =========================================================

  loadSources(): void {
    this.sourcesService.getSourceNames().subscribe({
      next: (names) => {
        if (names && names.length > 0) {
          this.sources = names;
        }
      },
      error: (err) =>
        console.error('Error loading sources in CreateLeads:', err)
    });
  }

  // =========================================================
  // BRANCHES
  // =========================================================

  loadBranches(): void {
    this.branchesService.getBranchNames().subscribe({
      next: (names) => {
        this.branches = names;
      },
      error: (err) =>
        console.error('Error loading branches in CreateLeads:', err)
    });
  }

  // =========================================================
  // FORM
  // =========================================================

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

  // =========================================================
  // ADD NEW CONTACT CHECKBOX (inline)
  // =========================================================

  setupAddCheckedListener(): void {
    this.leadForm
      .get('isAddChecked')
      ?.valueChanges
      .subscribe(checked => this.applyAddCheckedState(!!checked, true));
  }

  private applyAddCheckedState(checked: boolean, resetValues: boolean): void {
    const contactControl = this.leadForm.get('contact');
    const nameControl = this.leadForm.get('name');
    const mobileControl = this.leadForm.get('mobile');

    if (checked) {
      contactControl?.clearValidators();
      if (resetValues) {
        contactControl?.setValue('');
      }

      nameControl?.setValidators([Validators.required]);
      mobileControl?.setValidators([Validators.required]);
    } else {
      contactControl?.setValidators([Validators.required]);

      nameControl?.clearValidators();
      mobileControl?.clearValidators();

      if (resetValues) {
        nameControl?.setValue('');
        mobileControl?.setValue('');
        this.leadForm.get('email')?.setValue('');
        this.leadForm.get('company')?.setValue('');
      }
    }

    contactControl?.updateValueAndValidity();
    nameControl?.updateValueAndValidity();
    mobileControl?.updateValueAndValidity();
  }

  // =========================================================
  // CONTACT NAME / RESTORE IN EDIT MODE
  // =========================================================

  getContactName(contact: any): string {
    if (!contact) {
      return '';
    }

    const fullName =
      `${contact.salutation ? contact.salutation + ' ' : ''}${contact.firstName || ''} ${contact.lastName || ''}`.trim();

    return (
      fullName ||
      contact.name ||
      contact.contactName ||
      contact.customerName ||
      ''
    ).trim();
  }

  restoreEditContact(): void {
    if (!this.isEditMode || !this.leadForm || this.editContactRestored) {
      return;
    }

    if (!this.editContactId && !this.editContactName) {
      return;
    }

    let selectedContact: ContactOption | undefined;

    if (this.editContactId) {
      selectedContact = this.contacts.find(
        c => String(c.id) === String(this.editContactId)
      );
    }

    if (!selectedContact && !this.editContactId && this.editContactName) {
      const savedName = this.editContactName.trim().toLowerCase();
      selectedContact = this.contacts.find(
        c => String(c.name || '').trim().toLowerCase() === savedName
      );
    }

    if (selectedContact) {
      this.leadForm
        .get('contact')
        ?.setValue(selectedContact.id, { emitEvent: false });
      this.editContactRestored = true;
      return;
    }

    // Not in the first 20 results -> load it directly.
    if (this.editContactId) {
      this.fetchContactById(this.editContactId, true);
      this.editContactRestored = true;
    }
  }

  // =========================================================
  // AGENTS
  // =========================================================

  loadAgents(): void {
    this.authService.getAgents().subscribe({
      next: (res: any) => {
        this.assignees = res.data || res || [];
      },
      error: (err) => {
        console.error('Failed to load agents for leads creation:', err);
      }
    });
  }

  // =========================================================
  // FOLDERS (not used anymore - Folder field removed from form)
  // =========================================================

  loadFolders(): void {
    this.leadsService.getFolders().subscribe({
      next: (res: any) => {
        const payload = res.data || res || [];

        this.folders = payload
          .filter((f: any) => f.module && f.module.toLowerCase() === 'leads')
          .map((f: any) => f.folderName);
      },
      error: (err) => {
        console.error('Failed to load folders for leads creation:', err);
      }
    });
  }

  // =========================================================
  // STEP NAVIGATION
  // =========================================================

  private readonly STEP1_FIELDS = [
    'contact',
    'name',
    'mobile',
    'requirement',
    'followupNote',
    'scheduleDate',
    'scheduleTime'
  ];

  private isStep1Valid(): boolean {
    this.STEP1_FIELDS.forEach(f => this.leadForm.get(f)?.markAsTouched());
    return !this.STEP1_FIELDS.some(f => this.leadForm.get(f)?.invalid);
  }

  nextStep(): void {
    this.goToStep(2);
  }

  prevStep(): void {
    this.currentStep = 1;
  }

  goToStep(step: number): void {
    // Moving from Step 1 to Step 2 requires a valid Step 1.
    if (step === 2 && this.currentStep === 1 && !this.isStep1Valid()) {
      return;
    }
    this.currentStep = step;
  }

  // =========================================================
  // SUBMIT
  // =========================================================

  onSubmit(): void {
    // Typed keyword but "+ Add" not clicked -> add it automatically.
    if (this.keywordInput.trim()) {
      this.addKeyword();
    }

    if (!this.leadForm.valid) {
      this.leadForm.markAllAsTouched();

      if (!this.isStep1Valid()) {
        this.currentStep = 1;
      }
      return;
    }

    const formVal = this.leadForm.value;

    const payload: any = {
      requirement: formVal.requirement,
      followupNote: formVal.followupNote,
      scheduleDate: formVal.scheduleDate,
      scheduleTime: formVal.scheduleTime,

      // Slider (0-100) is stored as-is. Backend accepts 0-100.
      score: Number(formVal.score),

      keywords: formVal.keywords || undefined,

      source: formVal.source,
      branch: formVal.branch,

      sendWhatsAppToAssignee: !!formVal.sendWhatsAppToAssignee,
      sendEmailToAssignee: !!formVal.sendEmailToAssignee,
      sendWhatsAppToCustomer: !!formVal.sendWhatsAppToCustomer,
      sendEmailToCustomer: !!formVal.sendEmailToCustomer,

      visibility: formVal.privacyScope === 'Private' ? 'Private' : 'Branch',

      termsShared: !!formVal.termsShared
    };

    // CONTACT
    if (formVal.isAddChecked && !this.isEditMode) {
      payload.addNewContact = true;
      payload.name = formVal.name;
      payload.mobile = formVal.mobile;

      if (formVal.email) {
        payload.email = formVal.email;
      }
      if (formVal.company) {
        payload.company = formVal.company;
      }
    } else {
      payload.contactId = formVal.contact;
    }

    // ASSIGNEE
    if (formVal.assignee && formVal.assignee.length === 24) {
      payload.assignedTo = formVal.assignee;
    }

    // EDIT LEAD
    if (this.isEditMode && this.editLeadId) {
      this.leadsService.updateLead(this.editLeadId, payload).subscribe({
        next: () => {
          alert('Lead updated successfully!');
          this.router.navigate(['/my-leads']);
        },
        error: (err: any) => {
          console.error('Failed to update lead:', err);
          this.showApiError('Error updating lead: ', err);
        }
      });
      return;
    }

    // CREATE LEAD
    this.leadsService.createLead(payload).subscribe({
      next: () => {
        alert('Lead created successfully!');
        this.router.navigate(['/my-leads']);
      },
      error: (err) => {
        console.error('Failed to create lead:', err);
        this.showApiError('Error creating lead: ', err);
      }
    });
  }

  private showApiError(prefix: string, err: any): void {
    const errMsg = err.error?.message || err.message || 'Check inputs';
    alert(prefix + (Array.isArray(errMsg) ? errMsg.join(', ') : errMsg));
  }

  // =========================================================
  // CANCEL
  // =========================================================

  onCancel(): void {
    this.editContactId = null;
    this.editContactName = '';
    this.editContactRestored = false;

    this.keywordList = [];
    this.keywordInput = '';

    this.leadForm.reset({
      scheduleDate: this.getTodayDate(),
      scheduleTime: '14:23',
      score: 50,
      privacyScope: 'Private',
      isAddChecked: false
    });

    this.applyAddCheckedState(false, false);

    this.currentStep = 1;
  }

  // =========================================================
  // LETTER VALIDATION
  // =========================================================

  onlyLetters(event: any, field: string): void {
    let value = event.target.value;

    // Only A-Z + space allowed
    value = value.replace(/[^a-zA-Z\s]/g, '');

    this.leadForm.patchValue({ [field]: value });
  }

  // =========================================================
  // BLOCK INVALID CHARACTERS
  // =========================================================

  blockInvalidChars(event: KeyboardEvent): void {
    // Only printable single characters are checked.
    if (event.key && event.key.length === 1 && !/[a-zA-Z\s]/.test(event.key)) {
      event.preventDefault();
    }
  }

  // =========================================================
  // NUMBER VALIDATION
  // =========================================================

  onlyNumbers(event: any, field: string): void {
    let value = event.target.value;

    // Only numbers
    value = value.replace(/[^0-9]/g, '');

    this.leadForm.patchValue({ [field]: value });
  }
}