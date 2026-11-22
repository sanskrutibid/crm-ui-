import { Component, OnInit, OnDestroy, inject, NgZone, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { ProjectsService } from '../projects.service';
import { ContactsService } from '../../contacts/contacts.service';
import { AuthService } from '../../auth/auth.service';
import { OpportunitiesService } from '../../opportunities/opportunities.service';
import { GoogleMapsLoaderService, PlaceSuggestion, ParsedAddress, parseLatLngText } from '../../../services/google-maps-loader.service';

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
    'Commercial Bay Shop', 'Commercial Building', 'Special Economic Zone (SEZ)', 'Cloud Kitchen',
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
    if (this.suggestTimer) clearTimeout(this.suggestTimer);
    this.stopGpsWatch();
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

        if (this.projectData.city) this.ensureCityInList(this.projectData.city);

        // The saved address is already resolved - blur must not geocode it again and overwrite saved fields
        this.lastResolvedAddress = (this.projectData.address || '').trim();

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

  // =====================================================================
  // GOOGLE MAPS INTEGRATION  (same engine as the Create Property page)
  //  - Google Places (New) suggestions: business / GMB name, society, landmark, address
  //  - exact Google pin + address + city + locality + state + PIN
  //  - click on a building / shop icon on the map -> exact place
  //  - drag the pin / click the map / type Lat-Long -> reverse geocode + business name
  //  - Plus Code, "lat, long" text, My Location (GPS), Roadmap / Satellite
  // =====================================================================
  private readonly NOMINATIM_URL = 'https://nominatim.openstreetmap.org';
  private googleMapsLoader = inject(GoogleMapsLoaderService);

  geocodingStatus: string = '';
  isMapLoading: boolean = false;
  mapLayerType: 'roadmap' | 'satellite' | 'hybrid' = 'roadmap';
  /** Business / shop / building name taken from Google (GMB) */
  selectedPlaceName: string = '';
  private autoBuildingName: string = '';
  private gpsAccuracyNote: string = '';

  private geocodeTimeout: any = null;
  private mapInstance: any = null;
  private markerInstance: any = null;
  private infoWindowInstance: any = null;
  private geocoderInstance: any = null;
  private mapClickListener: any = null;

  // ===== Address suggestions (Google Places API New) =====
  addressSuggestions: PlaceSuggestion[] = [];
  showAddressSuggestions: boolean = false;
  suggestionsLoading: boolean = false;
  activeSuggestionIndex: number = -1;
  private suggestTimer: any = null;
  private suggestRequestId: number = 0;
  private selectingSuggestion: boolean = false;
  private geoRequestId: number = 0;
  private nameLookupId: number = 0;
  /** Address text already resolved to an exact pin - blur / Enter must not geocode it again */
  private lastResolvedAddress: string = '';

  private ensureCityInList(city: string): void {
    if (!city) return;
    const exists = this.cityList.some(c => c.toLowerCase() === city.toLowerCase());
    if (!exists) {
      this.cityList.push(city);
    }
  }

  private formatCityName(name: string): string {
    if (!name) return '';
    const clean = name.trim();
    return clean.charAt(0).toUpperCase() + clean.slice(1).toLowerCase();
  }

  private escHtml(s: string): string {
    return String(s || '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' } as any)[c]);
  }

  // Live Map Iframe fallback (used until / unless the Google SDK map is ready)
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

    const mapType = (this.mapLayerType === 'satellite' || this.mapLayerType === 'hybrid') ? 'k' : '';
    const embedUrl = `https://maps.google.com/maps?q=${encodeURIComponent(query)}&t=${mapType}&z=15&ie=UTF8&iwloc=&output=embed`;
    this.mapSecureUrl = this.sanitizer.bypassSecurityTrustResourceUrl(embedUrl);
  }

  private destroyMap(): void {
    if (this.mapClickListener) {
      try {
        if (typeof window !== 'undefined' && (window as any).google?.maps?.event) {
          (window as any).google.maps.event.removeListener(this.mapClickListener);
        }
      } catch (e) {}
      this.mapClickListener = null;
    }
    if (this.markerInstance) {
      try { this.markerInstance.setMap(null); } catch (e) {}
    }
    if (this.infoWindowInstance) {
      try { this.infoWindowInstance.close(); } catch (e) {}
      this.infoWindowInstance = null;
    }
    this.mapInstance = null;
    this.markerInstance = null;
  }

  /** Roadmap <-> Satellite */
  toggleMapLayer(type: string): void {
    const isSat = (type === 'satellite' || type === 'hybrid');
    this.mapLayerType = isSat ? 'satellite' : 'roadmap';
    this.updateMapSource();
    if (!this.mapInstance) return;
    const g = (window as any).google?.maps;
    if (!g) return;
    this.mapInstance.setMapTypeId(isSat ? g.MapTypeId.HYBRID : g.MapTypeId.ROADMAP);
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
      window.gm_authFailure = () => {
        this.isMapLoading = false;
        this.geocodingStatus = 'Google Maps API Key Error: Invalid or Unauthorized key. Please use a valid Google Cloud Maps API key (starts with AIzaSy) in environment.ts';
      };

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

        const isSat = this.mapLayerType === 'satellite' || this.mapLayerType === 'hybrid';
        this.mapLayerType = isSat ? 'satellite' : 'roadmap';

        this.mapInstance = new googleMaps.Map(container, {
          center: { lat: initialLat, lng: initialLng },
          zoom: initialZoom,
          minZoom: 3,
          maxZoom: 20,
          mapTypeId: isSat ? googleMaps.MapTypeId.HYBRID : googleMaps.MapTypeId.ROADMAP,
          zoomControl: true,
          zoomControlOptions: { position: googleMaps.ControlPosition.RIGHT_BOTTOM },
          streetViewControl: false,
          mapTypeControl: false,
          fullscreenControl: false
        });

        if (hasSaved) {
          this.placeOrUpdateMarker(initialLat, initialLng, false);
        } else {
          this.markerInstance = null;
          this.geocodingStatus = 'Click anywhere on the map to drop pin, or search address.';
        }

        // Click on a business / building icon -> exact place address (e.placeId)
        // Click on plain map -> pin moves there and the location is reverse geocoded
        this.mapClickListener = this.mapInstance.addListener('click', (e: any) => {
          if (!e || !e.latLng) return;
          const lat = e.latLng.lat();
          const lng = e.latLng.lng();
          if (e.placeId) {
            // Stop Google's default place info window; we show our own details instead.
            if (typeof e.stop === 'function') e.stop();
            this.ngZone.run(() => this.handleMapPlaceClick(e.placeId, lat, lng));
            return;
          }
          this.ngZone.run(() => this.updateMarkerAndGeocode(lat, lng));
        });

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
        this.geocodingStatus = 'Unable to load map. Please check your internet connection.';
        this.updateMapSource();
      });
    };
    setTimeout(tryInit, 150);
  }

  // ---------- marker + info window ----------

  private placeOrUpdateMarker(lat: number, lng: number, showInfo: boolean = true): void {
    if (!this.mapInstance) return;
    const g = (window as any).google?.maps;
    if (!g) return;

    const latLng = new g.LatLng(lat, lng);

    if (!this.markerInstance) {
      this.markerInstance = new g.Marker({
        position: latLng,
        map: this.mapInstance,
        draggable: true,
        animation: g.Animation?.DROP,
        title: 'Project Location (Drag to pinpoint exact location)'
      });

      this.markerInstance.addListener('dragend', () => {
        const pos = this.markerInstance.getPosition();
        if (pos) {
          this.ngZone.run(() => this.updateMarkerAndGeocode(pos.lat(), pos.lng()));
        }
      });

      this.markerInstance.addListener('click', () => {
        this.openMarkerInfoWindow();
      });
    } else {
      this.markerInstance.setPosition(latLng);
      if (this.markerInstance.getMap() !== this.mapInstance) {
        this.markerInstance.setMap(this.mapInstance);
      }
    }

    if (showInfo) {
      this.openMarkerInfoWindow();
    }
  }

  private openMarkerInfoWindow(): void {
    if (!this.markerInstance || !this.mapInstance) return;
    const g = (window as any).google?.maps;
    if (!g) return;

    if (!this.infoWindowInstance) {
      this.infoWindowInstance = new g.InfoWindow();
    }
    this.infoWindowInstance.setContent(this.getMarkerPopupHtml());
    this.infoWindowInstance.open({
      anchor: this.markerInstance,
      map: this.mapInstance,
      shouldFocus: false
    });
  }

  private getMarkerPopupHtml(): string {
    const d = this.projectData;
    const address = (d.address || '').trim();
    const locality = (d.locality || '').trim();
    const city = (d.city || '').trim();
    const state = (d.state || '').trim();
    const lat = (d.latitude || '').toString().trim();
    const lng = (d.longitude || '').toString().trim();

    let html = `<div style="font-family: system-ui, -apple-system, sans-serif; font-size: 13px; max-width: 270px; line-height: 1.5; padding: 6px; color: #1e293b;">`;
    html += `<div style="font-weight: 700; color: #0284c7; font-size: 14px; margin-bottom: 4px;">${this.selectedPlaceName ? '🏢 ' + this.escHtml(this.selectedPlaceName) : '📍 Project Location'}</div>`;
    if (address) html += `<div style="font-size: 12px; color: #334155; margin-bottom: 6px; word-break: break-word;">${this.escHtml(address)}</div>`;
    if (locality) html += `<div><b>Locality:</b> ${this.escHtml(locality)}</div>`;
    if (city) html += `<div><b>City:</b> ${this.escHtml(city)}</div>`;
    if (state) html += `<div style="color: #64748b; font-size: 11px; margin-top: 3px;">${this.escHtml(state)}, India</div>`;
    if (lat && lng) html += `<div style="color: #0284c7; font-size: 11px; margin-top: 4px; font-weight: 600;">🎯 ${this.escHtml(lat)}, ${this.escHtml(lng)}</div>`;
    html += `</div>`;
    return html;
  }

  /** Moves the pin, writes Lat / Long (6 decimals) and refreshes the map. */
  private moveMarker(lat: number, lng: number, zoom?: number): void {
    this.projectData.latitude = lat.toFixed(6);
    this.projectData.longitude = lng.toFixed(6);

    if (this.mapInstance && (window as any).google?.maps) {
      this.placeOrUpdateMarker(lat, lng, false);
      this.mapInstance.panTo({ lat, lng });
      this.mapInstance.setZoom(zoom ? zoom : 16);
    }
    this.updateMapSource();
  }

  // ---------- Google (GMB) place name ----------

  private setPlaceName(name: string): void {
    const clean = (name || '').trim();
    this.selectedPlaceName = clean;
    if (clean) {
      // the Google (GMB) name goes to Building / Premises; the ADDRESS stays as Google shows it
      this.projectData.buildingPremises = clean;
      this.autoBuildingName = clean;
    }
  }

  private clearPlaceName(): void {
    this.selectedPlaceName = '';
    const current = (this.projectData.buildingPremises || '').trim();
    if (current && current === this.autoBuildingName) {
      this.projectData.buildingPremises = '';
    }
    this.autoBuildingName = '';
  }

  /** Real business that stands exactly at a plain point (within 35 m). The pin is NOT moved. */
  private attachBusinessNameAt(lat: number, lng: number, nid: number): void {
    this.googleMapsLoader.findBusinessAt(lat, lng, 35).then((hit) => {
      if (nid !== this.nameLookupId || !hit || !hit.name) return;
      this.ngZone.run(() => {
        this.setPlaceName(hit.name as string);
        if (this.markerInstance) {
          try { this.markerInstance.setTitle(hit.name as string); } catch (e) {}
        }
        this.openMarkerInfoWindow();
      });
    }).catch(() => {});
  }

  /**
   * A typed / pasted address (for example the Google listing address of "Lighthouse Info Systems Pvt. Ltd.")
   * often resolves only to a street / premise point that has NO business name, so the pin popup showed the
   * generic "Project Location". Here we look for the real business (GMB) that uses this address:
   *  - exactly one business  -> it is selected automatically (exact Google pin + business name)
   *  - several businesses    -> they are listed below the address box so the user picks the correct one
   * The address text typed by the user is never changed.
   */
  private async autoPickBusinessForAddress(addr: string, reqId: number): Promise<void> {
    const typed = (this.projectData.address || '').trim();
    if (!typed || addr.trim() !== typed || this.selectedPlaceName) return;

    let biz: PlaceSuggestion[] = [];
    try {
      biz = await this.googleMapsLoader.discoverBusinessesForAddress(addr);
    } catch (e) {
      return;
    }
    if (reqId !== this.geoRequestId || this.selectedPlaceName || !biz || biz.length === 0) return;

    if (biz.length > 1) {
      this.ngZone.run(() => {
        this.addressSuggestions = biz;
        this.showAddressSuggestions = true;
        this.activeSuggestionIndex = -1;
        this.geocodingStatus = `⚠ ${biz.length} businesses use this address. Pick the correct one from the list below the address box to show its Google name on the pin.`;
      });
      return;
    }

    const parsed = await this.googleMapsLoader.getPlaceDetails(biz[0].placeId);
    if (reqId !== this.geoRequestId || this.selectedPlaceName || !parsed || !parsed.raw) return;

    this.ngZone.run(() => {
      this.applyPlaceDetails(parsed.raw, undefined, undefined, 18);
      // keep the address exactly as the user typed it
      this.projectData.address = typed;
      this.lastResolvedAddress = typed;
      this.openMarkerInfoWindow();
      this.geocodingStatus = `✓ Exact Google pin: ${this.selectedPlaceName ? this.selectedPlaceName + ' - ' : ''}${this.projectData.latitude}, ${this.projectData.longitude}`;
    });
  }

  // ---------- applying a Google place / geocode result ----------

  /**
   * Selected suggestion, clicked map POI or a geocoded place.
   * Fills exact address, Lat / Long, marker, city, locality, state and PIN.
   */
  private applyPlaceDetails(place: any, fallbackLat?: number, fallbackLng?: number, zoom: number = 17): void {
    let lat = fallbackLat;
    let lng = fallbackLng;
    const loc = place?.geometry?.location;
    if (loc) {
      lat = typeof loc.lat === 'function' ? loc.lat() : loc.lat;
      lng = typeof loc.lng === 'function' ? loc.lng() : loc.lng;
    }
    if (lat === undefined || lng === undefined || isNaN(Number(lat)) || isNaN(Number(lng))) return;

    const latR = Number(Number(lat).toFixed(6));
    const lngR = Number(Number(lng).toFixed(6));

    this.gpsAccuracyNote = '';
    this.projectData.latitude = latR.toFixed(6);
    this.projectData.longitude = lngR.toFixed(6);
    this.updateMapSource();

    if (this.mapInstance) {
      this.mapInstance.setCenter({ lat: latR, lng: lngR });
      this.mapInstance.setZoom(zoom);
    }
    this.placeOrUpdateMarker(latR, lngR, false);

    const types: string[] = place.types || [];
    const isEstablishment = types.some((t: string) => ['establishment', 'point_of_interest', 'premise'].includes(t));
    const name = (place.name || '').trim();
    const formatted = (place.formatted_address || '').trim();

    this.applyGoogleGeocodeResult(
      { formatted_address: formatted, address_components: place.address_components || [] },
      true,
      [place]
    );

    // Only real places (shop / hotel / college...) count as a name. A road / area name must not.
    const nameable = place.nameable !== undefined ? !!place.nameable : isEstablishment;
    if (!!name && nameable && !types.includes('route')) {
      this.setPlaceName(name);
      if (this.markerInstance) {
        try { this.markerInstance.setTitle(name); } catch (e) {}
      }
    } else {
      this.clearPlaceName();
    }
    this.lastResolvedAddress = (this.projectData.address || '').trim();

    this.openMarkerInfoWindow();
    this.geocodingStatus = `✓ Address selected: ${this.selectedPlaceName ? this.selectedPlaceName + ' - ' : ''}${this.projectData.address || ''}`;
  }

  /**
   * @param data          main (most specific) geocode result / place
   * @param updateAddress overwrite the address box with the formatted address
   * @param allResults    other results at the same location; their components are merged so that
   *                      PIN, area and street are not missed
   */
  private applyGoogleGeocodeResult(data: any, updateAddress: boolean = true, allResults?: any[]): void {
    if (!data) return;

    const formatted = data.formatted_address || '';
    if (updateAddress && formatted) {
      this.projectData.address = formatted;
      this.lastResolvedAddress = formatted.trim();
    } else if (!this.projectData.address && formatted) {
      this.projectData.address = formatted;
      this.lastResolvedAddress = formatted.trim();
    }

    const sources: any[] = [data, ...((allResults || []).filter(r => r && r !== data))];
    const m = this.mergeAddressComponents(sources);

    const stateName = m['administrative_area_level_1'] || '';
    const districtName = m['administrative_area_level_2'] || '';
    const cityName = m['locality'] || '';
    const sublocality1 = m['sublocality_level_1'] || m['sublocality'] || '';
    const sublocality2 = m['sublocality_level_2'] || '';
    const neighborhood = m['neighborhood'] || '';
    const postalCode = m['postal_code'] || '';
    const landmarkName = m['point_of_interest'] || m['establishment'] || '';

    // State
    if (stateName) {
      this.projectData.state = stateName;
    }

    // PIN code
    if (postalCode) {
      const pc = postalCode.replace(/\D/g, '').slice(0, 6);
      if (pc.length === 6) this.projectData.pinCode = pc;
    }

    // City
    const rawCity = (cityName || districtName || '').replace(/\s*\b(division|district|dist)\b/gi, '').trim();
    if (rawCity) {
      const formattedCity = this.formatCityName(rawCity);
      this.ensureCityInList(formattedCity);
      const matched = this.cityList.find(c => c.toLowerCase() === formattedCity.toLowerCase());
      this.projectData.city = matched || formattedCity;
    }

    // Locality: sublocality_level_1 -> sublocality_level_2 -> neighborhood
    const bestLoc = sublocality1 || sublocality2 || neighborhood || '';
    if (bestLoc) {
      this.projectData.locality = bestLoc.charAt(0).toUpperCase() + bestLoc.slice(1);
    }

    // Landmark
    if (landmarkName && (updateAddress || !this.projectData.landmark)) {
      this.projectData.landmark = landmarkName;
    }

    this.openMarkerInfoWindow();
    this.geocodingStatus = `✓ Location pinned: ${this.projectData.locality ? this.projectData.locality + ', ' : ''}${this.projectData.city || ''}${this.projectData.state ? ', ' + this.projectData.state : ''}${this.projectData.pinCode ? ' | PIN: ' + this.projectData.pinCode : ''}${this.gpsAccuracyNote}`;
  }

  /** Click on a building / shop / POI icon on the map -> exact address of that place */
  private handleMapPlaceClick(placeId: string, lat: number, lng: number): void {
    this.gpsAccuracyNote = '';
    this.geocodingStatus = 'Fetching selected place details...';

    // Put the pin on the clicked spot immediately
    this.projectData.latitude = lat.toFixed(6);
    this.projectData.longitude = lng.toFixed(6);
    this.updateMapSource();
    this.placeOrUpdateMarker(lat, lng, false);

    this.googleMapsLoader.getPlaceDetails(placeId).then((parsed) => {
      this.ngZone.run(() => {
        if (parsed && parsed.raw) {
          this.applyPlaceDetails(parsed.raw, lat, lng);
        } else {
          this.geocodeByPlaceId(placeId, lat, lng);
        }
      });
    });
  }

  private geocodeByPlaceId(placeId: string, lat: number, lng: number): void {
    const g = (window as any).google?.maps;
    if (!g || !g.Geocoder) {
      this.updateMarkerAndGeocode(lat, lng);
      return;
    }
    if (!this.geocoderInstance) {
      this.geocoderInstance = new g.Geocoder();
    }
    this.geocoderInstance.geocode({ placeId }, (results: any[], status: string) => {
      this.ngZone.run(() => {
        if (status === 'OK' && results && results.length > 0) {
          this.applyPlaceDetails(results[0], lat, lng);
        } else {
          this.updateMarkerAndGeocode(lat, lng);
        }
      });
    });
  }

  /** Plain point (drag / map click / GPS / typed Lat-Long): pin, reverse geocode and business name. */
  updateMarkerAndGeocode(lat: number, lng: number): void {
    this.clearPlaceName();
    this.gpsAccuracyNote = '';
    this.moveMarker(lat, lng);
    this.geocodingStatus = `Map pin set: ${lat.toFixed(6)}, ${lng.toFixed(6)}. Fetching location address...`;
    this.reverseGeocodeLatLong(lat, lng, true);
    this.attachBusinessNameAt(lat, lng, ++this.nameLookupId);
  }

  // ---------- reverse geocode helpers ----------

  /** Plus Code results (e.g. "7JFJ+4X Nagpur") are useless as an address - skip them. */
  private isPlusCodeResult(r: any): boolean {
    if (!r) return false;
    const types: string[] = r.types || [];
    if (types.includes('plus_code')) return true;
    const fa = String(r.formatted_address || '').trim();
    return /^[A-Z0-9]{4,8}\+[A-Z0-9]{2,}(\s|,|$)/i.test(fa);
  }

  /** Most specific result (street address > premise > POI > route > neighbourhood > locality). */
  private pickMostSpecificResult(results: any[]): any {
    const priority = [
      'street_address', 'premise', 'subpremise', 'establishment', 'point_of_interest', 'route',
      'intersection', 'neighborhood', 'sublocality_level_2', 'sublocality_level_1', 'sublocality', 'locality'
    ];
    let best: any = null;
    let bestScore = Number.MAX_SAFE_INTEGER;
    for (const r of results) {
      const types: string[] = r.types || [];
      let score = priority.length + 1;
      for (let i = 0; i < priority.length; i++) {
        if (types.includes(priority[i])) { score = i; break; }
      }
      if (score < bestScore) { bestScore = score; best = r; }
    }
    return best || results[0];
  }

  /** Merges address components of several results into one {type: long_name} map (earlier wins). */
  private mergeAddressComponents(results: any[]): { [type: string]: string } {
    const merged: { [type: string]: string } = {};
    for (const r of results) {
      const comps: any[] = (r && r.address_components) || [];
      for (const c of comps) {
        const types: string[] = c.types || [];
        for (const t of types) {
          if (!merged[t] && c.long_name) merged[t] = c.long_name;
        }
      }
    }
    return merged;
  }

  /** Distance in km between a point and a geocoder result's own location */
  private distanceKm(lat: number, lng: number, result: any): number {
    const loc = result?.geometry?.location;
    if (!loc) return 0;
    const rLat = typeof loc.lat === 'function' ? loc.lat() : loc.lat;
    const rLng = typeof loc.lng === 'function' ? loc.lng() : loc.lng;
    if (rLat === undefined || rLng === undefined) return 0;
    const toRad = (d: number) => (d * Math.PI) / 180;
    const dLat = toRad(rLat - lat);
    const dLng = toRad(rLng - lng);
    const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat)) * Math.cos(toRad(rLat)) * Math.sin(dLng / 2) ** 2;
    return 6371 * 2 * Math.asin(Math.sqrt(a));
  }

  reverseGeocodeLatLong(lat: number, lng: number, updateAddress: boolean = true): void {
    if (!Number.isFinite(lat) || !Number.isFinite(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      this.geocodingStatus = 'Invalid coordinates.';
      return;
    }
    const requestId = ++this.geoRequestId;

    const g = (window as any).google?.maps;
    if (g && g.Geocoder) {
      if (!this.geocoderInstance) this.geocoderInstance = new g.Geocoder();
      this.geocoderInstance.geocode({ location: { lat, lng } }, (results: any[], status: string) => {
        this.ngZone.run(() => {
          if (requestId !== this.geoRequestId) return;
          if (status === 'OK' && results && results.length > 0) {
            const usable = results.filter(r => !this.isPlusCodeResult(r));
            if (usable.length === 0) {
              this.fallbackNominatimReverse(lat, lng, updateAddress);
              return;
            }
            // An address must belong to the pin: ignore results farther than 3 km from it
            const near = usable.filter(r => this.distanceKm(lat, lng, r) <= 3);
            if (near.length === 0) {
              this.geocodingStatus = `Pin set at ${lat.toFixed(6)}, ${lng.toFixed(6)}. Google returned no address close to this point, so the address was not changed.`;
              return;
            }
            this.applyGoogleGeocodeResult(this.pickMostSpecificResult(near), updateAddress, near);
          } else {
            this.fallbackNominatimReverse(lat, lng, updateAddress);
          }
        });
      });
      return;
    }

    this.fallbackNominatimReverse(lat, lng, updateAddress);
  }

  private fallbackNominatimReverse(lat: number, lng: number, updateAddress: boolean = true): void {
    const url = `${this.NOMINATIM_URL}/reverse?format=json&lat=${encodeURIComponent(String(lat))}&lon=${encodeURIComponent(String(lng))}&zoom=18&addressdetails=1&accept-language=en`;
    fetch(url)
      .then(res => res.json())
      .then((data: any) => {
        this.ngZone.run(() => {
          if (!data) return;
          if (updateAddress && data.display_name) {
            this.projectData.address = data.display_name;
            this.lastResolvedAddress = data.display_name.trim();
          } else if (!this.projectData.address && data.display_name) {
            this.projectData.address = data.display_name;
            this.lastResolvedAddress = data.display_name.trim();
          }
          const a = data.address || {};
          if (a.state) this.projectData.state = a.state;
          if (a.postcode) {
            const pc = String(a.postcode).replace(/\D/g, '').slice(0, 6);
            if (pc.length === 6) this.projectData.pinCode = pc;
          }
          const rawCity = a.city || a.town || a.village || a.municipality || a.state_district || a.county || '';
          if (rawCity) {
            const formatted = this.formatCityName(rawCity);
            this.ensureCityInList(formatted);
            this.projectData.city = this.cityList.find(c => c.toLowerCase() === formatted.toLowerCase()) || formatted;
          }
          const loc = a.suburb || a.neighbourhood || a.city_district || a.quarter || a.residential || a.hamlet || '';
          if (loc) this.projectData.locality = loc;

          this.openMarkerInfoWindow();
          this.geocodingStatus = `✓ Location captured: ${this.projectData.locality ? this.projectData.locality + ', ' : ''}${this.projectData.city || ''}${this.projectData.pinCode ? ' | PIN: ' + this.projectData.pinCode : ''}`;
          this.updateMapSource();
        });
      })
      .catch(() => {
        this.ngZone.run(() => {
          this.geocodingStatus = `Pin set at Lat: ${lat.toFixed(6)}, Long: ${lng.toFixed(6)}`;
        });
      });
  }

  // ---------- typed / pasted address -> exact pin ----------

  /**
   * Typed / pasted address (or business name) -> exact pin.
   * Order: Places API (New) text search (exact business / building pin) -> Geocoding API -> OpenStreetMap.
   */
  private fetchGeocodeCoordinates(addr: string): void {
    if (!addr || addr.trim().length < 3) return;
    this.geocodingStatus = 'Searching Google Maps for exact location...';
    const reqId = ++this.geoRequestId;

    this.googleMapsLoader.geocode(addr.trim()).then((parsed: ParsedAddress | null) => {
      if (reqId !== this.geoRequestId) return;
      this.ngZone.run(() => {
        // Business / GMB / building found by Google Places
        if (parsed && parsed.source === 'places' && parsed.raw) {
          // The user typed this address (e.g. the GMB address): keep it exactly as typed,
          // only pin, state, city, locality and PIN come from the Google place.
          const typed = (this.projectData.address || '').trim();
          this.applyPlaceDetails(parsed.raw, undefined, undefined, 18);
          if (typed) {
            this.projectData.address = typed;
            this.lastResolvedAddress = typed;
            this.openMarkerInfoWindow();
            this.geocodingStatus = `✓ Exact Google pin: ${parsed.name ? parsed.name + ' - ' : ''}${parsed.lat.toFixed(6)}, ${parsed.lng.toFixed(6)}`;
          }
          // Several businesses share this address -> let the user pick the right one
          const choices = this.googleMapsLoader.lastAmbiguous || [];
          if (choices.length > 1) {
            this.addressSuggestions = choices;
            this.showAddressSuggestions = true;
            this.activeSuggestionIndex = -1;
            this.geocodingStatus = `⚠ ${choices.length} businesses share this address. "${parsed.name || choices[0].mainText}" is selected - pick the correct one from the list below the address box.`;
          } else if (!this.selectedPlaceName) {
            // Only a street / premise point was found (no business name) -> look for the real business of this address
            this.autoPickBusinessForAddress(addr, reqId);
          }
          return;
        }

        if (parsed && parsed.source !== 'osm' && parsed.raw && parsed.lat && parsed.lng) {
          const lat = Number(parsed.lat.toFixed(6));
          const lng = Number(parsed.lng.toFixed(6));

          this.gpsAccuracyNote = '';
          this.clearPlaceName();
          this.moveMarker(lat, lng, parsed.source === 'places' ? 18 : 17);
          this.attachBusinessNameAt(lat, lng, ++this.nameLookupId);
          // keep what the user typed; only fill state / city / locality / PIN
          this.applyGoogleGeocodeResult(parsed.raw, false, [parsed.raw]);
          this.lastResolvedAddress = (this.projectData.address || '').trim();

          const approx = parsed.source === 'geocoder' && parsed.locationType === 'APPROXIMATE';
          this.geocodingStatus = approx
            ? `⚠ Only the area was found (Lat: ${lat}, Long: ${lng}). Pick a suggestion from the list, type the business/building name, or drag the pin for the exact spot.`
            : `✓ Exact location captured! Lat: ${lat}, Long: ${lng}${this.projectData.pinCode ? ', PIN: ' + this.projectData.pinCode : ''}`;

          // Look for the real business (GMB) that uses this address, so its Google name shows on the pin
          this.autoPickBusinessForAddress(addr, reqId);
          return;
        }

        if (this.googleMapsLoader.lastError) {
          this.geocodingStatus = this.googleMapsLoader.lastError;
        }
        this.fallbackAddressSearch(addr);
      });
    }).catch(() => {
      this.ngZone.run(() => this.fallbackAddressSearch(addr));
    });
  }

  /** OpenStreetMap fallback (approximate). Several shorter query versions are tried. */
  private fallbackAddressSearch(addr: string): void {
    const cleanedQuery = addr
      .replace(/(?:flat|unit|plot|house|shop|office)\s*(?:no\.?|number)?\s*[:#-]?\s*[a-z0-9\/-]+/gi, '')
      .replace(/\s+/g, ' ')
      .trim();

    const queries: string[] = [];
    if (cleanedQuery) queries.push(cleanedQuery);
    if (addr.trim() !== cleanedQuery) queries.push(addr.trim());

    const parts = addr.split(',').map(p => p.trim()).filter(Boolean);
    if (parts.length >= 3) {
      queries.push(parts.slice(-3).join(', '));
    }
    const locCity = `${this.projectData.locality || ''} ${this.projectData.city || ''} ${this.projectData.pinCode || ''}`.trim();
    if (locCity && !queries.includes(locCity)) queries.push(locCity);

    const reqId = this.geoRequestId;

    const tryGeocode = (index: number) => {
      if (reqId !== this.geoRequestId) return;
      if (index >= queries.length) {
        this.geocodingStatus = 'Address not found. Add the area, city and pin code, or click on the map.';
        return;
      }
      const searchUrl = `${this.NOMINATIM_URL}/search?format=json&addressdetails=1&limit=1&countrycodes=in&accept-language=en&q=${encodeURIComponent(queries[index])}`;
      fetch(searchUrl)
        .then(res => res.json())
        .then((data: any[]) => {
          if (reqId !== this.geoRequestId) return;
          if (data && data.length > 0) {
            const lat = Number(parseFloat(data[0].lat).toFixed(6));
            const lng = Number(parseFloat(data[0].lon).toFixed(6));
            this.ngZone.run(() => {
              this.clearPlaceName();
              this.moveMarker(lat, lng, index === 0 ? 17 : 15);
              this.reverseGeocodeLatLong(lat, lng, false);
              this.attachBusinessNameAt(lat, lng, ++this.nameLookupId);
              this.lastResolvedAddress = (this.projectData.address || '').trim();
              this.geocodingStatus = `⚠ Approximate location from OpenStreetMap (Lat: ${lat}, Long: ${lng}) - Google could not find it. Drag the pin to the exact spot.`;
            });
          } else {
            setTimeout(() => tryGeocode(index + 1), 1100); // Nominatim: about 1 request per second
          }
        })
        .catch(() => setTimeout(() => tryGeocode(index + 1), 1100));
    };

    tryGeocode(0);
  }

  // ---------- Plus Code helpers ----------
  private readonly PLUS_CODE_RE = /(?:^|[\s,])([23456789CFGHJMPQRVWX]{4,8}\+[23456789CFGHJMPQRVWX]{2,7})(?=$|[\s,])/i;

  private extractPlusCode(addr: string): { code: string; rest: string } | null {
    const m = (addr || '').match(this.PLUS_CODE_RE);
    if (!m) return null;
    const rest = addr
      .replace(m[1], '')
      .replace(/^[\s,]+|[\s,]+$/g, '')
      .replace(/\s*,\s*,/g, ',');
    return { code: m[1].toUpperCase(), rest };
  }

  /** Returns true when the lookup was started (the generic path is then skipped). */
  private resolvePlusCodeAddress(addr: string, plus: { code: string; rest: string }): boolean {
    const g = (window as any).google?.maps;
    if (!g || !g.Geocoder) return false;
    if (!this.geocoderInstance) this.geocoderInstance = new g.Geocoder();
    const reqId = ++this.geoRequestId;

    const restParts = plus.rest
      .split(',')
      .map(x => x.replace(/\b[1-9][0-9]{5}\b/g, '').trim())
      .filter(x => x && !/^(india|bharat)$/i.test(x));
    const locality = restParts.slice(-2).join(', ');
    const queries = [`${plus.code} ${locality}`.trim(), `${plus.code} ${plus.rest}`.trim()];

    this.geocodingStatus = `Locating Plus Code ${plus.code}...`;

    const tryQuery = (i: number) => {
      if (i >= queries.length) {
        this.ngZone.run(() => {
          if (reqId === this.geoRequestId) {
            this.geocodingStatus = 'Searching map coordinates, state, city & pincode...';
            this.fetchGeocodeCoordinates(addr);
          }
        });
        return;
      }
      this.geocoderInstance.geocode({ address: queries[i], region: 'in' }, (results: any[], status: string) => {
        this.ngZone.run(() => {
          if (reqId !== this.geoRequestId) return;
          if (status !== 'OK' || !results || results.length === 0) {
            tryQuery(i + 1);
            return;
          }
          const r = results.find((x: any) => (x.types || []).includes('plus_code')) || results[0];
          const isPlus = (r.types || []).includes('plus_code');
          const approx = r.geometry?.location_type === 'APPROXIMATE' && !isPlus;
          const loc = r.geometry?.location;
          if (!loc || approx) {
            tryQuery(i + 1);
            return;
          }

          const lat = Number((typeof loc.lat === 'function' ? loc.lat() : loc.lat).toFixed(6));
          const lng = Number((typeof loc.lng === 'function' ? loc.lng() : loc.lng).toFixed(6));

          this.showAddressSuggestions = false;
          this.addressSuggestions = [];
          this.gpsAccuracyNote = '';
          this.clearPlaceName();
          this.moveMarker(lat, lng, 19);

          // keep the address exactly as typed; fill only state / city / locality / PIN
          this.applyGoogleGeocodeResult(r, false, results);
          this.lastResolvedAddress = addr.trim();

          this.attachBusinessNameAt(lat, lng, ++this.nameLookupId);
          this.geocodingStatus = `✓ Exact Plus Code location: ${plus.code} (${lat}, ${lng})`;
        });
      });
    };

    tryQuery(0);
    return true;
  }

  /** Typed / pasted address -> Lat, Long, City, Locality, State, Pin Code */
  async geocodeAddress(force: boolean = false): Promise<void> {
    const addr = (this.projectData.address || '').trim();
    if (!addr) return;
    if (this.selectingSuggestion || (!force && addr === this.lastResolvedAddress)) return;

    // "21.125746, 79.058728" typed / pasted in the address box -> use these EXACT coordinates
    const coords = parseLatLngText(addr);
    if (coords) {
      this.showAddressSuggestions = false;
      this.updateMarkerAndGeocode(coords.lat, coords.lng);
      if (this.mapInstance) this.mapInstance.setZoom(18);
      return;
    }

    // Address starting with a Plus Code -> the Plus Code IS the exact spot
    const plus = this.extractPlusCode(addr);
    if (plus && this.resolvePlusCodeAddress(addr, plus)) {
      return;
    }

    // PIN typed in the address (fallback if Google leaves it empty)
    const pinInText = (addr.match(/(?<![\d.])[1-9][0-9]{5}(?!\d)/) || [''])[0];
    if (pinInText && !this.projectData.pinCode) this.projectData.pinCode = pinInText;

    this.geocodingStatus = 'Searching map coordinates, state, city & pincode...';
    this.fetchGeocodeCoordinates(addr);
  }

  // ---------- address suggestion list ----------

  async selectAddressSuggestion(sg: PlaceSuggestion): Promise<void> {
    this.suggestRequestId++; // stop late GMB results from reopening the list
    this.showAddressSuggestions = false;
    this.addressSuggestions = [];
    this.geocodingStatus = `Fetching exact location of "${sg.mainText}"...`;
    const requestId = ++this.geoRequestId;
    this.selectingSuggestion = true;

    const parsed = await this.googleMapsLoader.getPlaceDetails(sg.placeId);
    this.selectingSuggestion = false;
    if (requestId !== this.geoRequestId) return;

    this.ngZone.run(() => {
      if (parsed && parsed.raw) {
        this.applyPlaceDetails(parsed.raw);
      } else {
        // place details unavailable -> resolve the suggestion text with text search / geocoder
        this.projectData.address = sg.fullText;
        this.lastResolvedAddress = '';
        this.fetchGeocodeCoordinates(sg.fullText);
      }
    });
  }

  private async requestAddressSuggestions(): Promise<void> {
    const addr = (this.projectData.address || '').trim();
    if (addr.length < 2) return;
    const reqId = ++this.suggestRequestId;
    this.suggestionsLoading = true;

    // Step 1: normal Google suggestions (instant)
    const list = await this.googleMapsLoader.autocomplete(addr);
    if (reqId !== this.suggestRequestId) return;
    this.ngZone.run(() => {
      this.suggestionsLoading = false;
      this.addressSuggestions = list;
      this.showAddressSuggestions = list.length > 0;
      this.activeSuggestionIndex = -1;
      if (list.length === 0 && this.googleMapsLoader.lastError) {
        this.geocodingStatus = this.googleMapsLoader.lastError;
      }
    });

    // Step 2: real businesses (GMB) that use this exact address, e.g. a university for its full address.
    if (addr.split(/[\s,]+/).filter(Boolean).length >= 3) {
      await new Promise((r) => setTimeout(r, 500));
      if (reqId !== this.suggestRequestId) return;
      const biz = await this.googleMapsLoader.discoverBusinessesForAddress(addr);
      if (reqId !== this.suggestRequestId || biz.length === 0) return;
      this.ngZone.run(() => {
        const ids = new Set(biz.map((b) => b.placeId));
        this.addressSuggestions = [...biz, ...this.addressSuggestions.filter((s) => !ids.has(s.placeId))];
        this.showAddressSuggestions = true;
        this.activeSuggestionIndex = -1;
      });
    }
  }

  onAddressPaste(event: ClipboardEvent): void {
    setTimeout(() => {
      this.lastResolvedAddress = '';
      if (parseLatLngText(this.projectData.address || '')) {
        this.geocodeAddress(true); // pasted "lat, long" -> exact coordinates
        return;
      }
      this.requestAddressSuggestions();
    }, 50);
  }

  // Typing shows Google suggestions (business / GMB name, society, landmark, address).
  // The exact pin is taken when a suggestion is picked, on Enter, on blur or AUTO-FETCH DATA.
  onAddressInput(): void {
    this.lastResolvedAddress = '';
    this.activeSuggestionIndex = -1;
    if (this.suggestTimer) clearTimeout(this.suggestTimer);
    const addr = (this.projectData.address || '').trim();
    if (addr.length < 2 || parseLatLngText(addr)) {
      this.suggestRequestId++; // cancel any in-flight lookup
      this.suggestionsLoading = false;
      this.addressSuggestions = [];
      this.showAddressSuggestions = false;
      return;
    }
    this.suggestTimer = setTimeout(() => this.requestAddressSuggestions(), 250);
  }

  /** AUTO-FETCH DATA button: always search again, even if the same address was resolved before */
  refetchAddress(): void {
    this.lastResolvedAddress = '';
    this.geocodeAddress(true);
  }

  onAddressKeydown(ev: KeyboardEvent): void {
    const n = this.addressSuggestions.length;
    if (this.showAddressSuggestions && n > 0) {
      if (ev.key === 'ArrowDown') {
        ev.preventDefault();
        this.activeSuggestionIndex = (this.activeSuggestionIndex + 1) % n;
        return;
      }
      if (ev.key === 'ArrowUp') {
        ev.preventDefault();
        this.activeSuggestionIndex = (this.activeSuggestionIndex - 1 + n) % n;
        return;
      }
      if (ev.key === 'Escape') {
        this.showAddressSuggestions = false;
        return;
      }
    }
    if (ev.key === 'Enter') {
      ev.preventDefault();
      const typedPlus = this.extractPlusCode((this.projectData.address || '').trim());
      if (typedPlus && this.activeSuggestionIndex < 0) {
        // Plus Code address: exact point, do not jump to the top (possibly neighbouring) suggestion
        this.suggestRequestId++;
        this.showAddressSuggestions = false;
        this.geocodeAddress(true);
      } else if (this.showAddressSuggestions && this.addressSuggestions.length > 0) {
        // Highlighted suggestion, otherwise the top one: exact Google place pin
        const idx = this.activeSuggestionIndex >= 0 ? this.activeSuggestionIndex : 0;
        this.selectAddressSuggestion(this.addressSuggestions[idx]);
      } else {
        this.suggestRequestId++;
        this.showAddressSuggestions = false;
        this.geocodeAddress();
      }
    }
  }

  onAddressBlur(): void {
    // Delay so a click on a suggestion is handled first
    setTimeout(() => {
      this.suggestRequestId++; // field left: no late dropdown
      this.suggestionsLoading = false;
      this.showAddressSuggestions = false;
      if (!this.selectingSuggestion) this.geocodeAddress();
    }, 180);
  }

  // ---------- manual Lat / Long entry ----------
  // Wait briefly until the user has finished entering BOTH fields, then reverse-geocode
  // using the entered coordinates (so a half-typed value never triggers a lookup).
  onLatLongChange(): void {
    if (this.geocodeTimeout) {
      clearTimeout(this.geocodeTimeout);
    }

    this.lastResolvedAddress = '';

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

      this.clearPlaceName();
      this.gpsAccuracyNote = '';
      // Keep the entered coordinates exactly to 6 decimal places, move the pin, fetch address + business name.
      this.moveMarker(lat, lng, 17);
      this.geocodingStatus = 'Fetching exact address from the entered Lat/Long...';
      this.reverseGeocodeLatLong(lat, lng, true);
      this.attachBusinessNameAt(lat, lng, ++this.nameLookupId);
    }, 700);
  }

  // ---------- MY LOCATION (GPS) ----------
  // A single getCurrentPosition() often returns a coarse Wi-Fi / IP based fix. We therefore watch the
  // GPS for a few seconds, keep the most accurate reading and stop as soon as it is within 25 m.
  private gpsWatchId: number | null = null;
  private gpsStopTimer: any = null;

  private stopGpsWatch(): void {
    if (this.gpsWatchId !== null && navigator.geolocation) {
      navigator.geolocation.clearWatch(this.gpsWatchId);
    }
    this.gpsWatchId = null;
    if (this.gpsStopTimer) {
      clearTimeout(this.gpsStopTimer);
      this.gpsStopTimer = null;
    }
  }

  locateCurrentPosition(): void {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }
    this.stopGpsWatch();
    this.geocodingStatus = 'Detecting precise GPS location... (waiting for the best accuracy)';
    this.gpsAccuracyNote = '';

    let best: GeolocationPosition | null = null;

    const finish = () => {
      this.stopGpsWatch();
      this.ngZone.run(() => {
        if (!best) {
          this.geocodingStatus = 'Could not detect location. Please check browser permission.';
          return;
        }
        const lat = best.coords.latitude;
        const lng = best.coords.longitude;
        const accuracy = Math.round(best.coords.accuracy || 0);

        this.updateMarkerAndGeocode(lat, lng);
        if (this.mapInstance) {
          this.mapInstance.setCenter({ lat, lng });
          this.mapInstance.setZoom(accuracy > 100 ? 15 : 18);
        }

        this.gpsAccuracyNote = accuracy > 100
          ? ` ⚠ GPS accuracy low (~${accuracy} m). Desktop/laptop browsers have no GPS - use a phone, or drag the pin / search the address for the exact spot.`
          : '';
        this.geocodingStatus = `✓ Current location detected (${lat.toFixed(6)}, ${lng.toFixed(6)}) accuracy ~${accuracy} m.${this.gpsAccuracyNote}`;
      });
    };

    this.gpsWatchId = navigator.geolocation.watchPosition(
      (pos) => {
        if (!best || pos.coords.accuracy < best.coords.accuracy) {
          best = pos;
          this.ngZone.run(() => {
            this.geocodingStatus = `Detecting precise GPS location... best accuracy so far ~${Math.round(pos.coords.accuracy)} m`;
          });
        }
        if (pos.coords.accuracy <= 25) {
          finish();
        }
      },
      (err) => {
        this.stopGpsWatch();
        this.ngZone.run(() => {
          if (best) {
            finish();
          } else if (err && err.code === 1) {
            this.geocodingStatus = 'Location permission denied. Please allow location access in your browser settings.';
          } else if (err && err.code === 3) {
            this.geocodingStatus = 'Location detection timed out. Please try again.';
          } else {
            this.geocodingStatus = 'Could not detect location. Please check browser permission.';
          }
        });
      },
      { enableHighAccuracy: true, timeout: 20000, maximumAge: 0 }
    );

    // Stop after 12 s and use the best reading collected so far
    this.gpsStopTimer = setTimeout(() => finish(), 12000);
  }

  // ==========================================
  // STEP NAVIGATION
  // ==========================================
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
        this.updateMapSource();
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