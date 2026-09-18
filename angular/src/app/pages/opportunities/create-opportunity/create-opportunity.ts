import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { ContactsService } from '../../contacts/contacts.service';
import { OpportunitiesService } from '../opportunities.service';
import { AuthService } from '../../auth/auth.service';

@Component({
  selector: 'app-create-opportunity',
  standalone: true,
  imports: [CommonModule, FormsModule,RouterModule],
  templateUrl: './create-opportunity.html',
  styleUrl: './create-opportunity.css'
})
export class CreateOpportunity implements OnInit {
  currentStep: number = 1; 
  contacts: any[] = [];
  agents: any[] = [];
  isEditMode: boolean = false;
  opportunityId: string = '';

  // Form Model Object
  opportunityData: any = {
    customer: '',
    requestDate: '',
    estCloseDate: '',
    forType: '',
    lookingFor: '',
    budgetMin: '',
    budgetMax: '',
    areaMin: '',
    areaMax: '',
    areaUnit: 'Sq.Ft.',
    city: '',
    locality: '',
    bedroom: '',
    furnishing: '',
    transaction: '',
    purpose: '',
    propertyAge: '',
    description: '',
    internalNote: '',
    purposeStage: '',
    remark: '',
    scheduleDate: '',
    scheduleTime: '14:23',
    whereFollowup: '',
    keyword: '',
    referBy: '',
    folder: '',
    source: '',
    branch: '',
    assignee: '',
    estRevenue: 0.00,
    sendWhatsappToAssignee: false,
    sendEmailToAssignee: false,
    sendWhatsappToCustomer: false,
    sendEmailToCustomer: false,
    isPrivate: true,
    isBranch: false,
    protected: false,
    matchingAlert: false,
    termsShared: false
  };

  // Dropdown Option Lists matching your exact values
  forOptions = ['Buy', 'PG', 'Rent/Lease', 'Re-Development', 'Joint Ventures', 'Services'];
  
  lookingForOptions = [
    'Residential Apartment', 'Residential Independent House / Villa', 'Residential Independent / Builder Floor',
    'Residential Studio Apartment', 'Residential Farm House', 'Guest house/ banquet hall', 'Residential Row House',
    'Residential Twin Bungalow', 'Residential Twin Apartment', 'Residential Duplex', 'Residential Terrace',
    'Residential Penthouse', 'Residential Tenement', 'Residential Bungalow', 'Residential Triplex',
    'Residential basement', 'Residential Row Villa', 'Weekend Villa', 'Residential Building', 'Sky Villa',
    'Commercial Serviced Apartment', 'Commercial Shop', 'Commercial Showroom', 'Commercial Office/Space',
    'Commercial Time share', 'Commercial Space in Retail Mall', 'Commercial Office in Business Park',
    'Commercial Office in IT Park', 'Commercial Business centre', 'Commercial Hotel/ Resort',
    'Commercial Financial Institution', 'Commercial Medical/Hospital  Premise', 'Corporate House',
    'Commercial Institutes', 'Commercial Labor Camp', 'Commercial Chemical Zone', 'Commercial Restaurant',
    'Commercial Flat', 'Commercial Terrace Restaurant', 'Commercial Education Institutes', 'Commercial Built to Suit',
    'Home Stay', 'Commercial Multiplex', 'Commercial basement', 'Commercial bungalow', 'Co-Working Office Spaces',
    'Commercial Shop Cum Office Spaces(SCO)', 'Commercial Shop Cum Flat(SCF)', 'Commercial Booth',
    'Commercial Bay Shop', 'Commercial Building', 'PG', 'Special Economic Zone (SEZ)', 'Cloud Kitchen',
    'Institutional Building', 'Corporate Building', 'Educational Building', 'Hostels', 'Industrial Cold storage',
    'Industrial Factory', 'Industrial Manufacturing', 'Warehouse/Godown', 'Industrial Building', 'Industrial Shed/Gala',
    'Residential  Land / Plot', 'Commercial  Land / Plot', 'Industrial Land / Plot', 'Agricultural Farm/Land',
    'Transfer of Development Rights (TDR)', 'Party Plot', 'Amenity Land', 'Institutional Plot', 'Corporate Plots',
    'Open Plot', 'Villa Plot'
  ];

