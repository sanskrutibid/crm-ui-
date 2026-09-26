import { Component, OnInit, inject, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { PropertiesService } from '../properties.service';
import { environment } from '../../../../environments/environment';
import { ContactsService } from '../../contacts/contacts.service';
import { AuthService } from '../../auth/auth.service';
import { SourcesService } from '../../../services/sources.service';
import { Location } from '@angular/common';

@Component({
  selector: 'app-create-property',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './create-property.html',
  styleUrl: './create-property.css',
})
export class CreateProperty implements OnInit {
  currentStep: number = 1;
  totalSteps: number = 6;

  geocodingStatus: string = '';
  private mapInstance: any = null;
  private markerInstance: any = null;

  // Safe Sanitized Resource Wrapper URL variable for Iframe map data security binding 
  mapSecureUrl!: SafeResourceUrl;
  owners: any[] = [];

  // Media (Photos & Videos) state
  propertyPhotos: Array<{ file?: File; url: string; name: string; size: string; isCover?: boolean }> = [];
  propertyVideos: Array<{ file?: File; url: string; name: string; size: string }> = [];
  selectedMediaModal: { url: string; type: 'image' | 'video'; name: string } | null = null;
  mediaModalList: Array<{ url: string; type: 'image' | 'video'; name: string }> = [];
  mediaModalIndex: number = 0;

  // Multi-Keyword State
  keywordInputText: string = '';
  finalKeywordInputText: string = '';
  selectedPresetKeyword: string = '';
  chosenWebKeywords: string[] = [];
  chosenFinalKeywords: string[] = [];

  keywordList: string[] = [
    'Premium Property',
    'Affordable Budget',
    'Investment Deal',
    'Prime Location',
    'Ready to Move',
    'High ROI',
    'Gated Community',
    'Vastu Compliant'
  ];

  // Master Property NgModel Data Structure Object 
  propertyData: any = {
    ownerLandlord: '',
    requestDate: '2026-06-02',
    forType: 'Rent/Lease',
    propertyType: 'Flat / Apartment',
    transaction: 'New',
    ownership: 'Freehold',
    bedroom: '2 BHK',
    furnishing: 'Semi Furnished',
    channel: 'Direct',
    channelEmployee: '',
    description: '',
    remark: '',
    internalNote: '',
    docsVerified: false,
    visitCompleted: false,
    suitableFor: [],
    uniqueFeatures: [],
    address: '',
    latLong: '21.1458, 79.0882', // Default layout coordinates initialization placeholder for Nagpur center area
    flatUnitNo: '',
    surveyNumber: '',
    surveyName: '',
    developerName: '',
    projectBuilding: '',
    street: '',
    landmark: '',
    pinCode: '',
    city: 'Nagpur',
    locality: '',
    area: null,
    areaUnit: 'Sq-Ft',
    builtUpArea: null,
    builtUpUnit: 'Sq-Ft',
    carpetArea: null,
    carpetUnit: 'Sq-Ft',
    terraceArea: null,
    terraceUnit: 'Sq-Ft',
    areaRange: null,
    areaRangeUnit: 'Sq-Ft',
    plotArea: null,
    plotUnit: 'Sq-Ft',
    plotDimension: '',
    propertyDimension: '',
    expectedPrice: null,
    rate: '',
    negotiableAmount: null,
    maintenanceType: '',
    maintenanceCharges: null,
    securityDeposit: null,
    securityDepositMonths: '',
    jvRatio: null,
    negotiableApplicable: true,
    paidByLicensor: false,
    depositNegotiable: true,
    depositRefundable: false,
    isPreLeaseEnabled: false,
    lockInPeriod: null,
    leasePeriod: null,
    leaseHoldCharges: null,
    rentFreePeriod: null,
    commissionPayable: '',
    rentPerMonth: null,
    rentStartDate: '',
    rentEscalation: null,
    mseb: '',
    roi: null,
    propertyTax: '',
    masterBedroom: null,
    guestRoom: null,
    childRoom: null,
    commonBath: null,
    ensuiteBath: null,
    otherRoom: '',
    totalFloor: null,
    propertyOnFloor: '',
    flooring: 'Vitrified Tile',
    noOfParking: null,
    noOfLift: null,
    facing: 'East',
    amenities: [],
    advertisements: [],
    ageOfProperty: 'Less than 5 years',
    suitableTenants: [],
    possessionStatus: 'Immediately/Ready to Move',
    workstations: null,
    cabins: null,
    conferenceRooms: null,
    reception: false,
    powerKva: null,
    dbBackup: false,
    videoUrl: '',
    websiteKeyword: '',
    pollutionZone: 'Green',
    rackingCapacity: null,
    floorStrength: null,
    stpCapacity: null,
    loadingBays: null,
    canopyLength: null,
    canopyWidth: null,
    fireNoc: false,
    approvalPlan: false,
    dockLevellers: false,
    keyword: '',
    referBy: '',
    keyHolder: '',
    folder: '',
    siteManager: '',
    siteManagerContact: '',
    sourcingManager: '',
    sourcingManagerContact: '',
    closingManager: '',
    closingManagerContact: '',
    category: 'Residential',
    source: '',
    branch: 'Global Team',
    assignee: '',
    isFeatured: false,
    sendWsAssignee: false,
    sendEmailAssignee: false,
    sendWsCustomer: false,
    sendEmailCustomer: false,
    visibility: 'Private',
    protected: false
  };

  // Static Configuration Datasets Arrays mappings match definitions lists exactly
  categories = ['Residential', 'Commercial', 'Industrial', 'Agricultural'];
  forOptions = ['Buy', 'PG', 'Rent/Lease', 'Re-Development', 'Joint Ventures', 'Services'];
  propertyTypes = ['Flat / Apartment', 'Commercial Office', 'Showroom', 'Warehouse', 'Plot/Land'];
  propertyTypesByCategory: { [key: string]: string[] } = {
    'Residential': [
      'Flat / Apartment',
      'Independent House',
      'Villa',
      'Builder Floor',
      'Studio Apartment',
      'Penthouse',
      'Residential Plot / Land',
      'Farm House'
    ],
    'Commercial': [
      'Office Space',
      'Shop / Retail Space',
      'Showroom',
      'Commercial Building',
      'Commercial Plot / Land',
      'Warehouse',
      'Co-working Space',
      'Restaurant / Cafe Space',
      'Commercial Floor',
      'Business Center'
    ],
    'Industrial': [
      'Industrial Plot',
      'Industrial Shed',
      'Factory',
      'Manufacturing Unit',
      'Warehouse',
      'Industrial Building',
      'Industrial Land'
    ],
    'Agricultural': [
      'Agricultural Land',
      'Farm Land',
      'Orchard / Fruit Farm',
      'Plantation Land',
      'Agricultural Plot',
      'Farm House with Land'
    ]
  };

  getPropertyTypes(): string[] {
    if (this.propertyData.category && this.propertyTypesByCategory[this.propertyData.category]) {
      return this.propertyTypesByCategory[this.propertyData.category];
    }
    return this.propertyTypes;
  }

  isBedroomVisible(): boolean {
    const bedroomSupportedTypes = [
      'Flat / Apartment',
      'Flat/Apartment',
      'Independent House',
      'Villa',
      'Builder Floor',
      'Studio Apartment',
      'Studio',
      'Penthouse',
      'Farm House',
      'Farm House with Land'
    ];
    return bedroomSupportedTypes.includes(this.propertyData.propertyType);
  }

  isFurnishingVisible(): boolean {
    const hiddenTypes = [
      'Residential Plot / Land',
      'Commercial Plot / Land',
      'Industrial Plot',
      'Industrial Land',
      'Agricultural Land',
      'Farm Land',
      'Orchard / Fruit Farm',
      'Plantation Land',
      'Agricultural Plot',
      'Plot/Land'
    ];
    if (hiddenTypes.includes(this.propertyData.propertyType)) {
      return false;
    }
    const type = (this.propertyData.propertyType || '').toLowerCase();
    if (type.includes('farm house')) {
      return true;
    }
    if (type.includes('plot') || type.includes('land') || type.includes('orchard') || type.includes('plantation')) {
      return false;
    }
    return true;
  }

  suitableForByCategory: { [key: string]: string[] } = {
    'Residential': [
      'Family',
      'Bachelors (Men / Women)',
      'Working Professionals',
      'Students',
      'Senior Citizens',
      'Company Guest House / Corporate Lease',
      'Home Office / Freelancer',
      'Government Job'
    ],
    'Commercial': [
      'IT / Software Corporate Office',
      'Bank / Financial Institution / ATM',
      'Call Center / BPO',
      'Doctor Clinic / Hospital / Diagnostic Lab',
      'Retail Shop / Supermarket / Grocery',
      'Showroom / Brand Outlet / Boutique',
      'Gym / Fitness Studio / Yoga Center',
      'Restaurant / Cafe / Cloud Kitchen',
      'Coaching Institute / Tuition Classes',
      'Spa / Salon / Beauty Parlour'
    ],
    'Industrial': [
      'FMCG',
      'FMGD',
      'Manufacturing / Production Unit',
      'Warehouse / Godown / Logistics Hub',
      'Automobile Workshop / Service Center',
      'Heavy Machinery / Fabrication',
      'Cold Storage / Food Processing',
      'Pharma / Chemical Industry',
      'Electronics Assembly / Packaging Unit'
    ],
    'Agricultural': [
      'Crop Cultivation / Farming',
      'Organic Farming',
      'Farm House / Weekend Villa',
      'Dairy Farm / Poultry / Animal Husbandry',
      'Fruit Orchard / Horticulture / Nursery',
      'Agro-Tourism / Nature Resort',
      'Solar Plant Setup',
      'Long-term Land Investment'
    ]
  };

  getSuitableForOptions(): string[] {
    if (this.propertyData.category && this.suitableForByCategory[this.propertyData.category]) {
      return this.suitableForByCategory[this.propertyData.category];
    }
    return this.suitableForOptions;
  }

  onCategoryChange(): void {
    const availableTypes = this.getPropertyTypes();
    if (!availableTypes.includes(this.propertyData.propertyType)) {
      this.propertyData.propertyType = availableTypes[0] || '';
    }
    const validSuitableFor = this.getSuitableForOptions();
    this.propertyData.suitableFor = (this.propertyData.suitableFor || []).filter((item: string) =>
      validSuitableFor.includes(item)
    );
    this.handleConditionalFields();
  }

  onPropertyTypeChange(): void {
    this.handleConditionalFields();
  }

  handleConditionalFields(): void {
    if (!this.isBedroomVisible()) {
      this.propertyData.bedroom = '';
    }
    if (!this.isFurnishingVisible()) {
      this.propertyData.furnishing = '';
    }
  }
  depositMonthsOptions = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

  addKeywordTag(): void {
    if (!this.keywordInputText) return;
    const raw = this.keywordInputText.trim();
    if (!raw) return;

    const parts = raw.split(',').map(k => k.trim()).filter(k => k.length > 0);
    parts.forEach(part => {
      if (!this.chosenWebKeywords.includes(part)) {
        this.chosenWebKeywords.push(part);
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
    this.chosenWebKeywords = this.chosenWebKeywords.filter(k => k !== kw);
    this.syncWebKeywordsString();
  }

  syncWebKeywordsString(): void {
    this.propertyData.websiteKeyword = this.chosenWebKeywords.join(', ');
  }

  addFinalKeywordTag(): void {
    if (!this.finalKeywordInputText) return;
    const raw = this.finalKeywordInputText.trim();
    if (!raw) return;

    const parts = raw.split(',').map(k => k.trim()).filter(k => k.length > 0);
    parts.forEach(part => {
      if (!this.chosenFinalKeywords.includes(part)) {
        this.chosenFinalKeywords.push(part);
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
    if (this.selectedPresetKeyword && !this.chosenFinalKeywords.includes(this.selectedPresetKeyword)) {
      this.chosenFinalKeywords.push(this.selectedPresetKeyword);
      this.syncFinalKeywordsString();
    }
    this.selectedPresetKeyword = '';
  }

  removeFinalKeywordTag(kw: string): void {
    this.chosenFinalKeywords = this.chosenFinalKeywords.filter(k => k !== kw);
    this.syncFinalKeywordsString();
  }

  syncFinalKeywordsString(): void {
    this.propertyData.keyword = this.chosenFinalKeywords.join(', ');
  }

  calculatePricing(): void {
    const area = parseFloat(this.propertyData.area);
    const rate = parseFloat(this.propertyData.rate);
    if (!isNaN(area) && !isNaN(rate) && area > 0 && rate > 0) {
      this.propertyData.expectedPrice = Math.round(area * rate);
    }
    this.calculateSecurityDeposit();
  }

  onExpectedPriceChange(): void {
    const area = parseFloat(this.propertyData.area);
    const price = parseFloat(this.propertyData.expectedPrice);
    if (!isNaN(area) && !isNaN(price) && area > 0 && price > 0) {
      this.propertyData.rate = (price / area).toFixed(2);
    }
    this.calculateSecurityDeposit();
  }

  calculateSecurityDeposit(): void {
    const months = parseFloat(this.propertyData.securityDepositMonths);
    const price = parseFloat(this.propertyData.expectedPrice);
    if (!isNaN(months) && !isNaN(price) && months > 0 && price > 0) {
      this.propertyData.securityDeposit = Math.round(months * price);
    }
  }

  transactionOptions = ['New', 'Resale', 'Rent', 'Lease', 'Pre Launch', 'Pre Lease/ Pre Rented', 'Individual', 'Company'];
  ownerships = ['Freehold', 'Leasehold', 'Co-operative Society', 'Power of Attorney'];
  bedrooms = ['1 RK', '1 BHK', '1.5 BHK', '2 BHK', '2.5 BHK', '3 BHK', '3.5 BHK', '4 BHK +'];
  furnishingOptions = ['Fully Furnished', 'UnFurnished', 'Semi Furnished', 'Ready to Furnished', 'Bareshell', 'Warmshell'];
  units = ['Sq-Ft', 'Sq-Mtr', 'Grounds', 'Guntha', 'Ares', 'Acres', 'Sq-Yrds'];
  floorings = ['Vitrified Tile', 'Marble', 'Granite', 'Wooden', 'Mosaic'];
  facings = ['East', 'West', 'North', 'South', 'North-East', 'North-West', 'South-East', 'South-West'];
  ages = ['Under Construction', 'Less than 5 years', '5 - 10 years', '10+ years'];
  pollutionZones = ['Green', 'Orange', 'Red', 'White'];
  assignees = ['Agent Dev Ghosh', 'Manager Achal Thakare', 'BD Adarsh Jichkar'];

  suitableForOptions = ['Call Center/BPO', 'Bank Branch', 'Software Corporate Office', 'Doctor Clinic', 'Gym', 'Boutique/Studio'];
  uniqueFeatures = ['Corner Property', 'Main Road Facing', 'Gated Community', 'Vaastu Compliant'];
  tenants = ['Family', 'Bachelors (Men)', 'Bachelors (Women)', 'Company Lease'];

  amenitiesList = ['24 Hours Water', 'Power Backup', 'Lift', 'Security Personnel', 'Car Parking', 'Visitor Parking', 'Gymnasium', 'Swimming Pool', 'Club House', 'Rain Water Harvesting'];

  sourcesList: string[] = [];

  advertisementsList = [
    '99acres Premium Banner', '99acres Top Listing', 'Billboard - Digital Signage', 'Billboard - Flex Print',
    'Brochures / Flyers Distribution', 'Bus Shelter / Transit Ad', 'Commonfloor Premium Feature',
    'Dainik Bhaskar Classified Ad', 'Email Blast Newsletter', 'Facebook Carousel Ad',
    'Facebook Lead Generation Campaign', 'Google Display Network Banner', 'Google Search Ads (PPC)',
    'Housing.com Exclusive Tag', 'Instagram Reel / Story Promo', 'LinkedIn Corporate Ad',
    'Local Cable TV Ad', 'Magicbricks Featured Property', 'Magicbricks Verified Badge',
    'Newspaper Display Ad', 'Newspaper Pamphlet Insert', 'Olx Featured Ad', 'Property Expo Stall Display',
    'Radio City / Radio Mirchi Jingle', 'SMS Marketing Blast', 'Society Gate Banner Advertisement',
    'The Times of India Classified', 'WhatsApp Business Broadcast', 'Window Poster / Office Standee',
    'YouTube Video Walkthrough Ad'
  ];

  localityOptions = [
    'Manish Nagar',
    'Pratap Nagar',
    'Dharampeth',
    'Civil Lines',
    'Sadar',
    'Wardha Road',
    'Besa',
    'Beltarodi',
    'Trimurti Nagar',
    'Narendra Nagar',
    'Laxmi Nagar',
    'Shankar Nagar',
    'Friends Colony',
    'Mahal',
    'Nandanvan',
    'Jaripatka',
    'Mankapur',
    'Hingna Road',
    'Omkar Nagar',
    'Koradi Road'
  ];

  selectedLocalityDropdown: string = '';
  customLocalityInput: string = '';

  getSelectedLocalities(): string[] {
    if (Array.isArray(this.propertyData.locality)) {
      return this.propertyData.locality;
    }
    if (typeof this.propertyData.locality === 'string' && this.propertyData.locality.trim()) {
      return this.propertyData.locality.split(',').map((s: string) => s.trim()).filter(Boolean);
    }
    return [];
  }

  isLocalitySelected(loc: string): boolean {
    return this.getSelectedLocalities().includes(loc);
  }

  toggleLocality(loc: string): void {
    let current = this.getSelectedLocalities();
    if (current.includes(loc)) {
      current = current.filter(l => l !== loc);
    } else {
      current = [...current, loc];
    }
    this.propertyData.locality = current;
  }

  removeLocality(loc: string): void {
    let current = this.getSelectedLocalities();
    this.propertyData.locality = current.filter(l => l !== loc);
  }

  onLocalitySelectFromDropdown(event: any): void {
    const value = event.target?.value || this.selectedLocalityDropdown;
    if (value) {
      if (!this.isLocalitySelected(value)) {
        this.toggleLocality(value);
      }
      this.selectedLocalityDropdown = '';
      if (event.target) event.target.value = '';
    }
  }

  addCustomLocality(): void {
    const val = (this.customLocalityInput || '').trim();
    if (val) {
      if (!this.localityOptions.some(l => l.toLowerCase() === val.toLowerCase())) {
        this.localityOptions.push(val);
      }
      const match = this.localityOptions.find(l => l.toLowerCase() === val.toLowerCase()) || val;
      if (!this.isLocalitySelected(match)) {
        this.toggleLocality(match);
      }
      this.customLocalityInput = '';
    }
  }

  cityOptions = [
    'Nagpur',
    'Mumbai',
    'Pune',
    'Thane',
    'Nashik',
    'Aurangabad',
    'Delhi',
    'Gurgaon',
    'Noida',
    'Bangalore',
    'Hyderabad',
    'Chennai',
    'Kolkata',
    'Ahmedabad',
    'Surat',
    'Indore',
    'Bhopal',
    'Jaipur',
    'Lucknow',
    'Chandigarh'
  ];

  localitiesByCity: { [key: string]: string[] } = {
    'Nagpur': [
      'Manish Nagar', 'Pratap Nagar', 'Dharampeth', 'Civil Lines', 'Sadar',
      'Wardha Road', 'Besa', 'Beltarodi', 'Trimurti Nagar', 'Narendra Nagar',
      'Laxmi Nagar', 'Shankar Nagar', 'Friends Colony', 'Mahal', 'Nandanvan',
      'Jaripatka', 'Mankapur', 'Hingna Road', 'Omkar Nagar', 'Koradi Road',
      'Khamla', 'Ramdaspeth', 'Dhantoli', 'Godhani', 'Mihan'
    ],
    'Mumbai': [
      'Andheri West', 'Andheri East', 'Bandra West', 'Bandra East', 'Juhu',
      'Powai', 'Worli', 'Lower Parel', 'Dadar', 'Borivali West', 'Borivali East',
      'Malad West', 'Navi Mumbai', 'Vashi', 'Chembur', 'Ghatkopar', 'Kandivali West',
      'Goregaon West', 'Santacruz West'
    ],
    'Thane': [
      'Majiwada', 'Ghodbunder Road', 'Vartak Nagar', 'Naupada', 'Hiranandani Estate',
      'Thane West', 'Thane East', 'Kasarvadavali', 'Kolshet Road'
    ],
    'Pune': [
      'Baner', 'Wakad', 'Hinjewadi', 'Kharadi', 'Viman Nagar', 'Kothrud',
      'Aundh', 'Hadapsar', 'Kalyani Nagar', 'Boat Club Road', 'Koregaon Park',
      'Bavdhan', 'Pimple Saudagar', 'Magarpatta', 'Undri', 'Ravet'
    ],
    'Nashik': [
      'Gangapur Road', 'College Road', 'Indira Nagar', 'Satpur', 'Nashik Road',
      'Cidco', 'Panchavati', 'Pathardi Phata'
    ],
    'Aurangabad': [
      'Garkheda', 'CIDCO', 'Beed Bypass', 'Waluj', 'Samarth Nagar', 'Nirala Bazar'
    ],
    'Delhi': [
      'Connaught Place', 'South Extension', 'Dwarka', 'Rohini', 'Saket',
      'Vasant Kunj', 'Lajpat Nagar', 'Karol Bagh', 'Greater Kailash', 'Janakpuri', 'Pitampura'
    ],
    'Gurgaon': [
      'DLF Phase 1', 'DLF Phase 2', 'DLF Phase 5', 'Golf Course Road', 'Sohna Road',
      'Sector 56', 'Sector 57', 'Sector 48', 'Cyber City', 'MG Road'
    ],
    'Noida': [
      'Sector 62', 'Sector 18', 'Sector 137', 'Sector 150', 'Noida Extension', 'Sector 50', 'Sector 78'
    ],
    'Bangalore': [
      'Indiranagar', 'Koramangala', 'Whitefield', 'HSR Layout', 'Electronic City',
      'Jayanagar', 'JP Nagar', 'Marathahalli', 'Bellandur', 'Sarjapur Road'
    ],
    'Hyderabad': [
      'Gachibowli', 'HITECH City', 'Jubilee Hills', 'Banjara Hills', 'Madhapur',
      'Kondapur', 'Kukatpally', 'Miyapur'
    ],
    'Indore': [
      'Vijay Nagar', 'Palasia', 'AB Road', 'Bypass Road', 'Super Corridor', 'Rau'
    ],
    'Bhopal': [
      'MP Nagar', 'Arera Colony', 'Kolar Road', 'Hoshangabad Road', 'Bairagarh'
    ]
  };

  onCityChange(): void {
    const city = this.propertyData.city;
    if (!city) return;
    this.updateLocalityOptionsForCity(city);
  }

  updateLocalityOptionsForCity(city: string): void {
    if (!city) return;
    const matchedCityKey = Object.keys(this.localitiesByCity).find(c => c.toLowerCase() === city.toLowerCase());
    if (matchedCityKey && this.localitiesByCity[matchedCityKey]) {
      const cityLocs = this.localitiesByCity[matchedCityKey];
      cityLocs.forEach(loc => {
        if (!this.localityOptions.some(l => l.toLowerCase() === loc.toLowerCase())) {
          this.localityOptions.push(loc);
        }
      });
      this.localityOptions = [...new Set(this.localityOptions)];
    }
    this.fetchLocalitiesForCity(city);
  }

  fetchLocalitiesForCity(city: string): void {
    if (!city || city.trim().length < 3) return;
    const url = `https://api.postalpincode.in/postoffice/${encodeURIComponent(city.trim())}`;
    fetch(url)
      .then(res => res.json())
      .then((resData: any[]) => {
        if (Array.isArray(resData) && resData[0] && resData[0].Status === 'Success') {
          const postOffices = resData[0].PostOffice;
          if (Array.isArray(postOffices) && postOffices.length > 0) {
            postOffices.forEach((po: any) => {
              if (po.Name) {
                const cleanName = po.Name.trim();
                if (!this.localityOptions.some(l => l.toLowerCase() === cleanName.toLowerCase())) {
                  this.localityOptions.push(cleanName);
                }
              }
            });
            this.localityOptions = [...new Set(this.localityOptions)];
          }
        }
      })
      .catch(() => {});
  }


  private propertiesService = inject(PropertiesService);
  private router = inject(Router);
  private sanitizer = inject(DomSanitizer);
  private contactsService = inject(ContactsService);
  private authService = inject(AuthService);
  private sourcesService = inject(SourcesService);
  private route = inject(ActivatedRoute);
  private location = inject(Location);

  isEditMode = false;
  propertyId: string | null = null;

  customersList: any[] = [];
  agentsList: any[] = [];

  ngOnInit(): void {
    this.updateMapSource();
    this.loadCustomers();
    this.loadAgents();
    this.loadSources();

    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.isEditMode = true;
        this.propertyId = id;
        this.loadPropertyDetails(id);
      }
    });

    this.route.queryParams.subscribe(params => {
      if (params['contactId']) {
        this.propertyData.ownerLandlord = params['contactId'];
      }
    });
  }

  loadPropertyDetails(id: string): void {
    this.propertiesService.getPropertyById(id).subscribe({
      next: (res: any) => {
        const p = res.data || res;
        if (!p) return;

        this.propertyData = {
          ...this.propertyData,
          ownerLandlord: p.ownerLandlord?._id || p.ownerLandlord?.id || (typeof p.ownerLandlord === 'string' ? p.ownerLandlord : ''),
          requestDate: p.requestDate ? p.requestDate.split('T')[0] : '2026-06-02',
          forType: p.forType || p.purpose || 'Rent/Lease',
          propertyType: p.propertyType || 'Flat / Apartment',
          transaction: p.transaction || 'New',
          ownership: p.ownership || 'Freehold',
          bedroom: p.bedroom || '2 BHK',
          furnishing: p.furnishing || 'Semi Furnished',
          channel: p.channel || 'Direct',
          channelEmployee: p.channelEmployee || '',
          description: p.description || '',
          remark: p.remark || '',
          internalNote: p.internalNote || '',
          docsVerified: !!p.docsVerified,
          visitCompleted: !!p.visitCompleted,
          suitableFor: Array.isArray(p.suitableFor) ? p.suitableFor : (p.suitableFor ? p.suitableFor.split(',').map((s: string) => s.trim()) : []),
          uniqueFeatures: Array.isArray(p.uniqueFeatures) ? p.uniqueFeatures : [],
          address: p.address || '',
          latLong: (p.latitude && p.longitude) ? `${p.latitude}, ${p.longitude}` : '21.1458, 79.0882',
          flatUnitNo: p.flatUnitNo || '',
          surveyNumber: p.surveyNumber || '',
          surveyName: p.surveyName || '',
          developerName: p.developerName || '',
          projectBuilding: p.projectBuilding || p.buildingTowerProject || '',
          street: p.street || '',
          landmark: p.landmark || '',
          pinCode: p.pinCode || '',
          city: p.city || 'Nagpur',
          locality: p.locality || '',
          area: p.area || p.sqft || null,
          areaUnit: p.areaUnit || 'Sq-Ft',
          builtUpArea: p.builtUpArea || null,
          builtUpUnit: p.builtUpUnit || 'Sq-Ft',
          carpetArea: p.carpetArea || null,
          carpetUnit: p.carpetUnit || 'Sq-Ft',
          terraceArea: p.terraceArea || null,
          terraceUnit: p.terraceUnit || 'Sq-Ft',
          areaRange: p.areaRange || null,
          areaRangeUnit: p.areaRangeUnit || 'Sq-Ft',
          plotArea: p.plotArea || null,
          plotUnit: p.plotUnit || 'Sq-Ft',
          plotDimension: (p.plotLength && p.plotWidth) ? `${p.plotLength} x ${p.plotWidth}` : (p.plotDimension || ''),
          propertyDimension: (p.propertyWidth && p.propertyDepth) ? `${p.propertyWidth} x ${p.propertyDepth}${p.propertyHeight ? ' x ' + p.propertyHeight : ''}` : (p.propertyDimension || ''),
          expectedPrice: p.expectedPrice || p.price || null,
          rate: p.rate || '',
          negotiableAmount: p.negotiableAmount || null,
          maintenanceType: p.maintenanceType || '',
          maintenanceCharges: p.maintenanceCharges || null,
          securityDeposit: p.securityDeposit || null,
          securityDepositMonths: p.securityDepositMonths || '',
          jvRatio: p.jvRatio || null,
          negotiableApplicable: p.negotiableApplicable !== false,
          paidByLicensor: !!p.paidByLicensor,
          depositNegotiable: p.depositNegotiable !== false,
          depositRefundable: !!p.depositRefundable,
          isPreLeaseEnabled: !!p.isPreLeaseEnabled,
          lockInPeriod: p.lockInPeriod || null,
          leasePeriod: p.leasePeriod || null,
          leaseHoldCharges: p.leaseHoldCharges || null,
          rentFreePeriod: p.rentFreePeriod || null,
          commissionPayable: p.commissionPayable || '',
          rentPerMonth: p.rentPerMonth || null,
          rentStartDate: p.rentStartDate || '',
          rentEscalation: p.rentEscalationPercentage || p.rentEscalation || null,
          mseb: p.mseb || '',
          roi: p.roi || null,
          propertyTax: p.propertyTax || '',
          masterBedroom: p.masterBedroom || null,
          guestRoom: p.guestRoom || null,
          childRoom: p.childRoom || null,
          commonBath: p.bathroomCommon || p.commonBath || null,
          ensuiteBath: p.bathroomAttach || p.ensuiteBath || null,
          otherRoom: p.otherRoom || '',
          totalFloor: p.totalFloor || null,
          propertyOnFloor: p.propertyOnFloor || '',
          flooring: p.flooring || 'Vitrified Tile',
          noOfParking: p.noOfParking || null,
          noOfLift: p.noOfLift || null,
          facing: p.facing || 'East',
          amenities: Array.isArray(p.amenities) ? p.amenities : [],
          advertisements: Array.isArray(p.advertised) ? p.advertised : (p.advertised ? p.advertised.split(',').map((s: string) => s.trim()) : []),
          ageOfProperty: p.ageOfProperty || 'Less than 5 years',
          suitableTenants: Array.isArray(p.suitableTenants) ? p.suitableTenants : (p.suitableTenants ? p.suitableTenants.split(',').map((s: string) => s.trim()) : []),
          possessionStatus: p.constructionStatus || p.possessionStatus || 'Immediately/Ready to Move',
          workstations: p.workStation || p.workstations || null,
          cabins: p.cabins || null,
          conferenceRooms: p.conferenceRoom || p.conferenceRooms || null,
          reception: !!p.reception,
          powerKva: p.powerKva || null,
          dbBackup: !!p.hasDgBackup || !!p.dbBackup,
          videoUrl: p.videoUrl || '',
          websiteKeyword: p.websiteKeyword || '',
          pollutionZone: p.pollutionZone || 'Green',
          rackingCapacity: p.tacklingCapacityEot || p.rackingCapacity || null,
          floorStrength: p.floorStrength || null,
          stpCapacity: p.stpEtpCapacity || p.stpCapacity || null,
          loadingBays: p.loadingBays || null,
          canopyLength: p.canopyLength || null,
          canopyWidth: p.canopyWidth || null,
          fireNoc: !!p.freeNoc || !!p.fireNoc,
          approvalPlan: !!p.additionalFiles || !!p.approvalPlan,
          dockLevellers: !!p.dockLevellers,
          keyword: p.keyword || '',
          referBy: p.referBy || '',
          keyHolder: p.keyHolder || '',
          siteManager: p.siteManager || '',
          siteManagerContact: p.siteManagerContact || '',
          sourcingManager: p.sourcingManager || '',
          sourcingManagerContact: p.sourcingManagerContact || '',
          closingManager: p.closingManager || '',
          closingManagerContact: p.closingManagerContact || '',
          category: p.category || 'Residential',
          source: p.source || '',
          branch: p.branch || 'Global Team',
          assignee: p.assignee?._id || p.assignee?.id || (typeof p.assignee === 'string' ? p.assignee : ''),
          isFeatured: !!p.featured || !!p.isFeatured,
          sendWsAssignee: !!p.sendWhatsAppToAssignee || !!p.sendWsAssignee,
          sendEmailAssignee: !!p.sendEmailToAssignee || !!p.sendEmailAssignee,
          sendWsCustomer: !!p.sendWhatsAppToCustomer || !!p.sendWsCustomer,
          sendEmailCustomer: !!p.sendEmailToCustomer || !!p.sendEmailCustomer,
          visibility: p.privacy || p.visibility || 'Private',
          protected: !!p.protected
        };

        const webKw = p.websiteKeyword || '';
        const finalKw = p.keyword || '';
        this.chosenWebKeywords = webKw ? webKw.split(',').map((k: string) => k.trim()).filter(Boolean) : [];
        this.chosenFinalKeywords = finalKw ? finalKw.split(',').map((k: string) => k.trim()).filter(Boolean) : [];

        let rawPhotosSources: any[] = [];
        const extractPhotos = (source: any) => {
          if (!source) return;
          if (typeof source === 'string') {
            const trimmed = source.trim();
            if (trimmed.startsWith('[')) {
              try {
                const parsed = JSON.parse(trimmed);
                if (Array.isArray(parsed)) rawPhotosSources.push(...parsed);
                return;
              } catch(e) {}
            }
            if (trimmed) {
              rawPhotosSources.push(...trimmed.split(',').map((s: string) => s.trim()).filter(Boolean));
            }
          } else if (Array.isArray(source)) {
            rawPhotosSources.push(...source);
          } else if (typeof source === 'object') {
            rawPhotosSources.push(source);
          }
        };

        extractPhotos(p.images);
        if (rawPhotosSources.length === 0) {
          extractPhotos(p.photos);
        }

        let loadedPhotos: any[] = [];
        const seenPhotoKeys = new Set<string>();

        const addPhotoIfUnique = (img: any) => {
          const url = this.getMediaUrl(img);
          if (!url) return;
          const key = url.length > 200 ? url.substring(0, 100) + url.substring(url.length - 100) : url;
          if (!seenPhotoKeys.has(key)) {
            seenPhotoKeys.add(key);
            loadedPhotos.push({
              url: url,
              name: typeof img === 'object' ? (img.name || 'Photo') : 'Photo',
              size: typeof img === 'object' ? (img.size || '') : '',
              isCover: typeof img === 'object' ? !!img.isCover : false
            });
          }
        };

        if (rawPhotosSources.length > 0) {
          rawPhotosSources.forEach(addPhotoIfUnique);
        }

        if (loadedPhotos.length === 0 && this.propertyId) {
          const localPhotos = localStorage.getItem(`property_photos_${this.propertyId}`);
          if (localPhotos) {
            try {
              const parsed = JSON.parse(localPhotos);
              if (Array.isArray(parsed)) {
                parsed.forEach(addPhotoIfUnique);
              }
            } catch(e) {}
          }
        }
        if (loadedPhotos.length > 0 && !loadedPhotos.some(p => p.isCover)) {
          loadedPhotos[0].isCover = true;
        }
        this.propertyPhotos = loadedPhotos;

        let rawVideosSources: any[] = [];
        const extractVideos = (source: any) => {
          if (!source) return;
          if (typeof source === 'string') {
            const trimmed = source.trim();
            if (trimmed.startsWith('[')) {
              try {
                const parsed = JSON.parse(trimmed);
                if (Array.isArray(parsed)) rawVideosSources.push(...parsed);
                return;
              } catch(e) {}
            }
            if (trimmed) {
              rawVideosSources.push(...trimmed.split(',').map((s: string) => s.trim()).filter(Boolean));
            }
          } else if (Array.isArray(source)) {
            rawVideosSources.push(...source);
          } else if (typeof source === 'object') {
            rawVideosSources.push(source);
          }
        };

        extractVideos(p.videos);
        if (p.videoUrl) extractVideos(p.videoUrl);

        let loadedVideos: any[] = [];
        const seenVidKeys = new Set<string>();

        const addVideoIfUnique = (vid: any) => {
          const url = this.getMediaUrl(vid);
          if (!url) return;
          const key = url.length > 200 ? url.substring(0, 100) + url.substring(url.length - 100) : url;
          if (!seenVidKeys.has(key)) {
            seenVidKeys.add(key);
            loadedVideos.push({
              url: url,
              name: typeof vid === 'object' ? (vid.name || 'Video') : 'Video',
              size: typeof vid === 'object' ? (vid.size || '') : ''
            });
          }
        };

        if (rawVideosSources.length > 0) {
          rawVideosSources.forEach(addVideoIfUnique);
        }

        if (loadedVideos.length === 0 && this.propertyId) {
          const localVideos = localStorage.getItem(`property_videos_${this.propertyId}`);
          if (localVideos) {
            try {
              const parsed = JSON.parse(localVideos);
              if (Array.isArray(parsed)) {
                parsed.forEach(addVideoIfUnique);
              }
            } catch(e) {}
          }
        }
        this.propertyVideos = loadedVideos;

        this.updateMapSource();
      },
      error: (err) => {
        console.error('Failed to load property details for editing:', err);
        alert('Failed to load property details.');
      }
    });
  }

  goBack(): void {
    if (window.history.length > 1) {
      this.location.back();
    } else {
      this.router.navigate(['/all-properties']);
    }
  }

  loadCustomers() {
    this.contactsService.getContacts({ limit: 99999 }).subscribe({
      next: (res: any) => {
        const payload = res.data || res;
        this.customersList = payload.contacts || [];
        this.owners = this.customersList;
      },
      error: (err) => {
        console.error('Failed to load contacts for dropdown:', err);
      }
    });
  }

  loadAgents() {
    this.authService.getAgents().subscribe({
      next: (res: any) => {
        this.agentsList = res.data || res;
      },
      error: (err) => {
        console.error('Failed to load agents in create property:', err);
      }
    });
  }

  onChannelChange(): void {
    if (this.propertyData.channel !== 'Other') {
      this.propertyData.channelEmployee = '';
    }
  }

  getEmployeeName(emp: any): string {
    if (!emp) return '';
    if (typeof emp === 'string') return emp;
    return (emp.firstName ? `${emp.firstName} ${emp.lastName || ''}`.trim() : '') || emp.name || emp.fullName || emp.officialEmail || 'Employee';
  }

  getEmployeesForDropdown(): any[] {
    if (this.agentsList && this.agentsList.length > 0) {
      return this.agentsList;
    }
    return [
      { firstName: 'Dev', lastName: 'Ghosh', designation: 'Agent' },
      { firstName: 'Achal', lastName: 'Thakare', designation: 'Manager' },
      { firstName: 'Adarsh', lastName: 'Jichkar', designation: 'Business Development' }
    ];
  }

  loadSources() {
    this.sourcesService.getSourceNames().subscribe({
      next: (names) => {
        if (names && names.length > 0) {
          this.sourcesList = names;
          if (!this.propertyData.source || !this.sourcesList.includes(this.propertyData.source)) {
            this.propertyData.source = this.sourcesList[0];
          }
        }
      },
      error: (err) => {
        console.error('Failed to load sources from API in create property:', err);
      }
    });
  }

  getContactName(contact: any): string {
    if (!contact) return '';
    return `${contact.salutation ? contact.salutation + ' ' : ''}${contact.firstName} ${contact.lastName || ''}`.trim();
  }

  private geocodeTimeout: any;

  onAddressPaste(event: ClipboardEvent): void {
    const pastedText = event.clipboardData?.getData('text');
    if (pastedText) {
      setTimeout(() => {
        this.parseAddressFields(this.propertyData.address || pastedText);
        this.fetchGeocodeCoordinates(this.propertyData.address || pastedText);
      }, 50);
    }
  }

  onAddressInput(): void {
    const addr = this.propertyData.address || '';
    this.parseAddressFields(addr);

    if (this.geocodeTimeout) {
      clearTimeout(this.geocodeTimeout);
    }

    if (addr.trim().length >= 5) {
      this.geocodeTimeout = setTimeout(() => {
        this.fetchGeocodeCoordinates(addr);
      }, 600);
    }
  }

  parseAddressFields(addr: string): void {
    if (!addr || typeof addr !== 'string') return;
    const cleanAddr = addr.trim();
    if (!cleanAddr) return;

    // 1. Extract 6-digit Pincode (Indian PIN codes with flexible formats: 440015, 440 015, PIN: 440015)
    const pinRegexes = [
      /(?:pin\s*code|pincode|pin)?\s*[:#-]?\s*\b([1-9][0-9]{2}[\s-]?[0-9]{3})\b/i,
      /\b([1-9][0-9]{5})\b/,
      /\b([1-9][0-9]{2}\s[0-9]{3})\b/
    ];

    for (const regex of pinRegexes) {
      const match = cleanAddr.match(regex);
      if (match && match[1]) {
        const cleanPin = match[1].replace(/[\s-]/g, '');
        if (cleanPin.length === 6) {
          this.propertyData.pinCode = cleanPin;
          break;
        }
      }
    }

    const parts = cleanAddr.split(',').map(p => p.trim()).filter(Boolean);

    // 2. Extract City (from predefined list or comma-separated address parts)
    let foundCity = '';
    for (const city of this.cityOptions) {
      const regex = new RegExp(`\\b${city}\\b`, 'i');
      if (regex.test(cleanAddr)) {
        foundCity = city;
        break;
      }
    }

    if (!foundCity && parts.length >= 2) {
      const stateNoiseWords = ['maharashtra', 'delhi', 'karnataka', 'telangana', 'tamil nadu', 'gujarat', 'uttar pradesh', 'madhya pradesh', 'rajasthan', 'punjab', 'haryana', 'india', 'bharat', 'u.p.', 'm.p.'];
      for (let i = parts.length - 1; i >= Math.max(0, parts.length - 3); i--) {
        let partClean = parts[i]
          .replace(/\b[1-9][0-9]{5}\b/g, '')
          .replace(/[-–]/g, ' ')
          .trim();
        for (const stateWord of stateNoiseWords) {
          const stateRegex = new RegExp(`\\b${stateWord}\\b`, 'gi');
          partClean = partClean.replace(stateRegex, '').trim();
        }
        if (partClean && partClean.length >= 3 && !/^\d+$/.test(partClean)) {
          const existingCity = this.cityOptions.find(c => c.toLowerCase() === partClean.toLowerCase());
          if (existingCity) {
            foundCity = existingCity;
          } else if (!foundCity) {
            foundCity = partClean.charAt(0).toUpperCase() + partClean.slice(1);
          }
          break;
        }
      }
    }

    if (foundCity) {
      if (!this.cityOptions.some(c => c.toLowerCase() === foundCity.toLowerCase())) {
        this.cityOptions.push(foundCity);
      }
      this.propertyData.city = this.cityOptions.find(c => c.toLowerCase() === foundCity.toLowerCase()) || foundCity;
    }

    // 3. Extract Locality
    let foundLocality = '';
    for (const loc of this.localityOptions) {
      const regex = new RegExp(`\\b${loc}\\b`, 'i');
      if (regex.test(cleanAddr)) {
        foundLocality = loc;
        break;
      }
    }

    if (!foundLocality && parts.length >= 2) {
      for (let i = 0; i < parts.length - 1; i++) {
        const p = parts[i].trim();
        if (!/^(flat|unit|plot|house|shop|office)\s/i.test(p) && !/^\d+$/.test(p) && p.length >= 3) {
          foundLocality = p;
        }
      }
    }

    if (foundLocality) {
      const matchLoc = this.localityOptions.find(l => l.toLowerCase() === foundLocality.toLowerCase()) || foundLocality;
      if (!this.localityOptions.some(l => l.toLowerCase() === matchLoc.toLowerCase())) {
        this.localityOptions.push(matchLoc);
      }
      if (!this.isLocalitySelected(matchLoc)) {
        this.toggleLocality(matchLoc);
      }
    }

    // 4. Extract Flat/Unit/Plot No if available
    const unitMatch = cleanAddr.match(/(?:flat|unit|plot|house|shop|office)\s*(?:no\.?|number)?\s*[:#-]?\s*([a-z0-9\/-]+)/i);
    if (unitMatch && unitMatch[0]) {
      if (!this.propertyData.flatUnitNo) {
        this.propertyData.flatUnitNo = unitMatch[0].trim();
      }
    }

    // 5. Extract Landmark
    const landmarkMatch = cleanAddr.match(/(?:near|opp|opposite|behind|next to|beside)\s+([^,]+)/i);
    if (landmarkMatch && landmarkMatch[0]) {
      if (!this.propertyData.landmark) {
        this.propertyData.landmark = landmarkMatch[0].trim();
      }
    }

    // 6. Extract Building / Project name
    const bldgMatch = cleanAddr.match(/([a-z0-9\s]+(?:apartment|building|tower|heights|residency|complex|society|enclave|villas|chambers|plaza))/i);
    if (bldgMatch && bldgMatch[0]) {
      if (!this.propertyData.projectBuilding) {
        this.propertyData.projectBuilding = bldgMatch[0].trim();
      }
    }
  }

  fetchGeocodeCoordinates(addr: string): void {
    if (!addr || addr.trim().length < 4) return;

    // Clean address by stripping flat/unit prefix that causes geocoding search failures
    const cleanedQuery = addr
      .replace(/(?:flat|unit|plot|house|shop|office)\s*(?:no\.?|number)?\s*[:#-]?\s*[a-z0-9\/-]+/gi, '')
      .replace(/\s+/g, ' ')
      .trim();

    const searchQueries: string[] = [];
    if (cleanedQuery) searchQueries.push(cleanedQuery);
    if (addr.trim() !== cleanedQuery) searchQueries.push(addr.trim());

    if (this.propertyData.locality || this.propertyData.city) {
      const locCity = `${this.propertyData.locality || ''} ${this.propertyData.city || ''} ${this.propertyData.pinCode || ''}`.trim();
      if (locCity && !searchQueries.includes(locCity)) {
        searchQueries.push(locCity);
      }
    }

    const tryGeocode = (index: number) => {
      if (index >= searchQueries.length) {
        this.geocodingStatus = 'Address not found on map. You can click anywhere on the map pin to set location.';
        return;
      }

      const q = searchQueries[index];
      const searchUrl = `https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&limit=1&q=${encodeURIComponent(q)}`;

      fetch(searchUrl)
        .then(res => res.json())
        .then((data: any[]) => {
          if (data && data.length > 0) {
            const item = data[0];
            const latNum = parseFloat(item.lat);
            const lonNum = parseFloat(item.lon);
            const lat = latNum.toFixed(6);
            const lon = lonNum.toFixed(6);

            // Update Lat and Long field
            this.propertyData.latLong = `${lat}, ${lon}`;

            // Re-render Map view iframe and sync Leaflet marker position
            this.updateMapSource();
            if (this.mapInstance && this.markerInstance) {
              this.markerInstance.setLatLng([latNum, lonNum]);
              this.mapInstance.setView([latNum, lonNum], 15);
            }

            // Reverse geocode exact Lat & Long to fetch accurate Pincode for coordinates
            this.reverseGeocodeLatLong(lat, lon);

            if (item.address) {
              if (item.address.postcode) {
                const pcMatch = item.address.postcode.match(/\b([1-9][0-9]{2}[\s-]?[0-9]{3})\b/);
                if (pcMatch && pcMatch[1]) {
                  const cleanPc = pcMatch[1].replace(/[\s-]/g, '');
                  if (cleanPc.length === 6) {
                    this.propertyData.pinCode = cleanPc;
                  }
                }
              }

              const rawCity = item.address.city || item.address.town || item.address.city_district || item.address.county || item.address.state_district;
              if (rawCity) {
                const formattedCity = rawCity.charAt(0).toUpperCase() + rawCity.slice(1);
                if (!this.cityOptions.some(c => c.toLowerCase() === formattedCity.toLowerCase())) {
                  this.cityOptions.push(formattedCity);
                }
                const matchedCityOpt = this.cityOptions.find(c => c.toLowerCase() === formattedCity.toLowerCase());
                this.propertyData.city = matchedCityOpt || formattedCity;
              }

              const rawLocality = item.address.suburb || item.address.neighbourhood || item.address.residential || item.address.quarter || item.address.road;
              if (rawLocality) {
                const formattedLoc = rawLocality.charAt(0).toUpperCase() + rawLocality.slice(1);
                if (!this.localityOptions.some(l => l.toLowerCase() === formattedLoc.toLowerCase())) {
                  this.localityOptions.push(formattedLoc);
                }
                const matchedLocOpt = this.localityOptions.find(l => l.toLowerCase() === formattedLoc.toLowerCase());
                this.propertyData.locality = matchedLocOpt || formattedLoc;
              }
            }

            this.geocodingStatus = `✓ Location auto-captured! Lat: ${latNum.toFixed(4)}, Lon: ${lonNum.toFixed(4)}` +
              (item.address?.postcode ? `, PIN: ${item.address.postcode}` : '');
          } else {
            tryGeocode(index + 1);
          }

          if (!this.propertyData.pinCode && (this.propertyData.locality || this.propertyData.city)) {
            this.lookupPincodeByLocality(this.propertyData.locality, this.propertyData.city);
          }
        })
        .catch(() => {
          tryGeocode(index + 1);
        });
    };

    tryGeocode(0);
  }

  geocodeAddress(): void {
    const addr = (this.propertyData.address || '').trim();
    if (!addr) return;
    this.geocodingStatus = 'Searching address coordinates, city & pincode...';
    this.parseAddressFields(addr);
    this.fetchGeocodeCoordinates(addr);
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
        let initialLat = 21.1458;
        let initialLng = 79.0882;
        if (this.propertyData.latLong) {
          const parts = this.propertyData.latLong.split(',').map((p: string) => parseFloat(p.trim()));
          if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
            initialLat = parts[0];
            initialLng = parts[1];
          }
        }

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

    this.propertyData.latLong = `${roundedLat}, ${roundedLng}`;
    this.updateMapSource();

    if (this.markerInstance) {
      this.markerInstance.setLatLng([lat, lng]);
    }
    if (this.mapInstance) {
      this.mapInstance.panTo([lat, lng]);
    }

    this.geocodingStatus = `Map pin set: ${roundedLat}, ${roundedLng}. Fetching location address details...`;
    this.reverseGeocodeLatLong(roundedLat, roundedLng);
  }

  private reverseGeocodeTimeout: any;

  onLatLongInput(): void {
    this.updateMapSource();
    if (this.reverseGeocodeTimeout) {
      clearTimeout(this.reverseGeocodeTimeout);
    }
    if (this.propertyData.latLong) {
      const parts = this.propertyData.latLong.split(',').map((p: string) => p.trim());
      if (parts.length === 2 && parts[0] && parts[1]) {
        const latNum = parseFloat(parts[0]);
        const lonNum = parseFloat(parts[1]);
        if (!isNaN(latNum) && !isNaN(lonNum) && this.mapInstance && this.markerInstance) {
          this.markerInstance.setLatLng([latNum, lonNum]);
          this.mapInstance.panTo([latNum, lonNum]);
        }
        this.reverseGeocodeTimeout = setTimeout(() => {
          this.reverseGeocodeLatLong(parts[0], parts[1]);
        }, 500);
      }
    }
  }

  reverseGeocodeLatLong(lat: string, lon: string): void {
    if (!lat || !lon) return;
    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lon)}&zoom=18&addressdetails=1`;

    fetch(url)
      .then(res => res.json())
      .then((data: any) => {
        if (data) {
          if (data.display_name && !this.propertyData.address) {
            this.propertyData.address = data.display_name;
          }

          if (data.address) {
            // Extract exact 6-digit Pincode from Reverse Geocoding
            if (data.address.postcode) {
              const pcMatch = data.address.postcode.match(/\b([1-9][0-9]{2}[\s-]?[0-9]{3})\b/);
              if (pcMatch && pcMatch[1]) {
                const cleanPc = pcMatch[1].replace(/[\s-]/g, '');
                if (cleanPc.length === 6) {
                  this.propertyData.pinCode = cleanPc;
                }
              }
            }

            // Sync City & Locality if available
            const rawCity = data.address.city || data.address.town || data.address.city_district || data.address.county || data.address.state_district;
            if (rawCity) {
              const formattedCity = rawCity.charAt(0).toUpperCase() + rawCity.slice(1);
              if (!this.cityOptions.some(c => c.toLowerCase() === formattedCity.toLowerCase())) {
                this.cityOptions.push(formattedCity);
              }
              const matchedCityOpt = this.cityOptions.find(c => c.toLowerCase() === formattedCity.toLowerCase());
              this.propertyData.city = matchedCityOpt || formattedCity;
            }

            const rawLocality = data.address.suburb || data.address.neighbourhood || data.address.residential || data.address.quarter || data.address.road;
            if (rawLocality) {
              const formattedLoc = rawLocality.charAt(0).toUpperCase() + rawLocality.slice(1);
              if (!this.localityOptions.some(l => l.toLowerCase() === formattedLoc.toLowerCase())) {
                this.localityOptions.push(formattedLoc);
              }
              const matchedLocOpt = this.localityOptions.find(l => l.toLowerCase() === formattedLoc.toLowerCase());
              this.propertyData.locality = matchedLocOpt || formattedLoc;
            }

            if (data.address.road && !this.propertyData.street) {
              this.propertyData.street = data.address.road;
            }
          }

          this.geocodingStatus = `✓ Location captured from map pin! ${this.propertyData.city ? 'City: ' + this.propertyData.city : ''} ${this.propertyData.pinCode ? '| PIN: ' + this.propertyData.pinCode : ''}`;
        }
      })
      .catch(err => {
        console.warn('Reverse geocoding warning:', err);
      });
  }

  // Live Map Iframe Sanitization Logic Method dynamically building Google Embed Queries
  updateMapSource() {
    let coordinates = this.propertyData.latLong ? this.propertyData.latLong.trim() : '21.1458,79.0882';
    const embedUrl = `https://maps.google.com/maps?q=${encodeURIComponent(coordinates)}&t=&z=15&ie=UTF8&iwloc=&output=embed`;
    this.mapSecureUrl = this.sanitizer.bypassSecurityTrustResourceUrl(embedUrl);
  }

  lookupPincodeByLocality(locality: string, city: string): void {
    const queryTerm = locality || city;
    if (!queryTerm) return;
    const url = `https://api.postalpincode.in/postoffice/${encodeURIComponent(queryTerm)}`;
    fetch(url)
      .then(res => res.json())
      .then((resData: any[]) => {
        if (Array.isArray(resData) && resData[0] && resData[0].Status === 'Success') {
          const postOffices = resData[0].PostOffice;
          if (Array.isArray(postOffices) && postOffices.length > 0) {
            const foundPO = postOffices.find((po: any) => 
              (city && po.District && po.District.toLowerCase() === city.toLowerCase()) ||
              (city && po.Circle && po.Circle.toLowerCase() === city.toLowerCase())
            ) || postOffices[0];
            if (foundPO && foundPO.Pincode) {
              this.propertyData.pinCode = foundPO.Pincode;
            }
          }
        }
      })
      .catch(() => {});
  }

  // Media Handlers (Photos & Videos)
  onPhotosSelected(event: any): void {
    const files = event.target.files;
    this.addPhotoFiles(files);
    event.target.value = '';
  }

  onPhotosDrop(event: DragEvent): void {
    event.preventDefault();
    if (event.dataTransfer && event.dataTransfer.files) {
      this.addPhotoFiles(event.dataTransfer.files);
    }
  }

  addPhotoFiles(files: FileList | File[]): void {
    if (!files || files.length === 0) return;
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (!file.type.startsWith('image/')) continue;
      const sizeFormatted = this.formatBytes(file.size);
      const objectUrl = URL.createObjectURL(file);

      const reader = new FileReader();
      reader.onload = (e: any) => {
        const rawDataUrl = e.target.result as string;
        this.compressImage(rawDataUrl, 1600, 0.75).then((compressedUrl) => {
          this.propertyPhotos.push({
            file,
            url: compressedUrl || objectUrl,
            name: file.name,
            size: sizeFormatted,
            isCover: this.propertyPhotos.length === 0
          });
        }).catch(() => {
          this.propertyPhotos.push({
            file,
            url: objectUrl,
            name: file.name,
            size: sizeFormatted,
            isCover: this.propertyPhotos.length === 0
          });
        });
      };
      reader.readAsDataURL(file);
    }
  }

  onVideoSelected(event: any): void {
    const files = event.target.files;
    this.addVideoFiles(files);
    event.target.value = '';
  }

  onVideosDrop(event: DragEvent): void {
    event.preventDefault();
    if (event.dataTransfer && event.dataTransfer.files) {
      this.addVideoFiles(event.dataTransfer.files);
    }
  }

  addVideoFiles(files: FileList | File[]): void {
    if (!files || files.length === 0) return;
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (!file.type.startsWith('video/')) continue;
      const sizeFormatted = this.formatBytes(file.size);
      const objectUrl = URL.createObjectURL(file);

      const reader = new FileReader();
      reader.onload = (e: any) => {
        const dataUrl = e.target.result as string;
        this.propertyVideos.push({
          file,
          url: dataUrl || objectUrl,
          name: file.name,
          size: sizeFormatted
        });
      };
      reader.onerror = () => {
        this.propertyVideos.push({
          file,
          url: objectUrl,
          name: file.name,
          size: sizeFormatted
        });
      };
      reader.readAsDataURL(file);
    }
  }

  private compressImage(dataUrl: string, maxDimension: number, quality: number): Promise<string> {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;
        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/jpeg', quality));
        } else {
          resolve(dataUrl);
        }
      };
      img.onerror = () => resolve(dataUrl);
      img.src = dataUrl;
    });
  }

  setCoverPhoto(index: number): void {
    this.propertyPhotos.forEach((p, i) => p.isCover = (i === index));
  }

  removePhoto(index: number): void {
    this.propertyPhotos.splice(index, 1);
    if (this.propertyPhotos.length > 0 && !this.propertyPhotos.some(p => p.isCover)) {
      this.propertyPhotos[0].isCover = true;
    }
  }

  removeVideo(index: number): void {
    const video = this.propertyVideos[index];
    if (video && video.url && video.url.startsWith('blob:')) {
      URL.revokeObjectURL(video.url);
    }
    this.propertyVideos.splice(index, 1);
  }

  openMediaModal(url: string, type: 'image' | 'video', name: string): void {
    this.mediaModalList = [];
    this.propertyPhotos.forEach(p => {
      if (p.url) this.mediaModalList.push({ url: p.url, type: 'image', name: p.name || 'Property Photo' });
    });
    this.propertyVideos.forEach(v => {
      if (v.url) this.mediaModalList.push({ url: v.url, type: 'video', name: v.name || 'Property Video' });
    });
    if (this.propertyData.videoUrl) {
      this.mediaModalList.push({ url: this.propertyData.videoUrl, type: 'video', name: 'Walkthrough Video' });
    }
    if (this.mediaModalList.length === 0 && url) {
      this.mediaModalList.push({ url, type, name });
    }
    const idx = this.mediaModalList.findIndex(m => m.url === url);
    this.mediaModalIndex = idx >= 0 ? idx : 0;
    this.selectedMediaModal = this.mediaModalList[this.mediaModalIndex] || { url, type, name };
  }

  prevMediaModal(event?: Event): void {
    if (event) event.stopPropagation();
    if (this.mediaModalList.length <= 1) return;
    this.mediaModalIndex = (this.mediaModalIndex - 1 + this.mediaModalList.length) % this.mediaModalList.length;
    this.selectedMediaModal = this.mediaModalList[this.mediaModalIndex];
  }

  nextMediaModal(event?: Event): void {
    if (event) event.stopPropagation();
    if (this.mediaModalList.length <= 1) return;
    this.mediaModalIndex = (this.mediaModalIndex + 1) % this.mediaModalList.length;
    this.selectedMediaModal = this.mediaModalList[this.mediaModalIndex];
  }

  selectMediaModalIndex(idx: number, event?: Event): void {
    if (event) event.stopPropagation();
    if (idx >= 0 && idx < this.mediaModalList.length) {
      this.mediaModalIndex = idx;
      this.selectedMediaModal = this.mediaModalList[idx];
    }
  }

  closeMediaModal(): void {
    this.selectedMediaModal = null;
    this.mediaModalList = [];
    this.mediaModalIndex = 0;
  }

  @HostListener('window:keydown', ['$event'])
  handleKeyboardEvent(event: KeyboardEvent) {
    if (!this.selectedMediaModal) return;
    if (event.key === 'ArrowLeft') {
      this.prevMediaModal();
    } else if (event.key === 'ArrowRight') {
      this.nextMediaModal();
    } else if (event.key === 'Escape') {
      this.closeMediaModal();
    }
  }

  private formatBytes(bytes: number): string {
    if (bytes < 1024) return bytes + ' B';
    else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    else return (bytes / 1048576).toFixed(1) + ' MB';
  }

  getBackendHostUrl(): string {
    const url = environment.apiUrl || 'http://localhost:3000';
    return url.replace(/\/api\/v1\/?$/, '').replace(/\/+$/, '');
  }

  getMediaUrl(item: any): string {
    if (!item) return '';
    let rawUrl = '';
    if (typeof item === 'string') {
      rawUrl = item;
    } else if (typeof item === 'object') {
      rawUrl = item.url || item.data || item.src || item.path || item.link || '';
    }
    if (!rawUrl) return '';
    if (rawUrl.startsWith('data:') || rawUrl.startsWith('http://') || rawUrl.startsWith('https://') || rawUrl.startsWith('blob:')) {
      return rawUrl;
    }
    const cleanPath = rawUrl.startsWith('/') ? rawUrl : `/${rawUrl}`;
    return `${this.getBackendHostUrl()}${cleanPath}`;
  }

  // Dynamic Navigation Multi-Step Handlers logic routines control structures definitions
  goToStep(stepNumber: number) {
    if (stepNumber >= 1 && stepNumber <= this.totalSteps) {
      this.currentStep = stepNumber;
      if (this.currentStep === 3) {
        this.updateMapSource();
        this.initInteractiveMap();
      }
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  nextStep() {
    if (this.currentStep < this.totalSteps) {
      this.currentStep++;
      if (this.currentStep === 3) {
        this.updateMapSource();
        this.initInteractiveMap();
      }
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  prevStep() {
    if (this.currentStep > 1) {
      this.currentStep--;
      if (this.currentStep === 3) {
        this.updateMapSource();
        this.initInteractiveMap();
      }
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  toggleSelection(array: any[], item: any) {
    const idx = array.indexOf(item);
    if (idx > -1) {
      array.splice(idx, 1);
    } else {
      array.push(item);
    }
  }

  cancelForm() {
    if (confirm("Are you sure you want to cancel creating this property listing?")) {
      this.router.navigate(['/all-properties']);
    }
  }

  submitProperty(form: NgForm) {
    if (form.invalid) {
      form.control.markAllAsTouched();

      const invalidFields: string[] = [];
      Object.keys(form.controls).forEach(key => {
        const control = form.controls[key];
        if (control.invalid) {
          invalidFields.push(key);
        }
      });

      const fieldStepMap: { [key: string]: number } = {
        ownerLandlord: 1,
        forType: 2,
        category: 2,
        propertyType: 2,
        city: 3,
        locality: 3,
        area: 4,
        expectedPrice: 4,
        source: 6,
        branch: 6
      };

      const fieldLabels: { [key: string]: string } = {
        ownerLandlord: 'Owner/Landlord (Step 1)',
        forType: 'For (Step 2)',
        category: 'Category (Step 2)',
        propertyType: 'Property Type (Step 2)',
        city: 'City (Step 3)',
        locality: 'Locality (Step 3)',
        area: 'Area (Step 4)',
        expectedPrice: 'Expected Price (Step 4)',
        source: 'Source (Step 6)',
        branch: 'Branch (Step 6)'
      };

      let firstInvalidStep = 6;
      for (const field of invalidFields) {
        if (fieldStepMap[field]) {
          firstInvalidStep = fieldStepMap[field];
          break;
        }
      }
      this.goToStep(firstInvalidStep);

      const missingLabels = invalidFields.map(field => fieldLabels[field] || field);
      alert("Please fill all required fields:\n- " + missingLabels.join("\n- "));
      return;
    }

    this.syncWebKeywordsString();
    this.syncFinalKeywordsString();

    // Map Angular NgModel fields to backend Property Schema structure
    const payload: any = {
      ownerLandlord: this.propertyData.ownerLandlord,
      requestDate: this.propertyData.requestDate,
      forType: this.propertyData.forType,
      propertyType: this.propertyData.propertyType,
      transaction: this.propertyData.transaction,
      ownership: this.propertyData.ownership,
      bedroom: this.isBedroomVisible() ? this.propertyData.bedroom : '',
      furnishing: this.isFurnishingVisible() ? this.propertyData.furnishing : '',
      channel: this.propertyData.channel === 'Other' && this.propertyData.channelEmployee ? `Other (${this.propertyData.channelEmployee})` : this.propertyData.channel,
      channelEmployee: this.propertyData.channelEmployee || '',
      description: this.propertyData.description,
      remark: this.propertyData.remark,
      internalNote: this.propertyData.internalNote,
      verifiedDocuments: !!this.propertyData.docsVerified,
      completedVisit: !!this.propertyData.visitCompleted,
      suitableFor: (this.propertyData.suitableFor || []).join(', '),
      uniqueFeature: (this.propertyData.uniqueFeatures || []).join(', '),
      address: this.propertyData.address,
      flatOfficeUnitNo: this.propertyData.flatUnitNo,
      surveyNumber: this.propertyData.surveyNumber,
      surveyName: this.propertyData.surveyName,
      projectDeveloperName: this.propertyData.developerName,
      buildingTowerProject: this.propertyData.projectBuilding,
      street: this.propertyData.street,
      landmark: this.propertyData.landmark,
      pincode: this.propertyData.pinCode,
      city: this.propertyData.city,
      locality: Array.isArray(this.propertyData.locality) ? this.propertyData.locality.join(', ') : (this.propertyData.locality || ''),
      localities: Array.isArray(this.propertyData.locality) ? this.propertyData.locality : (this.propertyData.locality ? this.propertyData.locality.split(',').map((s: string) => s.trim()).filter(Boolean) : []),
      area: this.propertyData.area,
      areaUnit: this.propertyData.areaUnit,
      builtUpArea: this.propertyData.builtUpArea,
      builtUpAreaUnit: this.propertyData.builtUpUnit,
      carpetArea: this.propertyData.carpetArea,
      carpetAreaUnit: this.propertyData.carpetUnit,
      terraceArea: this.propertyData.terraceArea,
      terraceAreaUnit: this.propertyData.terraceUnit,
      areaRange: this.propertyData.areaRange,
      areaRangeUnit: this.propertyData.areaRangeUnit,
      plotArea: this.propertyData.plotArea,
      plotAreaUnit: this.propertyData.plotUnit,
      expectedPrice: this.propertyData.expectedPrice,
      rate: this.propertyData.rate,
      isNegotiable: !!this.propertyData.negotiableApplicable,
      negotiableAmount: this.propertyData.negotiableAmount,
      paidByLicensor: !!this.propertyData.paidByLicensor,
      depositNegotiable: !!this.propertyData.depositNegotiable,
      depositRefundable: !!this.propertyData.depositRefundable,
      isPreLeaseEnabled: !!this.propertyData.isPreLeaseEnabled,
      maintenanceType: this.propertyData.maintenanceType,
      maintenanceCharges: this.propertyData.maintenanceType === 'Exclude' ? this.propertyData.maintenanceCharges : null,
      securityDeposit: this.propertyData.securityDeposit,
      securityDepositMonths: this.propertyData.securityDepositMonths,
      jvRatio: this.propertyData.jvRatio,
      lockInPeriod: this.propertyData.lockInPeriod,
      leasePeriod: this.propertyData.leasePeriod,
      leaseHoldCharges: this.propertyData.leaseHoldCharges,
      rentFreePeriod: this.propertyData.rentFreePeriod,
      commissionPayable: this.propertyData.commissionPayable,
      rentPerMonth: this.propertyData.rentPerMonth,
      rentStartDate: this.propertyData.rentStartDate,
      rentEscalationPercentage: this.propertyData.rentEscalation,
      mseb: this.propertyData.mseb,
      roi: this.propertyData.roi,
      propertyTax: this.propertyData.propertyTax,
      masterBedroom: this.isBedroomVisible() ? this.propertyData.masterBedroom : null,
      guestRoom: this.isBedroomVisible() ? this.propertyData.guestRoom : null,
      childRoom: this.isBedroomVisible() ? this.propertyData.childRoom : null,
      bathroomCommon: this.propertyData.commonBath,
      bathroomAttach: this.propertyData.ensuiteBath,
      otherRoom: this.propertyData.otherRoom,
      totalFloor: this.propertyData.totalFloor,
      propertyOnFloor: this.propertyData.propertyOnFloor,
      flooring: this.propertyData.flooring,
      noOfParking: this.propertyData.noOfParking,
      noOfLift: this.propertyData.noOfLift,
      facing: this.propertyData.facing,
      amenities: this.propertyData.amenities,
      ageOfProperty: this.propertyData.ageOfProperty,
      suitableTenants: (this.propertyData.suitableTenants || []).join(', '),
      constructionStatus: this.propertyData.possessionStatus,
      workStation: this.propertyData.workstations,
      cabins: this.propertyData.cabins,
      conferenceRoom: this.propertyData.conferenceRooms,
      reception: this.propertyData.reception,
      powerKva: this.propertyData.powerKva,
      hasDgBackup: !!this.propertyData.dbBackup,
      videoUrl: this.propertyData.videoUrl,
      websiteKeyword: this.propertyData.websiteKeyword,
      pollutionZone: this.propertyData.pollutionZone,
      tacklingCapacityEot: this.propertyData.rackingCapacity,
      floorStrength: this.propertyData.floorStrength,
      stpEtpCapacity: this.propertyData.stpCapacity,
      loadingBays: this.propertyData.loadingBays,
      canopyLength: this.propertyData.canopyLength,
      canopyWidth: this.propertyData.canopyWidth,
      freeNoc: !!this.propertyData.fireNoc,
      additionalFiles: !!this.propertyData.approvalPlan,
      dockLevellers: !!this.propertyData.dockLevellers,
      keyword: this.propertyData.keyword,
      referBy: this.propertyData.referBy,
      keyHolder: this.propertyData.keyHolder,
      siteManager: this.propertyData.siteManager,
      siteManagerContact: this.propertyData.siteManagerContact,
      sourcingManager: this.propertyData.sourcingManager,
      sourcingManagerContact: this.propertyData.sourcingManagerContact,
      closingManager: this.propertyData.closingManager,
      closingManagerContact: this.propertyData.closingManagerContact,
      source: this.propertyData.source,
      branch: this.propertyData.branch || 'Global Team',
      featured: !!this.propertyData.isFeatured,
      sendWhatsAppToAssignee: !!this.propertyData.sendWsAssignee,
      sendEmailToAssignee: !!this.propertyData.sendEmailAssignee,
      sendWhatsAppToCustomer: !!this.propertyData.sendWsCustomer,
      sendEmailToCustomer: !!this.propertyData.sendEmailCustomer,
      privacy: this.propertyData.visibility,
      status: 'Available',
      category: this.propertyData.category,
      assignee: this.propertyData.assignee || undefined,
      advertised: (this.propertyData.advertisements || []).join(', '),
      images: this.propertyPhotos.map(p => ({ data: p.url, url: p.url, name: p.name, size: p.size, isCover: p.isCover })),
      videos: this.propertyVideos.map(v => ({ data: v.url, url: v.url, name: v.name, size: v.size }))
    };

    if (!payload.videoUrl && this.propertyVideos.length > 0) {
      payload.videoUrl = this.propertyVideos[0].url;
    }

    // Parse latLong coordinates into latitude/longitude numbers
    if (this.propertyData.latLong) {
      const parts = this.propertyData.latLong.split(',');
      if (parts.length === 2) {
        const lat = parseFloat(parts[0].trim());
        const lng = parseFloat(parts[1].trim());
        if (!isNaN(lat)) payload.latitude = lat;
        if (!isNaN(lng)) payload.longitude = lng;
      }
    }

    if (payload.latitude !== undefined && payload.latitude !== null) {
      const parsed = parseFloat(String(payload.latitude));
      if (!isNaN(parsed)) payload.latitude = parsed; else delete payload.latitude;
    }
    if (payload.longitude !== undefined && payload.longitude !== null) {
      const parsed = parseFloat(String(payload.longitude));
      if (!isNaN(parsed)) payload.longitude = parsed; else delete payload.longitude;
    }

    // Parse plotDimension string into plotLength/plotWidth numbers
    if (this.propertyData.plotDimension) {
      const parts = this.propertyData.plotDimension.toLowerCase().split('x');
      if (parts.length === 2) {
        const l = parseFloat(parts[0].trim());
        const w = parseFloat(parts[1].trim());
        if (!isNaN(l)) payload.plotLength = l;
        if (!isNaN(w)) payload.plotWidth = w;
        payload.plotDimensionUnit = 'Feet';
      }
    }

    // Parse propertyDimension string into propertyWidth/propertyDepth/propertyHeight numbers
    if (this.propertyData.propertyDimension) {
      const parts = this.propertyData.propertyDimension.toLowerCase().split('x');
      if (parts.length >= 2) {
        const w = parseFloat(parts[0].trim());
        const d = parseFloat(parts[1].trim());
        if (!isNaN(w)) payload.propertyWidth = w;
        if (!isNaN(d)) payload.propertyDepth = d;
        payload.propertyDimensionUnit = 'Feet';
        if (parts.length >= 3) {
          const h = parseFloat(parts[2].trim());
          if (!isNaN(h)) payload.propertyHeight = h;
        }
      }
    }

    // Convert potential string inputs for numeric fields (e.g. expectedPrice, area)
    const numericFields = [
      { field: 'expectedPrice', unitMultiplier: 1 },
      { field: 'rate', unitMultiplier: 1 },
      { field: 'negotiableAmount', unitMultiplier: 1 },
      { field: 'maintenanceCharges', unitMultiplier: 1 },
      { field: 'securityDeposit', unitMultiplier: 1 },
      { field: 'securityDepositMonths', unitMultiplier: 1 },
      { field: 'jvRatio', unitMultiplier: 1 },
      { field: 'lockInPeriod', unitMultiplier: 1 },
      { field: 'leasePeriod', unitMultiplier: 1 },
      { field: 'leaseHoldCharges', unitMultiplier: 1 },
      { field: 'rentFreePeriod', unitMultiplier: 1 },
      { field: 'rentPerMonth', unitMultiplier: 1 },
      { field: 'rentEscalationPercentage', unitMultiplier: 1 },
      { field: 'roi', unitMultiplier: 1 },
      { field: 'masterBedroom', unitMultiplier: 1 },
      { field: 'guestRoom', unitMultiplier: 1 },
      { field: 'childRoom', unitMultiplier: 1 },
      { field: 'bathroomCommon', unitMultiplier: 1 },
      { field: 'bathroomAttach', unitMultiplier: 1 },
      { field: 'totalFloor', unitMultiplier: 1 },
      { field: 'propertyOnFloor', unitMultiplier: 1 },
      { field: 'noOfParking', unitMultiplier: 1 },
      { field: 'noOfLift', unitMultiplier: 1 },
      { field: 'workStation', unitMultiplier: 1 },
      { field: 'cabins', unitMultiplier: 1 },
      { field: 'conferenceRoom', unitMultiplier: 1 },
      { field: 'powerKva', unitMultiplier: 1 },
      { field: 'tacklingCapacityEot', unitMultiplier: 1 },
      { field: 'floorStrength', unitMultiplier: 1 },
      { field: 'stpEtpCapacity', unitMultiplier: 1 },
      { field: 'loadingBays', unitMultiplier: 1 },
      { field: 'canopyLength', unitMultiplier: 1 },
      { field: 'canopyWidth', unitMultiplier: 1 },
      { field: 'area', unitMultiplier: 1 },
      { field: 'builtUpArea', unitMultiplier: 1 },
      { field: 'carpetArea', unitMultiplier: 1 },
      { field: 'terraceArea', unitMultiplier: 1 },
      { field: 'areaRange', unitMultiplier: 1 },
      { field: 'plotArea', unitMultiplier: 1 }
    ];

    numericFields.forEach(({ field, unitMultiplier }) => {
      if (payload[field] !== undefined && payload[field] !== null) {
        const valStr = String(payload[field]).trim();
        const cleanStr = valStr.replace(/[^0-9.]/g, '');
        if (!cleanStr) {
          delete payload[field];
          return;
        }

        const parsed = Number(cleanStr);
        if (!isNaN(parsed)) {
          payload[field] = parsed * unitMultiplier;
        }
      }
    });

    // Clean up empty strings, nulls, and undefined properties to prevent Class Validator failures
    Object.keys(payload).forEach(key => {
      if (payload[key] === '' || payload[key] === null || payload[key] === undefined) {
        delete payload[key];
      }
    });

    const savePhotosAndVideos = (propId: string) => {
      if (propId) {
        if (this.propertyPhotos.length > 0) {
          try {
            localStorage.setItem(`property_photos_${propId}`, JSON.stringify(this.propertyPhotos.map(p => ({
              url: p.url,
              data: p.url,
              name: p.name,
              size: p.size,
              isCover: p.isCover
            }))));
          } catch (e) {
            console.warn('Could not store property photos in localStorage', e);
          }
        }
        if (this.propertyVideos.length > 0) {
          try {
            localStorage.setItem(`property_videos_${propId}`, JSON.stringify(this.propertyVideos.map(v => ({
              url: v.url,
              data: v.url,
              name: v.name,
              size: v.size
            }))));
          } catch (e) {
            console.warn('Could not store property videos in localStorage', e);
          }
        }
      }
    };

    if (this.isEditMode && this.propertyId) {
      this.propertiesService.updateProperty(this.propertyId, payload).subscribe({
        next: (res) => {
          savePhotosAndVideos(this.propertyId!);
          alert("Property Successfully Updated!");
          this.router.navigate(['/all-properties']);
        },
        error: (err) => {
          console.error("Failed to update property listing:", err);
          let errorMsg = "Error updating property listing. Please try again.";
          if (err.error && err.error.message) {
            if (Array.isArray(err.error.message)) {
              errorMsg += "\n\nDetails:\n- " + err.error.message.join("\n- ");
            } else {
              errorMsg += "\n\nDetails: " + err.error.message;
            }
          }
          alert(errorMsg);
        }
      });
    } else {
      this.propertiesService.createProperty(payload).subscribe({
        next: (res) => {
          const propId = res?.id || res?._id || res?.data?.id || res?.data?._id;
          if (propId) savePhotosAndVideos(propId);
          alert("Property Successfully Created and Published!");
          this.router.navigate(['/all-properties']);
        },
        error: (err) => {
          console.error("Failed to create property listing:", err);
          let errorMsg = "Error creating property listing. Please try again.";
          if (err.error && err.error.message) {
            if (Array.isArray(err.error.message)) {
              errorMsg += "\n\nDetails:\n- " + err.error.message.join("\n- ");
            } else {
              errorMsg += "\n\nDetails: " + err.error.message;
            }
          }
          alert(errorMsg);
        }
      });
    }
  }
}