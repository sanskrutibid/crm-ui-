import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { PropertiesService } from '../properties.service';
import { ContactsService } from '../../contacts/contacts.service';
import { AuthService } from '../../auth/auth.service';
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
  
  // Safe Sanitized Resource Wrapper URL variable for Iframe map data security binding 
  mapSecureUrl!: SafeResourceUrl;
  owners: any[] = [];

  // Master Property NgModel Data Structure Object 
  propertyData: any = {
    ownerLandlord: '',
    requestDate: '2026-06-02',
    forType: 'Rent/Lease',
    propertyType: 'Flat/Apartment',
    transaction: 'New',
    ownership: 'Freehold',
    bedroom: '2 BHK',
    furnishing: 'Semi Furnished',
    channel: 'Direct',
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
    maintenanceCharges: null,
    securityDeposit: null,
    jvRatio: null,
    negotiableApplicable: false,
    paidByLicensor: false,
    depositNegotiable: false,
    depositRefundable: false,
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
    category: 'Residential',
    source: 'Own Website',
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
  propertyTypes = ['Flat/Apartment', 'Commercial Office', 'Showroom', 'Warehouse', 'Plot/Land'];
  transactionOptions = ['New', 'Resale', 'Pre Launch', 'Pre Lease/ Pre Rented', 'Individual', 'Company'];
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
  
  sourcesList = [
    '99acres.com', '99acres.com(free)', 'Agent Referral', 'Blog', 'BNI', 'Business Card', 'Cold Calling', 
    'Commonfloor', 'CRM', 'Dainik Bhaskar', 'Developer/Builder Referral', 'Direct Client', 'Email Marketing', 
    'Employee', 'FaceBook', 'Friends & Relatives', 'Google Adwords', 'Google Search', 'Housing.com', 
    'Incoming call', 'Indiamart.com', 'Instagram', 'Justdial.com', 'Linkedin', 'LinkedIn Lead Form', 
    'Live Chat', 'Loksatta', 'Magicbricks.com', 'Makaan.com', 'Newspaper ads', 'Old Client Referral', 
    'Olx.in', 'Own Website', 'Phian Infotech', 'Poster/Banner/Billboards', 'Propertywala.com', 'Quickr.com(Paid)', 
    'Referral', 'SMS ads', 'Sulekha.com', 'Telecalling', 'Time Of India', 'Walk-in', 'Whats app', 'Youtube.com'
  ];

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

cityOptions = [
  'Nagpur',
  'Mumbai',
  'Pune',
  'Delhi',
  'Bangalore',
  'Hyderabad',
  'Chennai',
  'Kolkata'
];


  private propertiesService = inject(PropertiesService);
  private router = inject(Router);
  private sanitizer = inject(DomSanitizer);
  private contactsService = inject(ContactsService);
  private authService = inject(AuthService);
  private route = inject(ActivatedRoute);
  private location = inject(Location);

  customersList: any[] = [];
  agentsList: any[] = [];

  ngOnInit(): void {
    this.updateMapSource();
    this.loadCustomers();
    this.loadAgents();
    this.route.queryParams.subscribe(params => {
      if (params['contactId']) {
        this.propertyData.ownerLandlord = params['contactId'];
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

  getContactName(contact: any): string {
    if (!contact) return '';
    return `${contact.salutation ? contact.salutation + ' ' : ''}${contact.firstName} ${contact.lastName || ''}`.trim();
  }

  // Live Map Iframe Sanitization Logic Method dynamically building Google Embed Queries
  updateMapSource() {
    let coordinates = this.propertyData.latLong ? this.propertyData.latLong.trim() : '21.1458,79.0882';
    const embedUrl = `https://maps.google.com/maps?q=${encodeURIComponent(coordinates)}&t=&z=15&ie=UTF8&iwloc=&output=embed`;
    this.mapSecureUrl = this.sanitizer.bypassSecurityTrustResourceUrl(embedUrl);
  }

  // Dynamic Navigation Multi-Step Handlers logic routines control structures definitions
  goToStep(stepNumber: number) {
    if (stepNumber >= 1 && stepNumber <= this.totalSteps) {
      this.currentStep = stepNumber;
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  nextStep() {
    if (this.currentStep < this.totalSteps) {
      this.currentStep++;
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  prevStep() {
    if (this.currentStep > 1) {
      this.currentStep--;
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
      // Mark all fields as touched to trigger visual validation border indicators in the template
      form.control.markAllAsTouched();

      // Collect the technical control names that failed validation
      const invalidFields: string[] = [];
      Object.keys(form.controls).forEach(key => {
        const control = form.controls[key];
        if (control.invalid) {
          invalidFields.push(key);
        }
      });

      // Map technical field names to friendly layout steps labels
      const fieldLabels: { [key: string]: string } = {
        ownerLandlord: 'Owner/Landlord (Step 1)',
        forType: 'For (Step 2)',
        propertyType: 'Property Type (Step 2)',
        city: 'City (Step 3)',
        locality: 'Locality (Step 3)',
        area: 'Area (Step 4)',
        expectedPrice: 'Expected Price (Step 4)',
        source: 'Source (Step 6)',
        branch: 'Branch (Step 6)',
        assignee: 'Assignee (Step 6)'
      };

      const missingLabels = invalidFields.map(field => fieldLabels[field] || field);
      alert("Please fill all required fields:\n- " + missingLabels.join("\n- "));
      return;
    }

    // Map Angular NgModel fields to backend Property Schema structure
    const payload: any = {
      ownerLandlord: this.propertyData.ownerLandlord,
      requestDate: this.propertyData.requestDate,
      propertyType: this.propertyData.propertyType,
      transaction: this.propertyData.transaction,
      ownership: this.propertyData.ownership,
      bedroom: this.propertyData.bedroom,
      furnishing: this.propertyData.furnishing,
      channel: this.propertyData.channel,
      description: this.propertyData.description,
      remark: this.propertyData.remark,
      internalNote: this.propertyData.internalNote,
      verifiedDocuments: this.propertyData.docsVerified,
      completedVisit: this.propertyData.visitCompleted,
      suitableFor: this.propertyData.suitableFor.join(', '),
      uniqueFeature: this.propertyData.uniqueFeatures.join(', '),
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
      locality: this.propertyData.locality,
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
      isNegotiable: this.propertyData.negotiableApplicable,
      negotiableAmount: this.propertyData.negotiableAmount,
      maintenanceCharges: this.propertyData.maintenanceCharges,
      securityDeposit: this.propertyData.securityDeposit,
      jvRatio: this.propertyData.jvRatio,
      lockInPeriod: this.propertyData.lockInPeriod,
      leasePeriod: this.propertyData.leasePeriod,
      leaseHoldCharges: this.propertyData.leaseHoldCharges,
      rentFreePeriod: this.propertyData.rentFreePeriod,
      rentPerMonth: this.propertyData.rentPerMonth,
      rentStartDate: this.propertyData.rentStartDate,
      rentEscalationPercentage: this.propertyData.rentEscalation,
      roi: this.propertyData.roi,
      propertyTax: this.propertyData.propertyTax,
      masterBedroom: this.propertyData.masterBedroom,
      guestRoom: this.propertyData.guestRoom,
      childRoom: this.propertyData.childRoom,
      bathroomCommon: this.propertyData.commonBath,
      bathroomAttach: this.propertyData.ensuiteBath,
      otherRoom: this.propertyData.otherRoom,
      totalFloor: this.propertyData.totalFloor,
      propertyOnFloor: this.propertyData.propertyOnFloor,
      flooring: this.propertyData.flooring,
      noOfParking: this.propertyData.noOfParking,
      facing: this.propertyData.facing,
      amenities: this.propertyData.amenities,
      ageOfProperty: this.propertyData.ageOfProperty,
      constructionStatus: this.propertyData.possessionStatus,
      workStation: this.propertyData.workstations,
      cabins: this.propertyData.cabins,
      conferenceRoom: this.propertyData.conferenceRooms,
      reception: this.propertyData.reception,
      powerKva: this.propertyData.powerKva,
      hasDgBackup: this.propertyData.dbBackup,
      videoUrl: this.propertyData.videoUrl,
      websiteKeyword: this.propertyData.websiteKeyword,
      tacklingCapacityEot: this.propertyData.rackingCapacity,
      floorStrength: this.propertyData.floorStrength,
      stpEtpCapacity: this.propertyData.stpCapacity,
      canopyLength: this.propertyData.canopyLength,
      canopyWidth: this.propertyData.canopyWidth,
      freeNoc: this.propertyData.fireNoc,
      additionalFiles: this.propertyData.approvalPlan,
      dockLevellers: this.propertyData.dockLevellers,
      keyword: this.propertyData.keyword,
      referBy: this.propertyData.referBy,
      keyHolder: this.propertyData.keyHolder,
      source: this.propertyData.source,
      featured: this.propertyData.isFeatured,
      sendWhatsAppToAssignee: this.propertyData.sendWsAssignee,
      sendEmailToAssignee: this.propertyData.sendEmailAssignee,
      sendWhatsAppToCustomer: this.propertyData.sendWsCustomer,
      sendEmailToCustomer: this.propertyData.sendEmailCustomer,
      privacy: this.propertyData.visibility,
      status: 'Available',
      category: this.propertyData.category,

      // Map newly added missing schema fields
      assignee: this.propertyData.assignee,
      advertised: this.propertyData.advertisements.join(', ')
    };

    // Parse latLong coordinates into latitude/longitude numbers
    if (this.propertyData.latLong) {
      const parts = this.propertyData.latLong.split(',');
      if (parts.length === 2) {
        payload.latitude = parts[0].trim();
        payload.longitude = parts[1].trim();
      }
    }

    // Parse plotDimension string into plotLength/plotWidth numbers
    if (this.propertyData.plotDimension) {
      const parts = this.propertyData.plotDimension.toLowerCase().split('x');
      if (parts.length === 2) {
        payload.plotLength = parts[0].trim();
        payload.plotWidth = parts[1].trim();
        payload.plotDimensionUnit = 'Feet';
      }
    }

    // Parse propertyDimension string into propertyWidth/propertyDepth/propertyHeight numbers
    if (this.propertyData.propertyDimension) {
      const parts = this.propertyData.propertyDimension.toLowerCase().split('x');
      if (parts.length >= 2) {
        payload.propertyWidth = parts[0].trim();
        payload.propertyDepth = parts[1].trim();
        payload.propertyDimensionUnit = 'Feet';
        if (parts.length >= 3) {
          payload.propertyHeight = parts[2].trim();
        }
      }
    }

    // Fields that MUST be numbers in the backend
    const numericFields = [
      'sqft', 'latitude', 'longitude', 'area', 'builtUpArea', 'carpetArea', 'terraceArea',
      'areaRange', 'plotArea', 'plotLength', 'plotWidth', 'propertyHeight', 'propertyWidth',
      'propertyDepth', 'expectedPrice', 'negotiableAmount', 'maintenanceCharges', 'securityDeposit',
      'jvRatio', 'lockInPeriod', 'leasePeriod', 'leaseHoldCharges', 'rentFreePeriod',
      'rentPerMonth', 'rentEscalationPercentage', 'rentEscalationYears', 'roi', 'totalFloor',
      'noOfParking', 'workStation', 'cabins', 'conferenceRoom', 'powerKva', 'tacklingCapacityEot',
      'floorStrength', 'stpEtpCapacity', 'noOfWashrooms', 'canopyLength', 'canopyWidth',
      'masterBedroom', 'guestRoom', 'childRoom', 'bathroomCommon', 'bathroomAttach'
    ];

    numericFields.forEach(field => {
      if (payload[field] !== undefined && payload[field] !== null && payload[field] !== '') {
        // Remove currency symbols, commas, and formatting characters
        let cleanStr = String(payload[field]).replace(/[^\d.-]/g, '');
        
        // Handle Crores/Lacs/Thousands multipliers if present in original string input
        const origStr = String(payload[field]).toLowerCase();
        let multiplier = 1;
        if (origStr.includes('cr') || origStr.includes('crore')) {
          multiplier = 10000000;
        } else if (origStr.includes('lac') || origStr.includes('lakh') || origStr.includes('l')) {
          multiplier = 100000;
        } else if (origStr.includes('th') || origStr.includes('k') || origStr.includes('thousand')) {
          multiplier = 1000;
        }

        const parsed = Number(cleanStr);
        if (!isNaN(parsed)) {
          payload[field] = parsed * multiplier;
        }
      }
    });

    // Clean up empty strings, nulls, and undefined properties to prevent Class Validator failures
    Object.keys(payload).forEach(key => {
      if (payload[key] === '' || payload[key] === null || payload[key] === undefined) {
        delete payload[key];
      }
    });

    this.propertiesService.createProperty(payload).subscribe({
      next: (res) => {
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