  areaUnits = [
    'Sq.Ft.', 'Sq.Meter', 'Grounds', 'Aankadam', 'Rood', 'Chataks', 'Guntha', 'Ares', 'Biswa', 'Acres', 
    'Perch', 'Bigha', 'Kottah', 'Hectares', 'Marla', 'Kanal', 'Cents', 'Sq. Yard', 'Kanal(CHD)', 'Marla(CHD)', 
    'Ganda', 'Lecha'
  ];

  bedrooms = [
    '1 RK', '1 BHK', '1.5 BHK', '2 BHK', '2.5 BHK', '3 BHK', '3.5 BHK', '4 BHK', '4.5 BHK', 
    '5 BHK', '5.5 BHK', '6 BHK', '6.5 BHK', '7 BHK', '7.5 BHK', '8 BHK +'
  ];

  furnishingOptions = ['Fully Furnished', 'UnFurnished', 'Semi Furnished', 'Ready to Furnished', 'Bareshell', 'Warmshell'];
  
  transactionOptions = ['New', 'Resale', 'Rent', 'Lease', 'Pre Launch', 'Pre Lease/ Pre Rented', 'Individual', 'Company', 'Distress Sale', 'Group Booking', 'Individual / Company'];
  
  purposeStageOptions = [
  { label: 'Initiated', value: '0.00' },
  { label: 'General Follow-Up', value: '25.00' },
  { label: 'Office Visits [Meeting]', value: '26.00' },
  { label: 'Inspection [Site Visit Planned]', value: '50.00' },
  { label: 'Finalization [Site Visit Completed]', value: '75.00' },
  { label: 'Completed', value: '100.00' }
];

  purposeOptions = [
    'Bank', 'Cafe', 'Cinema', 'Clinic', 'Corporate House', 'Corporate Office', 'Farm House', 'Farming', 
    'Hospital', 'Hotel', 'Investment', 'Long term investment', 'Non-Vegetarian', 'Organic Farming', 
    'Own purpose', 'Petrol Pump', 'Pharmacy', 'Restaurant', 'Retail', 'Second Home', 'Vegetarian'
  ];

  propertyAgeOptions = [
    'Under Construction', 'Less than 5 years', '5 - 10 years', '10 - 20 years', 'More than 20 years',
    'Less than 6 months', 'Less than 1 years', 'Less than 18 months', 'Less than 2 years', 'Less than 3 years',
    'New', 'Ready for Sale'
  ];

  localityOptions = [
  'Manish Nagar',
  'Dharampeth',
  'Pratap Nagar',
  'Besa',
  'Beltarodi',
  'Wardha Road',
  'Sadar',
  'Civil Lines',
  'Trimurti Nagar',
  'Narendra Nagar',
  'Laxmi Nagar',
  'Nandanvan',
  'Mahal',
  'Jaripatka',
  'Mankapur',
  'Koradi Road',
  'Friends Colony',
  'Shankar Nagar',
  'Hingna Road',
  'Omkar Nagar'
];

referByOptions = [
  'Campaigns',
  'Website Form',
  'WhatsApp',
  'Google Search'
];
folderOptions = [
  'Dhantoli Premium Folder',
  'General Folder'
];
sourceOptions = [
  'Campaigns',
  'Website Form',
  'WhatsApp',
  'Google Search',
  '99acres.com'
];
branchOptions = [
  'Global Team',
  'Nagpur Branch'
];

cityOptions = [
  'Nagpur',
  'Mumbai',
  'Pune',
  'Delhi',
  'Bangalore',
  'Hyderabad',
  'Chennai',
  'Kolkata',
  'Indore',
  'Jaipur'
];


