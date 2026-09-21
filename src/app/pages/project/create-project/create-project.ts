import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
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

  geocodingStatus: string = '';
  private geocodeTimeout: any = null;
  private mapInstance: any = null;
  private markerInstance: any = null;

  updateMapSource() {
    let coordinates = '21.1458,79.0882'; 
    if (this.projectData.latitude && this.projectData.longitude) {
      coordinates = `${this.projectData.latitude.toString().trim()},${this.projectData.longitude.toString().trim()}`;
    }
 
    const embedUrl = `https://maps.google.com/maps?q=${encodeURIComponent(coordinates)}&t=&z=15&ie=UTF8&iwloc=&output=embed`;
    this.mapSecureUrl = this.sanitizer.bypassSecurityTrustResourceUrl(embedUrl);
  }

  initInteractiveMap(): void {
    setTimeout(() => {
      const container = document.getElementById('leafletMap');
      if (!container) return;

      if (!document.getElementById('leaflet-css')) {
        const link = document.createElement('link');
        link.id = 'leaflet-css';
        link.rel = 'stylesheet';
        link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
        document.head.appendChild(link);
      }

      const loadLeafletScript = (): Promise<any> => {
        return new Promise((resolve, reject) => {
          if ((window as any).L) {
            resolve((window as any).L);
            return;
          }
          const script = document.createElement('script');
          script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
          script.onload = () => resolve((window as any).L);
          script.onerror = (err) => reject(err);
          document.head.appendChild(script);
        });
      };

      loadLeafletScript().then((L) => {
        let initialLat = parseFloat(this.projectData.latitude) || 21.1458;
        let initialLng = parseFloat(this.projectData.longitude) || 79.0882;

        if (this.mapInstance) {
          try { this.mapInstance.remove(); } catch (e) {}
          this.mapInstance = null;
        }

        container.innerHTML = '';
        this.mapInstance = L.map('leafletMap').setView([initialLat, initialLng], 14);

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          maxZoom: 19,
          attribution: '&copy; OpenStreetMap contributors'
        }).addTo(this.mapInstance);

        this.markerInstance = L.marker([initialLat, initialLng], { draggable: true }).addTo(this.mapInstance);

        this.mapInstance.on('click', (e: any) => {
          const lat = e.latlng.lat;
          const lng = e.latlng.lng;
          this.updateMarkerAndGeocode(lat, lng);
        });

        this.markerInstance.on('dragend', (e: any) => {
          const position = e.target.getLatLng();
          this.updateMarkerAndGeocode(position.lat, position.lng);
        });
      }).catch(err => {
        console.error('Failed to load map library:', err);
      });
    }, 150);
  }

  updateMarkerAndGeocode(lat: number, lng: number): void {
    const roundedLat = lat.toFixed(6);
    const roundedLng = lng.toFixed(6);

    this.projectData.latitude = roundedLat;
    this.projectData.longitude = roundedLng;

    if (this.markerInstance) {
      this.markerInstance.setLatLng([lat, lng]);
    }
    if (this.mapInstance) {
      this.mapInstance.panTo([lat, lng]);
    }

    this.geocodingStatus = `Map position set: ${roundedLat}, ${roundedLng}. Fetching address details...`;
    this.reverseGeocode(lat, lng);
  }

  onAddressPaste(event: ClipboardEvent): void {
    setTimeout(() => {
      this.geocodeAddress();
    }, 100);
  }

  onAddressInput(): void {
    if (this.geocodeTimeout) {
      clearTimeout(this.geocodeTimeout);
    }
    this.geocodeTimeout = setTimeout(() => {
      if (this.projectData.address && this.projectData.address.trim().length > 5) {
        this.geocodeAddress();
      }
    }, 800);
  }

  geocodeAddress(): void {
    const address = (this.projectData.address || '').trim();
    if (!address) return;

    this.geocodingStatus = 'Searching address coordinates, city & pincode...';

    const searchQuery = this.projectData.city && !address.toLowerCase().includes(this.projectData.city.toLowerCase())
      ? `${address}, ${this.projectData.city}, India`
      : `${address}, India`;

    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&addressdetails=1&limit=1`;

    fetch(url)
      .then(res => res.json())
      .then((data: any[]) => {
        if (data && data.length > 0) {
          const result = data[0];
          const lat = parseFloat(result.lat);
          const lon = parseFloat(result.lon);

          this.projectData.latitude = lat.toFixed(6);
          this.projectData.longitude = lon.toFixed(6);

          const addr = result.address || {};
          if (addr.postcode) {
            this.projectData.pinCode = addr.postcode;
          }

          const foundCity = addr.city || addr.town || addr.village || addr.state_district || addr.county || '';
          if (foundCity) {
            const matched = this.cityList.find(c => c.toLowerCase() === foundCity.toLowerCase());
            if (matched) {
              this.projectData.city = matched;
            } else if (!this.projectData.city) {
              this.cityList.push(foundCity);
              this.projectData.city = foundCity;
            }
          }

          const locality = addr.suburb || addr.neighbourhood || addr.residential || addr.road || '';
          if (locality && !this.projectData.locality) {
            this.projectData.locality = locality;
          }

          if (this.mapInstance && this.markerInstance) {
            this.markerInstance.setLatLng([lat, lon]);
            this.mapInstance.setView([lat, lon], 15);
          }

          this.geocodingStatus = `✓ Location auto-captured! Lat: ${lat.toFixed(4)}, Lon: ${lon.toFixed(4)}` + 
            (addr.postcode ? `, PIN: ${addr.postcode}` : '');
        } else {
          this.geocodingStatus = 'Address not found on map. You can click anywhere on the map to set location pin.';
        }
      })
      .catch(err => {
        console.error('Geocoding error:', err);
        this.geocodingStatus = 'Geocoding request failed. Please click directly on the map.';
      });
  }

  reverseGeocode(lat: number, lng: number): void {
    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1`;

    fetch(url)
      .then(res => res.json())
      .then((result: any) => {
        if (result && result.address) {
          const addr = result.address;

          if (addr.postcode) {
            this.projectData.pinCode = addr.postcode;
          }

          const foundCity = addr.city || addr.town || addr.village || addr.state_district || addr.county || '';
          if (foundCity) {
            const matched = this.cityList.find(c => c.toLowerCase() === foundCity.toLowerCase());
            if (matched) {
              this.projectData.city = matched;
            } else if (!this.projectData.city) {
              this.cityList.push(foundCity);
              this.projectData.city = foundCity;
            }
          }

          const locality = addr.suburb || addr.neighbourhood || addr.residential || addr.road || '';
          if (locality) {
            this.projectData.locality = locality;
          }

          if (result.display_name && !this.projectData.address) {
            this.projectData.address = result.display_name;
          }

          this.geocodingStatus = `✓ Location captured from map! ${this.projectData.city ? 'City: ' + this.projectData.city : ''} ${addr.postcode ? '| PIN: ' + addr.postcode : ''}`;
        }
      })
      .catch(err => {
        console.error('Reverse geocoding error:', err);
      });
  }

  onLatLongChange(): void {
    const lat = parseFloat(this.projectData.latitude);
    const lng = parseFloat(this.projectData.longitude);
    if (!isNaN(lat) && !isNaN(lng)) {
      this.updateMarkerAndGeocode(lat, lng);
    }
  }

  nextStep(): void {
    if (this.currentStep < 5) {
      this.currentStep++;
      if (this.currentStep === 4) {
        this.updateMapSource();
        this.initInteractiveMap();
      }
    }
  }

  prevStep(): void {
    if (this.currentStep > 1) {
      this.currentStep--;
      if (this.currentStep === 4) {
        this.initInteractiveMap();
      }
    }
  }

  goToStep(step: number): void {
    if (step >= 1 && step <= 5) {
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