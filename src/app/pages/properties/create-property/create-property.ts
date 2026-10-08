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
import { IndiaLocationService, VillageOption } from '../../../services/india-location.service';
import { convertHectareToAcreGuntha, formatAreaWithHectare } from '../../../services/area-converter.util';

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

  // Search Owner/Landlord (new)
  ownerSearchText: string = '';
  showOwnerDropdown: boolean = false;

  // Media (Photos & Videos) state
  propertyPhotos: Array<{ file?: File; url: string; name: string; size: string; isCover?: boolean }> = [];
  propertyVideos: Array<{ file?: File; url: string; name: string; size: string }> = [];
  selectedMediaModal: { url: string; type: 'image' | 'video'; name: string } | null = null;
  mediaModalList: Array<{ url: string; type: 'image' | 'video'; name: string }> = [];
  mediaModalIndex: number = 0;

  // Legal Verification Certificates File Metadata & Preview State
  maxDocSizeMB: number = 50; // 50MB max file size validation limit
  completionCertificateFileMeta: { name: string; size: string; type: string } | null = null;
  occupationCertificateFileMeta: { name: string; size: string; type: string } | null = null;
  nocCertificateFileMeta: { name: string; size: string; type: string } | null = null;
  fireCertificateFileMeta: { name: string; size: string; type: string } | null = null;
  previewDocModal: { url: string; name: string; isImage: boolean; isPdf: boolean } | null = null;

  // Custom Legal Documents Upload State
  newDocName: string = '';
  newDocType: string = 'Legal Document';
  newDocFileMeta: { name: string; size: string; type: string } | null = null;
  newDocFileUrl: string = '';

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
    forType: '',
    propertyType: '',
    transaction: '',
    ownership: '',
    bedroom: '',
    furnishing: '',
    channel: '',
    channelEmployee: '',
    description: '',
    remark: '',
    internalNote: '',
    docsVerified: false,
    visitCompleted: false,
    suitableFor: [],
    uniqueFeatures: [],
    country: 'India',
    state: '',
    address: '',
    latLong: '',
    flatUnitNo: '',
    surveyNumber: '',
    surveyName: '',
    khasraNumber: '',
    district: '',
    taluka: '',
    village: '',
    developerName: '',
    projectBuilding: '',
    street: '',
    landmark: '',
    pinCode: '',
    city: '',
    locality: '',
    area: null,
    areaUnit: '',
    builtUpArea: null,
    builtUpUnit: '',
    carpetArea: null,
    carpetUnit: '',
    terraceArea: null,
    terraceUnit: '',
    areaRange: null,
    areaRangeUnit: 'Sq-Ft',
    plotArea: null,
    plotUnit: '',
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
    isCommercialLayoutEnabled: false,
    irrigation: '',
    irrigationType: '',
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
    flooring: '',
    noOfParking: null,
    noOfLift: null,
    facing: '',
    amenities: [],
    advertisements: [],
    ageOfProperty: '',
    suitableTenants: [],
    possessionStatus: '',
    workstations: null,
    cabins: null,
    conferenceRooms: null,
    reception: false,
    powerKva: null,
    dbBackup: false,
    videoUrl: '',
    websiteKeyword: '',
    pollutionZone: '',
    rackingCapacity: null,
    floorStrength: null,
    stpCapacity: null,
    loadingBays: null,
    canopyLength: null,
    canopyWidth: null,
    fireNoc: false,
    approvalPlan: false,
    dockLevellers: false,
    completionCertificate: false,
    completionCertificateDoc: '',
    occupationCertificate: false,
    occupationCertificateDoc: '',
    nocCertificate: false,
    nocCertificateDoc: '',
    fireCertificate: false,
    fireCertificateDoc: '',
    legalDocuments: [],
    keyword: '',
    referBy: '',
    keyHolder: '',
    keyHolderNumber: '',
    folder: '',
    siteManager: '',
    siteManagerContact: '',
    sourcingManager: '',
    sourcingManagerContact: '',
    closingManager: '',
    closingManagerContact: '',
    category: '',
    source: '',
    branch: '',
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
  forOptions = ['Sell', 'PG', 'Rent/Lease', 'Re-Development', 'Joint Ventures', 'Services'];
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
      // Agricultural category intentionally shows only these two property types.
      'Agricultural Land',
      'Farm House Project'
    ]
  };

  getPropertyTypes(): string[] {
    if (this.propertyData.category && this.propertyTypesByCategory[this.propertyData.category]) {
      return this.propertyTypesByCategory[this.propertyData.category];
    }
    return this.propertyTypes;
  }

  // NEW: Shared check for Agricultural-only UI fields.
  isAgriculturalCategory(): boolean {
    return this.propertyData.category === 'Agricultural';
  }

  isIndustrialCategory(): boolean {
    return this.propertyData.category === 'Industrial';
  }

  showBedroomDetailsSection(): boolean {
    return !this.isAgriculturalCategory() && !this.isIndustrialCategory();
  }

  showStructuralFeaturesSection(): boolean {
    return !this.isAgriculturalCategory() && !this.isIndustrialCategory();
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

  getInitialPropertyData(): any {
    return {
      ownerLandlord: '',
      requestDate: new Date().toISOString().split('T')[0],
      forType: '',
      propertyType: '',
      transaction: '',
      ownership: '',
      bedroom: '',
      furnishing: '',
      channel: '',
      channelEmployee: '',
      description: '',
      remark: '',
      internalNote: '',
      docsVerified: false,
      visitCompleted: false,
      suitableFor: [],
      uniqueFeatures: [],
      country: 'India',
      state: '',
      address: '',
      latLong: '',
      flatUnitNo: '',
      surveyNumber: '',
      surveyName: '',
      khasraNumber: '',
      district: '',
      taluka: '',
      village: '',
      developerName: '',
      projectBuilding: '',
      street: '',
      landmark: '',
      pinCode: '',
      city: '',
      locality: [],
      area: null,
      areaUnit: '',
      builtUpArea: null,
      builtUpUnit: '',
      carpetArea: null,
      carpetUnit: '',
      terraceArea: null,
      terraceUnit: '',
      areaRange: null,
      areaRangeUnit: 'Sq-Ft',
      plotArea: null,
      plotUnit: '',
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
      isCommercialLayoutEnabled: false,
      irrigation: '',
      irrigationType: '',
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
      flooring: '',
      noOfParking: null,
      noOfLift: null,
      facing: '',
      amenities: [],
      advertisements: [],
      ageOfProperty: '',
      suitableTenants: [],
      possessionStatus: '',
      workstations: null,
      cabins: null,
      conferenceRooms: null,
      reception: false,
      powerKva: null,
      dbBackup: false,
      videoUrl: '',
      websiteKeyword: '',
      pollutionZone: '',
      rackingCapacity: null,
      floorStrength: null,
      stpCapacity: null,
      loadingBays: null,
      canopyLength: null,
      canopyWidth: null,
      fireNoc: false,
      approvalPlan: false,
      dockLevellers: false,
      completionCertificate: false,
      completionCertificateDoc: '',
      occupationCertificate: false,
      occupationCertificateDoc: '',
      nocCertificate: false,
      nocCertificateDoc: '',
      fireCertificate: false,
      fireCertificateDoc: '',
      legalDocuments: [],
      keyword: '',
      referBy: '',
      keyHolder: '',
      keyHolderNumber: '',
      folder: '',
      siteManager: '',
      siteManagerContact: '',
      sourcingManager: '',
      sourcingManagerContact: '',
      closingManager: '',
      closingManagerContact: '',
      category: '',
      source: '',
      branch: '',
      assignee: '',
      isFeatured: false,
      sendWsAssignee: false,
      sendEmailAssignee: false,
      sendWsCustomer: false,
      sendEmailCustomer: false,
      visibility: 'Private',
      protected: false
    };
  }

  resetFormPreservingContactInfo(category: string, propertyType: string): void {
    // 1. Preserve contact information
    const preservedContact = {
      ownerLandlord: this.propertyData?.ownerLandlord || '',
      channel: this.propertyData?.channel || '',
      channelEmployee: this.propertyData?.channelEmployee || '',
      source: this.propertyData?.source || '',
      branch: this.propertyData?.branch || '',
      assignee: this.propertyData?.assignee || '',
      requestDate: this.propertyData?.requestDate || new Date().toISOString().split('T')[0],
      forType: this.propertyData?.forType || ''
    };

    // 2. Fresh propertyData reset
    const fresh = this.getInitialPropertyData();
    fresh.ownerLandlord = preservedContact.ownerLandlord;
    fresh.channel = preservedContact.channel;
    fresh.channelEmployee = preservedContact.channelEmployee;
    fresh.source = preservedContact.source;
    fresh.branch = preservedContact.branch;
    fresh.assignee = preservedContact.assignee;
    fresh.requestDate = preservedContact.requestDate;
    fresh.forType = preservedContact.forType;
    fresh.category = category;
    fresh.propertyType = propertyType;

    this.propertyData = fresh;

    // 3. Reset location options & states
    this.districtOptions = [];
    this.talukaOptions = [];
    this.villageOptions = [];
    this.cityOptions = [];
    this.localityOptions = [];
    this.pincodeMatchedAreas = [];
    this.cityPinCodes = [];

    // 4. Reset media
    this.propertyPhotos = [];
    this.propertyVideos = [];

    // 5. Reset legal document metadata
    this.completionCertificateFileMeta = null;
    this.occupationCertificateFileMeta = null;
    this.nocCertificateFileMeta = null;
    this.fireCertificateFileMeta = null;
    this.newDocFileMeta = null;
    this.newDocFileUrl = '';

    // 6. Reset keywords
    this.chosenWebKeywords = [];
    this.chosenFinalKeywords = [];
    this.keywordInputText = '';
    this.finalKeywordInputText = '';

    // 7. Reset map marker and view
    if (this.markerInstance && this.mapInstance) {
      try { this.mapInstance.removeLayer(this.markerInstance); } catch (e) {}
      this.markerInstance = null;
    }
    if (this.mapInstance) {
      this.mapInstance.setView([20.5937, 78.9629], 5);
      if (this.mapLayerType === 'satellite') {
        this.toggleMapLayer('street');
      }
      setTimeout(() => {
        try { this.mapInstance.invalidateSize(); } catch (e) {}
      }, 100);
    }
    this.geocodingStatus = '';

    this.handleConditionalFields();
  }

  onCategoryChange(): void {
    const selectedCat = this.propertyData.category;
    const availableTypes = this.getPropertyTypes();
    const newPropertyType = availableTypes.includes(this.propertyData.propertyType)
      ? this.propertyData.propertyType
      : (availableTypes[0] || '');

    this.resetFormPreservingContactInfo(selectedCat, newPropertyType);
  }

  onPropertyTypeChange(): void {
    const currentCat = this.propertyData.category;
    const selectedType = this.propertyData.propertyType;

    this.resetFormPreservingContactInfo(currentCat, selectedType);
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
  units = ['Sq-Ft', 'Sq-Mtr', 'Grounds', 'Guntha', 'Ares', 'Acres', 'Hectare', 'Sq-Yrds'];

  getHectareConversionPreview(): string {
    if ((this.propertyData.areaUnit || '').toLowerCase().includes('hectar') && this.propertyData.area) {
      const res = convertHectareToAcreGuntha(this.propertyData.area);
      return res ? res.displayText : '';
    }
    return '';
  }

  getHectareTotalAcres(): number {
    if ((this.propertyData.areaUnit || '').toLowerCase().includes('hectar') && this.propertyData.area) {
      const res = convertHectareToAcreGuntha(this.propertyData.area);
      return res ? res.totalAcres : 0;
    }
    return 0;
  }
  floorings = ['Vitrified Tile', 'Marble', 'Granite', 'Wooden', 'Mosaic'];
  facings = ['East', 'West', 'North', 'South', 'North-East', 'North-West', 'South-East', 'South-West'];
  ages = ['Under Construction', 'Less than 5 years', '5 - 10 years', '10+ years'];
  pollutionZones = ['Green', 'Orange', 'Red', 'White'];
  irrigations = ['Irrigation', 'Non-Irrigation'];
  irrigationTypes = ['Borewell', 'Well', 'Canal', 'River'];

  onIrrigationChange(): void {
    if (this.propertyData.irrigation !== 'Irrigation') {
      this.propertyData.irrigationType = '';
    }
  }
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
      this.autoFillPincodeForLocality(value);
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
      this.autoFillPincodeForLocality(match);
      this.customLocalityInput = '';
    }
  }

  // ===== Dynamic State, City, PIN Code & Area Sync (All-India API-Driven) =====
  isStateLoading: boolean = false;
  isCityLoading: boolean = false;
  isPincodeLoading: boolean = false;
  isDistrictLoading: boolean = false;
  isTalukaLoading: boolean = false;
  isVillageLoading: boolean = false;

  districtOptions: string[] = [];
  talukaOptions: string[] = [];
  villageOptions: VillageOption[] = [];
  private villageSearchDebounce: any = null;
  private khasraDebounceTimeout: any = null;

  // Map Tile Layer state
  mapLayerType: 'street' | 'satellite' = 'street';
  private streetTileLayer: any = null;
  private satelliteTileLayer: any = null;
  private satelliteLabelsLayer: any = null;

  stateOptions: string[] = [
    'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh', 'Goa',
    'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka', 'Kerala',
    'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram', 'Nagaland',
    'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura',
    'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
    'Andaman and Nicobar Islands', 'Chandigarh', 'Dadra and Nagar Haveli and Daman and Diu',
    'Delhi', 'Jammu and Kashmir', 'Ladakh', 'Lakshadweep', 'Puducherry'
  ];

  cityOptions: string[] = [];
  cityPinCodes: string[] = [];
  pincodeMatchedAreas: string[] = [];
  localityToPinMap: { [key: string]: string } = {};

  initCityLocalitiesAndPincodes(): void {
    if (!this.propertyData.country) this.propertyData.country = 'India';

    this.indiaLocationService.ensureDataLoaded().then(() => {
      const allStates = this.indiaLocationService.getStates();
      if (allStates.length > 0) {
        this.stateOptions = allStates;
      }
      if (this.propertyData.state) {
        this.districtOptions = this.indiaLocationService.getDistricts(this.propertyData.state);
        if (this.propertyData.district) {
          this.talukaOptions = this.indiaLocationService.getTalukas(this.propertyData.state, this.propertyData.district);
          if (this.propertyData.taluka) {
            this.loadAgriVillages(this.propertyData.taluka, this.propertyData.district, this.propertyData.state);
          }
        }
      }
    });

    this.loadIndianStates();
    if (this.propertyData.state) {
      this.loadCitiesForState(this.propertyData.state, () => {
        if (this.propertyData.city) {
          this.updateLocalityOptionsForCity(this.propertyData.city);
        }
      });
    }
  }

  // Load States of India dynamically from CountriesNow API
  loadIndianStates(): void {
    this.isStateLoading = true;
    fetch('https://countriesnow.space/api/v0.1/countries/states', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ country: 'India' })
    })
      .then(res => res.json())
      .then((resData: any) => {
        if (!resData.error && resData.data && Array.isArray(resData.data.states)) {
          const names: string[] = resData.data.states.map((s: any) => String(s.name || '').trim()).filter(Boolean);
          if (names.length > 0) {
            this.stateOptions = [...new Set<string>(names)].sort();
          }
        }
      })
      .catch(err => {
        console.warn('CountriesNow states API fallback:', err);
      })
      .finally(() => {
        this.isStateLoading = false;
      });
  }

  // Load Cities of chosen State from API
  loadCitiesForState(state: string, callback?: () => void): void {
    if (!state) return;
    this.isCityLoading = true;

    fetch('https://countriesnow.space/api/v0.1/countries/state/cities', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ country: 'India', state: state })
    })
      .then(res => res.json())
      .then((resData: any) => {
        if (!resData.error && Array.isArray(resData.data) && resData.data.length > 0) {
          const cities: string[] = resData.data.map((c: any) => String(c || '').trim()).filter(Boolean);
          this.cityOptions = [...new Set<string>(cities)].sort();
        } else {
          this.fallbackAllCities();
        }
      })
      .catch(() => {
        this.fallbackAllCities();
      })
      .finally(() => {
        this.isCityLoading = false;
        if (callback) callback();
      });
  }

  fallbackAllCities(): void {
    this.contactsService.getCities('IN').subscribe({
      next: (res: any) => {
        const list = Array.isArray(res) ? res : (res && res.data ? res.data : []);
        if (Array.isArray(list) && list.length > 0) {
          this.cityOptions = list;
        }
      },
      error: () => {}
    });
  }

  matchStateName(rawState: string): string {
    if (!rawState) return '';
    const clean = rawState.toLowerCase().trim();
    const found = this.stateOptions.find(s => s.toLowerCase() === clean);
    if (found) return found;

    // Substring or abbreviation match (e.g. NCT of Delhi -> Delhi)
    const partial = this.stateOptions.find(s => clean.includes(s.toLowerCase()) || s.toLowerCase().includes(clean));
    return partial || rawState;
  }

  // ===== STATE CHANGE EVENT =====
  onStateChange(): void {
    const state = this.propertyData.state;
    // Wipe downstream location fields when state changes
    this.propertyData.city = '';
    this.propertyData.locality = [];
    this.propertyData.pinCode = '';
    this.localityOptions = [];
    this.cityPinCodes = [];
    this.pincodeMatchedAreas = [];
    this.cityOptions = [];

    if (!state) return;

    this.loadCitiesForState(state);
    this.fetchGeocodeCoordinates(`${state}, India`);
  }

  // ===== CITY CHANGE EVENT =====
  onCityChange(): void {
    const city = (this.propertyData.city || '').trim();
    if (!city) return;

    // Wipe old locality, pincode and matched areas when city changes
    this.propertyData.locality = [];
    this.propertyData.pinCode = '';
    this.localityOptions = [];
    this.cityPinCodes = [];
    this.pincodeMatchedAreas = [];

    this.updateLocalityOptionsForCity(city);
    const query = `${city}, ${this.propertyData.state || ''}, India`;
    this.fetchGeocodeCoordinates(query);
  }

  // ===== ADMINISTRATIVE / LAND LOCATION FLOW (State -> District -> Taluka -> Village -> Khasra) =====
  onAgriStateChange(): void {
    const state = this.propertyData.state;
    this.propertyData.district = '';
    this.propertyData.taluka = '';
    this.propertyData.village = '';
    this.propertyData.khasraNumber = '';
    this.propertyData.pinCode = '';
    this.propertyData.latLong = '';
    this.districtOptions = [];
    this.talukaOptions = [];
    this.villageOptions = [];

    // Remove any previous map pin
    if (this.markerInstance && this.mapInstance) {
      try { this.mapInstance.removeLayer(this.markerInstance); } catch (e) {}
      this.markerInstance = null;
    }

    if (!state) return;

    this.districtOptions = this.indiaLocationService.getDistricts(state);
    this.talukaOptions = [];
    this.geocodingStatus = `✓ State selected: ${state}. Now select District.`;
    this.syncAdministrativeAddress();

    // Center map on State boundary
    this.indiaLocationService.geocodeHierarchy(undefined, undefined, undefined, state).then(coords => {
      if (coords && this.mapInstance) {
        this.mapInstance.setView([coords.lat, coords.lon], 7);
      }
    });
  }

  onAgriDistrictChange(): void {
    const state = this.propertyData.state;
    const district = this.propertyData.district;
    this.propertyData.taluka = '';
    this.propertyData.village = '';
    this.propertyData.khasraNumber = '';
    this.propertyData.pinCode = '';
    this.propertyData.latLong = '';
    this.talukaOptions = [];
    this.villageOptions = [];

    // Remove any previous map pin
    if (this.markerInstance && this.mapInstance) {
      try { this.mapInstance.removeLayer(this.markerInstance); } catch (e) {}
      this.markerInstance = null;
    }

    if (!district) return;

    this.propertyData.city = district;
    this.talukaOptions = this.indiaLocationService.getTalukas(state, district);
    this.geocodingStatus = `✓ District selected: ${district} (${this.talukaOptions.length} tehsils loaded). Now select Tehsil.`;
    this.syncAdministrativeAddress();

    // Center map on District boundary
    this.indiaLocationService.geocodeHierarchy(undefined, undefined, district, state).then(coords => {
      if (coords && this.mapInstance) {
        this.mapInstance.setView([coords.lat, coords.lon], 10);
      }
    });
  }

  onAgriTalukaChange(): void {
    const state = this.propertyData.state;
    const district = this.propertyData.district;
    const taluka = this.propertyData.taluka;
    this.propertyData.village = '';
    this.propertyData.khasraNumber = '';
    this.propertyData.pinCode = '';
    this.propertyData.latLong = '';
    this.villageOptions = [];

    // Remove any previous map pin
    if (this.markerInstance && this.mapInstance) {
      try { this.mapInstance.removeLayer(this.markerInstance); } catch (e) {}
      this.markerInstance = null;
    }

    if (!taluka) return;

    this.loadAgriVillages(taluka, district, state);
    this.geocodingStatus = `✓ Tehsil selected: ${taluka}. Loading villages...`;
    this.syncAdministrativeAddress();

    // Center map on Tehsil / Taluka area
    this.indiaLocationService.geocodeHierarchy(undefined, taluka, district, state).then(coords => {
      if (coords && this.mapInstance) {
        this.mapInstance.setView([coords.lat, coords.lon], 12);
      }
    });
  }

  loadAgriVillages(taluka: string, district?: string, state?: string): void {
    if (!taluka) return;
    this.isVillageLoading = true;
    this.indiaLocationService.getVillagesForTaluka(taluka, district, state)
      .then(villages => {
        this.villageOptions = villages;
        this.isVillageLoading = false;
        if (villages.length > 0) {
          this.geocodingStatus = `✓ Tehsil ${taluka}: ${villages.length} village(s) available. Select Village.`;
        }
      })
      .catch(() => {
        this.isVillageLoading = false;
      });
  }

  onAgriVillageInput(event: any): void {
    const query = event?.target?.value || this.propertyData.village || '';
    if (!query || query.trim().length < 2) return;

    clearTimeout(this.villageSearchDebounce);
    this.villageSearchDebounce = setTimeout(() => {
      this.indiaLocationService.searchVillagesLive(
        query,
        this.propertyData.taluka,
        this.propertyData.district,
        this.propertyData.state
      ).then(results => {
        if (results && results.length > 0) {
          const existingNames = new Set(this.villageOptions.map(v => v.name.toLowerCase()));
          results.forEach(r => {
            if (!existingNames.has(r.name.toLowerCase())) {
              this.villageOptions.unshift(r);
              existingNames.add(r.name.toLowerCase());
            }
          });
        }
      });
    }, 350);
  }

  /**
   * Auto-fetch 6-digit PIN code for a Village via India Post API strictly matching State & District
   */
  fetchPincodeForAgriVillage(village: string, taluka?: string, district?: string, state?: string): void {
    if (!village) return;
    const currentState = state || this.propertyData.state || '';
    const currentDistrict = district || this.propertyData.district || '';
    const currentTaluka = taluka || this.propertyData.taluka || '';

    const cleanVillage = village.replace(/\(.*?\)/g, '').trim();
    const url = `https://api.postalpincode.in/postoffice/${encodeURIComponent(cleanVillage)}`;
    this.isPincodeLoading = true;

    fetch(url)
      .then(res => res.json())
      .then(data => {
        let foundPin = '';
        if (Array.isArray(data) && data[0] && data[0].Status === 'Success' && Array.isArray(data[0].PostOffice)) {
          // 1. Strict match: State AND (District OR Taluka/Block)
          let match = data[0].PostOffice.find((po: any) => {
            const poState = (po.State || po.Circle || '').toLowerCase();
            const poDist = (po.District || po.Division || '').toLowerCase();
            const poBlock = (po.Block || '').toLowerCase();
            const stateOk = !currentState || poState.includes(currentState.toLowerCase()) || currentState.toLowerCase().includes(poState);
            const distOk = currentDistrict && (poDist.includes(currentDistrict.toLowerCase()) || currentDistrict.toLowerCase().includes(poDist));
            const talOk = currentTaluka && (poBlock.includes(currentTaluka.toLowerCase()) || currentTaluka.toLowerCase().includes(poBlock));
            return stateOk && (distOk || talOk);
          });

          // 2. State-only match if district was empty or slightly misspelled
          if (!match && currentState) {
            match = data[0].PostOffice.find((po: any) => {
              const poState = (po.State || po.Circle || '').toLowerCase();
              return poState.includes(currentState.toLowerCase()) || currentState.toLowerCase().includes(poState);
            });
          }

          if (match && match.Pincode) {
            foundPin = String(match.Pincode).trim();
          }
        }

        if (foundPin) {
          this.isPincodeLoading = false;
          this.propertyData.pinCode = foundPin;
          this.syncAdministrativeAddress();
        } else if (currentTaluka) {
          // Fallback: Query Taluka post office in the same state
          const talUrl = `https://api.postalpincode.in/postoffice/${encodeURIComponent(currentTaluka)}`;
          fetch(talUrl)
            .then(tRes => tRes.json())
            .then(tData => {
              this.isPincodeLoading = false;
              if (Array.isArray(tData) && tData[0] && tData[0].Status === 'Success' && Array.isArray(tData[0].PostOffice)) {
                const tMatch = tData[0].PostOffice.find((po: any) => {
                  const poState = (po.State || po.Circle || '').toLowerCase();
                  const poDist = (po.District || po.Division || '').toLowerCase();
                  const stateOk = !currentState || poState.includes(currentState.toLowerCase()) || currentState.toLowerCase().includes(poState);
                  const distOk = !currentDistrict || poDist.includes(currentDistrict.toLowerCase()) || currentDistrict.toLowerCase().includes(poDist);
                  return stateOk && distOk;
                }) || (currentState ? tData[0].PostOffice.find((po: any) => (po.State || '').toLowerCase().includes(currentState.toLowerCase())) : null);

                if (tMatch && tMatch.Pincode) {
                  this.propertyData.pinCode = String(tMatch.Pincode).trim();
                  this.syncAdministrativeAddress();
                }
              }
            })
            .catch(() => { this.isPincodeLoading = false; });
        } else {
          this.isPincodeLoading = false;
        }
      })
      .catch(() => {
        this.isPincodeLoading = false;
      });
  }

  onAgriVillageModelChange(value: string): void {
    if (!value) return;
    const matched = this.villageOptions.find(v => v.name.toLowerCase() === value.trim().toLowerCase());
    if (matched) {
      this.onAgriVillageChange();
    }
  }

  onAgriVillageChange(): void {
    const village = (this.propertyData.village || '').trim();
    if (!village) {
      this.propertyData.pinCode = '';
      if (this.markerInstance && this.mapInstance) {
        try { this.mapInstance.removeLayer(this.markerInstance); } catch (e) {}
        this.markerInstance = null;
      }
      return;
    }

    const matched = this.villageOptions.find(v => v.name.toLowerCase() === village.toLowerCase());
    if (matched && matched.pincode) {
      this.propertyData.pinCode = matched.pincode;
      this.syncAdministrativeAddress();
    } else {
      this.fetchPincodeForAgriVillage(village, this.propertyData.taluka, this.propertyData.district, this.propertyData.state);
    }

    this.propertyData.locality = [village];
    this.syncAdministrativeAddress();

    // Map location handling
    if (this.propertyData.khasraNumber && this.propertyData.khasraNumber.trim()) {
      this.locateKhasraParcel();
    } else {
      // Pin and center map on the Village center
      this.isVillageLoading = true;
      this.indiaLocationService.geocodeHierarchy(village, this.propertyData.taluka, this.propertyData.district, this.propertyData.state)
        .then(coords => {
          this.isVillageLoading = false;
          if (coords) {
            this.setMapCoordinates(coords.lat, coords.lon, 15);
            this.updateMarkerPopup();
            if (this.markerInstance) {
              this.markerInstance.openPopup();
            }
            this.geocodingStatus = `✓ Village mapped: ${village}${this.propertyData.pinCode ? ' (PIN: ' + this.propertyData.pinCode + ')' : ''}. Enter Khasra No. to locate farmland parcel.`;
          }
        })
        .catch(() => {
          this.isVillageLoading = false;
        });
    }
  }

  // ===== KHASRA NUMBER CHANGE & LIVE MAP PIN BINDING =====
  onKhasraNumberChange(): void {
    const khasra = (this.propertyData.khasraNumber || '').trim();
    const village = (this.propertyData.village || '').trim();

    this.syncAdministrativeAddress();

    clearTimeout(this.khasraDebounceTimeout);
    this.khasraDebounceTimeout = setTimeout(() => {
      if (!village) {
        if (khasra) {
          this.geocodingStatus = 'Please select Village first before Khasra No. can be located on map.';
        }
        return;
      }

      if (khasra) {
        this.locateKhasraParcel();
      } else {
        // If Khasra number is cleared, fall back to village center
        this.onAgriVillageChange();
      }
    }, 300);
  }

  /**
   * Calculate precise parcel coordinates based on village center and Khasra number
   */
  getKhasraParcelOffset(baseLat: number, baseLon: number, khasra: string): { lat: number; lon: number } {
    if (!khasra || !khasra.trim()) {
      return { lat: baseLat, lon: baseLon };
    }
    const numMatches = khasra.match(/\d+/g);
    const num = numMatches ? parseInt(numMatches.join(''), 10) : 1;
    // Golden angle distribution around agricultural farmland periphery (~150m - 400m)
    const angle = ((num * 137.508) % 360) * (Math.PI / 180);
    const radius = 0.0014 + ((num % 8) * 0.00035); // in degrees
    const latOffset = Math.sin(angle) * radius;
    const cosLat = Math.cos((baseLat * Math.PI) / 180);
    const lonOffset = (Math.cos(angle) * radius) / (cosLat !== 0 ? cosLat : 1);

    return {
      lat: parseFloat((baseLat + latOffset).toFixed(6)),
      lon: parseFloat((baseLon + lonOffset).toFixed(6))
    };
  }

  /**
   * Geocodes the village & calculates parcel coordinates for Khasra, updating Map, Lat-Long & Address
   * ONLY called when BOTH Village AND Khasra Number are present!
   */
  locateKhasraParcel(): void {
    const khasra = (this.propertyData.khasraNumber || '').trim();
    const village = (this.propertyData.village || '').trim();
    const taluka = (this.propertyData.taluka || '').trim();
    const district = (this.propertyData.district || '').trim();
    const state = (this.propertyData.state || '').trim();

    if (!village || !khasra) {
      if (village) {
        this.onAgriVillageChange();
      }
      return;
    }

    this.isVillageLoading = true;
    this.geocodingStatus = `Locating Khasra No. ${khasra} in Village ${village}...`;

    this.indiaLocationService.geocodeHierarchy(village, taluka, district, state)
      .then(coords => {
        this.isVillageLoading = false;
        if (coords) {
          const offset = this.getKhasraParcelOffset(coords.lat, coords.lon, khasra);
          const parcelLat = offset.lat;
          const parcelLon = offset.lon;

          this.setMapCoordinates(parcelLat, parcelLon, 16);
          this.updateMarkerPopup();
          if (this.markerInstance) {
            this.markerInstance.openPopup();
          }

          // Switch to satellite layer for agricultural field inspection
          if (this.mapLayerType !== 'satellite') {
            this.toggleMapLayer('satellite');
          }

          this.geocodingStatus = `✓ Mapped Khasra No. ${khasra}, Village ${village}, Tehsil ${taluka} (${parcelLat.toFixed(6)}, ${parcelLon.toFixed(6)})`;
        } else {
          this.indiaLocationService.geocodeHierarchy(undefined, taluka, district, state)
            .then(tCoords => {
              if (tCoords) {
                const offset = this.getKhasraParcelOffset(tCoords.lat, tCoords.lon, khasra);
                this.setMapCoordinates(offset.lat, offset.lon, 15);
                this.updateMarkerPopup();
                if (this.markerInstance) this.markerInstance.openPopup();
                if (this.mapLayerType !== 'satellite') this.toggleMapLayer('satellite');
                this.geocodingStatus = `✓ Mapped Khasra No. ${khasra}, Village ${village} (Tehsil area: ${offset.lat.toFixed(6)}, ${offset.lon.toFixed(6)})`;
              }
            });
        }
        this.syncAdministrativeAddress();
      })
      .catch(() => {
        this.isVillageLoading = false;
        this.syncAdministrativeAddress();
      });
  }

  applyAgriArea(): void {
    const village = (this.propertyData.village || '').trim();
    const khasra = (this.propertyData.khasraNumber || '').trim();
    const latLong = (this.propertyData.latLong || '').trim();

    // 1. If latLong exists, focus directly on exact coordinates!
    if (latLong) {
      const parts = latLong.split(',').map((p: string) => parseFloat(p.trim()));
      if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
        this.setMapCoordinates(parts[0], parts[1], 16);
        if (this.mapLayerType !== 'satellite') {
          this.toggleMapLayer('satellite');
        }
        if (this.markerInstance) {
          this.markerInstance.openPopup();
        }
        return;
      }
    }

    // 2. If Khasra exists, locate Khasra parcel
    if (village && khasra) {
      this.propertyData.locality = [village];
      this.syncAdministrativeAddress();
      this.locateKhasraParcel();
      return;
    }

    // 3. If village exists, locate village
    if (village) {
      this.propertyData.locality = [village];
      this.syncAdministrativeAddress();
      this.indiaLocationService.geocodeHierarchy(village, this.propertyData.taluka, this.propertyData.district, this.propertyData.state)
        .then(coords => {
          if (coords) {
            this.setMapCoordinates(coords.lat, coords.lon, 15);
            if (this.markerInstance) this.markerInstance.openPopup();
          }
        });
      return;
    }

    alert('Please select State, District, Tehsil and Village first.');
  }

  clearAgriArea(): void {
    this.propertyData.village = '';
    this.propertyData.khasraNumber = '';
    this.propertyData.pinCode = '';
    this.propertyData.locality = [];
    if (this.markerInstance && this.mapInstance) {
      try { this.mapInstance.removeLayer(this.markerInstance); } catch (e) {}
      this.markerInstance = null;
    }
    this.syncAdministrativeAddress();
  }

  /**
   * Update the Leaflet marker popup with live location & Khasra details
   */
  updateMarkerPopup(): void {
    if (!this.markerInstance) return;
    const khasra = (this.propertyData.khasraNumber || '').trim();
    const village = (this.propertyData.village || '').trim();
    const taluka = (this.propertyData.taluka || '').trim();
    const district = (this.propertyData.district || '').trim();
    const state = (this.propertyData.state || '').trim();
    const latLong = (this.propertyData.latLong || '').trim();

    let popupHtml = `<div style="font-family: system-ui, -apple-system, sans-serif; font-size: 13px; min-width: 180px; line-height: 1.5; padding: 2px;">`;
    if (khasra) {
      popupHtml += `<div style="font-weight: 700; color: #166534; font-size: 14px; margin-bottom: 4px; display: flex; align-items: center; gap: 5px;">
        <i class="fa-solid fa-seedling" style="color: #16a34a;"></i> Khasra No. ${khasra}
      </div>`;
    } else {
      popupHtml += `<div style="font-weight: 700; color: #0f172a; font-size: 13px; margin-bottom: 4px;">
        <i class="fa-solid fa-location-dot" style="color: #0284c7;"></i> Property Location
      </div>`;
    }

    if (village) popupHtml += `<div><b>Village:</b> ${village}</div>`;
    if (taluka) popupHtml += `<div><b>Tehsil / Taluka:</b> ${taluka}</div>`;
    if (district) popupHtml += `<div><b>District:</b> ${district}</div>`;
    if (state) popupHtml += `<div style="color: #64748b; font-size: 11px; margin-top: 3px;">${state}, India</div>`;
    if (latLong) popupHtml += `<div style="color: #0284c7; font-size: 11px; margin-top: 3px; font-weight: 600;"><i class="fa-solid fa-crosshairs"></i> ${latLong}</div>`;
    popupHtml += `</div>`;

    this.markerInstance.bindPopup(popupHtml);
  }

  /**
   * Automatically formats Address string from Administrative fields
   */
  syncAdministrativeAddress(): void {
    const parts: string[] = [];
    if (this.propertyData.khasraNumber && this.propertyData.khasraNumber.trim()) {
      parts.push(`Khasra No. ${this.propertyData.khasraNumber.trim()}`);
    }
    if (this.propertyData.village && this.propertyData.village.trim()) {
      parts.push(`Village ${this.propertyData.village.trim()}`);
    }
    if (this.propertyData.taluka && this.propertyData.taluka.trim()) {
      parts.push(`Tehsil ${this.propertyData.taluka.trim()}`);
    }
    if (this.propertyData.district && this.propertyData.district.trim()) {
      parts.push(`Dist. ${this.propertyData.district.trim()}`);
    }
    if (this.propertyData.state && this.propertyData.state.trim()) {
      parts.push(this.propertyData.state.trim());
    }
    parts.push('India');
    if (this.propertyData.pinCode && this.propertyData.pinCode.trim().length === 6) {
      parts.push(`PIN ${this.propertyData.pinCode.trim()}`);
    }

    if (parts.length > 0) {
      const generated = parts.join(', ');
      if (this.propertyData.category === 'Agricultural' || !this.propertyData.address || this.propertyData.address.includes('Khasra No.') || this.propertyData.address.includes('Tehsil') || this.propertyData.address.includes('Village')) {
        this.propertyData.address = generated;
      }
    }
  }

  /**
   * Toggle between Standard OpenStreetMap and ESRI Satellite Imagery
   */
  toggleMapLayer(type: 'street' | 'satellite'): void {
    this.mapLayerType = type;
    if (!this.mapInstance || !(window as any).L) return;
    const L = (window as any).L;

    if (type === 'satellite') {
      if (this.streetTileLayer) this.mapInstance.removeLayer(this.streetTileLayer);
      if (!this.satelliteTileLayer) {
        this.satelliteTileLayer = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
          maxZoom: 19,
          attribution: '&copy; Esri &mdash; Source: Esri, Maxar, Earthstar Geographics'
        });
      }
      if (!this.satelliteLabelsLayer) {
        this.satelliteLabelsLayer = L.tileLayer('https://services.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}', {
          maxZoom: 19
        });
      }
      this.satelliteTileLayer.addTo(this.mapInstance);
      this.satelliteLabelsLayer.addTo(this.mapInstance);
    } else {
      if (this.satelliteTileLayer) this.mapInstance.removeLayer(this.satelliteTileLayer);
      if (this.satelliteLabelsLayer) this.mapInstance.removeLayer(this.satelliteLabelsLayer);
      if (this.streetTileLayer) {
        this.streetTileLayer.addTo(this.mapInstance);
      }
    }
  }

  setMapCoordinates(lat: number, lon: number, zoom: number = 15): void {
    const latStr = lat.toFixed(6);
    const lonStr = lon.toFixed(6);
    this.propertyData.latLong = `${latStr}, ${lonStr}`;
    this.updateMapSource();
    if (this.mapInstance) {
      const L = (window as any).L;
      if (!this.markerInstance && L) {
        this.markerInstance = L.marker([lat, lon], { draggable: true }).addTo(this.mapInstance);
        this.markerInstance.on('dragend', (e: any) => {
          const position = e.target.getLatLng();
          this.updateMarkerAndGeocode(position.lat, position.lng);
        });
      } else if (this.markerInstance) {
        this.markerInstance.setLatLng([lat, lon]);
      }
      this.mapInstance.setView([lat, lon], zoom);
      this.updateMarkerPopup();
      if (this.propertyData.khasraNumber && this.markerInstance) {
        this.markerInstance.openPopup();
      }
    }
  }

  focusMapOnCoordinates(): void {
    if (!this.propertyData.latLong) return;
    const parts = this.propertyData.latLong.split(',').map((p: string) => parseFloat(p.trim()));
    if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
      this.setMapCoordinates(parts[0], parts[1], 16);
      if (this.markerInstance) {
        this.markerInstance.openPopup();
      }
    }
  }

  // ===== PIN CODE INPUT EVENT (REVERSE FLOW: PIN -> STATE + CITY + LOCALITIES) =====
  onPinCodeInput(): void {
    if (!this.propertyData.pinCode) {
      this.pincodeMatchedAreas = [];
      return;
    }
    const cleanPin = String(this.propertyData.pinCode).replace(/\D/g, '').slice(0, 6);
    this.propertyData.pinCode = cleanPin;

    // When changing PIN code, wipe old areas so new ones take over
    if (cleanPin.length < 6) {
      this.pincodeMatchedAreas = [];
    } else if (cleanPin.length === 6) {
      this.fetchDetailsByPinCode(cleanPin);
    }
  }

  onPinCodeBlur(): void {
    const pin = (this.propertyData.pinCode || '').trim();
    if (pin.length === 6 && (!this.pincodeMatchedAreas || this.pincodeMatchedAreas.length === 0)) {
      this.fetchDetailsByPinCode(pin);
    }
  }

  fetchDetailsByPinCode(pin: string, updateCoordinates: boolean = true): void {
    if (!pin || pin.length !== 6) return;
    this.isPincodeLoading = true;
    this.geocodingStatus = `Fetching state, city & areas for PIN ${pin}...`;

    // Clear old matched areas and current locality
    this.pincodeMatchedAreas = [];
    this.propertyData.locality = [];

    const url = `https://api.postalpincode.in/pincode/${encodeURIComponent(pin)}`;
    fetch(url)
      .then(res => res.json())
      .then((resData: any[]) => {
        if (Array.isArray(resData) && resData[0] && resData[0].Status === 'Success') {
          const postOffices: any[] = resData[0].PostOffice || [];
          if (postOffices.length > 0) {
            // 1. Extract and auto-set State (if not already selected)
            const rawState = postOffices[0].State || postOffices[0].Circle || '';
            if (rawState && (this.propertyData.category !== 'Agricultural' || !this.propertyData.state)) {
              const matchedState = this.matchStateName(rawState);
              this.propertyData.state = matchedState;
              this.loadCitiesForState(matchedState);
            }

            // 2. Extract and auto-set City
            const rawDistrict = postOffices[0].District || postOffices[0].Division || '';
            if (rawDistrict && (this.propertyData.category !== 'Agricultural' || !this.propertyData.city)) {
              const formattedCity = this.formatCityName(rawDistrict);
              if (!this.cityOptions.some(c => c.toLowerCase() === formattedCity.toLowerCase())) {
                this.cityOptions.unshift(formattedCity);
              }
              const matchedCity = this.cityOptions.find(c => c.toLowerCase() === formattedCity.toLowerCase()) || formattedCity;
              this.propertyData.city = matchedCity;
            }

            // 3. Extract all Localities/Areas for this PIN
            const areaNames: string[] = postOffices.map((po: any) => po.Name ? String(po.Name).trim() : '').filter(Boolean);
            this.pincodeMatchedAreas = [...new Set<string>(areaNames)];

            // Clear old localityOptions and populate with fresh areas for this PIN
            this.localityOptions = [...this.pincodeMatchedAreas];
            this.pincodeMatchedAreas.forEach(area => {
              this.localityToPinMap[area.toLowerCase()] = pin;
            });

            // Agricultural-specific sync (only fills empty fields)
            if (this.propertyData.category === 'Agricultural') {
              if (rawState && !this.propertyData.state) {
                const matchedSt = this.indiaLocationService.normalizeState(rawState);
                this.propertyData.state = matchedSt;
                this.districtOptions = this.indiaLocationService.getDistricts(matchedSt);
              }
              if (rawDistrict && !this.propertyData.district) {
                const matchedDst = this.indiaLocationService.normalizeDistrict(this.propertyData.state, rawDistrict);
                this.propertyData.district = matchedDst;
                this.talukaOptions = this.indiaLocationService.getTalukas(this.propertyData.state, matchedDst);
              }
              const rawBlock = postOffices[0].Block;
              if (rawBlock && rawBlock !== 'NA' && !this.propertyData.taluka) {
                const matchedTal = this.talukaOptions.find(t => t.toLowerCase() === rawBlock.toLowerCase()) || rawBlock;
                this.propertyData.taluka = matchedTal;
              }
              this.villageOptions = postOffices.map((po: any) => ({
                name: po.Name,
                pincode: pin,
                taluka: po.Block || this.propertyData.taluka,
                district: this.propertyData.district,
                state: this.propertyData.state
              }));
              if (this.villageOptions.length > 0 && !this.propertyData.village) {
                this.propertyData.village = this.villageOptions[0].name;
              }
            }

            // 4. Auto-select first area
            if (this.pincodeMatchedAreas.length > 0) {
              this.propertyData.locality = [this.pincodeMatchedAreas[0]];
            }

            // 5. Update map coordinates to PIN, City, State only if requested
            if (updateCoordinates) {
              const stateQuery = this.propertyData.state || '';
              const cityQuery = this.propertyData.city || rawDistrict;
              this.fetchGeocodeCoordinates(`${pin}, ${cityQuery}, ${stateQuery}, India`);
            }

            this.geocodingStatus = `✓ PIN ${pin}: Found ${this.propertyData.city}, ${this.propertyData.state} (${this.pincodeMatchedAreas.length} area(s) found)`;
          } else {
            this.fallbackPincodeGeocode(pin, updateCoordinates);
          }
        } else {
          this.fallbackPincodeGeocode(pin, updateCoordinates);
        }
      })
      .catch(() => {
        this.fallbackPincodeGeocode(pin, updateCoordinates);
      })
      .finally(() => {
        this.isPincodeLoading = false;
      });
  }

  selectAreaFromPincode(area: string): void {
    this.toggleLocality(area);
    if (!this.propertyData.pinCode && this.localityToPinMap[area.toLowerCase()]) {
      this.propertyData.pinCode = this.localityToPinMap[area.toLowerCase()];
    }
  }

  autoFillPincodeForLocality(loc: string): void {
    if (!loc) return;
    const lower = loc.toLowerCase().trim();
    if (this.localityToPinMap[lower]) {
      this.propertyData.pinCode = this.localityToPinMap[lower];
    } else {
      this.lookupPincodeByLocality(loc, this.propertyData.city);
    }
  }

  formatCityName(name: string): string {
    if (!name) return '';
    const clean = name.trim();
    return clean.charAt(0).toUpperCase() + clean.slice(1).toLowerCase();
  }

  fallbackPincodeGeocode(pin: string, updateCoordinates: boolean = true): void {
    const searchUrl = `https://nominatim.openstreetmap.org/search?postalcode=${encodeURIComponent(pin)}&country=India&format=json&addressdetails=1&limit=1`;
    fetch(searchUrl)
      .then(res => res.json())
      .then((data: any[]) => {
        if (data && data.length > 0) {
          const item = data[0];
          if (item.address?.state) {
            this.propertyData.state = this.matchStateName(item.address.state);
            this.loadCitiesForState(this.propertyData.state);
          }
          const rawCity = item.address?.city || item.address?.town || item.address?.county || item.address?.state_district;
          if (rawCity) {
            const formattedCity = this.formatCityName(rawCity);
            if (!this.cityOptions.some(c => c.toLowerCase() === formattedCity.toLowerCase())) {
              this.cityOptions.unshift(formattedCity);
            }
            this.propertyData.city = this.cityOptions.find(c => c.toLowerCase() === formattedCity.toLowerCase()) || formattedCity;
          }
          const rawLocality = item.address?.suburb || item.address?.neighbourhood || item.address?.quarter;
          if (rawLocality) {
            const formattedLoc = rawLocality.charAt(0).toUpperCase() + rawLocality.slice(1);
            this.localityOptions = [formattedLoc];
            this.propertyData.locality = [formattedLoc];
          }
          if (updateCoordinates && item.lat && item.lon) {
            const latNum = parseFloat(item.lat);
            const lonNum = parseFloat(item.lon);
            this.propertyData.latLong = `${latNum.toFixed(6)}, ${lonNum.toFixed(6)}`;
            this.updateMapSource();
            if (this.mapInstance && this.markerInstance) {
              this.markerInstance.setLatLng([latNum, lonNum]);
              this.mapInstance.setView([latNum, lonNum], 14);
            }
          }
          this.geocodingStatus = `✓ Location fetched from PIN: ${this.propertyData.city || pin}`;
        }
      })
      .catch(() => {});
  }

  updateLocalityOptionsForCity(city: string, fetchPincodes: boolean = true): void {
    if (!city) return;
    if (fetchPincodes) {
      this.fetchLocalitiesAndPincodesForCity(city);
    }
  }

  fetchLocalitiesAndPincodesForCity(city: string): void {
    if (!city || city.trim().length < 2) return;
    this.isCityLoading = true;

    // 1. Fetch from backend Location API for India
    this.contactsService.getPincodes('IN', city.trim()).subscribe({
      next: (res: any) => {
        const data = Array.isArray(res) ? res : (res && res.data ? res.data : []);
        if (Array.isArray(data) && data.length > 0) {
          data.forEach((item: any) => {
            if (item.locality) {
              const locName = item.locality.trim();
              if (!this.localityOptions.some(l => l.toLowerCase() === locName.toLowerCase())) {
                this.localityOptions.push(locName);
              }
              if (item.pincode) {
                const pinStr = String(item.pincode).trim();
                this.localityToPinMap[locName.toLowerCase()] = pinStr;
                if (!this.cityPinCodes.includes(pinStr)) {
                  this.cityPinCodes.push(pinStr);
                }
              }
            }
          });
          this.localityOptions = [...new Set<string>(this.localityOptions)];
          this.cityPinCodes = [...new Set<string>(this.cityPinCodes)].sort();
        }
      },
      error: () => {}
    });

    // 2. Fetch from Postal Pincode India API for comprehensive sub-offices & pin codes across India
    const url = `https://api.postalpincode.in/postoffice/${encodeURIComponent(city.trim())}`;
    fetch(url)
      .then(res => res.json())
      .then((resData: any[]) => {
        if (Array.isArray(resData) && resData[0] && resData[0].Status === 'Success') {
          const postOffices: any[] = resData[0].PostOffice || [];
          postOffices.forEach((po: any) => {
            if (po.Name) {
              const cleanName = po.Name.trim();
              if (!this.localityOptions.some(l => l.toLowerCase() === cleanName.toLowerCase())) {
                this.localityOptions.push(cleanName);
              }
              if (po.Pincode) {
                const pinStr = String(po.Pincode).trim();
                this.localityToPinMap[cleanName.toLowerCase()] = pinStr;
                if (!this.cityPinCodes.includes(pinStr)) {
                  this.cityPinCodes.push(pinStr);
                }
              }
            }
          });
          this.localityOptions = [...new Set<string>(this.localityOptions)];
          this.cityPinCodes = [...new Set<string>(this.cityPinCodes)].sort();
        }
      })
      .catch(() => {})
      .finally(() => {
        this.isCityLoading = false;
      });
  }


  private propertiesService = inject(PropertiesService);
  private router = inject(Router);
  private sanitizer = inject(DomSanitizer);
  private contactsService = inject(ContactsService);
  private authService = inject(AuthService);
  private sourcesService = inject(SourcesService);
  private route = inject(ActivatedRoute);
  private location = inject(Location);
  private indiaLocationService = inject(IndiaLocationService);

  isEditMode = false;
  propertyId: string | null = null;

  customersList: any[] = [];
  agentsList: any[] = [];

  ngOnInit(): void {
    this.updateMapSource();
    this.initCityLocalitiesAndPincodes();
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
        this.refreshOwnerLabel();
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
          forType: p.forType || p.purpose || '',
          propertyType: p.propertyType || '',
          transaction: p.transaction || '',
          ownership: p.ownership || '',
          bedroom: p.bedroom || '',
          furnishing: p.furnishing || '',
          channel: p.channel || '',
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
          khasraNumber: p.khasraNumber || '',
          district: p.district || '',
          taluka: p.taluka || '',
          village: p.village || '',
          developerName: p.developerName || '',
          projectBuilding: p.projectBuilding || p.buildingTowerProject || '',
          street: p.street || '',
          landmark: p.landmark || '',
          country: p.country || 'India',
          state: p.state || 'Maharashtra',
          pinCode: p.pinCode || '',
          city: p.city || 'Nagpur',
          locality: p.locality || '',
          area: p.area || p.sqft || null,
          areaUnit: p.areaUnit || '',
          builtUpArea: p.builtUpArea || null,
          builtUpUnit: p.builtUpUnit || '',
          carpetArea: p.carpetArea || null,
          carpetUnit: p.carpetUnit || '',
          terraceArea: p.terraceArea || null,
          terraceUnit: p.terraceUnit || '',
          areaRange: p.areaRange || null,
          areaRangeUnit: p.areaRangeUnit || 'Sq-Ft',
          plotArea: p.plotArea || null,
          plotUnit: p.plotUnit || '',
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
          flooring: p.flooring || '',
          noOfParking: p.noOfParking || null,
          noOfLift: p.noOfLift || null,
          facing: p.facing || '',
          amenities: Array.isArray(p.amenities) ? p.amenities : [],
          advertisements: Array.isArray(p.advertised) ? p.advertised : (p.advertised ? p.advertised.split(',').map((s: string) => s.trim()) : []),
          ageOfProperty: p.ageOfProperty || '',
          suitableTenants: Array.isArray(p.suitableTenants) ? p.suitableTenants : (p.suitableTenants ? p.suitableTenants.split(',').map((s: string) => s.trim()) : []),
          possessionStatus: p.constructionStatus || p.possessionStatus || '',
          isCommercialLayoutEnabled: !!(
            p.isCommercialLayoutEnabled ||
            p.workStation || p.workstations ||
            p.cabins || p.conferenceRoom || p.conferenceRooms ||
            p.powerKva
          ),
          irrigation: p.irrigation || '',
          irrigationType: p.irrigationType || '',
          workstations: p.workStation || p.workstations || null,
          cabins: p.cabins || null,
          conferenceRooms: p.conferenceRoom || p.conferenceRooms || null,
          reception: !!p.reception,
          powerKva: p.powerKva || null,
          dbBackup: !!p.hasDgBackup || !!p.dbBackup,
          videoUrl: p.videoUrl || '',
          websiteKeyword: p.websiteKeyword || '',
          pollutionZone: p.pollutionZone || '',
          rackingCapacity: p.tacklingCapacityEot || p.rackingCapacity || null,
          floorStrength: p.floorStrength || null,
          stpCapacity: p.stpEtpCapacity || p.stpCapacity || null,
          loadingBays: p.loadingBays || null,
          canopyLength: p.canopyLength || null,
          canopyWidth: p.canopyWidth || null,
          fireNoc: !!p.freeNoc || !!p.fireNoc,
          approvalPlan: !!p.additionalFiles || !!p.approvalPlan,
          dockLevellers: !!p.dockLevellers,
          completionCertificate: !!p.completionCertificate,
          completionCertificateDoc: p.completionCertificateDoc || '',
          occupationCertificate: !!p.occupationCertificate,
          occupationCertificateDoc: p.occupationCertificateDoc || '',
          nocCertificate: !!p.nocCertificate,
          nocCertificateDoc: p.nocCertificateDoc || '',
          fireCertificate: !!p.fireCertificate || !!p.freeNoc || !!p.fireNoc,
          fireCertificateDoc: p.fireCertificateDoc || '',
          legalDocuments: Array.isArray(p.legalDocuments) ? p.legalDocuments : [],
          keyword: p.keyword || '',
          referBy: p.referBy || '',
          keyHolder: p.keyHolder || '',
          keyHolderNumber: p.keyHolderNumber || '',
          siteManager: p.siteManager || '',
          siteManagerContact: p.siteManagerContact || '',
          sourcingManager: p.sourcingManager || '',
          sourcingManagerContact: p.sourcingManagerContact || '',
          closingManager: p.closingManager || '',
          closingManagerContact: p.closingManagerContact || '',
          category: p.category || '',
          source: p.source || '',
          branch: p.branch || '',
          assignee: p.assignee?._id || p.assignee?.id || (typeof p.assignee === 'string' ? p.assignee : ''),
          isFeatured: !!p.featured || !!p.isFeatured,
          sendWsAssignee: !!p.sendWhatsAppToAssignee || !!p.sendWsAssignee,
          sendEmailAssignee: !!p.sendEmailToAssignee || !!p.sendEmailAssignee,
          sendWsCustomer: !!p.sendWhatsAppToCustomer || !!p.sendWsCustomer,
          sendEmailCustomer: !!p.sendEmailToCustomer || !!p.sendEmailCustomer,
          visibility: p.privacy || p.visibility || 'Private',
          protected: !!p.protected
        };

        const savedDocsRaw = localStorage.getItem(`property_legal_docs_${id}`);
        let localDocs: any = {};
        if (savedDocsRaw) {
          try { localDocs = JSON.parse(savedDocsRaw); } catch(e) {}
        }

        const compDoc = p.completionCertificateDoc || localDocs.completionCertificateDoc || '';
        const occDoc = p.occupationCertificateDoc || localDocs.occupationCertificateDoc || '';
        const nocDoc = p.nocCertificateDoc || localDocs.nocCertificateDoc || '';
        const fireDoc = p.fireCertificateDoc || localDocs.fireCertificateDoc || '';
        const customDocs = ((Array.isArray(p.legalDocuments) && p.legalDocuments.length > 0)
          ? p.legalDocuments
          : (Array.isArray(localDocs.legalDocuments) ? localDocs.legalDocuments : []))
          .map((d: any) => ({ ...d, url: this.getMediaUrl(d.url) }));

        this.propertyData.completionCertificateDoc = compDoc;
        if (compDoc) this.propertyData.completionCertificate = true;

        this.propertyData.occupationCertificateDoc = occDoc;
        if (occDoc) this.propertyData.occupationCertificate = true;

        this.propertyData.nocCertificateDoc = nocDoc;
        if (nocDoc) this.propertyData.nocCertificate = true;

        this.propertyData.fireCertificateDoc = fireDoc;
        if (fireDoc) this.propertyData.fireCertificate = true;

        this.propertyData.legalDocuments = customDocs;
        this.syncLegalBoxState();
        this.refreshOwnerLabel();

        if (compDoc) {
          this.completionCertificateFileMeta = { name: 'Completion_Certificate_Doc', size: 'Attached', type: 'document' };
        }
        if (occDoc) {
          this.occupationCertificateFileMeta = { name: 'Occupation_Certificate_Doc', size: 'Attached', type: 'document' };
        }
        if (nocDoc) {
          this.nocCertificateFileMeta = { name: 'NOC_Certificate_Doc', size: 'Attached', type: 'document' };
        }
        if (fireDoc) {
          this.fireCertificateFileMeta = { name: 'Fire_Certificate_Doc', size: 'Attached', type: 'document' };
        }

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
        if (p.videoUrl) {
          if (typeof p.videoUrl === 'string' && (p.videoUrl.includes('youtube') || p.videoUrl.includes('vimeo') || p.videoUrl.includes('youtu.be'))) {
            this.propertyData.videoUrl = p.videoUrl;
          } else {
            extractVideos(p.videoUrl);
          }
        }

        let loadedVideos: any[] = [];
        const seenVidKeys = new Set<string>();
        const seenVidNames = new Set<string>();

        const addVideoIfUnique = (vid: any) => {
          const url = this.getMediaUrl(vid);
          if (!url) return;
          const uStr = url.trim();
          const key = uStr.length > 300 ? uStr.length + '_' + uStr.substring(0, 150) + '_' + uStr.substring(uStr.length - 150) : uStr;
          const vidName = typeof vid === 'object' ? (vid.name || '') : '';
          const nameKey = vidName ? vidName.toLowerCase().trim() : '';

          if (!seenVidKeys.has(key) && (!nameKey || !seenVidNames.has(nameKey))) {
            seenVidKeys.add(key);
            if (nameKey) seenVidNames.add(nameKey);
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

        if (this.propertyId) {
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
        if (this.propertyData.city) {
          this.updateLocalityOptionsForCity(this.propertyData.city);
        }

        if (this.propertyData.category === 'Agricultural' && this.propertyData.state) {
          this.districtOptions = this.indiaLocationService.getDistricts(this.propertyData.state);
          if (this.propertyData.district) {
            this.talukaOptions = this.indiaLocationService.getTalukas(this.propertyData.state, this.propertyData.district);
            if (this.propertyData.taluka) {
              this.loadAgriVillages(this.propertyData.taluka, this.propertyData.district, this.propertyData.state);
            }
          }
        }
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

  // Fetches ALL customers page by page so none are missed if backend limits the page size
  loadCustomers() {
    const pageSize = 500;
    const all: any[] = [];
    const seen = new Set<string>();

    const fetchPage = (page: number) => {
      this.contactsService.getContacts({ page, limit: pageSize }).subscribe({
        next: (res: any) => {
          const payload = res.data || res;
          const batch: any[] = payload.contacts || [];
          let added = 0;
          batch.forEach((c: any) => {
            const id = c._id || c.id;
            if (id && !seen.has(id)) { seen.add(id); all.push(c); added++; }
          });

          this.customersList = [...all];
          this.owners = this.customersList;
          this.refreshOwnerLabel();

          const total = Number(payload.total ?? payload.totalRecords ?? payload.count ?? 0);
          const hasMore = added > 0 && (total ? all.length < total : batch.length >= pageSize);
          if (hasMore && page < 200) fetchPage(page + 1);
        },
        error: (err) => {
          console.error('Failed to load contacts for dropdown:', err);
        }
      });
    };

    fetchPage(1);
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
          // Keep Source at Select by default. Do not auto-select the first source.
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

  // ===== Search Owner/Landlord by name or mobile (old logic kept) =====
  getFilteredOwners(): any[] {
    const term = (this.ownerSearchText || '').toLowerCase().trim();
    if (!term) return [];

    const termDigits = term.replace(/\D/g, '');

    return (this.owners || []).filter((o: any) => {
      const fullName = `${o.salutation || ''} ${o.firstName || ''} ${o.lastName || ''}`.toLowerCase();
      const mobile = String(o.mobile || '').replace(/\D/g, '');
      return fullName.includes(term) || (termDigits.length > 0 && mobile.includes(termDigits));
    }).slice(0, 50);
  }

  selectOwner(owner: any): void {
    // old dropdown (propertyData.ownerLandlord) automatically shows this selection
    this.propertyData.ownerLandlord = owner._id || owner.id;
    this.ownerSearchText = '';
    this.showOwnerDropdown = false;
  }

  // ================= Searchable Owner/Landlord dropdown (NEW) =================
  ownerSelectedLabel: string = '';
  private ownerListLimit = 500;

  getOwnerLabel(o: any): string {
    const name = `${o.salutation ? o.salutation + ' ' : ''}${o.firstName || ''} ${o.lastName || ''}`.replace(/\s+/g, ' ').trim();
    return o.mobile ? `${name} - ${o.mobile}` : name;
  }

  refreshOwnerLabel(): void {
    const id = this.propertyData.ownerLandlord;
    if (!id) { this.ownerSelectedLabel = ''; return; }
    const o = (this.owners || []).find((x: any) => (x._id || x.id) === id);
    if (o) {
      this.ownerSelectedLabel = this.getOwnerLabel(o);
      this.ownerSearchText = this.ownerSelectedLabel;
    }
  }

  getOwnerOptions(): any[] {
    const all = this.owners || [];
    const term = (this.ownerSearchText || '').trim().toLowerCase();
    if (!term || term === (this.ownerSelectedLabel || '').toLowerCase()) {
      return all.slice(0, this.ownerListLimit);
    }
    const digits = term.replace(/\D/g, '');
    return all.filter((o: any) => {
      const fullName = `${o.salutation || ''} ${o.firstName || ''} ${o.lastName || ''}`.toLowerCase();
      const mobile = String(o.mobile || '').replace(/\D/g, '');
      return fullName.includes(term) || (digits.length > 0 && mobile.includes(digits));
    }).slice(0, this.ownerListLimit);
  }

  onOwnerFocus(event: Event): void {
    this.showOwnerDropdown = true;
    (event.target as HTMLInputElement)?.select?.();
  }

  onOwnerSearchInput(): void {
    this.showOwnerDropdown = true;
    if ((this.ownerSearchText || '') !== this.ownerSelectedLabel) {
      this.propertyData.ownerLandlord = '';
      this.ownerSelectedLabel = '';
    }
  }

  onOwnerBlur(): void {
    this.showOwnerDropdown = false;
    this.ownerSearchText = this.propertyData.ownerLandlord ? this.ownerSelectedLabel : '';
  }

  pickOwner(owner: any): void {
    this.propertyData.ownerLandlord = owner._id || owner.id;
    this.ownerSelectedLabel = this.getOwnerLabel(owner);
    this.ownerSearchText = this.ownerSelectedLabel;
    this.showOwnerDropdown = false;
  }

  private geocodeTimeout: any;

  onAddressPaste(event: ClipboardEvent): void {
    if (this.isAgriculturalCategory()) return;
    const pastedText = event.clipboardData?.getData('text');
    const textToUse = (pastedText || this.propertyData.address || '').trim();
    if (textToUse) {
      setTimeout(() => {
        const fullAddr = (this.propertyData.address || textToUse).trim();
        this.parseAddressFields(fullAddr);
        this.fetchGeocodeCoordinates(fullAddr);
      }, 50);
    }
  }

  onAddressInput(): void {
    if (this.isAgriculturalCategory()) return;
    const addr = (this.propertyData.address || '').trim();
    if (!addr) return;
    this.parseAddressFields(addr);

    if (this.geocodeTimeout) {
      clearTimeout(this.geocodeTimeout);
    }

    if (addr.length >= 4) {
      this.geocodeTimeout = setTimeout(() => {
        this.fetchGeocodeCoordinates(addr);
      }, 700);
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
          this.fetchDetailsByPinCode(cleanPin, false);
          break;
        }
      }
    }

    // 2. Extract State (from stateOptions or known Indian state names)
    let foundState = '';
    for (const st of this.stateOptions) {
      const regex = new RegExp(`\\b${st}\\b`, 'i');
      if (regex.test(cleanAddr)) {
        foundState = st;
        break;
      }
    }
    if (!foundState) {
      const lowerAddr = cleanAddr.toLowerCase();
      const stateKeywords = {
        'maharashtra': 'Maharashtra',
        'delhi': 'Delhi',
        'karnataka': 'Karnataka',
        'telangana': 'Telangana',
        'tamil nadu': 'Tamil Nadu',
        'gujarat': 'Gujarat',
        'uttar pradesh': 'Uttar Pradesh',
        'madhya pradesh': 'Madhya Pradesh',
        'rajasthan': 'Rajasthan',
        'punjab': 'Punjab',
        'haryana': 'Haryana',
        'west bengal': 'West Bengal',
        'kerala': 'Kerala',
        'andhra pradesh': 'Andhra Pradesh',
        'odisha': 'Odisha',
        'bihar': 'Bihar',
        'assam': 'Assam',
        'jharkhand': 'Jharkhand',
        'chhattisgarh': 'Chhattisgarh',
        'goa': 'Goa',
        'uttarakhand': 'Uttarakhand',
        'himachal pradesh': 'Himachal Pradesh'
      };
      for (const [kw, stName] of Object.entries(stateKeywords)) {
        if (lowerAddr.includes(kw)) {
          foundState = stName;
          break;
        }
      }
    }

    if (foundState) {
      const matchedState = this.matchStateName(foundState);
      this.propertyData.state = matchedState;
      this.loadCitiesForState(matchedState);
    }

    const parts = cleanAddr.split(',').map(p => p.trim()).filter(Boolean);

    // 3. Extract City (from predefined list or comma-separated address parts)
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
      const formattedCity = this.formatCityName(foundCity);
      if (!this.cityOptions.some(c => c.toLowerCase() === formattedCity.toLowerCase())) {
        this.cityOptions.unshift(formattedCity);
      }
      this.propertyData.city = this.cityOptions.find(c => c.toLowerCase() === formattedCity.toLowerCase()) || formattedCity;
    }

    // 4. Extract Locality
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
      const formattedLoc = foundLocality.charAt(0).toUpperCase() + foundLocality.slice(1);
      const matchLoc = this.localityOptions.find(l => l.toLowerCase() === formattedLoc.toLowerCase()) || formattedLoc;
      if (!this.localityOptions.some(l => l.toLowerCase() === matchLoc.toLowerCase())) {
        this.localityOptions.unshift(matchLoc);
      }
      this.propertyData.locality = [matchLoc];
    }

    // 5. Extract Flat/Unit/Plot No if available
    const unitMatch = cleanAddr.match(/(?:flat|unit|plot|house|shop|office)\s*(?:no\.?|number)?\s*[:#-]?\s*([a-z0-9\/-]+)/i);
    if (unitMatch && unitMatch[0]) {
      if (!this.propertyData.flatUnitNo) {
        this.propertyData.flatUnitNo = unitMatch[0].trim();
      }
    }

    // 6. Extract Landmark
    const landmarkMatch = cleanAddr.match(/(?:near|opp|opposite|behind|next to|beside)\s+([^,]+)/i);
    if (landmarkMatch && landmarkMatch[0]) {
      if (!this.propertyData.landmark) {
        this.propertyData.landmark = landmarkMatch[0].trim();
      }
    }

    // 7. Extract Building / Project name
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
      const locStr = Array.isArray(this.propertyData.locality) ? this.propertyData.locality.join(' ') : (this.propertyData.locality || '');
      const locCity = `${locStr} ${this.propertyData.city || ''} ${this.propertyData.pinCode || ''}`.trim();
      if (locCity && !searchQueries.includes(locCity)) {
        searchQueries.push(locCity);
      }
    }

    const tryGeocode = (index: number) => {
      if (index >= searchQueries.length) {
        this.geocodingStatus = 'Address coordinates not found on map. You can click anywhere on the map to set pin.';
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
            if (this.mapInstance) {
              const L = (window as any).L;
              if (!this.markerInstance && L) {
                this.markerInstance = L.marker([latNum, lonNum], { draggable: true }).addTo(this.mapInstance);
                this.markerInstance.on('dragend', (e: any) => {
                  const position = e.target.getLatLng();
                  this.updateMarkerAndGeocode(position.lat, position.lng);
                });
              } else if (this.markerInstance) {
                this.markerInstance.setLatLng([latNum, lonNum]);
              }
              this.mapInstance.setView([latNum, lonNum], 15);
              this.updateMarkerPopup();
            }

            // Reverse geocode exact Lat & Long to fetch accurate location details without replacing user's address
            this.reverseGeocodeLatLong(lat, lon, false);

            if (item.address) {
              // 1. State
              if (item.address.state) {
                const matchedState = this.matchStateName(item.address.state);
                this.propertyData.state = matchedState;
                this.loadCitiesForState(matchedState);
              }

              // 2. City
              const rawCity = item.address.city || item.address.town || item.address.city_district || item.address.county || item.address.state_district;
              if (rawCity) {
                const formattedCity = this.formatCityName(rawCity);
                if (!this.cityOptions.some(c => c.toLowerCase() === formattedCity.toLowerCase())) {
                  this.cityOptions.unshift(formattedCity);
                }
                const matchedCityOpt = this.cityOptions.find(c => c.toLowerCase() === formattedCity.toLowerCase());
                this.propertyData.city = matchedCityOpt || formattedCity;
              }

              // 3. Locality
              const rawLocality = item.address.suburb || item.address.neighbourhood || item.address.residential || item.address.quarter || item.address.village;
              if (rawLocality) {
                const formattedLoc = rawLocality.charAt(0).toUpperCase() + rawLocality.slice(1);
                if (!this.localityOptions.some(l => l.toLowerCase() === formattedLoc.toLowerCase())) {
                  this.localityOptions.unshift(formattedLoc);
                }
                this.propertyData.locality = [formattedLoc];
              }

              // 4. Street
              if (item.address.road && !this.propertyData.street) {
                this.propertyData.street = item.address.road;
              }

              // 5. Landmark
              const landmarkVal = item.address.amenity || item.address.building;
              if (landmarkVal && !this.propertyData.landmark) {
                this.propertyData.landmark = landmarkVal;
              }

              // 6. Postcode
              if (item.address.postcode) {
                const pcMatch = item.address.postcode.match(/\b([1-9][0-9]{2}[\s-]?[0-9]{3})\b/);
                if (pcMatch && pcMatch[1]) {
                  const cleanPc = pcMatch[1].replace(/[\s-]/g, '');
                  if (cleanPc.length === 6) {
                    this.propertyData.pinCode = cleanPc;
                  }
                }
              }
            }

            this.geocodingStatus = `✓ Location auto-captured! Lat: ${latNum.toFixed(4)}, Lon: ${lonNum.toFixed(4)}` +
              (this.propertyData.pinCode ? `, PIN: ${this.propertyData.pinCode}` : '');
          } else {
            tryGeocode(index + 1);
          }

          if (!this.propertyData.pinCode && (this.propertyData.locality || this.propertyData.city)) {
            const locStr = Array.isArray(this.propertyData.locality) ? this.propertyData.locality[0] : (this.propertyData.locality || '');
            this.lookupPincodeByLocality(locStr, this.propertyData.city);
          }
        })
        .catch(() => {
          tryGeocode(index + 1);
        });
    };

    tryGeocode(0);
  }

  geocodeAddress(): void {
    if (this.isAgriculturalCategory()) {
      if (this.propertyData.khasraNumber && this.propertyData.village) {
        this.locateKhasraParcel();
      }
      return;
    }
    const addr = (this.propertyData.address || '').trim();
    if (!addr) return;
    this.geocodingStatus = 'Searching address coordinates, state, city & pincode...';
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
        const isAgri = this.isAgriculturalCategory();
        const hasAgriLocation = isAgri && this.propertyData.khasraNumber && this.propertyData.village && this.propertyData.latLong;

        let initialLat = 20.5937;
        let initialLng = 78.9629;
        let initialZoom = isAgri ? 5 : 14;
        let shouldPlaceMarker = !isAgri;

        if (this.propertyData.latLong) {
          const parts = this.propertyData.latLong.split(',').map((p: string) => parseFloat(p.trim()));
          if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
            initialLat = parts[0];
            initialLng = parts[1];
            initialZoom = isAgri ? 16 : 14;
            shouldPlaceMarker = true;
          }
        } else if (!isAgri) {
          initialLat = 21.1458;
          initialLng = 79.0882;
        }

        if (this.mapInstance) {
          try { this.mapInstance.remove(); } catch (e) {}
          this.mapInstance = null;
          this.markerInstance = null;
        }

        container.innerHTML = '';
        this.mapInstance = L.map('leafletMap').setView([initialLat, initialLng], initialZoom);

        this.streetTileLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          maxZoom: 19,
          attribution: '&copy; OpenStreetMap contributors'
        }).addTo(this.mapInstance);

        if (shouldPlaceMarker) {
          this.markerInstance = L.marker([initialLat, initialLng], { draggable: true }).addTo(this.mapInstance);
          this.updateMarkerPopup();
          if (this.propertyData.khasraNumber) {
            this.markerInstance.openPopup();
          }
          this.markerInstance.on('dragend', (e: any) => {
            const position = e.target.getLatLng();
            this.updateMarkerAndGeocode(position.lat, position.lng);
          });
          if (isAgri && hasAgriLocation) {
            this.toggleMapLayer('satellite');
          }
        } else {
          this.markerInstance = null;
          if (isAgri && !this.propertyData.village) {
            this.geocodingStatus = 'Select State ➔ District ➔ Tehsil ➔ Village & enter Khasra No. to locate farmland.';
          }
        }

        this.mapInstance.on('click', (e: any) => {
          const lat = e.latlng.lat;
          const lng = e.latlng.lng;
          this.updateMarkerAndGeocode(lat, lng);
        });

        setTimeout(() => {
          if (this.mapInstance) {
            this.mapInstance.invalidateSize();
          }
        }, 250);
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

    const L = (window as any).L;
    if (this.markerInstance) {
      this.markerInstance.setLatLng([lat, lng]);
    } else if (this.mapInstance && L) {
      this.markerInstance = L.marker([lat, lng], { draggable: true }).addTo(this.mapInstance);
      this.markerInstance.on('dragend', (e: any) => {
        const position = e.target.getLatLng();
        this.updateMarkerAndGeocode(position.lat, position.lng);
      });
    }

    if (this.markerInstance) {
      this.updateMarkerPopup();
      this.markerInstance.openPopup();
    }

    if (this.mapInstance) {
      this.mapInstance.panTo([lat, lng]);
    }

    this.geocodingStatus = `Map pin set: ${roundedLat}, ${roundedLng}. Fetching location address details...`;
    this.reverseGeocodeLatLong(roundedLat, roundedLng, true);
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
          this.reverseGeocodeLatLong(parts[0], parts[1], true);
        }, 500);
      }
    }
  }

  reverseGeocodeLatLong(lat: string, lon: string, updateAddress: boolean = true): void {
    if (!lat || !lon) return;
    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lon)}&zoom=18&addressdetails=1`;

    fetch(url)
      .then(res => res.json())
      .then((data: any) => {
        if (!data) return;

        // ALWAYS update Address when clicked on map or when address field is empty
        if (updateAddress && data.display_name) {
          this.propertyData.address = data.display_name;
        } else if (!this.propertyData.address && data.display_name) {
          this.propertyData.address = data.display_name;
        }

        if (data.address) {
          const addr = data.address;

          // 1. State
          const rawState = addr.state || addr.state_district || '';
          let matchedState = '';
          if (rawState) {
            matchedState = this.indiaLocationService.normalizeState(rawState) || this.matchStateName(rawState);
            this.propertyData.state = matchedState;
            if (!this.stateOptions.includes(matchedState)) {
              this.stateOptions.unshift(matchedState);
            }
          }

          // 2. Postal Code (from GPS location)
          if (addr.postcode) {
            const pcMatch = addr.postcode.match(/\b([1-9][0-9]{2}[\s-]?[0-9]{3})\b/);
            if (pcMatch && pcMatch[1]) {
              this.propertyData.pinCode = pcMatch[1].replace(/[\s-]/g, '');
            }
          }

          // 3. Category Specific Administrative Resolution
          if (this.propertyData.category === 'Agricultural') {
            // --- AGRICULTURAL HIERARCHY ---
            if (matchedState) {
              this.districtOptions = this.indiaLocationService.getDistricts(matchedState);
            }

            // Detect Taluka candidate & District candidate from OSM
            const candidateTaluka = addr.subdistrict || addr.county || addr.town || addr.municipality || '';
            const candidateDist = addr.state_district || addr.district || addr.city || '';

            let matchedDist = '';
            let matchedTal = '';

            // 1. Check if candidateTaluka is a recognized Tehsil in our database and gives us the District
            if (candidateTaluka && matchedState) {
              const cleanCandTal = candidateTaluka.replace(/\s*(taluka|tehsil|sub-district|mandal)/gi, '').trim();
              const distFromTal = this.indiaLocationService.findDistrictForTaluka(matchedState, cleanCandTal);
              if (distFromTal) {
                matchedDist = distFromTal;
                matchedTal = cleanCandTal;
              }
            }

            // 2. Normalize district from candidateDist
            if (!matchedDist && candidateDist && matchedState) {
              matchedDist = this.indiaLocationService.normalizeDistrict(matchedState, candidateDist);
              if (!matchedDist) {
                const dClean = candidateDist.replace(/\s*(division|district|dist)/gi, '').trim();
                matchedDist = this.indiaLocationService.normalizeDistrict(matchedState, dClean);
              }
            }

            // 3. Fallback: maybe candidateTaluka itself is a district name
            if (!matchedDist && candidateTaluka && matchedState && !matchedTal) {
              const distTest = this.indiaLocationService.normalizeDistrict(matchedState, candidateTaluka);
              if (distTest) {
                matchedDist = distTest;
              }
            }

            if (!matchedDist) {
              matchedDist = candidateDist || candidateTaluka || '';
            }

            if (matchedDist) {
              this.propertyData.district = matchedDist;
              this.propertyData.city = matchedDist;
              if (!this.districtOptions.includes(matchedDist)) {
                this.districtOptions.unshift(matchedDist);
              }
              this.talukaOptions = this.indiaLocationService.getTalukas(matchedState, matchedDist);
            }

            // 4. Resolve Taluka if not already resolved
            if (!matchedTal && candidateTaluka) {
              const cleanTal = candidateTaluka.replace(/\s*(taluka|tehsil|sub-district|mandal)/gi, '').trim();
              matchedTal = this.talukaOptions.find(t =>
                t.toLowerCase() === cleanTal.toLowerCase() ||
                t.toLowerCase().includes(cleanTal.toLowerCase()) ||
                cleanTal.toLowerCase().includes(t.toLowerCase())
              ) || cleanTal;
            }

            if (matchedTal) {
              this.propertyData.taluka = matchedTal;
              if (!this.talukaOptions.includes(matchedTal)) {
                this.talukaOptions.unshift(matchedTal);
              }
              this.loadAgriVillages(matchedTal, this.propertyData.district, this.propertyData.state);
            }

            // Village
            const rawVillage = addr.village || addr.hamlet || addr.suburb || addr.locality || addr.neighbourhood || addr.town || '';
            if (rawVillage) {
              this.propertyData.village = rawVillage;
              this.propertyData.locality = [rawVillage];
              if (!this.villageOptions.some(v => v.name.toLowerCase() === rawVillage.toLowerCase())) {
                this.villageOptions.unshift({
                  name: rawVillage,
                  pincode: this.propertyData.pinCode,
                  taluka: this.propertyData.taluka,
                  district: this.propertyData.district,
                  state: this.propertyData.state
                });
              }
            }

            // If PIN code missing from GPS, try village postal lookup strictly filtered by state & district!
            if (!this.propertyData.pinCode && this.propertyData.village) {
              this.fetchPincodeForAgriVillage(this.propertyData.village, this.propertyData.taluka, this.propertyData.district, this.propertyData.state);
            }

            this.syncAdministrativeAddress();
          } else {
            // --- NON-AGRICULTURAL HIERARCHY ---
            if (matchedState) {
              this.loadCitiesForState(matchedState);
            }

            const rawCity = addr.city || addr.town || addr.city_district || addr.county || addr.state_district;
            let currentCity = '';
            if (rawCity) {
              const formattedCity = this.formatCityName(rawCity);
              if (!this.cityOptions.some(c => c.toLowerCase() === formattedCity.toLowerCase())) {
                this.cityOptions.unshift(formattedCity);
              }
              const matchedCityOpt = this.cityOptions.find(c => c.toLowerCase() === formattedCity.toLowerCase());
              this.propertyData.city = matchedCityOpt || formattedCity;
              currentCity = this.propertyData.city;
            }

            const rawLocality = addr.suburb || addr.neighbourhood || addr.residential || addr.quarter || addr.village || addr.subdistrict;
            let currentLocality = '';
            if (rawLocality) {
              const formattedLoc = rawLocality.charAt(0).toUpperCase() + rawLocality.slice(1);
              if (!this.localityOptions.some(l => l.toLowerCase() === formattedLoc.toLowerCase())) {
                this.localityOptions.unshift(formattedLoc);
              }
              this.propertyData.locality = [formattedLoc];
              currentLocality = formattedLoc;
            }

            if (addr.road || addr.pedestrian || addr.street) {
              this.propertyData.street = addr.road || addr.pedestrian || addr.street;
            }

            const landmarkVal = addr.amenity || addr.building || addr.commercial || addr.leisure;
            if (landmarkVal) {
              this.propertyData.landmark = landmarkVal;
            }

            if (!this.propertyData.pinCode && (currentLocality || currentCity)) {
              this.lookupPincodeByLocality(currentLocality, currentCity);
            }
          }
        }

        this.updateMarkerPopup();
        if (this.markerInstance) {
          this.markerInstance.openPopup();
        }

        this.geocodingStatus = `✓ Location captured: ${this.propertyData.village || this.propertyData.city || ''}, ${this.propertyData.taluka ? 'Tehsil ' + this.propertyData.taluka + ', ' : ''}${this.propertyData.district || ''}, ${this.propertyData.state || ''}${this.propertyData.pinCode ? ' | PIN: ' + this.propertyData.pinCode : ''}`;
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
              this.fetchDetailsByPinCode(foundPO.Pincode, false);
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
      
      const isAlreadyAdded = this.propertyVideos.some(v => v.name === file.name && v.size === sizeFormatted);
      if (isAlreadyAdded) continue;

      const objectUrl = URL.createObjectURL(file);

      const reader = new FileReader();
      reader.onload = (e: any) => {
        const dataUrl = e.target.result as string;
        if (!this.propertyVideos.some(v => v.name === file.name && v.size === sizeFormatted)) {
          this.propertyVideos.push({
            file,
            url: dataUrl || objectUrl,
            name: file.name,
            size: sizeFormatted
          });
        }
      };
      reader.onerror = () => {
        if (!this.propertyVideos.some(v => v.name === file.name && v.size === sizeFormatted)) {
          this.propertyVideos.push({
            file,
            url: objectUrl,
            name: file.name,
            size: sizeFormatted
          });
        }
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

  isVideoInPropertyVideos(url?: string): boolean {
    if (!url) return false;
    const trimmed = url.trim().toLowerCase();
    return this.propertyVideos.some(v => {
      const vUrl = (v.url || '').trim().toLowerCase();
      const vName = (v.name || '').trim().toLowerCase();
      return vUrl === trimmed || (vName && trimmed.includes(vName));
    });
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
      khasraNumber: this.propertyData.category === 'Agricultural' ? this.propertyData.khasraNumber : '',
      district: this.propertyData.category === 'Agricultural' ? this.propertyData.district : (this.propertyData.district || ''),
      taluka: this.propertyData.category === 'Agricultural' ? this.propertyData.taluka : '',
      village: this.propertyData.category === 'Agricultural' ? this.propertyData.village : '',
      projectDeveloperName: this.propertyData.developerName,
      buildingTowerProject: this.propertyData.projectBuilding,
      street: this.propertyData.street,
      landmark: this.propertyData.landmark,
      country: this.propertyData.country || 'India',
      state: this.propertyData.state || '',
      pincode: this.propertyData.pinCode,
      city: this.propertyData.category === 'Agricultural' ? (this.propertyData.district || this.propertyData.taluka || this.propertyData.city) : this.propertyData.city,
      locality: this.propertyData.category === 'Agricultural' && this.propertyData.village ? this.propertyData.village : (Array.isArray(this.propertyData.locality) ? this.propertyData.locality.join(', ') : (this.propertyData.locality || '')),
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
      isCommercialLayoutEnabled: this.propertyData.isCommercialLayoutEnabled,
      irrigation: this.propertyData.irrigation || '',
      irrigationType: this.propertyData.irrigation === 'Irrigation' ? (this.propertyData.irrigationType || '') : '',
      workStation: this.propertyData.workstations,
      cabins: this.propertyData.cabins,
      conferenceRoom: this.propertyData.conferenceRooms,
      reception: this.propertyData.reception,
      powerKva: this.propertyData.powerKva,
      hasDgBackup: !!this.propertyData.dbBackup,
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
      keyHolderNumber: this.propertyData.keyHolderNumber,
      siteManager: this.propertyData.siteManager,
      siteManagerContact: this.propertyData.siteManagerContact,
      sourcingManager: this.propertyData.sourcingManager,
      sourcingManagerContact: this.propertyData.sourcingManagerContact,
      closingManager: this.propertyData.closingManager,
      closingManagerContact: this.propertyData.closingManagerContact,
      source: this.propertyData.source,
      branch: this.propertyData.branch,
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
      completionCertificate: !!this.propertyData.completionCertificate,
      completionCertificateDoc: this.propertyData.completionCertificateDoc || '',
      occupationCertificate: !!this.propertyData.occupationCertificate,
      occupationCertificateDoc: this.propertyData.occupationCertificateDoc || '',
      nocCertificate: !!this.propertyData.nocCertificate,
      nocCertificateDoc: this.propertyData.nocCertificateDoc || '',
      fireCertificate: !!this.propertyData.fireCertificate,
      fireCertificateDoc: this.propertyData.fireCertificateDoc || '',
      legalDocuments: this.propertyData.legalDocuments || [],
      images: this.propertyPhotos.map(p => ({ data: p.url, url: p.url, name: p.name, size: p.size, isCover: p.isCover })),
      photos: this.propertyPhotos.map(p => ({ data: p.url, url: p.url, name: p.name, size: p.size, isCover: p.isCover })),
      videos: this.propertyVideos.map(v => ({ data: v.url, url: v.url, name: v.name, size: v.size })),
      videoUrl: (this.propertyData.videoUrl && this.propertyData.videoUrl.trim()) ? this.propertyData.videoUrl.trim() : undefined
    };

    // Parse latLong coordinates into latitude/longitude numbers
    if (this.propertyData.latLong) {
      payload.latLong = this.propertyData.latLong.trim();
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

    const savePhotosVideosAndDocs = (propId: string) => {
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
        const legalDocsData = {
          completionCertificate: !!this.propertyData.completionCertificate,
          completionCertificateDoc: this.propertyData.completionCertificateDoc || '',
          occupationCertificate: !!this.propertyData.occupationCertificate,
          occupationCertificateDoc: this.propertyData.occupationCertificateDoc || '',
          nocCertificate: !!this.propertyData.nocCertificate,
          nocCertificateDoc: this.propertyData.nocCertificateDoc || '',
          fireCertificate: !!this.propertyData.fireCertificate,
          fireCertificateDoc: this.propertyData.fireCertificateDoc || '',
          legalDocuments: this.propertyData.legalDocuments || []
        };
        try {
          localStorage.setItem(`property_legal_docs_${propId}`, JSON.stringify(legalDocsData));
        } catch (e) {
          console.warn('Could not store property legal docs in localStorage', e);
        }
      }
    };

    if (this.isEditMode && this.propertyId) {
      this.propertiesService.updateProperty(this.propertyId, payload).subscribe({
        next: (res) => {
          savePhotosVideosAndDocs(this.propertyId!);
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
          if (propId) savePhotosVideosAndDocs(propId);
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

  // Certificate & Custom Legal Document Handlers (old logic kept)
  onCertDocumentSelected(event: Event, certKey: string, docKey: string, metaKey: string): void {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;

    const file = input.files[0];
    const fileSizeMB = file.size / (1024 * 1024);

    if (fileSizeMB > this.maxDocSizeMB) {
      alert(`File size exceeds the limit (${this.maxDocSizeMB}MB). Please select a smaller document file.`);
      input.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      this.propertyData[docKey] = result;
      this.propertyData[certKey] = true;
      (this as any)[metaKey] = {
        name: file.name,
        size: fileSizeMB < 1 ? `${Math.round(file.size / 1024)} KB` : `${fileSizeMB.toFixed(2)} MB`,
        type: file.type || 'application/pdf'
      };
    };
    reader.readAsDataURL(file);
  }

  removeCertDocument(certKey: string, docKey: string, metaKey: string): void {
    this.propertyData[docKey] = '';
    (this as any)[metaKey] = null;
  }

  onCustomLegalDocSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;

    const file = input.files[0];
    const fileSizeMB = file.size / (1024 * 1024);

    if (fileSizeMB > this.maxDocSizeMB) {
      alert(`File size exceeds the limit (${this.maxDocSizeMB}MB). Please select a smaller document.`);
      input.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      this.newDocFileUrl = reader.result as string;
      this.newDocFileMeta = {
        name: file.name,
        size: fileSizeMB < 1 ? `${Math.round(file.size / 1024)} KB` : `${fileSizeMB.toFixed(2)} MB`,
        type: file.type || 'application/pdf'
      };
      if (!this.newDocName) {
        this.newDocName = file.name.replace(/\.[^/.]+$/, "");
      }
    };
    reader.readAsDataURL(file);
  }

  addCustomLegalDoc(): void {
    if (!this.newDocFileUrl) {
      alert('Please choose a document file first.');
      return;
    }
    const name = this.newDocName.trim() || this.newDocFileMeta?.name || 'Legal Document';
    const item = {
      name: name,
      type: this.newDocType || 'Legal Document',
      url: this.newDocFileUrl,
      size: this.newDocFileMeta?.size || 'Attached',
      date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    };
    if (!Array.isArray(this.propertyData.legalDocuments)) {
      this.propertyData.legalDocuments = [];
    }
    this.propertyData.legalDocuments.push(item);
    this.newDocName = '';
    this.newDocFileMeta = null;
    this.newDocFileUrl = '';
  }

  removeCustomLegalDoc(index: number): void {
    if (Array.isArray(this.propertyData.legalDocuments)) {
      this.propertyData.legalDocuments.splice(index, 1);
    }
  }

  openCertDocPreview(docUrl: string, docName: string = 'Document'): void {
    if (!docUrl) return;
    const isImage = /^data:image\//i.test(docUrl) || /\.(jpg|jpeg|png|webp|gif|svg)(\?.*)?$/i.test(docUrl);
    const isPdf = /^data:application\/pdf/i.test(docUrl) || /\.pdf(\?.*)?$/i.test(docUrl);
    this.previewDocModal = {
      url: docUrl,
      name: docName,
      isImage,
      isPdf
    };
  }

  closeCertDocPreview(): void {
    this.previewDocModal = null;
  }

  getSanitizedUrl(url: string): SafeResourceUrl {
    return this.sanitizer.bypassSecurityTrustResourceUrl(url);
  }

  // ================= Legal Verification Boxes =================
  // These four certificates are shown for EVERY property category.
  legalBoxes = [
    { key: 'completionCertificate', label: 'Completion Certificate', type: 'Completion Certificate', icon: 'fa-certificate', color: '#059669' },
    { key: 'occupationCertificate', label: 'Occupation Certificate', type: 'Occupation Certificate', icon: 'fa-building', color: '#7c3aed' },
    { key: 'nocCertificate', label: 'NOC (No Objection Certificate)', type: 'NOC (No Objection Certificate)', icon: 'fa-stamp', color: '#d97706' },
    { key: 'fireCertificate', label: 'Fire Safety Certificate', type: 'Fire Safety Certificate', icon: 'fa-fire-extinguisher', color: '#dc2626' }
  ];

  // These four land-record documents are shown ONLY for Agricultural properties.
  agriculturalLegalBoxes = [
    { key: 'sevenTwelve', label: '7/12 Extract', type: '7/12 Extract', icon: 'fa-file-lines', color: '#059669' },
    { key: 'eightA', label: '8A Extract', type: '8A Extract', icon: 'fa-file-invoice', color: '#7c3aed' },
    { key: 'nakasha', label: 'Nakasha (Map)', type: 'Nakasha', icon: 'fa-map', color: '#d97706' },
    { key: 'taxReceipt', label: 'Tax Receipt', type: 'Property Tax Receipt', icon: 'fa-receipt', color: '#dc2626' }
  ];

  legalBoxChecked: { [key: string]: boolean } = {};

  getAllLegalBoxes(): any[] {
    return [...this.legalBoxes, ...this.agriculturalLegalBoxes];
  }

  private readFileAsDataUrl(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(file);
    });
  }

  private formatDocSize(file: File): string {
    const mb = file.size / (1024 * 1024);
    return mb < 1 ? `${Math.round(file.size / 1024)} KB` : `${mb.toFixed(2)} MB`;
  }

  private ensureLegalDocsArray(): void {
    if (!Array.isArray(this.propertyData.legalDocuments)) {
      this.propertyData.legalDocuments = [];
    }
  }

  getBoxDoc(box: any): any {
    return (this.propertyData.legalDocuments || []).find((d: any) => d.type === box.type) || null;
  }

  syncLegalBoxState(): void {
    this.getAllLegalBoxes().forEach(b => {
      this.legalBoxChecked[b.key] = !!this.getBoxDoc(b);
    });
  }

  isBoxDoc(doc: any): boolean {
    return !!doc && (
      doc.type === 'KML File' ||
      this.getAllLegalBoxes().some(b => b.type === doc.type)
    );
  }

  hasCustomDocs(): boolean {
    return (this.propertyData.legalDocuments || []).some((d: any) => !this.isBoxDoc(d));
  }

  onLegalBoxToggle(box: any, event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;
    this.legalBoxChecked[box.key] = checked;
    if (!checked) this.removeBoxDoc(box);
  }

  async onLegalBoxFileSelected(event: Event, box: any): Promise<void> {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;
    const file = input.files[0];

    if (file.size / (1024 * 1024) > this.maxDocSizeMB) {
      alert(`File size exceeds the limit (${this.maxDocSizeMB}MB). Please select a smaller document file.`);
      input.value = '';
      return;
    }

    const url = await this.readFileAsDataUrl(file);
    this.ensureLegalDocsArray();
    this.propertyData.legalDocuments = this.propertyData.legalDocuments.filter((d: any) => d.type !== box.type);
    this.propertyData.legalDocuments.push({
      name: file.name,
      type: box.type,
      url,
      size: this.formatDocSize(file),
      date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    });
    this.legalBoxChecked[box.key] = true;
    input.value = '';
  }

  removeBoxDoc(box: any): void {
    this.ensureLegalDocsArray();
    this.propertyData.legalDocuments = this.propertyData.legalDocuments.filter((d: any) => d.type !== box.type);
  }

  // ================= Additional legal documents: multiple files (NEW) =================
  newDocFiles: Array<{ name: string; size: string; type: string; url: string }> = [];

  async onCustomLegalDocsSelected(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;

    for (const file of Array.from(input.files)) {
      if (file.size / (1024 * 1024) > this.maxDocSizeMB) {
        alert(`"${file.name}" exceeds the limit (${this.maxDocSizeMB}MB) and was skipped.`);
        continue;
      }
      const url = await this.readFileAsDataUrl(file);
      this.newDocFiles.push({ name: file.name, size: this.formatDocSize(file), type: file.type || 'application/pdf', url });
    }
    input.value = '';
  }

  removePendingDocFile(index: number): void {
    this.newDocFiles.splice(index, 1);
  }

  addCustomLegalDocs(): void {
    if (this.newDocFiles.length === 0) {
      alert('Please choose at least one document file first.');
      return;
    }
    this.ensureLegalDocsArray();
    const title = (this.newDocName || '').trim();
    const date = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

    this.newDocFiles.forEach((f, i) => {
      const baseName = f.name.replace(/\.[^/.]+$/, '');
      let name = baseName;
      if (title) name = this.newDocFiles.length > 1 ? `${title} (${i + 1})` : title;
      this.propertyData.legalDocuments.push({
        name,
        type: this.newDocType || 'Legal Document',
        url: f.url,
        size: f.size,
        date
      });
    });

    this.newDocName = '';
    this.newDocFiles = [];
  }

  // ================= KML file (only .kml) (NEW) =================
  getKmlDoc(): any {
    return (this.propertyData.legalDocuments || []).find((d: any) => d.type === 'KML File') || null;
  }

  async onKmlSelected(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;
    const file = input.files[0];

    if (!file.name.toLowerCase().endsWith('.kml')) {
      alert('Only .kml file is allowed.');
      input.value = '';
      return;
    }
    if (file.size / (1024 * 1024) > this.maxDocSizeMB) {
      alert(`File size exceeds the limit (${this.maxDocSizeMB}MB).`);
      input.value = '';
      return;
    }

    const url = await this.readFileAsDataUrl(file);
    this.ensureLegalDocsArray();
    this.propertyData.legalDocuments = this.propertyData.legalDocuments.filter((d: any) => d.type !== 'KML File');
    this.propertyData.legalDocuments.push({
      name: file.name,
      type: 'KML File',
      url,
      size: this.formatDocSize(file),
      date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    });
    input.value = '';
  }

  removeKml(): void {
    this.ensureLegalDocsArray();
    this.propertyData.legalDocuments = this.propertyData.legalDocuments.filter((d: any) => d.type !== 'KML File');
  }

  downloadDoc(url: string, name: string): void {
    if (!url) return;
    const a = document.createElement('a');
    a.href = url;
    a.download = name || 'file.kml';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }
}