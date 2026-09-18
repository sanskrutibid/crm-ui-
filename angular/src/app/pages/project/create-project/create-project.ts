import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { ProjectsService } from '../projects.service';
import { ContactsService } from '../../contacts/contacts.service';
import { AuthService } from '../../auth/auth.service';
import { OpportunitiesService } from '../../opportunities/opportunities.service';

@Component({
  selector: 'app-create-project',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './create-project.html',
  styleUrl: './create-project.css'
})
export class CreateProject implements OnInit {
  currentStep: number = 1;
  mapSecureUrl!: SafeResourceUrl;

  ownerList: any[] = [];
  
  areaUnits: string[] = [
    'Sq.Ft', 'Sq.Meter', 'Grounds', 'Aankadam', 'Rood', 'Chataks', 'Guntha', 
    'Ares', 'Biswa', 'Acres', 'Perch', 'Bigha', 'Kottah', 'Hectares', 
    'Marla', 'Kanal', 'Cents', 'Sq. Yard', 'Kanal(CHD)', 'Marla(CHD)', 'Ganda', 'Lecha'
  ];

  possessionOptions: string[] = ['Immediately', 'Specify Time'];

  transactionTypes: string[] = [
    'New', 'Resale', 'Pre Launch', 'Pre Lease/ Pre Rented', 
    'Individual', 'Company', 'Distress Sale', 'Group Booking', 'Individual / Company'
  ];

  

folderList: string[] = [
  'Sales',
  'Project Leads',
  'Marketing',
  'Brokers'
];

keywordList: string[] = [
  'Premium Project',
  'Affordable Budget'
];

branchList: string[] = [
  'Main Head Office Branch'
];
cityList: string[] = [
  'Nagpur',
  'Mumbai',
  'Pune',
  'Bangalore',
  'Delhi',
  'Hyderabad',
  'Chennai',
  'Kolkata',
  'Ahmedabad',
  'Jaipur'
];
assigneeList: any[] = [
  { id: '1', name: 'Gourav Raut' },
  { id: '2', name: 'Pragati Karokar' }
];
  amenitiesList: string[] = [
    '24/7 Security', 'Activity Area', 'Air Condition', 'Air Conditioning', 'Amphitheatre', 
    'Automated Car Parking System', 'Balcony', 'Banquet Hall', 'Basket Ball Court', 'CCTV', 
    'Clubhouse', 'Community Hall', 'Conference Room', 'EV Charging Station', 'Fire Hydrant System', 
    'Garden', 'Gated Community', 'Gym', 'High Speed Elevators', 'Indoor Games', 'Jogging Track', 
    'Kids Play Area', 'Landscape Garden', 'Lift', 'Power Backup', 'Swimming Pool', 'Vastu Compliant'
  ];

  projectData = {
    projectOwner: '', // contactId
    launchDate: '2026-06-02', 
    completionDate: '2027-03-25',
    projectName: '',
    reraNumber: '',
    publicName: '',
    lockingDuration: 0,
    projectAreaValue: null,
    projectAreaUnit: 'Sq.Ft',
    possession: '',
    transactionType: '',
    developerName: '',
    description: '',
    remark: '',
    approvedCc: false,
    approvedOc: false,
    specificationText: '',
    openSpacePercent: 0.00,
    selectedAmenity: '',
    chosenAmenities: [] as string[],
    videoUrl: '',
    virtualVideoUrl: '',
    webKeywords: '',
    address: '',
    latitude: '',
    longitude: '',
    buildingPremises: '',
    city: '',
    locality: '',
    landmark: '',
    pinCode: '',
    finalKeyword: '',
    finalFolder: '',
    branch: '',
    finalAssignee: '',
    isFeatured: true,
    visibility: 'Branch',
    price: null as number | null,
    type: '',
    totalRoom: ''
  };

