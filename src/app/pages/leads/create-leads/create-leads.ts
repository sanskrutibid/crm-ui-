
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

  contacts: any[] = [];

  folders: string[] = [];

  sources: string[] = [];

  branches: string[] = [];

  assignees: any[] = [];

  // =========================================================
  // EDIT MODE
  // =========================================================

  isEditMode: boolean = false;
  editLeadId: string | null = null;

  // Stores the selected contact while the edit data and contact list
  // are loading asynchronously.
  private editContactId: string | null = null;
  private editContactName: string = '';

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

    // =========================================================
    // CHECK EDIT MODE
    // =========================================================

    this.activatedRoute.queryParamMap.subscribe(params => {
      const leadId = params.get('leadId');

      if (leadId) {
        this.isEditMode = true;
        this.editLeadId = leadId;

        console.log('EDIT MODE ENABLED');
        console.log('Lead ID:', this.editLeadId);

        this.loadLeadForEdit(leadId);
      } else {
        this.isEditMode = false;
        this.editLeadId = null;
      }
    });

    this.loadContacts();
    this.loadAgents();
    this.loadFolders();
    this.loadBranches();
    this.loadSources();
    this.setupAddCheckedListener();
  }

  // =========================================================
  // LOAD LEAD FOR EDIT
  // =========================================================

  loadLeadForEdit(leadId: string): void {
    /*
     * This method expects LeadsService to have:
     *
     * getLeadById(leadId)
     *
     * If your service uses another method name, only this
     * service call needs to be changed.
     */

    const service: any = this.leadsService;

    if (typeof service.getLeadById !== 'function') {
      console.error(
        'getLeadById() is not available in LeadsService.'
      );

      alert(
        'Edit mode opened, but the Lead details API is not connected.'
      );

      return;
    }

    service.getLeadById(leadId).subscribe({
      next: (res: any) => {
        console.log('Lead details received:', res);

        const lead =
          res?.data?.lead ||
          res?.data ||
          res?.lead ||
          res;

        if (!lead) {
          console.error('Lead data not found.');
          alert('Lead details not found.');
          return;
        }

        this.patchLeadForm(lead);
      },

      error: (err: any) => {
        console.error(
          'Failed to load lead for editing:',
          err
        );

        alert(
          'Failed to load lead details.'
        );
      }
    });
  }

  // =========================================================
  // PATCH LEAD FORM
  // =========================================================

  patchLeadForm(lead: any): void {
    /*
     * Handle different possible backend field names without
     * changing your existing form structure.
     */

    const contactId =
      (typeof lead.contactId === 'object'
        ? lead.contactId?.id || lead.contactId?._id
        : lead.contactId) ||
      lead.contact?.id ||
      lead.contact?._id ||
      '';

    // Keep the existing contact information so that the selected
    // customer can be restored after the contacts API finishes loading.
    this.editContactId = contactId ? String(contactId) : null;

    this.editContactName = this.getContactName(
      lead.contact ||
      lead.contactDetails ||
      lead.customer ||
      lead
    );

    const assignedTo =
      lead.assignedTo ||
      lead.assignee ||
      lead.assignedUser?.id ||
      lead.assignedUser?._id ||
      '';

    const score =
      lead.score !== undefined && lead.score !== null
        ? this.convertBackendScoreToSlider(lead.score)
        : 50;

    const privacyScope =
      lead.visibility === 'Branch'
        ? 'Branch'
        : 'Private';

    /*
     * Detect whether this lead was created with a new contact.
     */
    const isAddChecked =
      !!lead.addNewContact ||
      !!lead.isAddChecked;

    this.leadForm.patchValue({

      // Step 1
      contact: contactId,

      isAddChecked: isAddChecked,

      name:
        lead.name ||
        lead.contactName ||
        '',

      mobile:
        lead.mobile ||
        lead.phone ||
        lead.contact?.mobile ||
        lead.contact?.phone ||
        '',

      email:
        lead.email ||
        lead.contact?.email ||
        '',

      company:
        lead.company ||
        lead.contact?.company ||
        '',

      requirement:
        lead.requirement ||
        '',

      followupNote:
        lead.followupNote ||
        '',

      scheduleDate:
        this.formatDateForInput(
          lead.scheduleDate
        ) ||
        this.getTodayDate(),

      scheduleTime:
        lead.scheduleTime ||
        '14:23',

      score:
        score,

      // Step 2
      keywords:
        lead.keywords ||
        '',

      folder:
        lead.folder ||
        '',

      source:
        lead.source ||
        '',

      branch:
        lead.branch ||
        '',

      assignee:
        assignedTo,

      sendWhatsAppToAssignee:
        !!lead.sendWhatsAppToAssignee,

      sendEmailToAssignee:
        !!lead.sendEmailToAssignee,

      sendWhatsAppToCustomer:
        !!lead.sendWhatsAppToCustomer,

      sendEmailToCustomer:
        !!lead.sendEmailToCustomer,

      termsShared:
        !!lead.termsShared,

      privacyScope:
        privacyScope
    });

    /*
     * Update validators after patching the form.
     */
    const contactControl =
      this.leadForm.get('contact');

    const nameControl =
      this.leadForm.get('name');

    const mobileControl =
      this.leadForm.get('mobile');

    if (isAddChecked) {

      contactControl?.clearValidators();

      nameControl?.setValidators([
        Validators.required
      ]);

      mobileControl?.setValidators([
        Validators.required
      ]);

    } else {

      contactControl?.setValidators([
        Validators.required
      ]);

      nameControl?.clearValidators();

      mobileControl?.clearValidators();
    }

    contactControl?.updateValueAndValidity();
    nameControl?.updateValueAndValidity();
    mobileControl?.updateValueAndValidity();

    console.log(
      'Lead form populated for editing.'
    );
  }

  // =========================================================
  // CONVERT BACKEND SCORE
  // =========================================================

  convertBackendScoreToSlider(
    backendScore: number
  ): number {

    const score =
      Number(backendScore);

    if (isNaN(score)) {
      return 50;
    }

    /*
     * Backend:
     * 1.0 - 5.0
     *
     * Frontend:
     * 0 - 100
     */

    const sliderValue =
      ((score - 1) / 4) * 100;

    return Math.max(
      0,
      Math.min(
        100,
        Math.round(sliderValue)
      )
    );
  }

  // =========================================================
  // FORMAT DATE
  // =========================================================

  formatDateForInput(
    dateValue: any
  ): string {

    if (!dateValue) {
      return '';
    }

    /*
     * Already YYYY-MM-DD
     */
    if (
      typeof dateValue === 'string' &&
      /^\d{4}-\d{2}-\d{2}$/.test(dateValue)
    ) {
      return dateValue;
    }

    const date =
      new Date(dateValue);

    if (isNaN(date.getTime())) {
      return '';
    }

    const year =
      date.getFullYear();

    const month =
      String(
        date.getMonth() + 1
      ).padStart(2, '0');

    const day =
      String(
        date.getDate()
      ).padStart(2, '0');

    return `${year}-${month}-${day}`;
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
        console.error(
          'Error loading sources in CreateLeads:',
          err
        )
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
        console.error(
          'Error loading branches in CreateLeads:',
          err
        )
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

      requirement: [
        '',
        Validators.required
      ],

      followupNote: [
        '',
        Validators.required
      ],

      scheduleDate: [
        this.getTodayDate(),
        Validators.required
      ],

      scheduleTime: [
        '14:23',
        Validators.required
      ],

      score: [50],

      // Step 2
      keywords: [''],

      folder: [''],

      source: [
        '',
        Validators.required
      ],

      branch: [
        '',
        Validators.required
      ],

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
  // ADD NEW CONTACT CHECKBOX
  // =========================================================

  setupAddCheckedListener(): void {
    this.leadForm
      .get('isAddChecked')
      ?.valueChanges
      .subscribe(checked => {

        const contactControl =
          this.leadForm.get('contact');

        const nameControl =
          this.leadForm.get('name');

        const mobileControl =
          this.leadForm.get('mobile');

        if (checked) {

          contactControl?.clearValidators();

          contactControl?.setValue('');

          nameControl?.setValidators([
            Validators.required
          ]);

          mobileControl?.setValidators([
            Validators.required
          ]);

        } else {

          contactControl?.setValidators([
            Validators.required
          ]);

          nameControl?.clearValidators();

          nameControl?.setValue('');

          mobileControl?.clearValidators();

          mobileControl?.setValue('');

          this.leadForm
            .get('email')
            ?.setValue('');

          this.leadForm
            .get('company')
            ?.setValue('');
        }

        contactControl?.updateValueAndValidity();

        nameControl?.updateValueAndValidity();

        mobileControl?.updateValueAndValidity();
      });
  }

  // =========================================================
  // CONTACTS
  // =========================================================

  loadContacts(): void {
    this.contactsService
      .getContacts({
        limit: 500,
        customerType: 'Customer'
      })
      .subscribe({

        next: (res: any) => {

          const payload =
            res.data || res;

          const rawContacts =
            payload.contacts || [];

          this.contacts =
            rawContacts.map((c: any) => ({

              // Some API responses use "id" while others use "_id".
              // Keep the value that the lead form uses for selection.
              id: c.id || c._id,

              name:
                this.getContactName(c)

            }));

          // In edit mode, make sure the already saved customer is
          // automatically selected once the contacts are available.
          this.restoreEditContact();
        },

        error: (err) => {

          console.error(
            'Failed to load contacts for leads creation:',
            err
          );
        }
      });
  }

  // =========================================================
  // RESTORE CONTACT IN EDIT MODE
  // =========================================================

  getContactName(contact: any): string {
    if (!contact) {
      return '';
    }

    const fullName =
      `${
        contact.salutation
          ? contact.salutation + ' '
          : ''
      }${contact.firstName || ''} ${
        contact.lastName || ''
      }`.trim();

    return (
      fullName ||
      contact.name ||
      contact.contactName ||
      contact.customerName ||
      ''
    ).trim();
  }

  restoreEditContact(): void {
    if (!this.isEditMode || !this.leadForm) {
      return;
    }

    if (!this.editContactId && !this.editContactName) {
      return;
    }

    let selectedContact: any = null;

    // First try the saved contact ID.
    if (this.editContactId) {
      selectedContact = this.contacts.find(
        (contact: any) =>
          String(contact.id) === String(this.editContactId)
      );
    }

    // If the API returned a different ID format, fall back to
    // the customer name so the existing customer is still selected.
    if (!selectedContact && this.editContactName) {
      const savedName = this.editContactName
        .trim()
        .toLowerCase();

      selectedContact = this.contacts.find(
        (contact: any) =>
          String(contact.name || '')
            .trim()
            .toLowerCase() === savedName
      );
    }

    if (selectedContact) {
      this.leadForm
        .get('contact')
        ?.setValue(selectedContact.id, {
          emitEvent: false
        });

      console.log(
        'Edit contact automatically selected:',
        selectedContact.name
      );
    }
  }

  // =========================================================
  // AGENTS
  // =========================================================

  loadAgents(): void {
    this.authService.getAgents().subscribe({

      next: (res: any) => {

        this.assignees =
          res.data ||
          res ||
          [];
      },

      error: (err) => {

        console.error(
          'Failed to load agents for leads creation:',
          err
        );
      }
    });
  }

  // =========================================================
  // FOLDERS
  // =========================================================

  loadFolders(): void {
    this.leadsService
      .getFolders()
      .subscribe({

        next: (res: any) => {

          const payload =
            res.data ||
            res ||
            [];

          this.folders =
            payload
              .filter(
                (f: any) =>
                  f.module &&
                  f.module.toLowerCase() ===
                  'leads'
              )
              .map(
                (f: any) =>
                  f.folderName
              );
        },

        error: (err) => {

          console.error(
            'Failed to load folders for leads creation:',
            err
          );
        }
      });
  }

  // =========================================================
  // DATE
  // =========================================================

  getTodayDate(): string {

    const today =
      new Date();

    return today
      .toISOString()
      .split('T')[0];
  }

  // =========================================================
  // STEP NAVIGATION
  // =========================================================

  nextStep(): void {
    this.currentStep = 2;
  }

  prevStep(): void {
    this.currentStep = 1;
  }

  goToStep(step: number): void {
    this.currentStep = step;
  }

  // =========================================================
  // SUBMIT
  // =========================================================

  onSubmit(): void {

    if (this.leadForm.valid) {

      const formVal =
        this.leadForm.value;

      // Convert slider range 0-100 to backend expected
      // score range 1.0 - 5.0
      const scaledScore =
        1.0 +
        (formVal.score / 100) *
        4.0;

      const payload: any = {

        requirement:
          formVal.requirement,

        followupNote:
          formVal.followupNote,

        scheduleDate:
          formVal.scheduleDate,

        scheduleTime:
          formVal.scheduleTime,

        score:
          Number(
            scaledScore.toFixed(2)
          ),

        keywords:
          formVal.keywords ||
          undefined,

        folder:
          formVal.folder ||
          undefined,

        source:
          formVal.source,

        branch:
          formVal.branch,

        sendWhatsAppToAssignee:
          !!formVal.sendWhatsAppToAssignee,

        sendEmailToAssignee:
          !!formVal.sendEmailToAssignee,

        sendWhatsAppToCustomer:
          !!formVal.sendWhatsAppToCustomer,

        sendEmailToCustomer:
          !!formVal.sendEmailToCustomer,

        visibility:
          formVal.privacyScope === 'Private'
            ? 'Private'
            : 'Branch',

        termsShared:
          !!formVal.termsShared
      };

      // =====================================================
      // CONTACT
      // =====================================================

      if (formVal.isAddChecked) {

        payload.addNewContact = true;

        payload.name =
          formVal.name;

        payload.mobile =
          formVal.mobile;

        if (formVal.email) {
          payload.email =
            formVal.email;
        }

        if (formVal.company) {
          payload.company =
            formVal.company;
        }

      } else {

        payload.contactId =
          formVal.contact;
      }

      // =====================================================
      // ASSIGNEE
      // =====================================================

      if (
        formVal.assignee &&
        formVal.assignee.length === 24
      ) {

        payload.assignedTo =
          formVal.assignee;
      }

      // =====================================================
      // EDIT LEAD
      // =====================================================

      if (
        this.isEditMode &&
        this.editLeadId
      ) {

        const service: any =
          this.leadsService;

        /*
         * Use updateLead() when it exists in your
         * LeadsService.
         */

        if (
          typeof service.updateLead !==
          'function'
        ) {

          console.error(
            'updateLead() is not available in LeadsService.'
          );

          alert(
            'Update API is not available in LeadsService.'
          );

          return;
        }

        service
          .updateLead(
            this.editLeadId,
            payload
          )
          .subscribe({

            next: (res: any) => {

              console.log(
                'Lead updated successfully:',
                res
              );

              alert(
                'Lead updated successfully!'
              );

              this.router.navigate([
                '/my-leads'
              ]);
            },

            error: (err: any) => {

              console.error(
                'Failed to update lead:',
                err
              );

              const errMsg =
                err.error?.message ||
                err.message ||
                'Check inputs';

              alert(
                'Error updating lead: ' +
                (
                  Array.isArray(errMsg)
                    ? errMsg.join(', ')
                    : errMsg
                )
              );
            }
          });

        return;
      }

      // =====================================================
      // CREATE LEAD
      // =====================================================

      this.leadsService
        .createLead(payload)
        .subscribe({

          next: (res) => {

            alert(
              'Lead created successfully!'
            );

            this.router.navigate([
              '/my-leads'
            ]);
          },

          error: (err) => {

            console.error(
              'Failed to create lead:',
              err
            );

            const errMsg =
              err.error?.message ||
              err.message ||
              'Check inputs';

            alert(
              'Error creating lead: ' +
              (
                Array.isArray(errMsg)
                  ? errMsg.join(', ')
                  : errMsg
              )
            );
          }

        });

    } else {

      this.leadForm.markAllAsTouched();

      console.log(
        'Form is invalid, please fill required fields'
      );
    }
  }

  // =========================================================
  // CANCEL
  // =========================================================

  onCancel(): void {

    this.editContactId = null;
    this.editContactName = '';

    this.leadForm.reset({

      scheduleDate:
        this.getTodayDate(),

      score: 50,

      privacyScope:
        'Private'
    });

    this.currentStep = 1;
  }

  // =========================================================
  // LETTER VALIDATION
  // =========================================================

  onlyLetters(
    event: any,
    field: string
  ): void {

    let value =
      event.target.value;

    // Only A-Z + space allowed
    value =
      value.replace(
        /[^a-zA-Z\s]/g,
        ''
      );

    this.leadForm.patchValue({
      [field]: value
    });
  }

  // =========================================================
  // BLOCK INVALID CHARACTERS
  // =========================================================

  blockInvalidChars(
    event: KeyboardEvent
  ): void {

    const char =
      String.fromCharCode(
        event.keyCode
      );

    if (
      !/[a-zA-Z\s]/.test(char)
    ) {

      event.preventDefault();
    }
  }

  // =========================================================
  // NUMBER VALIDATION
  // =========================================================

  onlyNumbers(
    event: any,
    field: string
  ): void {

    let value =
      event.target.value;

    // Only numbers
    value =
      value.replace(
        /[^0-9]/g,
        ''
      );

    this.leadForm.patchValue({
      [field]: value
    });
  }
}

