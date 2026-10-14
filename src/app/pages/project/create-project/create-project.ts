import { Component, OnInit, OnDestroy, inject, NgZone, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { ProjectsService } from '../projects.service';
import { ContactsService } from '../../contacts/contacts.service';
import { AuthService } from '../../auth/auth.service';
import { OpportunitiesService } from '../../opportunities/opportunities.service';
import { GoogleMapsLoaderService } from '../../../services/google-maps-loader.service';

@Component({
  selector: 'app-create-project',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './create-project.html',
  styleUrl: './create-project.css'
})
export class CreateProject implements OnInit, OnDestroy {
  currentStep: number = 1;
  mapSecureUrl!: SafeResourceUrl;
  hasSdkMap: boolean = false;

  ownerList: any[] = [];
  
  areaUnits: string[] = [
    'Sq.Ft', 'Sq.Meter', 'Grounds', 'Aankadam', 'Rood', 'Chataks', 'Guntha', 
    'Ares', 'Biswa', 'Acres', 'Perch', 'Bigha', 'Kottah', 'Hectares', 
    'Marla', 'Kanal', 'Cents', 'Sq. Yard', 'Kanal(CHD)', 'Marla(CHD)', 'Ganda', 'Lecha'
  ];

  possessionOptions: string[] = ['Immediately', 'Specify Time'];

  // Property Type dropdown options (Basic Information step)
  propertyTypeOptions: string[] = ['Commercial', 'Residential', 'Layout'];
  private lastPropertyType: string = '';

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

  projectData: any = {
    projectOwner: '', // contactId
    propertyType: '', // Commercial / Residential / Layout
    launchDate: '2026-06-02', 
    completionDate: '2027-03-25',
    projectName: '',
    reraNumber: '',
    publicName: '',
    lockingDuration: 0,
    projectAreaValue: null,
    projectAreaUnit: 'Sq.Ft',
    possession: '',
    possessionDate: '',
    transactionType: '',
    developerName: '',
    siteManager: '',
    siteManagerContact: '',
    sourcingManager: '',
    sourcingManagerContact: '',
    closingManager: '',
    closingManagerContact: '',
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
    state: '',
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
    totalRoom: '',
    // Multiple BHK configurations, each with its own base price
    bhkConfigs: [] as Array<{ bhk: string; price: number | null }>,
    images: [] as Array<{ name: string; size: string; data: string; uploadedAt: string }>,
    documents: [] as Array<{ name: string; category: string; size: string; data: string; uploadedAt: string }>,
    chosenWebKeywords: [] as string[],
    chosenFinalKeywords: [] as string[]
  };

  keywordInputText: string = '';
  finalKeywordInputText: string = '';
  selectedPresetKeyword: string = '';
  maxGalleryImagesLimit: number = 8;
  maxDocumentsLimit: number = 8;

  previewModalImage: { name: string; data: string; size?: string } | null = null;
  previewModalDoc: { name: string; category: string; data: string; size: string; isPdf: boolean; isImage: boolean; safeUrl?: SafeResourceUrl } | null = null;

  documentCategoryList: string[] = [
    'Brochure', 
    'Floor / Layout Plan', 
    'RERA Certificate', 
    'Approval Certificate', 
    'Price Sheet / Cost Sheet', 
    'Other Document'
  ];
  selectedDocCategory: string = 'Brochure';

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

  isEditMode: boolean = false;
  projectId: string | null = null;
  isSubmitting: boolean = false;

  private projectsService = inject(ProjectsService);
  private contactsService = inject(ContactsService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private sanitizer = inject(DomSanitizer);
  private authService = inject(AuthService);
  private opportunitiesService = inject(OpportunitiesService);
  private ngZone = inject(NgZone);

  agentsList: any[] = [];
  opportunitiesList: any[] = [];

  ngOnInit(): void {
    this.updateMapSource();
    this.loadContacts();
    this.loadAgents();
    this.loadOpportunities();

    this.route.queryParams.subscribe(params => {
      if (params['id']) {
        this.projectId = params['id'];
        this.isEditMode = true;
        this.loadProjectDetails(this.projectId!);
      }
    });
  }

  ngOnDestroy(): void {
    if (this.geocodeTimeout) clearTimeout(this.geocodeTimeout);
    this.destroyMap();
  }

  loadProjectDetails(id: string): void {
    this.projectsService.getProjectById(id).subscribe({
      next: (res: any) => {
        const p = res.data || res;
        if (!p) return;

        let ownerId = '';
        if (typeof p.contactId === 'object' && p.contactId) {
          ownerId = p.contactId._id || p.contactId.id || '';
        } else if (typeof p.contactId === 'string') {
          ownerId = p.contactId;
        }

        let assigneeId = '';
        if (typeof p.assignedTo === 'object' && p.assignedTo) {
          assigneeId = p.assignedTo._id || p.assignedTo.id || '';
        } else if (typeof p.assignedTo === 'string') {
          assigneeId = p.assignedTo;
        }

        let possessionStr = p.possession || '';
        let possDateStr = p.possessionDate ? p.possessionDate.split('T')[0] : '';
        if (possessionStr.startsWith('Specify Time')) {
          const match = possessionStr.match(/\(([^)]+)\)/);
          if (match && match[1]) {
            possDateStr = match[1];
          }
          possessionStr = 'Specify Time';
        }

        const webKw = p.websiteKeywords || '';
        const finalKw = p.keyword || '';

        // Load saved BHK configurations (each BHK with its own price).
        // Old projects that only have a single totalRoom + price are converted into one entry.
        let loadedConfigs: Array<{ bhk: string; price: number | null }> = Array.isArray(p.bhkConfigurations)
          ? p.bhkConfigurations
              .filter((c: any) => c && c.bhk)
              .map((c: any) => ({
                bhk: String(c.bhk),
                price: c.price !== undefined && c.price !== null && c.price !== '' ? Number(c.price) : null
              }))
          : [];

        if (loadedConfigs.length === 0 && p.totalRoom) {
          loadedConfigs = [{
            bhk: String(p.totalRoom),
            price: p.price !== undefined && p.price !== null && p.price !== '' ? Number(p.price) : null
          }];
        }

        this.projectData = {
          projectOwner: ownerId,
          propertyType: p.propertyType || '',
          launchDate: p.launchDate ? p.launchDate.split('T')[0] : '',
          completionDate: p.completionDate ? p.completionDate.split('T')[0] : '',
          projectName: p.projectName || '',
          reraNumber: p.reraNumber || '',
          publicName: p.districtCode || p.publicName || '',
          lockingDuration: p.lockingDuration || 0,
          projectAreaValue: p.projectArea || null,
          projectAreaUnit: p.areaUnit || 'Sq.Ft',
          possession: possessionStr,
          possessionDate: possDateStr,
          transactionType: p.transactionType || '',
          developerName: p.developerName || '',
          siteManager: p.siteManager || '',
          siteManagerContact: p.siteManagerContact || '',
          sourcingManager: p.sourcingManager || '',
          sourcingManagerContact: p.sourcingManagerContact || '',
          closingManager: p.closingManager || '',
          closingManagerContact: p.closingManagerContact || '',
          description: p.description || '',
          remark: p.remark || '',
          approvedCc: !!p.commencementCertificate,
          approvedOc: !!p.occupancyCertificate,
          specificationText: p.specification || '',
          openSpacePercent: p.openSpacePercentage || 0,
          selectedAmenity: '',
          chosenAmenities: Array.isArray(p.amenities) ? [...p.amenities] : [],
          videoUrl: p.videoUrl || '',
          virtualVideoUrl: p.virtualVideoUrl || '',
          webKeywords: webKw,
          address: p.address || '',
          latitude: p.latitude !== undefined && p.latitude !== null ? p.latitude.toString() : '',
          longitude: p.longitude !== undefined && p.longitude !== null ? p.longitude.toString() : '',
          buildingPremises: p.buildingPremises || '',
          city: p.city || '',
          state: p.state || '',
          locality: p.locality || '',
          landmark: p.landmark || '',
          pinCode: p.pinCode || '',
          finalKeyword: finalKw,
          finalFolder: p.folder || '',
          branch: p.branch || 'Main Head Office Branch',
          finalAssignee: assigneeId,
          isFeatured: p.featuredProject !== undefined ? !!p.featuredProject : true,
          visibility: p.visibility || 'Branch',
          // When BHK entries exist, the BHK / Base Price input boxes stay blank (ready for the next entry)
          price: loadedConfigs.length > 0 ? null : (p.price || null),
          type: p.type || '',
          totalRoom: loadedConfigs.length > 0 ? '' : (p.totalRoom || ''),
          bhkConfigs: loadedConfigs,
          images: Array.isArray(p.images) ? [...p.images] : [],
          documents: Array.isArray(p.documents) ? [...p.documents] : [],
          chosenWebKeywords: webKw ? webKw.split(',').map((k: string) => k.trim()).filter(Boolean) : [],
          chosenFinalKeywords: finalKw ? finalKw.split(',').map((k: string) => k.trim()).filter(Boolean) : []
        };

        this.lastPropertyType = this.projectData.propertyType;
        this.basePriceText = this.projectData.price ? String(this.projectData.price) : '';

        if (this.projectData.documents.length === 0) {
          const localDocs = localStorage.getItem(`project_documents_${id}`);
          if (localDocs) {
            try { this.projectData.documents = JSON.parse(localDocs); } catch (e) {}
          }
        }
        if (this.projectData.images.length === 0) {
          const localImgs = localStorage.getItem(`project_images_${id}`);
          if (localImgs) {
            try { this.projectData.images = JSON.parse(localImgs); } catch (e) {}
          }
        }

        this.updateMapSource();
      },
      error: (err) => {
        console.error('Failed to load project details for editing:', err);
        alert('Failed to load project details');
      }
    });
  }

  shouldShowBhkConfig(): boolean {
    const type = (this.projectData.type || '').trim().toLowerCase();
    const transType = (this.projectData.transactionType || '').trim().toLowerCase();

    // If Project Type is selected and non-residential
    if (type) {
      const nonResidentialKeywords = [
        'commercial', 'industrial', 'land', 'plot', 'agricultural', 'warehouse',
        'godown', 'shop', 'office', 'hotel', 'resort', 'multiplex', 'co-working',
        'sez', 'cold storage', 'factory', 'institutional', 'corporate', 'educational',
        'hostels', 'cloud kitchen', 'party plot', 'amenity land'
      ];
      if (nonResidentialKeywords.some(keyword => type.includes(keyword))) {
        return false;
      }
    }

    // If Transaction Type is non-residential (e.g. Pre Lease)
    if (transType.includes('pre lease') || transType.includes('pre-lease')) {
      return false;
    }

    return true;
  }

  onTransactionOrTypeChange(): void {
    if (!this.shouldShowBhkConfig()) {
      this.projectData.totalRoom = '';
      this.projectData.bhkConfigs = [];
      this.bhkDropdownOpen = false;
    }
  }

  // ==========================================
  // BHK DROPDOWN (list opens under the BHK box, typing is also allowed)
  // ==========================================
  bhkDropdownOpen: boolean = false;
  bhkHoverIndex: number = -1;

  toggleBhkDropdown(): void {
    this.bhkDropdownOpen = !this.bhkDropdownOpen;
  }

  selectBhkOption(bhk: string): void {
    this.projectData.totalRoom = bhk;
    this.bhkDropdownOpen = false;
    this.bhkHoverIndex = -1;
  }

  // Close the list when clicking anywhere outside the BHK box / list
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event): void {
    const target = event.target as HTMLElement | null;
    if (!target || !target.closest('.bhk-combo')) {
      this.bhkDropdownOpen = false;
    }
  }

  // ==========================================
  // MULTIPLE BHK CONFIGURATION + BASE PRICE
  // Pick (or type) a BHK, enter its base price, click ADD.
  // Every entry is shown below as "2 BHK - ₹3 Lakh" and can be removed again.
  // ==========================================
  // Text typed in the Base Price box (can be words or numbers, e.g. "2 lakh", "2.5 Lakh", "1 cr", "200000")
  basePriceText: string = '';

  // Converts typed text into a plain number.
  // Accepts: 200000 | 2,00,000 | ₹2 lakh | 2.5 Lakh | 2 lac | 2L | 1.2 crore | 1 cr | 50 k | 50 thousand
  // Returns null when the text is empty or cannot be understood.
  parsePriceText(text: string | null | undefined): number | null {
    const raw = (text ?? '').toString().toLowerCase().replace(/₹|rs\.?|inr/g, '').replace(/,/g, '').trim();
    if (!raw) return null;

    const m = raw.match(/^(\d+(?:\.\d+)?)\s*(crores?|cr|lakhs?|lacs?|lac|l|thousand|k)?$/);
    if (!m) return null;

    const num = parseFloat(m[1]);
    const unit = m[2] || '';
    let multiplier = 1;
    if (unit.startsWith('cr')) multiplier = 10000000;
    else if (unit.startsWith('lakh') || unit.startsWith('lac') || unit === 'l') multiplier = 100000;
    else if (unit === 'thousand' || unit === 'k') multiplier = 1000;

    const value = Math.round(num * multiplier);
    return value > 0 ? value : null;
  }

  // The red "not understood" message appears only after the user leaves the box (not while typing)
  basePriceTouched: boolean = false;

  onBasePriceTextChange(text: string): void {
    this.basePriceText = text;
    this.basePriceTouched = false;
    this.projectData.price = this.parsePriceText(text);
  }

  addBhkConfig(): boolean {
    const bhk = (this.projectData.totalRoom || '').toString().trim();
    if (!bhk) {
      alert('Please select or type a BHK configuration first.');
      return false;
    }

    const typedPrice = (this.basePriceText || '').trim();
    const price: number | null = this.parsePriceText(typedPrice);
    if (typedPrice && price === null) {
      alert('Base Price not understood. Type a number or words like "2 lakh", "2.5 lakh" or "1 crore".');
      return false;
    }

    // Same BHK added again -> update its price instead of creating a duplicate row
    const existing = this.projectData.bhkConfigs.find((c: any) => c.bhk.toLowerCase() === bhk.toLowerCase());
    if (existing) {
      existing.price = price;
    } else {
      this.projectData.bhkConfigs.push({ bhk, price });
    }

    // Keep both boxes blank, ready for the next BHK
    this.projectData.totalRoom = '';
    this.projectData.price = null;
    this.basePriceText = '';
    this.bhkDropdownOpen = false;
    return true;
  }

  removeBhkConfig(index: number): void {
    this.projectData.bhkConfigs.splice(index, 1);
  }

  // Shows prices in Indian style: 250000 -> ₹2.5 Lakh, 12000000 -> ₹1.2 Cr
  formatPrice(value: number | null | undefined): string {
    if (value === null || value === undefined || !Number.isFinite(Number(value))) return 'Price not set';
    const n = Number(value);
    const trim = (x: number) => parseFloat(x.toFixed(2)).toString();
    if (n >= 10000000) return `₹${trim(n / 10000000)} Cr`;
    if (n >= 100000) return `₹${trim(n / 100000)} Lakh`;
    return `₹${n.toLocaleString('en-IN')}`;
  }

  // When Property Type changes (Commercial / Residential / Layout),
  // reset the dependent details so the user selects them again.
  onPropertyTypeChange(newType: string): void {
    const previousType = this.lastPropertyType;
    this.projectData.propertyType = newType;
    this.lastPropertyType = newType;

    // First selection (or no real change): keep what the user already typed.
    if (!previousType || previousType === newType) return;

    // Switching Commercial <-> Residential <-> Layout: blank the whole Basic Information page.
    const d = this.projectData;

    d.launchDate = '2026-06-02';
    d.completionDate = '2027-03-25';
    d.projectName = '';
    d.reraNumber = '';
    d.publicName = '';
    d.lockingDuration = 0;
    d.projectAreaValue = null;
    d.projectAreaUnit = 'Sq.Ft';
    d.possession = '';
    d.possessionDate = '';
    d.transactionType = '';
    d.developerName = '';
    d.siteManager = '';
    d.siteManagerContact = '';
    d.sourcingManager = '';
    d.sourcingManagerContact = '';
    d.closingManager = '';
    d.closingManagerContact = '';
    d.price = null;
    this.basePriceText = '';
    this.bhkDropdownOpen = false;
    d.type = '';       // Project Type
    d.totalRoom = '';  // BHK Configuration
    d.bhkConfigs = []; // Added BHK + price entries
    d.description = '';
    d.remark = '';
    d.approvedCc = false;
    d.approvedOc = false;
  }

  onPossessionChange(): void {
    if (this.projectData.possession !== 'Specify Time') {
      this.projectData.possessionDate = '';
    }
  }

  addKeywordTag(): void {
    if (!this.keywordInputText) return;
    const raw = this.keywordInputText.trim();
    if (!raw) return;

    const parts = raw.split(',').map(k => k.trim()).filter(k => k.length > 0);
    parts.forEach(part => {
      if (!this.projectData.chosenWebKeywords.includes(part)) {
        this.projectData.chosenWebKeywords.push(part);
      }
    });

    this.keywordInputText = '';
    this.syncWebKeywordsString();
  }

  addKeywordTagFromComma(): void {
    if (this.keywordInputText.includes(',')) {
      this.addKeywordTag();
    }
  }

  removeKeywordTag(kw: string): void {
    this.projectData.chosenWebKeywords = this.projectData.chosenWebKeywords.filter((k: string) => k !== kw);
    this.syncWebKeywordsString();
  }

  syncWebKeywordsString(): void {
    this.projectData.webKeywords = this.projectData.chosenWebKeywords.join(', ');
  }

  addFinalKeywordTag(): void {
    if (!this.finalKeywordInputText) return;
    const raw = this.finalKeywordInputText.trim();
    if (!raw) return;

    const parts = raw.split(',').map(k => k.trim()).filter(k => k.length > 0);
    parts.forEach(part => {
      if (!this.projectData.chosenFinalKeywords.includes(part)) {
        this.projectData.chosenFinalKeywords.push(part);
      }
    });

    this.finalKeywordInputText = '';
    this.syncFinalKeywordsString();
  }

  addFinalKeywordTagFromComma(): void {
    if (this.finalKeywordInputText.includes(',')) {
      this.addFinalKeywordTag();
    }
  }

  addPresetKeywordTag(): void {
    if (this.selectedPresetKeyword && !this.projectData.chosenFinalKeywords.includes(this.selectedPresetKeyword)) {
      this.projectData.chosenFinalKeywords.push(this.selectedPresetKeyword);
      this.syncFinalKeywordsString();
    }
    this.selectedPresetKeyword = '';
  }

  removeFinalKeywordTag(kw: string): void {
    this.projectData.chosenFinalKeywords = this.projectData.chosenFinalKeywords.filter((k: string) => k !== kw);
    this.syncFinalKeywordsString();
  }

  syncFinalKeywordsString(): void {
    this.projectData.finalKeyword = this.projectData.chosenFinalKeywords.join(', ');
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

    // BHK + price pairs of this project. If several BHKs were added, an opportunity
    // matches when ANY of them fits. Otherwise the old single price / BHK value is used.
    const bhkCandidates: Array<{ bhk: any; price: any }> = this.projectData.bhkConfigs.length > 0
      ? this.projectData.bhkConfigs.map((c: any) => ({ bhk: c.bhk, price: c.price }))
      : [{ bhk: this.projectData.totalRoom, price: this.projectData.price }];
    
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

      // 3. Price & Budget Match + 6. BHK Match (checked per BHK entry)
      const priceAndBhkMatch = bhkCandidates.some(candidate => {
        const projectPrice = parseFloat(candidate.price as any);
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

        const projectRoom = (candidate.bhk || '').toString().trim().toLowerCase();
        const oppRoom = (opp.bedroom || '').trim().toLowerCase();
        if (projectRoom && oppRoom && projectRoom !== oppRoom) {
          return false;
        }

        return true;
      });
      if (!priceAndBhkMatch) {
        return false;
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

      return true;
    }).length;
  }

  // ==========================================
  // GOOGLE MAPS INTEGRATION
  // ==========================================
  private readonly NOMINATIM_URL = 'https://nominatim.openstreetmap.org';
  private googleMapsLoader = inject(GoogleMapsLoaderService);

  private ensureCityInList(city: string): void {
    if (!city) return;
    const exists = this.cityList.some(c => c.toLowerCase() === city.toLowerCase());
    if (!exists) {
      this.cityList.push(city);
    }
  }

  private async ensureMap(): Promise<void> {
    if (this.mapInstance) return;
    this.initInteractiveMap();
  }
  geocodingStatus: string = '';
  isMapLoading: boolean = false;
  private geocodeTimeout: any = null;
  private mapInstance: any = null;
  private markerInstance: any = null;
  private autocompleteInstance: any = null;
  private mapClickListener: any = null;
  private geoRequestId: number = 0;
  private lastGeocodedAddress: string = '';

  // Live Map Iframe Sanitization Logic Method dynamically building Google Embed Queries
  updateMapSource() {
    let query = '';
    const lat = this.projectData.latitude ? String(this.projectData.latitude).trim() : '';
    const lng = this.projectData.longitude ? String(this.projectData.longitude).trim() : '';
    if (lat && lng && lat !== '0' && lng !== '0') {
      query = `${lat},${lng}`;
    } else if (this.projectData.address && this.projectData.address.trim()) {
      query = this.projectData.address.trim();
    } else if (this.projectData.city || this.projectData.state) {
      query = [this.projectData.city, this.projectData.state, 'India'].filter(Boolean).join(', ');
    } else {
      query = 'Nagpur, Maharashtra, India';
    }

    const embedUrl = `https://maps.google.com/maps?q=${encodeURIComponent(query)}&t=&z=15&ie=UTF8&iwloc=&output=embed`;
    this.mapSecureUrl = this.sanitizer.bypassSecurityTrustResourceUrl(embedUrl);
  }

  private destroyMap(): void {
    if (this.mapClickListener && (window as any).google?.maps?.event) {
      (window as any).google.maps.event.removeListener(this.mapClickListener);
      this.mapClickListener = null;
    }
    if (this.markerInstance) {
      try { this.markerInstance.setMap(null); } catch (e) {}
    }
    this.mapInstance = null;
    this.markerInstance = null;
  }

  initInteractiveMap(): void {
    let attempts = 0;
    const tryInit = () => {
      const container = document.getElementById('googleMap');
      if (!container) {
        if (++attempts < 20) setTimeout(tryInit, 150);
        return;
      }

      this.isMapLoading = true;
      this.googleMapsLoader.load().then((googleMaps: any) => {
        this.isMapLoading = false;
        if (!googleMaps) {
          this.hasSdkMap = false;
          this.updateMapSource();
          return;
        }
        this.hasSdkMap = true;

        this.destroyMap();

        if (container.offsetHeight < 100) {
          container.style.height = '350px';
        }
        container.style.width = '100%';

        const savedLat = parseFloat(this.projectData.latitude);
        const savedLng = parseFloat(this.projectData.longitude);
        const hasSaved = !isNaN(savedLat) && !isNaN(savedLng) && savedLat !== 0 && savedLng !== 0;

        const initialLat = hasSaved ? savedLat : 20.5937;
        const initialLng = hasSaved ? savedLng : 78.9629;
        const initialZoom = hasSaved ? 16 : 5;

        this.mapInstance = new googleMaps.Map(container, {
          center: { lat: initialLat, lng: initialLng },
          zoom: initialZoom,
          minZoom: 3,
          maxZoom: 20,
          mapTypeId: googleMaps.MapTypeId.ROADMAP,
          zoomControl: true,
          streetViewControl: false,
          mapTypeControl: false,
          fullscreenControl: false
        });

        if (hasSaved) {
          this.ensureMarker(initialLat, initialLng);
        } else {
          this.geocodingStatus = 'Click anywhere on the map to drop pin, or search address.';
        }

        this.mapClickListener = this.mapInstance.addListener('click', (e: any) => {
          if (e && e.latLng) {
            this.ngZone.run(() => this.updateMarkerAndGeocode(e.latLng.lat(), e.latLng.lng()));
          }
        });

        this.initPlacesAutocomplete();
        this.updateMapSource();

        setTimeout(() => {
          if (this.mapInstance && googleMaps.event) {
            googleMaps.event.trigger(this.mapInstance, 'resize');
            this.mapInstance.setCenter({ lat: initialLat, lng: initialLng });
          }
        }, 300);
      }).catch(() => {
        this.isMapLoading = false;
        this.hasSdkMap = false;
        this.updateMapSource();
      });
    };
    setTimeout(tryInit, 150);
  }

  private initPlacesAutocomplete(): void {
    if (typeof window === 'undefined' || !(window as any).google?.maps?.places) return;
    const input = document.getElementById('projectAddressInput') as HTMLInputElement;
    if (!input || this.autocompleteInstance) return;

    try {
      const g = (window as any).google.maps;
      this.autocompleteInstance = new g.places.Autocomplete(input, {
        componentRestrictions: { country: 'in' },
        fields: ['address_components', 'geometry', 'formatted_address']
      });

      this.autocompleteInstance.addListener('place_changed', () => {
        const place = this.autocompleteInstance.getPlace();
        if (!place || !place.geometry || !place.geometry.location) return;

        this.ngZone.run(() => {
          const parsed = this.googleMapsLoader.parseAddressComponents(place);
          this.projectData.address = parsed.formattedAddress || input.value;
          if (parsed.city) {
            this.ensureCityInList(parsed.city);
            this.projectData.city = parsed.city;
          }
          if (parsed.locality) this.projectData.locality = parsed.locality;
          if (parsed.pinCode) this.projectData.pinCode = parsed.pinCode;

          const lat = parsed.lat;
          const lng = parsed.lng;
          this.moveMarker(lat, lng, 16);
          this.lastGeocodedAddress = this.projectData.address;
          this.geocodingStatus = `✓ Location selected: ${this.projectData.address}`;
          this.updateMapSource();
        });
      });
    } catch (e) {
      console.warn('Places Autocomplete initialization error:', e);
    }
  }

  private ensureMarker(lat: number, lng: number): void {
    if (!this.mapInstance || typeof window === 'undefined' || !(window as any).google?.maps) return;
    const g = (window as any).google.maps;

    if (this.markerInstance) {
      this.markerInstance.setPosition({ lat, lng });
      return;
    }

    this.markerInstance = new g.Marker({
      position: { lat, lng },
      map: this.mapInstance,
      draggable: true,
      animation: g.Animation.DROP,
      title: 'Project Location'
    });

    this.markerInstance.addListener('dragend', () => {
      const pos = this.markerInstance.getPosition();
      if (pos) {
        this.ngZone.run(() => this.updateMarkerAndGeocode(pos.lat(), pos.lng()));
      }
    });
  }

  private moveMarker(lat: number, lng: number, zoom?: number): void {
    this.projectData.latitude = lat.toFixed(6);
    this.projectData.longitude = lng.toFixed(6);

    if (this.mapInstance && (window as any).google?.maps) {
      this.ensureMarker(lat, lng);
      const targetZoom = zoom ? zoom : 16;
      this.mapInstance.panTo({ lat, lng });
      this.mapInstance.setZoom(targetZoom);
    }
    this.updateMapSource();
  }

  updateMarkerAndGeocode(lat: number, lng: number): void {
    this.moveMarker(lat, lng);
    this.geocodingStatus = 'Fetching address for the selected point...';
    this.reverseGeocode(lat, lng);
  }

  // ---------- Nominatim helpers ----------

  private wait(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private async nominatimSearch(query: string, countryCodes?: string): Promise<any | null> {
    const params = new URLSearchParams({
      q: query,
      format: 'jsonv2',
      addressdetails: '1',
      limit: '1',
      'accept-language': 'en'
    });
    if (countryCodes) params.set('countrycodes', countryCodes);

    const res = await fetch(`${this.NOMINATIM_URL}/search?${params.toString()}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    return Array.isArray(data) && data.length > 0 ? data[0] : null;
  }

  // Second free search service (Photon, built on OpenStreetMap data). It tolerates spelling
  // differences better than Nominatim. Results are accepted only if they are in the same city.
  private async photonSearch(query: string, mustBeInCity: string): Promise<any | null> {
    const params = new URLSearchParams({
      q: query,
      limit: '3',
      lang: 'en',
      lat: '21.1458',   // gentle bias towards the centre of India
      lon: '79.0882'
    });
    const res = await fetch(`https://photon.komoot.io/api/?${params.toString()}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    const features: any[] = Array.isArray(data?.features) ? data.features : [];
    const wanted = (mustBeInCity || '').toLowerCase();

    for (const f of features) {
      const p = f.properties || {};
      const coords = f.geometry?.coordinates;
      if (!coords || coords.length < 2) continue;

      const where = [p.city, p.county, p.district, p.state].filter(Boolean).join(' ').toLowerCase();
      if (wanted && !where.includes(wanted)) continue;

      return {
        lat: String(coords[1]),
        lon: String(coords[0]),
        address: {
          postcode: p.postcode,
          city: p.city || p.county,
          suburb: p.district || p.locality,
          road: p.street,
          state: p.state
        }
      };
    }
    return null;
  }

  // Reads City, Locality and Pin Code from Nominatim's address object
  // typedAddress is passed only for a typed / pasted address, so the user's own words win
  // over the map's guess. It also clears old values so nothing stale is left in the form.
  private applyNominatimAddress(a: any, typedAddress?: string): void {
    if (!a) return;

    const foundCity =
      a.city || a.town || a.village || a.municipality || a.state_district || a.county || '';

    if (foundCity) {
      const matched = this.cityList.find(c => c.toLowerCase() === String(foundCity).toLowerCase());
      if (matched) {
        this.projectData.city = matched;
      } else {
        this.cityList.push(foundCity);
        this.projectData.city = foundCity;
      }
    }

    // Pin code: the 6 digits you typed first, otherwise the map's postcode
    const typedPin = typedAddress ? (typedAddress.match(/\b\d{6}\b/) || [''])[0] : '';
    const mapPin = a.postcode ? String(a.postcode).replace(/\s+/g, '') : '';
    this.projectData.pinCode = typedPin || mapPin;

    // Locality: the part you typed just before the city, otherwise the map's area name
    let locality = '';
    if (typedAddress) {
      const parts = typedAddress.split(',').map(p => p.trim()).filter(Boolean);
      const cityName = String(this.projectData.city || '').toLowerCase();
      const idx = parts.findIndex(p => p.toLowerCase() === cityName);
      if (idx > 0) locality = parts[idx - 1];
    }
    if (!locality) {
      locality =
        a.suburb || a.neighbourhood || a.city_district || a.quarter ||
        a.residential || a.hamlet || a.road || '';
    }
    this.projectData.locality = locality;
  }

  // Typed / pasted address -> Lat, Long, City, Locality, Pin Code
  async geocodeAddress(): Promise<void> {
    const address = (this.projectData.address || '').trim();
    if (!address) return;

    // Already fetched this exact address successfully (e.g. paste then blur)
    if (address === this.lastGeocodedAddress) return;

    const requestId = ++this.geoRequestId;
    this.geocodingStatus = 'Searching location...';

    try {
      const parsedGoogle = await this.googleMapsLoader.geocode(address);
      if (requestId !== this.geoRequestId) return;
      if (parsedGoogle && parsedGoogle.lat && parsedGoogle.lng) {
        this.ngZone.run(() => {
          this.projectData.latitude = parsedGoogle.lat.toFixed(6);
          this.projectData.longitude = parsedGoogle.lng.toFixed(6);
          if (parsedGoogle.city) {
            this.ensureCityInList(parsedGoogle.city);
            this.projectData.city = parsedGoogle.city;
          }
          if (parsedGoogle.locality) this.projectData.locality = parsedGoogle.locality;
          if (parsedGoogle.pinCode) this.projectData.pinCode = parsedGoogle.pinCode;

          this.lastGeocodedAddress = address;
          this.moveMarker(parsedGoogle.lat, parsedGoogle.lng, 16);
          this.geocodingStatus = `✓ Location found! Lat: ${parsedGoogle.lat.toFixed(4)}, Long: ${parsedGoogle.lng.toFixed(4)}${this.projectData.pinCode ? ', PIN: ' + this.projectData.pinCode : ''}`;
          this.updateMapSource();
        });
        return;
      }
      // Build several search versions, from most to least specific.
      // Maps often don't know flat / building names or the exact spelling, so we fall back
      // to street / area + city, and finally the pin code.
      // Fix common spelling differences (Chatrapati -> Chhatrapati, as OpenStreetMap spells it)
      const cleaned = address.replace(/\bchh?atrapath?i\b/gi, 'Chhatrapati');

      const parts = cleaned.split(',').map((p: string) => p.trim()).filter(Boolean);
      const pinMatch = cleaned.match(/\b\d{6}\b/);
      const typedPinCode = pinMatch ? pinMatch[0] : '';
      const cityPart = parts.length >= 3 ? parts[parts.length - 2] : '';

      // Drop floor / flat / shop style parts, OpenStreetMap does not know them
      const specific = (parts.length >= 3 ? parts.slice(0, parts.length - 2) : parts)
        .filter((p: string) => !/\b(floor|flat|plot|shop|office|wing|room)\b/i.test(p));

      const list: string[] = [cleaned];
      if (cityPart) {
        list.push(`${specific.join(', ')}, ${cityPart}`);
        for (let i = specific.length - 1; i >= 0; i--) {
          list.push(`${specific[i]}, ${cityPart}`);
        }
      }
      const candidates = list.filter((c, i) => c.length > 3 && list.indexOf(c) === i).slice(0, 5);
      const pinQuery = typedPinCode
        ? (cityPart ? `${typedPinCode}, ${cityPart}, India` : `${typedPinCode}, India`)
        : '';

      let result: any = null;
      let usedShorter = false;

      // 1) India first (fast and accurate for Indian addresses)
      for (let i = 0; i < candidates.length && !result; i++) {
        if (i > 0) await this.wait(1100); // Nominatim allows about 1 request per second
        if (requestId !== this.geoRequestId) return;
        this.geocodingStatus = `Searching address on OpenStreetMap... (${i + 1}/${candidates.length})`;
        result = await this.nominatimSearch(candidates[i], 'in');
        if (result && i > 0) usedShorter = true;
      }

      // 2) Typo-tolerant search (Photon): handles spellings like Chatrapati / Chhatrapati
      if (!result) {
        const areaParts = cityPart ? specific.slice(specific.length > 1 ? 1 : 0).reverse() : [];
        const photonQueries = cityPart ? areaParts.map((s: string) => `${s}, ${cityPart}`).slice(0, 3) : [cleaned];
        for (let i = 0; i < photonQueries.length && !result; i++) {
          await this.wait(500);
          if (requestId !== this.geoRequestId) return;
          this.geocodingStatus = 'Trying another address search...';
          try {
            result = await this.photonSearch(photonQueries[i], cityPart);
          } catch (e) {
            result = null;
          }
          if (result) usedShorter = true;
        }
      }

      // 3) Worldwide fallback for addresses outside India
      if (!result) {
        await this.wait(1100);
        if (requestId !== this.geoRequestId) return;
        result = await this.nominatimSearch(cleaned);
      }

      // 4) Last resort: the centre of the pin code area
      if (!result && pinQuery) {
        await this.wait(1100);
        if (requestId !== this.geoRequestId) return;
        result = await this.nominatimSearch(pinQuery, 'in');
        if (result) usedShorter = true;
      }

      if (requestId !== this.geoRequestId) return;

      if (result) {
        await this.ensureMap();
        if (requestId !== this.geoRequestId) return;
      }

      this.ngZone.run(() => {
        if (!result) {
          this.geocodingStatus = 'Address not found. Add the area, city and pin code, or click on the map.';
          return;
        }

        const lat = parseFloat(result.lat);
        const lng = parseFloat(result.lon);

        // Drop the pin and zoom straight onto it (wider view if the match was only approximate)
        this.moveMarker(lat, lng, usedShorter ? 15 : 17);

        this.applyNominatimAddress(result.address, cleaned);
        this.lastGeocodedAddress = address;

        this.geocodingStatus =
          `✓ Location found! Lat: ${lat.toFixed(4)}, Long: ${lng.toFixed(4)}` +
          (this.projectData.pinCode ? `, PIN: ${this.projectData.pinCode}` : '') +
          (usedShorter ? ' (approximate: part of the address was not found, check the pin)' : '');
      });
    } catch (err) {
      console.error('Address search failed:', err);
      if (requestId !== this.geoRequestId) return;
      this.ngZone.run(() => {
        this.geocodingStatus = 'Could not search this address right now. Check your internet connection and try again.';
      });
    }
  }

  async reverseGeocode(lat: number, lng: number): Promise<void> {
    const requestId = ++this.geoRequestId;

    if (!Number.isFinite(lat) || !Number.isFinite(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      this.geocodingStatus = 'Invalid coordinates.';
      return;
    }

    try {
      const parsed = await this.googleMapsLoader.reverseGeocode(lat, lng);
      if (requestId !== this.geoRequestId) return;

      this.ngZone.run(() => {
        if (!parsed || !parsed.formattedAddress) {
          this.geocodingStatus = `Pin set at Lat: ${lat.toFixed(6)}, Long: ${lng.toFixed(6)}`;
          return;
        }

        this.projectData.address = parsed.formattedAddress;
        if (parsed.city) {
          this.ensureCityInList(parsed.city);
          this.projectData.city = parsed.city;
        }
        if (parsed.locality) this.projectData.locality = parsed.locality;
        if (parsed.pinCode) this.projectData.pinCode = parsed.pinCode;

        this.lastGeocodedAddress = this.projectData.address;
        this.geocodingStatus = `✓ Address fetched: ${parsed.formattedAddress} (PIN: ${parsed.pinCode || '—'})`;
        this.updateMapSource();
      });
    } catch (err) {
      console.error('Google Maps reverse lookup failed:', err);
      if (requestId !== this.geoRequestId) return;
      this.ngZone.run(() => {
        this.geocodingStatus = `Pin set at Lat: ${lat.toFixed(6)}, Long: ${lng.toFixed(6)}`;
      });
    }
  }

  onAddressPaste(event: ClipboardEvent): void {
    setTimeout(() => this.geocodeAddress(), 150);
  }

  // Typing does not call the free OpenStreetMap service on every keystroke (its usage policy
  // does not allow that). The search runs on paste, when you leave the field,
  // or when you press AUTO-FETCH DATA.
  onAddressInput(): void {
    this.lastGeocodedAddress = '';
  }

  // Manual Lat/Long entry:
  // Wait briefly until the user has finished entering BOTH fields, then reverse-geocode
  // using the entered coordinates. This prevents the first field from triggering a lookup
  // with an old value from the second field.
  onLatLongChange(): void {
    if (this.geocodeTimeout) {
      clearTimeout(this.geocodeTimeout);
    }

    this.lastGeocodedAddress = '';

    this.geocodeTimeout = setTimeout(() => {
      const lat = parseFloat(String(this.projectData.latitude ?? '').trim());
      const lng = parseFloat(String(this.projectData.longitude ?? '').trim());

      if (
        !Number.isFinite(lat) ||
        !Number.isFinite(lng) ||
        lat < -90 ||
        lat > 90 ||
        lng < -180 ||
        lng > 180
      ) {
        this.geocodingStatus = 'Enter a valid latitude (-90 to 90) and longitude (-180 to 180).';
        return;
      }

      // Keep the entered coordinates exactly to 6 decimal places.
      this.projectData.latitude = lat.toFixed(6);
      this.projectData.longitude = lng.toFixed(6);

      // Update map position first, then fetch the address strictly from these coordinates.
      this.moveMarker(lat, lng, 17);
      this.geocodingStatus = 'Fetching exact address from the entered Lat/Long...';
      this.reverseGeocode(lat, lng);
    }, 700);
  }

  nextStep(): void {
    if (this.currentStep < 5) {
      if (this.currentStep === 4) this.destroyMap();
      this.currentStep++;
      if (this.currentStep === 4) {
        this.updateMapSource();
        this.initInteractiveMap();
      }
    }
  }

  prevStep(): void {
    if (this.currentStep > 1) {
      if (this.currentStep === 4) this.destroyMap();
      this.currentStep--;
      if (this.currentStep === 4) {
        this.initInteractiveMap();
      }
    }
  }

  goToStep(step: number): void {
    if (step >= 1 && step <= 5) {
      if (this.currentStep === 4 && step !== 4) this.destroyMap();
      this.currentStep = step;
      if (step === 4) {
        this.updateMapSource();
        this.initInteractiveMap();
      }
    }
  }

  getTotalPayloadSizeFormatted(): string {
    let totalBytes = 0;
    (this.projectData.images || []).forEach((img: any) => {
      if (img.data) totalBytes += img.data.length * 0.75;
    });
    (this.projectData.documents || []).forEach((doc: any) => {
      if (doc.data) totalBytes += doc.data.length * 0.75;
    });
    if (totalBytes === 0) return '0 KB';
    if (totalBytes < 1024 * 1024) {
      return (totalBytes / 1024).toFixed(1) + ' KB';
    }
    return (totalBytes / (1024 * 1024)).toFixed(2) + ' MB';
  }

  addAmenityTag(): void {
    const selected = this.projectData.selectedAmenity;
    if (selected && !this.projectData.chosenAmenities.includes(selected)) {
      this.projectData.chosenAmenities.push(selected);
    }
    this.projectData.selectedAmenity = ''; 
  }

  removeAmenityTag(amenity: string): void {
    this.projectData.chosenAmenities = this.projectData.chosenAmenities.filter((item: string) => item !== amenity);
  }

  private compressImage(dataUrl: string, maxWidth = 1000, maxHeight = 1000, quality = 0.65): Promise<string> {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > maxWidth || height > maxHeight) {
          if (width > height) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          } else {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
          resolve(compressedDataUrl);
        } else {
          resolve(dataUrl);
        }
      };
      img.onerror = () => resolve(dataUrl);
      img.src = dataUrl;
    });
  }

  // Document Upload Handlers with 8 Limit & Preview
  onDocumentFileSelected(event: any): void {
    const files: FileList = event.target.files;
    if (!files || files.length === 0) return;

    if (this.projectData.documents.length >= this.maxDocumentsLimit) {
      alert(`Maximum limit of ${this.maxDocumentsLimit} documents reached.`);
      event.target.value = '';
      return;
    }

    const remainingSlots = this.maxDocumentsLimit - this.projectData.documents.length;
    if (files.length > remainingSlots) {
      alert(`You can only attach ${remainingSlots} more document(s). Only the first ${remainingSlots} files will be attached.`);
    }

    const countToUpload = Math.min(files.length, remainingSlots);

    for (let i = 0; i < countToUpload; i++) {
      const file = files[i];
      if (file.size > 5 * 1024 * 1024) {
        alert(`Document "${file.name}" is too large (${(file.size / (1024 * 1024)).toFixed(1)} MB). Please select documents under 5 MB.`);
        continue;
      }
      const reader = new FileReader();
      reader.onload = (e: any) => {
        if (this.projectData.documents.length < this.maxDocumentsLimit) {
          this.projectData.documents.push({
            name: file.name,
            category: this.selectedDocCategory || 'Other Document',
            size: (file.size / 1024).toFixed(1) + ' KB',
            data: e.target.result,
            uploadedAt: new Date().toLocaleDateString()
          });
        }
      };
      reader.readAsDataURL(file);
    }
    event.target.value = '';
  }

  removeDocument(index: number): void {
    this.projectData.documents.splice(index, 1);
  }

  openDocPreview(doc: any): void {
    const isPdf = doc.name.toLowerCase().endsWith('.pdf') || (doc.data && doc.data.startsWith('data:application/pdf'));
    const isImage = /\.(jpg|jpeg|png|webp|gif)$/i.test(doc.name) || (doc.data && doc.data.startsWith('data:image/'));

    let safeUrl: SafeResourceUrl | undefined;
    if (isPdf && doc.data) {
      safeUrl = this.sanitizer.bypassSecurityTrustResourceUrl(doc.data);
    }

    this.previewModalDoc = {
      name: doc.name,
      category: doc.category,
      size: doc.size,
      data: doc.data,
      isPdf,
      isImage,
      safeUrl
    };
  }

  closeDocPreview(): void {
    this.previewModalDoc = null;
  }

  // Image Upload Handlers with 8 Limit & Preview
  onImageFileSelected(event: any): void {
    const files: FileList = event.target.files;
    if (!files || files.length === 0) return;

    if (this.projectData.images.length >= this.maxGalleryImagesLimit) {
      alert(`Maximum limit of ${this.maxGalleryImagesLimit} gallery images reached.`);
      event.target.value = '';
      return;
    }

    const remainingSlots = this.maxGalleryImagesLimit - this.projectData.images.length;
    if (files.length > remainingSlots) {
      alert(`You can only upload ${remainingSlots} more image(s). Only the first ${remainingSlots} images will be uploaded.`);
    }

    const countToUpload = Math.min(files.length, remainingSlots);

    for (let i = 0; i < countToUpload; i++) {
      const file = files[i];
      if (!file.type.startsWith('image/')) {
        alert(`File "${file.name}" is not a valid image format.`);
        continue;
      }
      const reader = new FileReader();
      reader.onload = (e: any) => {
        const rawDataUrl = e.target.result;
        this.compressImage(rawDataUrl, 1000, 1000, 0.65).then((compressedDataUrl) => {
          if (this.projectData.images.length < this.maxGalleryImagesLimit) {
            const approxKb = (compressedDataUrl.length * 0.75 / 1024).toFixed(1);
            this.projectData.images.push({
              name: file.name,
              size: approxKb + ' KB',
              data: compressedDataUrl,
              uploadedAt: new Date().toLocaleDateString()
            });
          }
        });
      };
      reader.readAsDataURL(file);
    }
    event.target.value = '';
  }

  removeImage(index: number): void {
    this.projectData.images.splice(index, 1);
  }

  openImagePreview(img: any): void {
    this.previewModalImage = img;
  }

  closeImagePreview(): void {
    this.previewModalImage = null;
  }

  cancelWizard(): void {
    if (confirm('Are you sure you want to cancel?')) {
      this.router.navigate(['/all-projects']);
    }
  }

  submitProjectForm(): void {
    if (this.isSubmitting) return;

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

    // If a BHK was selected / typed but the ADD button was not pressed, add it automatically
    if ((this.basePriceText || '').trim() && this.parsePriceText(this.basePriceText) === null) {
      alert('Base Price not understood. Type a number or words like "2 lakh", "2.5 lakh" or "1 crore".');
      return;
    }
    if (this.shouldShowBhkConfig() && (this.projectData.totalRoom || '').toString().trim()) {
      if (!this.addBhkConfig()) return;
    }

    this.isSubmitting = true;
    this.syncWebKeywordsString();
    this.syncFinalKeywordsString();

    let possessionValue = this.projectData.possession;
    if (possessionValue === 'Specify Time' && this.projectData.possessionDate) {
      possessionValue = `Specify Time (${this.projectData.possessionDate})`;
    }

    // BHK configurations (each BHK with its own base price)
    const bhkConfigs = (this.projectData.bhkConfigs || []).map((c: any) => ({ bhk: c.bhk, price: c.price }));
    const pricedConfigs = bhkConfigs.filter((c: any) => c.price !== null && c.price !== undefined && Number(c.price) > 0);
    // "price" stays as the lowest BHK price so existing lists / filters / matching keep working
    const startingPrice = pricedConfigs.length > 0
      ? Math.min(...pricedConfigs.map((c: any) => Number(c.price)))
      : undefined;

    const payload: any = {
      contactId: this.projectData.projectOwner,
      propertyType: this.projectData.propertyType || undefined,
      launchDate: this.projectData.launchDate,
      projectName: this.projectData.projectName,
      reraNumber: this.projectData.reraNumber || undefined,
      districtCode: this.projectData.publicName || undefined,
      lockingDuration: Number(this.projectData.lockingDuration) || 0,
      projectArea: Number(this.projectData.projectAreaValue) || undefined,
      areaUnit: this.projectData.projectAreaUnit || undefined,
      possession: possessionValue || undefined,
      possessionDate: this.projectData.possessionDate || undefined,
      transactionType: this.projectData.transactionType || undefined,
      developerName: this.projectData.developerName || undefined,
      siteManager: this.projectData.siteManager || undefined,
      siteManagerContact: this.projectData.siteManagerContact || undefined,
      sourcingManager: this.projectData.sourcingManager || undefined,
      sourcingManagerContact: this.projectData.sourcingManagerContact || undefined,
      closingManager: this.projectData.closingManager || undefined,
      closingManagerContact: this.projectData.closingManagerContact || undefined,
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
      price: bhkConfigs.length > 0 ? startingPrice : (Number(this.projectData.price) || undefined),
      type: this.projectData.type || undefined,
      totalRoom: bhkConfigs.length > 0
        ? bhkConfigs.map((c: any) => c.bhk).join(', ')
        : (this.projectData.totalRoom || undefined),
      bhkConfigurations: bhkConfigs,
      documents: this.projectData.documents || [],
      images: this.projectData.images || []
    };

    // Clean up undefined / empty string fields
    Object.keys(payload).forEach(key => {
      if (payload[key] === undefined || payload[key] === '' || payload[key] === 'Select') {
        delete payload[key];
      }
    });

    // Safety check: Prevent Node.js Buffer out of range error (17.8MB max payload limit)
    let totalPayloadSize = 0;
    (payload.images || []).forEach((img: any) => { totalPayloadSize += (img.data ? img.data.length : 0); });
    (payload.documents || []).forEach((doc: any) => { totalPayloadSize += (doc.data ? doc.data.length : 0); });

    if (totalPayloadSize > 12 * 1024 * 1024) { // 12MB limit check
      const sizeMb = (totalPayloadSize / (1024 * 1024)).toFixed(1);
      alert(`The total size of uploaded images and documents is too large (~${sizeMb} MB). The server limit is ~12 MB. Please remove some heavy documents or images before submitting.`);
      this.isSubmitting = false;
      return;
    }

    if (this.isEditMode && this.projectId) {
      this.projectsService.updateProject(this.projectId, payload).subscribe({
        next: (res: any) => {
          localStorage.setItem(`project_full_data_${this.projectId}`, JSON.stringify({
            ...payload,
            possessionDate: this.projectData.possessionDate,
            documents: this.projectData.documents,
            images: this.projectData.images
          }));
          if (this.projectData.documents.length > 0) {
            localStorage.setItem(`project_documents_${this.projectId}`, JSON.stringify(this.projectData.documents));
          }
          if (this.projectData.images.length > 0) {
            localStorage.setItem(`project_images_${this.projectId}`, JSON.stringify(this.projectData.images));
          }
          alert('Project updated successfully!');
          this.isSubmitting = false;
          this.router.navigate(['/all-projects']);
        },
        error: (err) => {
          console.error('Failed to update project:', err);
          this.isSubmitting = false;
          const errMsg = err.error?.message || err.error?.error || err.message || 'Error updating project';
          alert('Error updating project: ' + (Array.isArray(errMsg) ? errMsg.join(', ') : errMsg));
        }
      });
    } else {
      this.projectsService.createProject(payload).subscribe({
        next: (res: any) => {
          const createdId = res?.id || res?._id || res?.data?.id || res?.data?._id;
          if (createdId) {
            localStorage.setItem(`project_full_data_${createdId}`, JSON.stringify({
              ...payload,
              possessionDate: this.projectData.possessionDate,
              documents: this.projectData.documents,
              images: this.projectData.images
            }));
            if (this.projectData.documents.length > 0) {
              localStorage.setItem(`project_documents_${createdId}`, JSON.stringify(this.projectData.documents));
            }
            if (this.projectData.images.length > 0) {
              localStorage.setItem(`project_images_${createdId}`, JSON.stringify(this.projectData.images));
            }
          }
          alert('Project created successfully!');
          this.isSubmitting = false;
          this.router.navigate(['/all-projects']);
        },
        error: (err) => {
          console.error('Failed to create project:', err);
          this.isSubmitting = false;
          const errMsg = err.error?.message || err.error?.error || err.message || 'Error creating project';
          alert('Error creating project: ' + (Array.isArray(errMsg) ? errMsg.join(', ') : errMsg));
        }
      });
    }
  }
}