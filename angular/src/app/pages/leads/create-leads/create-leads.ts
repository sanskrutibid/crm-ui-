import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
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
  }

  loadSources(): void {
    this.sourcesService.getSourceNames().subscribe({
      next: (names) => {
        if (names && names.length > 0) {
          this.sources = names;
        }
      },
      error: (err) => console.error('Error loading sources in CreateLeads:', err)
    });
  }

  loadBranches(): void {
    this.branchesService.getBranchNames().subscribe({
      next: (names) => {
        this.branches = names;
      },
      error: (err) => console.error('Error loading branches in CreateLeads:', err)
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
      score: [50], // Start in middle

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
        console.error('Failed to load contacts for leads creation:', err);
      }
    });
  }

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
    if (this.leadForm.valid) {
      const formVal = this.leadForm.value;
      
      // Convert slider range 0-100 to backend expected score range 1.0 - 5.0
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

      // If a valid 24-character hexadecimal user ID is assigned, pass it
      if (formVal.assignee && formVal.assignee.length === 24) {
        payload.assignedTo = formVal.assignee;
      }

      this.leadsService.createLead(payload).subscribe({
        next: (res) => {
          alert('Lead created successfully!');
          this.router.navigate(['/my-leads']);
        },
        error: (err) => {
          console.error('Failed to create lead:', err);
          const errMsg = err.error?.message || err.message || 'Check inputs';
          alert('Error creating lead: ' + (Array.isArray(errMsg) ? errMsg.join(', ') : errMsg));
        }
      });
    } else {
      this.leadForm.markAllAsTouched();
      console.log('Form is invalid, please fill required fields');
    }
  }

  onCancel(): void {
    this.leadForm.reset({
      scheduleDate: this.getTodayDate(),
      score: 50,
      privacyScope: 'Private'
    });
    this.currentStep = 1;
  }


  onlyLetters(event: any, field: string) {
  let value = event.target.value;

  // only A-Z + space allowed
  value = value.replace(/[^a-zA-Z\s]/g, '');

  this.leadForm.patchValue({
    [field]: value
  });
}


blockInvalidChars(event: KeyboardEvent) {
  const char = String.fromCharCode(event.keyCode);

  if (!/[a-zA-Z\s]/.test(char)) {
    event.preventDefault();
  }
}



onlyNumbers(event: any, field: string) {
  let value = event.target.value;

  value = value.replace(/[^0-9]/g, ''); // only numbers

  this.leadForm.patchValue({
    [field]: value
  });
}
}