  private contactsService = inject(ContactsService);
  private opportunitiesService = inject(OpportunitiesService);
  private authService = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  ngOnInit(): void {
    const today = this.getTodayDate();
    this.opportunityData.requestDate = today;
    this.opportunityData.scheduleDate = today;
    this.loadContacts();
    this.loadAgents();
    
    this.route.params.subscribe(params => {
      if (params['id']) {
        this.isEditMode = true;
        this.opportunityId = params['id'];
        this.loadOpportunityDetails(this.opportunityId);
      }
    });

    this.route.queryParams.subscribe(params => {
      if (params['contactId']) {
        this.opportunityData.customer = params['contactId'];
      }
    });
  }

  loadOpportunityDetails(id: string): void {
    this.opportunitiesService.getOpportunityById(id).subscribe({
      next: (res: any) => {
        const opp = res.data || res;
        this.opportunityData = {
          customer: opp.contactId?._id || opp.contactId?.id || opp.contactId || '',
          requestDate: opp.requestDate ? opp.requestDate.split('T')[0] : this.getTodayDate(),
          estCloseDate: opp.estCloseDate ? opp.estCloseDate.split('T')[0] : '',
          forType: opp.purpose || '',
          lookingFor: opp.lookingFor || '',
          budgetMin: opp.minBudget || '',
          budgetMax: opp.maxBudget || '',
          areaMin: opp.minArea || '',
          areaMax: opp.maxArea || '',
          areaUnit: opp.areaUnit || 'Sq.Ft.',
          city: opp.city || '',
          locality: opp.locality || '',
          bedroom: opp.bedroom || '',
          furnishing: opp.furnishing || '',
          transaction: opp.transaction || '',
          purpose: opp.purposePref || '',
          propertyAge: opp.propertyAge || '',
          description: opp.description || '',
          internalNote: opp.internalNote || '',
          purposeStage: opp.schedulePurpose || '',
          remark: opp.scheduleRemark || opp.remark || '',
          scheduleDate: opp.scheduleDate ? opp.scheduleDate.split('T')[0] : this.getTodayDate(),
          scheduleTime: opp.scheduleTime || '14:23',
          whereFollowup: opp.scheduleWhere || opp.whereFollowup || '',
          keyword: opp.keyword || '',
          referBy: opp.referBy || '',
          folder: opp.folder || '',
          source: opp.source || '',
          branch: opp.branch || '',
          assignee: opp.assignedTo?._id || opp.assignedTo?.id || opp.assignedTo || '',
          estRevenue: opp.estRevenue || 0,
          sendWhatsappToAssignee: !!opp.sendWhatsAppToAssignee,
          sendEmailToAssignee: !!opp.sendEmailToAssignee,
          sendWhatsappToCustomer: !!opp.sendWhatsAppToCustomer,
          sendEmailToCustomer: !!opp.sendEmailToCustomer,
          isPrivate: opp.visibility === 'Private',
          isBranch: opp.visibility === 'Branch',
          protected: opp.protected || false,
          matchingAlert: opp.matchingAlert || false,
          termsShared: opp.termsShared || false
        };
      },
      error: (err) => {
        console.error('Failed to load opportunity details:', err);
        alert('Failed to load opportunity details. Please try again.');
      }
    });
  }

  getTodayDate(): string {
    const today = new Date();
    return today.toISOString().split('T')[0];
  }

  loadContacts(): void {
    this.contactsService.getContacts({ limit: 500 }).subscribe({
      next: (res: any) => {
        const payload = res.data || res;
        this.contacts = payload.contacts || [];
      },
      error: (err) => {
        console.error('Failed to load contacts for opportunities creation:', err);
      }
    });
  }

  loadAgents(): void {
    this.authService.getAgents().subscribe({
      next: (res: any) => {
        this.agents = res.data || res;
      },
      error: (err) => {
        console.error('Failed to load agents in opportunity creation:', err);
      }
    });
  }

  // Navigation handlers
  goToStep(stepNumber: number) {
    this.currentStep = stepNumber;
  }

  nextStep() {
    if (this.currentStep < 4) this.currentStep++;
  }