  lookingForOptions: string[] = [
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

  bedrooms: string[] = [
    '1 RK', '1 BHK', '1.5 BHK', '2 BHK', '2.5 BHK', '3 BHK', '3.5 BHK', '4 BHK', '4.5 BHK', 
    '5 BHK', '5.5 BHK', '6 BHK', '6.5 BHK', '7 BHK', '7.5 BHK', '8 BHK +'
  ];

  private projectsService = inject(ProjectsService);
  private contactsService = inject(ContactsService);
  private router = inject(Router);
  private sanitizer = inject(DomSanitizer);
  private authService = inject(AuthService);
  private opportunitiesService = inject(OpportunitiesService);

  agentsList: any[] = [];
  opportunitiesList: any[] = [];

  ngOnInit(): void {
    this.updateMapSource();
    this.loadContacts();
    this.loadAgents();
    this.loadOpportunities();
  }

  loadContacts(): void {
    this.contactsService.getContacts({ limit: 99999 }).subscribe({
      next: (res: any) => {
        const payload = res.data || res;
        this.ownerList = payload.contacts || [];
      },
      error: (err) => {
        console.error('Failed to load contacts for project owner dropdown:', err);
      }
    });
  }

  loadAgents(): void {
    this.authService.getAgents().subscribe({
      next: (res: any) => {
        this.agentsList = res.data || res;
      },
      error: (err) => {
        console.error('Failed to load agents for project assignee dropdown:', err);
      }
    });
  }

  loadOpportunities(): void {
    this.opportunitiesService.getOpportunities({ limit: 1000 }).subscribe({
      next: (res: any) => {
        const payload = res.data || res;
        this.opportunitiesList = payload.opportunities || [];
      },
      error: (err) => {
        console.error('Failed to load opportunities for matching:', err);
      }
    });
  }

  getMatchingOpportunitiesCount(): number {
    if (this.opportunitiesList.length === 0) return 0;
    
    return this.opportunitiesList.filter(opp => {
      // 1. City Match (Case-Insensitive)
      const projectCity = (this.projectData.city || '').trim().toLowerCase();
      const oppCity = (opp.city || '').trim().toLowerCase();
      if (projectCity && oppCity && projectCity !== oppCity) {
        return false;
      }

      // 2. Locality Match
      const projectLocality = (this.projectData.locality || '').trim().toLowerCase();
      const oppLocality = (opp.locality || '').trim().toLowerCase();
      if (projectLocality && oppLocality) {
        if (!projectLocality.includes(oppLocality) && !oppLocality.includes(projectLocality)) {
          return false;
        }
      }

      // 3. Price & Budget Match
      const projectPrice = parseFloat(this.projectData.price as any);
      if (!isNaN(projectPrice)) {
        const budgetMin = parseFloat(opp.minBudget || opp.budgetMin);
        const budgetMax = parseFloat(opp.maxBudget || opp.budgetMax);
        if (!isNaN(budgetMax) && projectPrice > budgetMax) {
          return false;
        }
        if (!isNaN(budgetMin) && projectPrice < budgetMin) {
          return false;
        }
      }

      // 4. Area Match
      const projectArea = parseFloat(this.projectData.projectAreaValue as any);
      if (!isNaN(projectArea)) {
        const areaMin = parseFloat(opp.minArea || opp.areaMin);
        const areaMax = parseFloat(opp.maxArea || opp.areaMax);
        if (!isNaN(areaMax) && projectArea > areaMax) {
          return false;
        }
        if (!isNaN(areaMin) && projectArea < areaMin) {
          return false;
        }
      }

      // 5. Type Match
      const projectType = (this.projectData.type || '').trim().toLowerCase();
      const oppType = (opp.lookingFor || '').trim().toLowerCase();
      if (projectType && oppType && projectType !== oppType) {
        return false;
      }

      // 6. BHK Match
      const projectRoom = (this.projectData.totalRoom || '').trim().toLowerCase();
      const oppRoom = (opp.bedroom || '').trim().toLowerCase();
      if (projectRoom && oppRoom && projectRoom !== oppRoom) {
        return false;
      }

      return true;
    }).length;
  }

  updateMapSource() {
    let coordinates = '21.1458,79.0882'; 
    if (this.projectData.latitude && this.projectData.longitude) {
      coordinates = `${this.projectData.latitude.trim()},${this.projectData.longitude.trim()}`;
    }
 
    const embedUrl = `https://maps.google.com/maps?q=${encodeURIComponent(coordinates)}&t=&z=15&ie=UTF8&iwloc=&output=embed`;
    this.mapSecureUrl = this.sanitizer.bypassSecurityTrustResourceUrl(embedUrl);
  }

  nextStep(): void {
    if (this.currentStep < 5) {
      this.currentStep++;
      if (this.currentStep === 4) {
        this.updateMapSource();
      }
    }
  }

  prevStep(): void {
    if (this.currentStep > 1) {
      this.currentStep--;
    }
  }

  addAmenityTag(): void {
    const selected = this.projectData.selectedAmenity;
    if (selected && !this.projectData.chosenAmenities.includes(selected)) {
      this.projectData.chosenAmenities.push(selected);
    }
    this.projectData.selectedAmenity = ''; 
  }

  removeAmenityTag(amenity: string): void {
    this.projectData.chosenAmenities = this.projectData.chosenAmenities.filter(item => item !== amenity);
  }

  cancelWizard(): void {
    if (confirm('Are you sure you want to cancel?')) {
      this.router.navigate(['/all-projects']);
    }
  }

  submitProjectForm(): void {
    if (!this.projectData.projectOwner) {
      alert('Project Owner (Contact) is required');
      return;
    }
    if (!this.projectData.launchDate) {
      alert('Launch Date is required');
      return;
    }
    if (!this.projectData.projectName) {
      alert('Project Name is required');
      return;
    }
    if (!this.projectData.city) {
      alert('City is required');
      return;
    }
    if (!this.projectData.locality) {
      alert('Locality is required');
      return;
    }

    const payload: any = {
      contactId: this.projectData.projectOwner,
      launchDate: this.projectData.launchDate,
      projectName: this.projectData.projectName,
      reraNumber: this.projectData.reraNumber || undefined,
      districtCode: this.projectData.publicName || undefined,
      lockingDuration: Number(this.projectData.lockingDuration) || 0,
      projectArea: Number(this.projectData.projectAreaValue) || undefined,
      areaUnit: this.projectData.projectAreaUnit || undefined,
      transactionType: this.projectData.transactionType || undefined,
      developerName: this.projectData.developerName || undefined,
      description: this.projectData.description || undefined,
      remark: this.projectData.remark || undefined,
      commencementCertificate: !!this.projectData.approvedCc,
      occupancyCertificate: !!this.projectData.approvedOc,
      specification: this.projectData.specificationText || undefined,
      openSpacePercentage: Number(this.projectData.openSpacePercent) || undefined,
      amenities: this.projectData.chosenAmenities || [],
      videoUrl: this.projectData.videoUrl || undefined,
      virtualVideoUrl: this.projectData.virtualVideoUrl || undefined,
      websiteKeywords: this.projectData.webKeywords || undefined,
      address: this.projectData.address || undefined,
      latitude: Number(this.projectData.latitude) || undefined,
      longitude: Number(this.projectData.longitude) || undefined,
      buildingPremises: this.projectData.buildingPremises || undefined,
      city: this.projectData.city,
      locality: this.projectData.locality,
      landmark: this.projectData.landmark || undefined,
      pinCode: this.projectData.pinCode || undefined,
      keyword: this.projectData.finalKeyword || undefined,
      folder: this.projectData.finalFolder || undefined,
      branch: this.projectData.branch || 'Global Team',
      assignedTo: this.projectData.finalAssignee || undefined,
      featuredProject: !!this.projectData.isFeatured,
      visibility: this.projectData.visibility || 'Branch',
      price: Number(this.projectData.price) || undefined,
      type: this.projectData.type || undefined,
      totalRoom: this.projectData.totalRoom || undefined
    };

    // Clean up empty fields
    Object.keys(payload).forEach(key => {
      if (payload[key] === undefined || payload[key] === '' || payload[key] === 'Select') {
        delete payload[key];
      }
    });

    this.projectsService.createProject(payload).subscribe({
      next: (res) => {
        alert('Project created successfully!');
        this.router.navigate(['/all-projects']);
      },
      error: (err) => {
        console.error('Failed to create project:', err);
        const errMsg = err.error?.message || err.message || 'Error occurred';
        alert('Error creating project: ' + (Array.isArray(errMsg) ? errMsg.join(', ') : errMsg));
      }
    });
  }
}