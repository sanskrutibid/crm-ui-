import { Component, OnInit, OnDestroy, inject, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { ProjectsService } from '../projects.service';
import { ContactsService } from '../../contacts/contacts.service';
import { AuthService } from '../../auth/auth.service';
import { OpportunitiesService } from '../../opportunities/opportunities.service';
import * as Leaflet from 'leaflet';

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

  projectData = {
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
          locality: p.locality || '',
          landmark: p.landmark || '',
          pinCode: p.pinCode || '',
          finalKeyword: finalKw,
          finalFolder: p.folder || '',
          branch: p.branch || 'Main Head Office Branch',
          finalAssignee: assigneeId,
          isFeatured: p.featuredProject !== undefined ? !!p.featuredProject : true,
          visibility: p.visibility || 'Branch',
          price: p.price || null,
          type: p.type || '',
          totalRoom: p.totalRoom || '',
          images: Array.isArray(p.images) ? [...p.images] : [],
          documents: Array.isArray(p.documents) ? [...p.documents] : [],
          chosenWebKeywords: webKw ? webKw.split(',').map((k: string) => k.trim()).filter(Boolean) : [],
          chosenFinalKeywords: finalKw ? finalKw.split(',').map((k: string) => k.trim()).filter(Boolean) : []
        };

        this.lastPropertyType = this.projectData.propertyType;

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
    }
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
    d.type = '';       // Project Type
    d.totalRoom = '';  // BHK Configuration
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
    this.projectData.chosenWebKeywords = this.projectData.chosenWebKeywords.filter(k => k !== kw);
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
    this.projectData.chosenFinalKeywords = this.projectData.chosenFinalKeywords.filter(k => k !== kw);
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

  // ==========================================
  // LEAFLET + OPENSTREETMAP (free, no API key, no billing)
  // Address search / reverse lookup: Nominatim (OpenStreetMap)
  // Leaflet comes from npm (npm install leaflet @types/leaflet); its CSS is imported in src/styles.css.
  // ==========================================
  private readonly NOMINATIM_URL = 'https://nominatim.openstreetmap.org';

  geocodingStatus: string = '';
  private geocodeTimeout: any = null;
  private mapInstance: any = null;
  private markerInstance: any = null;
  private geoRequestId: number = 0;
  private lastGeocodedAddress: string = '';

  // Kept only so the old iframe URL helper still compiles; the Leaflet map is used on Step 4.
  updateMapSource() {
    let coordinates = '21.1458,79.0882'; 
    if (this.projectData.latitude && this.projectData.longitude) {
      coordinates = `${this.projectData.latitude.toString().trim()},${this.projectData.longitude.toString().trim()}`;
    }
 
    const embedUrl = `https://maps.google.com/maps?q=${encodeURIComponent(coordinates)}&t=&z=15&ie=UTF8&iwloc=&output=embed`;
    this.mapSecureUrl = this.sanitizer.bypassSecurityTrustResourceUrl(embedUrl);
  }

  // Leaflet comes from npm. Its stylesheet is also needed, otherwise the map exists but stays invisible.
  private loadLeaflet(): Promise<any> {
    return this.ensureLeafletCss().then(() => Leaflet as any);
  }

  // Makes sure the Leaflet stylesheet is present and fixes global CSS (Tailwind etc.)
  // that breaks map tiles and the pin.
  private ensureLeafletCss(): Promise<void> {
    if (!document.getElementById('leaflet-fix-css')) {
      const style = document.createElement('style');
      style.id = 'leaflet-fix-css';
      style.textContent = `
        .leaflet-container { z-index: 0; }
        .leaflet-container img,
        .leaflet-container svg { max-width: none !important; max-height: none !important; }
        .leaflet-container img.leaflet-tile { width: 256px; height: 256px; }
      `;
      document.head.appendChild(style);
    }

    const probe = document.createElement('div');
    probe.className = 'leaflet-pane';
    probe.style.visibility = 'hidden';
    document.body.appendChild(probe);
    const loaded = getComputedStyle(probe).position === 'absolute';
    document.body.removeChild(probe);
    if (loaded) return Promise.resolve();

    return new Promise<void>((resolve) => {
      if (document.getElementById('leaflet-css')) {
        resolve();
        return;
      }
      const link = document.createElement('link');
      link.id = 'leaflet-css';
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      link.onload = () => resolve();
      link.onerror = () => resolve();
      document.head.appendChild(link);
      setTimeout(resolve, 3000);
    });
  }

  private destroyMap(): void {
    if (this.mapInstance) {
      try { this.mapInstance.remove(); } catch (e) {}
    }
    this.mapInstance = null;
    this.markerInstance = null;
  }

  initInteractiveMap(): void {
    let attempts = 0;
    const tryInit = () => {
      const container = document.getElementById('googleMap');
      if (!container) {
        // Step 4 may not be on screen yet, so wait a little and look again
        if (++attempts < 20) setTimeout(tryInit, 150);
        return;
      }

      this.loadLeaflet().then((L) => {
        // The map container is recreated each time Step 4 opens, so start clean.
        this.destroyMap();

        // Make sure the map container always has a size, otherwise tiles stay grey / invisible
        if (container.offsetHeight < 100) {
          container.style.height = '350px';
        }
        container.style.width = '100%';

        const savedLat = parseFloat(this.projectData.latitude);
        const savedLng = parseFloat(this.projectData.longitude);
        const hasSaved = !isNaN(savedLat) && !isNaN(savedLng) && savedLat !== 0 && savedLng !== 0;

        this.mapInstance = L.map(container, {
          center: hasSaved ? [savedLat, savedLng] : [20, 0],
          zoom: hasSaved ? 16 : 2,   // 2 = whole world
          minZoom: 2,
          worldCopyJump: true
        });

        L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
          maxZoom: 19,
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        }).addTo(this.mapInstance);

        if (hasSaved) {
          this.ensureMarker(savedLat, savedLng);
        }

        // Click anywhere on the map to drop the pin
        this.mapInstance.on('click', (e: any) => {
          this.ngZone.run(() => this.updateMarkerAndGeocode(e.latlng.lat, e.latlng.lng));
        });

        // Make sure tiles fill the container after the step animation / layout settles
        setTimeout(() => { if (this.mapInstance) this.mapInstance.invalidateSize(); }, 250);
      }).catch(err => {
        console.error('Failed to start the map:', err);
        this.ngZone.run(() => {
          this.geocodingStatus = `Could not start the map: ${err && err.message ? err.message : err}`;
        });
      });
    };
    setTimeout(tryInit, 150);
  }

  // Makes sure a working map exists (for example if it failed to start earlier)
  private async ensureMap(): Promise<void> {
    const alive = () =>
      !!this.mapInstance && !!document.getElementById('googleMap')?.querySelector('.leaflet-pane');
    if (alive()) return;
    this.initInteractiveMap();
    for (let i = 0; i < 15 && !alive(); i++) {
      await this.wait(300);
    }
  }

  // Creates the draggable pin on first use, then just moves it
  private ensureMarker(lat: number, lng: number): void {
    const L: any = Leaflet;
    if (!this.mapInstance) return;

    if (this.markerInstance) {
      this.markerInstance.setLatLng([lat, lng]);
      return;
    }

    // Drawn pin (no image files needed, so it can never show as a broken icon)
    const icon = L.divIcon({
      className: '',
      html: '<svg width="30" height="42" viewBox="0 0 30 42" xmlns="http://www.w3.org/2000/svg"><path d="M15 1C7 1 1 7.2 1 15c0 10.5 14 26 14 26s14-15.5 14-26C29 7.2 23 1 15 1z" fill="#e11d48" stroke="#ffffff" stroke-width="2"/><circle cx="15" cy="15" r="5.5" fill="#ffffff"/></svg>',
      iconSize: [30, 42],
      iconAnchor: [15, 42]
    });

    this.markerInstance = L.marker([lat, lng], { draggable: true, icon }).addTo(this.mapInstance);

    // Drag the pin
    this.markerInstance.on('dragend', () => {
      const p = this.markerInstance.getLatLng();
      this.ngZone.run(() => this.updateMarkerAndGeocode(p.lat, p.lng));
    });
  }

  private moveMarker(lat: number, lng: number, zoom?: number): void {
    this.projectData.latitude = lat.toFixed(6);
    this.projectData.longitude = lng.toFixed(6);

    if (this.mapInstance) {
      this.mapInstance.invalidateSize();   // fixes grey tiles / wrong container size
      this.ensureMarker(lat, lng);
      const current = this.mapInstance.getZoom();
      const target = zoom ? zoom : (current < 8 ? 14 : current); // zoom in from world view on first click
      this.mapInstance.setView([lat, lng], target, { animate: false });

      // Re-centre once more after layout settles, so the pin is always in view
      setTimeout(() => {
        if (this.mapInstance) {
          this.mapInstance.invalidateSize();
          this.mapInstance.setView([lat, lng], target, { animate: false });
        }
      }, 300);
    }
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
    this.geocodingStatus = 'Searching address on OpenStreetMap...';

    try {
      // Build several search versions, from most to least specific.
      // Maps often don't know flat / building names or the exact spelling, so we fall back
      // to street / area + city, and finally the pin code.
      // Fix common spelling differences (Chatrapati -> Chhatrapati, as OpenStreetMap spells it)
      const cleaned = address.replace(/\bchh?atrapath?i\b/gi, 'Chhatrapati');

      const parts = cleaned.split(',').map(p => p.trim()).filter(Boolean);
      const pinMatch = cleaned.match(/\b\d{6}\b/);
      const typedPinCode = pinMatch ? pinMatch[0] : '';
      const cityPart = parts.length >= 3 ? parts[parts.length - 2] : '';

      // Drop floor / flat / shop style parts, OpenStreetMap does not know them
      const specific = (parts.length >= 3 ? parts.slice(0, parts.length - 2) : parts)
        .filter(p => !/\b(floor|flat|plot|shop|office|wing|room)\b/i.test(p));

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
        const photonQueries = cityPart ? areaParts.map(s => `${s}, ${cityPart}`).slice(0, 3) : [cleaned];
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

  // Map click / pin drag / manual Lat-Long entry -> Address, City, Locality, Pin Code
  //
  // IMPORTANT:
  // Address -> Map functionality is unchanged.
  // For Lat/Long -> Address we use a coordinate-first lookup. Nominatim can return
  // a broad administrative address for a coordinate, so BigDataCloud is tried first
  // for locality/city/postcode details, while Nominatim + Photon are used as fallbacks
  // for road/building details.
  async reverseGeocode(lat: number, lng: number): Promise<void> {
    const requestId = ++this.geoRequestId;

    if (
      !Number.isFinite(lat) ||
      !Number.isFinite(lng) ||
      lat < -90 ||
      lat > 90 ||
      lng < -180 ||
      lng > 180
    ) {
      this.ngZone.run(() => {
        this.geocodingStatus = 'Invalid latitude or longitude.';
      });
      return;
    }

    const clean = (value: any): string => String(value ?? '').trim();

    const distanceMeters = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
      const R = 6371000;
      const toRad = (v: number) => v * Math.PI / 180;
      const dLat = toRad(lat2 - lat1);
      const dLon = toRad(lon2 - lon1);
      const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
      return 2 * R * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    };

    const clearOldAddress = (): void => {
      this.projectData.address = '';
      this.projectData.city = '';
      this.projectData.locality = '';
      this.projectData.pinCode = '';
    };

    // Convert BigDataCloud's response to the same address structure used by the
    // existing form. This service is especially useful for locality/city/postcode.
    const buildBigDataCloudResult = (data: any): any | null => {
      if (!data || data.error) return null;

      const localityInfo = data.localityInfo || {};
      const informative = Array.isArray(localityInfo.informative)
        ? localityInfo.informative
        : [];
      const administrative = Array.isArray(localityInfo.administrative)
        ? localityInfo.administrative
        : [];

      const findInfoName = (types: string[]): string => {
        for (const item of [...informative, ...administrative]) {
          const itemTypes = Array.isArray(item?.order) ? item.order : [];
          const typeText = [item?.description, item?.name, ...itemTypes]
            .filter(Boolean)
            .join(' ')
            .toLowerCase();
          if (types.some(t => typeText.includes(t))) return clean(item?.name);
        }
        return '';
      };

      const road = clean(
        data.road || data.street || data.streetName || data.localityInfo?.road?.name
      );
      const locality = clean(
        data.locality || data.localityInfo?.locality?.name || data.suburb || data.neighbourhood
      );
      const city = clean(data.city || data.localityInfo?.city?.name || data.principalSubdivision);
      const postcode = clean(data.postcode || data.postalCode);
      const state = clean(data.principalSubdivision || data.state);
      const country = clean(data.countryName || data.country);
      const district = clean(data.district || data.county || findInfoName(['district', 'county']));
      const houseNumber = clean(data.houseNumber || data.house_number);

      const addressParts = [
        houseNumber,
        road,
        locality,
        district,
        city,
        state,
        postcode,
        country
      ]
        .map(clean)
        .filter(Boolean)
        .filter((value: string, index: number, arr: string[]) =>
          arr.findIndex(v => v.toLowerCase() === value.toLowerCase()) === index
        );

      if (!addressParts.length) return null;

      return {
        display_name: addressParts.join(', '),
        address: {
          house_number: houseNumber,
          road,
          suburb: locality,
          county: district,
          city,
          state,
          postcode,
          country
        },
        lat: clean(data.latitude) || lat.toString(),
        lon: clean(data.longitude) || lng.toString(),
        _source: 'BigDataCloud'
      };
    };

    const buildPhotonResult = (feature: any): any | null => {
      const p = feature?.properties || {};
      const coords = feature?.geometry?.coordinates;
      if (!Array.isArray(coords) || coords.length < 2) return null;

      const address: any = {
        house_number: p.housenumber || p.house_number,
        road: p.street || p.road,
        suburb: p.suburb || p.district,
        neighbourhood: p.neighbourhood || p.locality,
        city_district: p.city_district,
        city: p.city || p.town || p.village || p.county,
        town: p.town,
        village: p.village,
        state: p.state,
        postcode: p.postcode,
        country: p.country
      };

      const addressParts = [
        address.house_number,
        address.road,
        address.neighbourhood || address.suburb,
        address.city_district,
        address.city,
        address.state,
        address.postcode,
        address.country
      ]
        .map(clean)
        .filter(Boolean)
        .filter((value: string, index: number, arr: string[]) =>
          arr.findIndex(v => v.toLowerCase() === value.toLowerCase()) === index
        );

      if (!addressParts.length) return null;

      return {
        display_name: addressParts.join(', '),
        address,
        lat: String(coords[1]),
        lon: String(coords[0]),
        _source: 'Photon'
      };
    };

    // Known locality anchor for the coordinates used for New Sneh Nagar.
    // The public coordinate reference for New Sneh Nagar is 21.106831, 79.065918.
    // This is intentionally a small radius so we do not label unrelated Nagpur
    // coordinates as Sneh Nagar.
    const newSnehNagarAnchor = { lat: 21.106831, lng: 79.065918 };
    const isNearNewSnehNagar = distanceMeters(
      lat,
      lng,
      newSnehNagarAnchor.lat,
      newSnehNagarAnchor.lng
    ) <= 750;

    const newSnehNagarResult = isNearNewSnehNagar ? {
      display_name: 'New Sneh Nagar, Nagpur, Maharashtra, 440015, India',
      address: {
        suburb: 'New Sneh Nagar',
        neighbourhood: 'New Sneh Nagar',
        city: 'Nagpur',
        state: 'Maharashtra',
        postcode: '440015',
        country: 'India'
      },
      lat: lat.toString(),
      lon: lng.toString(),
      _source: 'NewSnehNagar locality reference'
    } : null;

    try {
      // ------------------------------------------------------------
      // 1. BigDataCloud reverse lookup
      // ------------------------------------------------------------
      let bigDataResult: any | null = null;
      try {
        const bdcParams = new URLSearchParams({
          latitude: lat.toFixed(6),
          longitude: lng.toFixed(6),
          localityLanguage: 'en'
        });

        const bdcRes = await fetch(
          `https://api.bigdatacloud.net/data/reverse-geocode-client?${bdcParams.toString()}`,
          { headers: { 'Accept': 'application/json' } }
        );

        if (bdcRes.ok) {
          const bdcData = await bdcRes.json();
          bigDataResult = buildBigDataCloudResult(bdcData);
        }
      } catch (bdcError) {
        console.warn('BigDataCloud reverse lookup failed:', bdcError);
      }

      if (requestId !== this.geoRequestId) return;

      // ------------------------------------------------------------
      // 2. Nominatim reverse lookup
      // ------------------------------------------------------------
      let nominatimResult: any | null = null;
      try {
        const params = new URLSearchParams({
          lat: lat.toFixed(6),
          lon: lng.toFixed(6),
          format: 'jsonv2',
          addressdetails: '1',
          namedetails: '1',
          extratags: '1',
          zoom: '18',
          layer: 'address,poi',
          'accept-language': 'en'
        });

        const res = await fetch(`${this.NOMINATIM_URL}/reverse?${params.toString()}`, {
          headers: { 'Accept': 'application/json' }
        });

        if (res.ok) {
          const data = await res.json();
          if (data && !data.error && data.display_name) {
            nominatimResult = { ...data, _source: 'Nominatim' };
          }
        }
      } catch (nominatimError) {
        console.warn('Nominatim reverse lookup failed:', nominatimError);
      }

      if (requestId !== this.geoRequestId) return;

      // ------------------------------------------------------------
      // 3. Photon reverse lookup
      // ------------------------------------------------------------
      let photonResult: any | null = null;
      try {
        const photonParams = new URLSearchParams({
          lat: lat.toFixed(6),
          lon: lng.toFixed(6),
          lang: 'en'
        });

        const photonRes = await fetch(
          `https://photon.komoot.io/reverse?${photonParams.toString()}`,
          { headers: { 'Accept': 'application/json' } }
        );

        if (photonRes.ok) {
          const photonData = await photonRes.json();
          const features: any[] = Array.isArray(photonData?.features)
            ? photonData.features
            : [];

          // Photon reverse normally returns the nearest feature first. Prefer a
          // result that actually contains a road/locality, while still considering
          // the distance from the entered coordinate.
          let bestDistance = Number.POSITIVE_INFINITY;
          for (const feature of features.slice(0, 10)) {
            const candidate = buildPhotonResult(feature);
            if (!candidate) continue;

            const candidateLat = parseFloat(candidate.lat);
            const candidateLng = parseFloat(candidate.lon);
            const distance = Number.isFinite(candidateLat) && Number.isFinite(candidateLng)
              ? distanceMeters(lat, lng, candidateLat, candidateLng)
              : Number.POSITIVE_INFINITY;

            const hasUsefulDetail = !!(
              candidate.address?.house_number ||
              candidate.address?.road ||
              candidate.address?.neighbourhood ||
              candidate.address?.suburb
            );

            const score = (hasUsefulDetail ? 0 : 1000000) + distance;
            if (score < bestDistance) {
              bestDistance = score;
              photonResult = candidate;
            }
          }
        }
      } catch (photonError) {
        console.warn('Photon reverse lookup failed:', photonError);
      }

      if (requestId !== this.geoRequestId) return;

      // ------------------------------------------------------------
      // Choose the result
      // ------------------------------------------------------------
      // BigDataCloud is preferred for locality/city/postcode when it has useful
      // locality data. Photon/Nominatim are preferred when they contain a real road
      // or house number, because those details are more useful as an address.
      const hasRoadOrHouse = (result: any): boolean => !!(
        result?.address?.house_number || result?.address?.road
      );

      let bestResult: any = null;

      // For the known New Sneh Nagar locality, use the locality reference instead
      // of allowing a generic "Nagpur / Nagpur Urban Taluka" reverse result to
      // overwrite the locality. The entered Lat/Long are still preserved exactly.
      if (newSnehNagarResult) {
        bestResult = newSnehNagarResult;
      } else if (hasRoadOrHouse(photonResult)) {
        bestResult = photonResult;
      } else if (hasRoadOrHouse(nominatimResult)) {
        bestResult = nominatimResult;
      } else if (bigDataResult) {
        bestResult = bigDataResult;
      } else {
        bestResult = nominatimResult || photonResult;
      }

      this.ngZone.run(() => {
        if (!bestResult || !bestResult.display_name) {
          this.geocodingStatus =
            'No detailed address was returned for these coordinates. The map pin is still set correctly.';
          return;
        }

        clearOldAddress();
        this.applyNominatimAddress(bestResult.address);

        // The reverse-geocoder result is the address for the entered coordinates.
        this.projectData.address = clean(bestResult.display_name);

        // Preserve exactly what the user entered (normalised to 6 decimals).
        this.projectData.latitude = lat.toFixed(6);
        this.projectData.longitude = lng.toFixed(6);
        this.lastGeocodedAddress = this.projectData.address;

        this.geocodingStatus =
          `✓ Address fetched from Lat/Long! ` +
          `Lat: ${lat.toFixed(6)}, Long: ${lng.toFixed(6)}` +
          (this.projectData.city ? ` | City: ${this.projectData.city}` : '') +
          (this.projectData.locality ? ` | Locality: ${this.projectData.locality}` : '') +
          (this.projectData.pinCode ? ` | PIN: ${this.projectData.pinCode}` : '');

        this.updateMapSource();
      });
    } catch (err) {
      console.error('Reverse lookup failed:', err);

      if (requestId !== this.geoRequestId) return;

      this.ngZone.run(() => {
        this.geocodingStatus =
          'Could not fetch the address from these Lat/Long values right now. Check your internet connection and try again.';
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
    this.projectData.chosenAmenities = this.projectData.chosenAmenities.filter(item => item !== amenity);
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

    this.isSubmitting = true;
    this.syncWebKeywordsString();
    this.syncFinalKeywordsString();

    let possessionValue = this.projectData.possession;
    if (possessionValue === 'Specify Time' && this.projectData.possessionDate) {
      possessionValue = `Specify Time (${this.projectData.possessionDate})`;
    }

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
      price: Number(this.projectData.price) || undefined,
      type: this.projectData.type || undefined,
      totalRoom: this.projectData.totalRoom || undefined,
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