  prevStep() {
    if (this.currentStep > 1) this.currentStep--;
  }

 cancelForm() {
  if (confirm("You want to cancel it?")) {

    const today = this.getTodayDate();

    this.opportunityData.customer = '';
    this.opportunityData.requestDate = today;
    this.opportunityData.scheduleDate = today;
    this.currentStep = 1;

    // Navigate to My Opportunities page
    this.router.navigate(['/my-opportunities']);
  }
}

  submitOpportunity() {
    const data = this.opportunityData;
    
    if (!data.customer) {
      alert("Please select a target customer");
      this.currentStep = 1;
      return;
    }
    if (!data.forType || !data.lookingFor) {
      alert("Please select transaction purpose and property category in Step 2");
      this.currentStep = 2;
      return;
    }
    if (!data.budgetMin || !data.budgetMax || !data.areaMin || !data.areaMax) {
      alert("Please specify budget and area ranges in Step 2");
      this.currentStep = 2;
      return;
    }
    if (!data.source || !data.branch) {
      alert("Please select lead source and branch in Step 4");
      this.currentStep = 4;
      return;
    }

    const payload: any = {
      contactId: data.customer,
      requestDate: data.requestDate,
      estCloseDate: data.estCloseDate || undefined,
      purpose: data.forType,
      lookingFor: data.lookingFor,
      minBudget: Number(data.budgetMin),
      maxBudget: Number(data.budgetMax),
      budgetUnit: 'Lacs',
      minArea: Number(data.areaMin),
      maxArea: Number(data.areaMax),
      areaUnit: data.areaUnit,
      city: data.city || 'Nagpur',
      locality: data.locality || 'Manish Nagar',
      bedroom: data.bedroom || undefined,
      furnishing: data.furnishing || undefined,
      transaction: data.transaction || undefined,
      purposePref: data.purpose || undefined,
      propertyAge: data.propertyAge || undefined,
      description: data.description || undefined,
      internalNote: data.internalNote || undefined,
      schedulePurpose: data.purposeStage || undefined,
      scheduleRemark: data.remark || undefined,
      scheduleDate: data.scheduleDate,
      scheduleTime: data.scheduleTime,
      scheduleWhere: data.whereFollowup || undefined,
      keyword: data.keyword || undefined,
      referBy: data.referBy || undefined,
      folder: data.folder || undefined,
      source: data.source,
      branch: data.branch,
      estRevenue: Number(data.estRevenue) || 0,
      sendWhatsAppToAssignee: !!data.sendWhatsappToAssignee,
      sendEmailToAssignee: !!data.sendEmailToAssignee,
      sendWhatsAppToCustomer: !!data.sendWhatsappToCustomer,
      sendEmailToCustomer: !!data.sendEmailToCustomer,
      visibility: data.isPrivate ? 'Private' : 'Branch',
      protected: !!data.protected,
      matchingAlert: !!data.matchingAlert
    };

    if (data.assignee && data.assignee.length === 24) {
      payload.assignedTo = data.assignee;
    }

    if (this.isEditMode) {
      this.opportunitiesService.updateOpportunity(this.opportunityId, payload).subscribe({
        next: (res) => {
          alert("Opportunity Successfully Updated!");
          this.router.navigate(['/my-opportunities']);
        },
        error: (err) => {
          console.error('Failed to update opportunity:', err);
          const errMsg = err.error?.message || err.message || 'Check inputs';
          alert('Error updating opportunity: ' + (Array.isArray(errMsg) ? errMsg.join(', ') : errMsg));
        }
      });
    } else {
      this.opportunitiesService.createOpportunity(payload).subscribe({
        next: (res) => {
          alert("Opportunity Successfully Created!");
          this.router.navigate(['/my-opportunities']);
        },
        error: (err) => {
          console.error('Failed to create opportunity:', err);
          const errMsg = err.error?.message || err.message || 'Check inputs';
          alert('Error creating opportunity: ' + (Array.isArray(errMsg) ? errMsg.join(', ') : errMsg));
        }
      });
    }
  }
}