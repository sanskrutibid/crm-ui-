import { Component, OnInit, ViewEncapsulation, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { ContactsService } from '../../contacts/contacts.service';
import { LeadsService } from '../../leads/leads.service';
import { SiteVisitsService } from '../site-visits.service';
import { AuthService } from '../../auth/auth.service';
import { ProjectsService } from '../../project/projects.service';
import { PropertiesService } from '../../properties/properties.service';
import { OpportunitiesService } from '../../opportunities/opportunities.service';
import { BranchesService } from '../../../services/branches.service';
import { SourcesService } from '../../../services/sources.service';

@Component({
  selector: 'app-create-visitor',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './create-visit.html',
  styleUrl: './create-visit.css',
  encapsulation: ViewEncapsulation.None
})
export class CreateVisit implements OnInit {
  private branchesService = inject(BranchesService);
  private sourcesService = inject(SourcesService);

  currentStep = 1;
  visitForm!: FormGroup;
  contacts: any[] = [];
  leads: any[] = [];
  agents: any[] = [];
  projects: any[] = [];
  properties: any[] = [];
  latitude?: number;
  longitude?: number;
  isEditMode = false;
  visitId: string | null = null;
  imagePreview: string | null = null;
  selectedVisitorValue = '';

  sources = [
    'Campaigns',
    'Website Form',
    'WhatsApp',
    'Google Search',
    'magicbricks',
    '99acres',
    'Broker'
  ];

  branches: string[] = [];

  visitStatuses = [
    'Scheduled',
    'Completed',
    'Cancelled'
  ];

  visitTypes = [
    'Line Visit',
    'Direct Visit'
  ];

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private route: ActivatedRoute,
    private contactsService: ContactsService,
    private leadsService: LeadsService,
    private siteVisitsService: SiteVisitsService,
    private authService: AuthService,
    private projectsService: ProjectsService,
    private propertiesService: PropertiesService,
    private opportunitiesService: OpportunitiesService
  ) { }

  ngOnInit(): void {
    this.initForm();
    this.loadContacts();
    this.loadLeads();
    this.loadAgents();
    this.loadProjects();
    this.loadPropertiesList();
    this.loadBranches();
    this.loadSources();
    this.captureLocation();
    this.setupModuleListener();

    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.isEditMode = true;
        this.visitId = id;
        this.loadVisitDetails(id);
      }
    });

    this.route.queryParams.subscribe(params => {
      if (!this.isEditMode) {
        if (params['leadId']) {
          const leadId = params['leadId'];
          this.visitForm.patchValue({
            module: 'Project',
            selectedLeadId: leadId
          });
          this.selectedVisitorValue = `lead:${leadId}`;

          const selectLeadFromList = () => {
            const found = this.leads.find(l => l.id === leadId);
            if (found) {
              this.visitForm.get('visitor')?.setValue(found.name);
              return true;
            }
            return false;
          };

          if (!selectLeadFromList()) {
            this.opportunitiesService.getOpportunityById(leadId).subscribe({
              next: (oppRes: any) => {
                const opp = oppRes.data || oppRes;
                const contact = opp.contactId || {};
                const name = `${contact.salutation ? contact.salutation + ' ' : ''}${contact.firstName || ''} ${contact.lastName || ''}`.trim() || opp.name || 'Unknown Opportunity';

                if (!this.leads.some(l => l.id === leadId)) {
                  this.leads.push({ id: leadId, name: name });
                }

                this.visitForm.patchValue({
                  visitor: name,
                  source: opp.source || 'Website Form',
                  branch: opp.branch || 'Nagpur Branch',
                  assignee: opp.assignedTo?._id || opp.assignedTo?.id || opp.assignedTo || opp.assignee?._id || opp.assignee?.id || opp.assignee || ''
                });
              },
              error: () => {
                this.leadsService.getLeadById(leadId).subscribe({
                  next: (leadRes: any) => {
                    const lead = leadRes.data || leadRes;
                    const contact = lead.contactId || {};
                    const name = `${contact.salutation ? contact.salutation + ' ' : ''}${contact.firstName || ''} ${contact.lastName || ''}`.trim() || lead.name || 'Unknown Lead';

                    if (!this.leads.some(l => l.id === leadId)) {
                      this.leads.push({ id: leadId, name: name });
                    }

                    this.visitForm.patchValue({
                      visitor: name,
                      source: lead.source || 'Website Form',
                      branch: lead.branch || 'Nagpur Branch',
                      assignee: lead.assignedTo?._id || lead.assignedTo?.id || lead.assignedTo || lead.assignee?._id || lead.assignee?.id || lead.assignee || ''
                    });
                  }
                });
              }
            });
          }
        } else if (params['contactId']) {
          const contactId = params['contactId'];
          this.visitForm.patchValue({
            module: 'Project',
            selectedContactId: contactId
          });
          this.selectedVisitorValue = `contact:${contactId}`;

          const selectContactFromList = () => {
            const found = this.contacts.find(c => c.id === contactId);
            if (found) {
              this.visitForm.get('visitor')?.setValue(found.name);
              return true;
            }
            return false;
          };

          if (!selectContactFromList()) {
            this.contactsService.getContactById(contactId).subscribe({
              next: (contactRes: any) => {
                const c = contactRes.data || contactRes;
                const name = `${c.salutation ? c.salutation + ' ' : ''}${c.firstName || ''} ${c.lastName || ''}`.trim() || 'Unknown Contact';

                if (!this.contacts.some(item => item.id === contactId)) {
                  this.contacts.push({ id: contactId, name: name });
                }

                this.visitForm.patchValue({
                  visitor: name,
                  source: c.source || 'Website Form',
                  branch: c.branch || 'Nagpur Branch'
                });
              }
            });
          }
        }
      }
    });
  }

  initForm(): void {
    this.visitForm = this.fb.group({
      // Step 1: Visitor Information
      visitor: ['', Validators.required],
      module: ['Project', Validators.required],
      selectedContactId: [''],
      selectedLeadId: [''],
      visitType: ['Line Visit', Validators.required],
      siteName: [''],
      otherName: [''],
      visitDate: [this.getTodayDate(), Validators.required],
      timeIn: [this.getCurrentTime(), Validators.required],
      timeOut: [this.getCurrentTimePlus(60), Validators.required],
      remark: [''],

      // Step 2: Save & Publish
      siteManager: ['', Validators.required],
      sourcingManager: [''],
      closingManager: [''],
      source: ['Website Form', Validators.required],
      branch: ['Nagpur Branch', Validators.required],
      assignee: ['', Validators.required],
      visitStatus: ['Scheduled', Validators.required],
      sendSmsNotification: [false],
      sendEmailNotification: [false],
      isPrivate: [false],
      photograph: ['']
    });
  }

  setupModuleListener(): void {
    // When module changes, clear selected siteName
    this.visitForm.get('module')?.valueChanges.subscribe(() => {
      this.visitForm.get('siteName')?.setValue('');
    });
  }

  onVisitorSelected(value: string): void {
    this.selectedVisitorValue = value;
    if (!value) {
      this.visitForm.patchValue({
        visitor: '',
        selectedContactId: '',
        selectedLeadId: ''
      });
      return;
    }

    const [type, id] = value.split(':');
    if (type === 'contact') {
      const contact = this.contacts.find(c => c.id === id);
      this.visitForm.patchValue({
        visitor: contact ? contact.name : '',
        selectedContactId: id,
        selectedLeadId: ''
      });
    } else if (type === 'lead') {
      const lead = this.leads.find(l => l.id === id);
      this.visitForm.patchValue({
        visitor: lead ? lead.name : '',
        selectedContactId: '',
        selectedLeadId: id
      });
    }
  }

  loadBranches(): void {
    this.branchesService.getBranchNames().subscribe({
      next: (names) => {
        this.branches = names;
        if (names.length > 0 && this.visitForm) {
          const currentVal = this.visitForm.get('branch')?.value;
          if (!currentVal || currentVal === 'Nagpur Branch') {
            this.visitForm.patchValue({ branch: names[0] });
          }
        }
      },
      error: (err) => console.error('Error loading branches in CreateVisit:', err)
    });
  }

  loadContacts(): void {
    this.contactsService.getContacts({ limit: 500 }).subscribe({
      next: (res: any) => {
        const payload = res.data || res;
        const rawContacts = payload.contacts || [];
        this.contacts = rawContacts.map((c: any) => ({
          id: c.id,
          name: `${c.salutation ? c.salutation + ' ' : ''}${c.firstName} ${c.lastName || ''}`.trim()
        }));

        // Restore selectedVisitorValue or preserve dynamic selected contact
        const currentContactId = this.visitForm.get('selectedContactId')?.value || (this.selectedVisitorValue.startsWith('contact:') ? this.selectedVisitorValue.split(':')[1] : null);
        if (currentContactId) {
          if (!this.selectedVisitorValue) {
            this.selectedVisitorValue = `contact:${currentContactId}`;
          }
          const contact = this.contacts.find(c => c.id === currentContactId);
          if (contact) {
            this.visitForm.get('visitor')?.setValue(contact.name);
          } else {
            // Preserve dynamic selected contact
            const visitorName = this.visitForm.get('visitor')?.value || 'Selected Contact';
            this.contacts.push({ id: currentContactId, name: visitorName });
          }
        }
      },
      error: (err) => {
        console.error('Failed to load contacts for site visit creation:', err);
      }
    });
  }

  loadLeads(): void {
    this.leadsService.getLeads({ limit: 500 }).subscribe({
      next: (res: any) => {
        const payload = res.data || res;
        const rawLeads = payload.leads || [];
        this.leads = rawLeads.map((l: any) => {
          const contact = l.contactId || {};
          const name = contact.firstName
            ? `${contact.salutation ? contact.salutation + ' ' : ''}${contact.firstName} ${contact.lastName || ''}`.trim()
            : (l.name || 'Unknown Lead');
          return {
            id: l.id,
            name: name
          };
        });

        // Restore selectedVisitorValue or preserve dynamic selected lead/opportunity
        const currentLeadId = this.visitForm.get('selectedLeadId')?.value || (this.selectedVisitorValue.startsWith('lead:') ? this.selectedVisitorValue.split(':')[1] : null);
        if (currentLeadId) {
          if (!this.selectedVisitorValue) {
            this.selectedVisitorValue = `lead:${currentLeadId}`;
          }
          const lead = this.leads.find(l => l.id === currentLeadId);
          if (lead) {
            this.visitForm.get('visitor')?.setValue(lead.name);
          } else {
            // Preserve dynamic selected lead
            const visitorName = this.visitForm.get('visitor')?.value || 'Selected Lead';
            this.leads.push({ id: currentLeadId, name: visitorName });
          }
        }
      },
      error: (err) => {
        console.error('Failed to load leads for site visit creation:', err);
      }
    });
  }

  loadAgents(): void {
    this.authService.getAgents().subscribe({
      next: (res: any) => {
        this.agents = res.data || res;
      },
      error: (err) => {
        console.error('Failed to load agents for site visit creation:', err);
      }
    });
  }

  loadProjects(): void {
    this.projectsService.getProjects({ limit: 500 }).subscribe({
      next: (res: any) => {
        const payload = res.data || res;
        this.projects = payload.projects || payload || [];
      },
      error: (err) => {
        console.error('Failed to load projects for site visit creation:', err);
      }
    });
  }

  loadPropertiesList(): void {
    this.propertiesService.getProperties({ limit: 500 }).subscribe({
      next: (res: any) => {
        const payload = res.data || res;
        this.properties = payload.properties || payload || [];
      },
      error: (err) => {
        console.error('Failed to load properties for site visit creation:', err);
      }
    });
  }

  loadSources(): void {
    this.sourcesService.getSourceNames().subscribe({
      next: (names) => {
        if (Array.isArray(names) && names.length > 0) {
          this.sources = names;
        }
      },
      error: (err) => console.error('Error loading sources:', err)
    });
  }

  loadVisitDetails(id: string): void {
    this.siteVisitsService.getSiteVisitById(id).subscribe({
      next: (res: any) => {
        const data = res.data || res;
        if (data) {
          const contactId = data.contactId?._id || data.contactId?.id || data.contactId || '';
          const leadId = data.leadId?._id || data.leadId?.id || data.leadId || '';

          if (contactId) {
            this.selectedVisitorValue = `contact:${contactId}`;
          } else if (leadId) {
            this.selectedVisitorValue = `lead:${leadId}`;
          }

          this.visitForm.patchValue({
            visitor: data.visitor || '',
            module: data.module || 'Project',
            selectedContactId: contactId,
            selectedLeadId: leadId,
            visitType: data.visitType || 'Line Visit',
            siteName: data.siteName || '',
            otherName: data.otherName || '',
            visitDate: data.visitDate ? data.visitDate.split('T')[0] : this.getTodayDate(),
            timeIn: data.timeIn || this.getCurrentTime(),
            timeOut: data.timeOut || this.getCurrentTimePlus(60),
            remark: data.remark || '',
            siteManager: data.siteManager || '',
            sourcingManager: data.sourcingManager || '',
            closingManager: data.closingManager || '',
            source: data.source || 'Website Form',
            branch: data.branch || 'Nagpur Branch',
            assignee: data.assignee?._id || data.assignee?.id || data.assignee || '',
            visitStatus: data.visitStatus || 'Scheduled',
            sendSmsNotification: !!data.sendSmsNotification,
            sendEmailNotification: !!data.sendEmailNotification,
            isPrivate: !!data.isPrivate,
            photograph: data.photograph || ''
          });

          if (data.photograph) {
            this.imagePreview = data.photograph;
          }
        }
      },
      error: (err) => {
        console.error('Failed to load site visit details:', err);
        alert('Failed to load site visit details.');
      }
    });
  }

  captureLocation(): void {
    if (typeof window !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          this.latitude = position.coords.latitude;
          this.longitude = position.coords.longitude;
        },
        (error) => {
          console.warn('Geolocation capture failed or was denied:', error);
          this.latitude = 21.1458;
          this.longitude = 79.0882;
        }
      );
    } else {
      this.latitude = 21.1458;
      this.longitude = 79.0882;
    }
  }

  getTodayDate(): string {
    const today = new Date();
    return today.toISOString().split('T')[0];
  }

  getCurrentTime(): string {
    const now = new Date();
    const hrs = String(now.getHours()).padStart(2, '0');
    const mins = String(now.getMinutes()).padStart(2, '0');
    return `${hrs}:${mins}`;
  }

  getCurrentTimePlus(minutes: number): string {
    const now = new Date();
    now.setMinutes(now.getMinutes() + minutes);
    const hrs = String(now.getHours()).padStart(2, '0');
    const mins = String(now.getMinutes()).padStart(2, '0');
    return `${hrs}:${mins}`;
  }

  onImageSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        this.imagePreview = reader.result as string;
        this.visitForm.get('photograph')?.setValue(this.imagePreview);
      };
      reader.readAsDataURL(file);
    }
  }

  goToStep(step: number): void {
    if (step === 2 && this.visitForm.get('visitor')?.invalid) {
      this.visitForm.get('visitor')?.markAsTouched();
      return;
    }
    this.currentStep = step;
  }

  nextStep(): void {
    // Validate Step 1 fields
    const step1Controls = ['visitor', 'module', 'visitType', 'visitDate', 'timeIn', 'timeOut'];
    let step1Valid = true;
    step1Controls.forEach(ctrl => {
      const control = this.visitForm.get(ctrl);
      if (control) {
        control.markAsTouched();
        if (control.invalid) {
          step1Valid = false;
        }
      }
    });

    if (step1Valid) {
      this.currentStep = 2;
    }
  }

  prevStep(): void {
    this.currentStep = 1;
  }

  onSubmit(): void {
    if (this.visitForm.invalid) {
      this.visitForm.markAllAsTouched();
      return;
    }

    const formVal = this.visitForm.value;
    const payload = {
      ...formVal,
      latitude: this.latitude,
      longitude: this.longitude
    };

    if (this.selectedVisitorValue.startsWith('contact:')) {
      payload.contactId = payload.selectedContactId || null;
      payload.leadId = null;
    } else if (this.selectedVisitorValue.startsWith('lead:')) {
      payload.leadId = payload.selectedLeadId || null;
      payload.contactId = null;
    } else {
      payload.contactId = null;
      payload.leadId = null;
    }

    delete payload.selectedContactId;
    delete payload.selectedLeadId;

    if (this.isEditMode && this.visitId) {
      this.siteVisitsService.updateSiteVisit(this.visitId, payload).subscribe({
        next: () => {
          alert('Site Visit Updated Successfully');
          this.router.navigate(['/all-visits']);
        },
        error: (err) => {
          console.error('Failed to update site visit:', err);
          const errMsg = err.error?.message || err.message || 'Unknown error';
          alert('Error updating site visit: ' + (Array.isArray(errMsg) ? errMsg.join(', ') : errMsg));
        }
      });
    } else {
      this.siteVisitsService.createSiteVisit(payload).subscribe({
        next: () => {
          alert('Site Visit Created Successfully');
          this.router.navigate(['/all-visits']);
        },
        error: (err) => {
          console.error('Failed to create site visit:', err);
          const errMsg = err.error?.message || err.message || 'Unknown error';
          alert('Error creating site visit: ' + (Array.isArray(errMsg) ? errMsg.join(', ') : errMsg));
        }
      });
    }
  }

  onCancel(): void {
    this.router.navigate(['/all-visits']);
  }
}