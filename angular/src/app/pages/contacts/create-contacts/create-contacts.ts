import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ContactsService } from '../contacts.service';
import { AuthService } from '../../auth/auth.service';
import { BranchesService } from '../../../services/branches.service';
import { SourcesService } from '../../../services/sources.service';

@Component({
  selector: 'app-create-contacts',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './create-contacts.html',
  styleUrl: './create-contacts.css',
})
export class CreateContacts implements OnInit {
  currentStep = 1;
  agents: any[] = [];
  selectedCountryIso = '';
  isEditMode = false;
  contactId: string | null = null;

  formData = {
    salutation: 'Select',
    firstName: '',
    lastName: '',
    customerType: 'Select',
    contactType: 'Select',
    mobile: '',
    dndStatus: 'Pending',
    otherNumbers: '',
    email: '',
    emailStatus: 'Pending',
    uniqueNumber: '',
    address: '',
    city: '',
    locality: '',
    pincode: '',
    countryCode: '',
    companyName: '',
    businessDomain: '',
    companyType: 'Select',
    designation: '',
    investCapacity: 'Select',
    bankName: '',
    bankAccountNumber: '',
    ifscCode: '',
    professionalAddress: '',
    professionalCity: '',
    professionalLocality: '',

    dob: '',
    anniversary: '',
    sendEmailGreeting: true,
    sendSmsGreeting: true,
    faxNumber: '',
    website: '',
    // skype: '',
    linkdin: '',
    preferredLanguage: 'English',
    rating: 53,
    customerRemark: '',

    keyword: '',
    folder: 'Select',
    source: 'Select',
    branch: 'Select',
    assignedTo: 'Select',
    photograph: '',
    visibility: 'Private',
    isConfidential: false,
    subscribePromotions: true
  };

contactTypes: string[] = [];

customerTypeOptions: any = {

  Customer: [
    'Visitor',
    'Tenants',
    'Seller',
    'Others',
    'Landlord',
    'Investor',
    'Corporate Clients',
    'Buyers',
    'Builder Executive',
    'Builder'
  ],

  'Network Consultant': [
    'None',
    'Developers',
    'Broker',
    'Agent'
  ],

  'Wooden Flooring': [
    'Wooden Flooring',
    'Water Connection',
    'Wallpaper',
    'Wall Mounting Brackets',
    'Vinyl Flooring',
    'Vaastu Consulting',
    'TV/DVD Repair',
    'Tiles Flooring',
    'Steel Fabricators',
    'Stamp Vendors',
    'Software Shop Establishment',
    'Security Guard',
    'Room Partitions/Dividers',
    'PVC Flooring',
    'Property Valuers',
    'Property Lawyers',
    'Printing and Advertising',
    'Plumber/Bath Fitting',
    'Placement Agency',
    'Pest Control',
    'Painter',
    'Packers and Movers',
    'Others',
    'Notary',
    'Modular Kitchen',
    'Marble/Granite Flooring',
    'Key Maker',
    'Internet Broadband',
    'Interior Designer',
    'Insurance',
    'House Keeping',
    'Home Loans',
    'Home Appliance Repair',
    'Gas Connection',
    'False Ceiling',
    'Electricity Connection',
    'Electrician',
    'DTH Connections',
    'Doctor',
    'Curtains Installation',
    'Cook/House Maid',
    'Construction Material Dealers',
    'Concrete Flooring',
    'Civil Work',
    'CA',
    'Carpenter/Furniture',
    'Car Loans',
    'Architects',
    'Advocate/Solicitor'
  ],

  'General Contacts': [
    'Relatives',
    'None',
    'Friends',
    'Employees'
  ]

};

onCustomerTypeChange(): void {
  this.formData.contactType = '';

  this.contactTypes =
    this.customerTypeOptions[this.formData.customerType] || [];
}


  folders = [
    'Sales',
    'Project Leads',
    'Marketing',
    'Brokers'
  ];

  sources: string[] = [
    'Campaigns',
    'Website Form',
    'WhatsApp',
    'Google Search'
  ];
  countryCodeList: any[] = [];
  branches: string[] = [];

  cities: string[] = [];
  localities: any[] = [];

  languages = [
    'Hindi',
    'English',
    'Marathi',
    'Gujarati',
    'Tamil',
    'Telugu',
    'Kannada',
    'Bengali',
    'Punjabi',
    'Other'
  ];

  private branchesService = inject(BranchesService);
  private sourcesService = inject(SourcesService);

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private contactsService: ContactsService,
    private authService: AuthService
  ) { }

  ngOnInit(): void {
    this.loadAgents();
    this.loadCountries();
    this.loadBranches();
    this.loadSources();
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.isEditMode = true;
        this.contactId = id;
        this.loadContactDetails(id);
      }
    });
  }

  loadSources(): void {
    this.sourcesService.getSourceNames().subscribe({
      next: (names) => {
        if (names && names.length > 0) {
          this.sources = names;
        }
      },
      error: (err) => console.error('Error loading sources in CreateContacts:', err)
    });
  }

  loadBranches(): void {
    this.branchesService.getBranchNames().subscribe({
      next: (names) => {
        this.branches = names;
      },
      error: (err) => console.error('Error loading branches in CreateContacts:', err)
    });
  }

  loadContactDetails(id: string): void {
    this.contactsService.getContactById(id).subscribe({
      next: (res: any) => {
        const data = res.data || res;
        if (data) {
          Object.keys(this.formData).forEach(key => {
            if (data[key] !== undefined && data[key] !== null) {
              if (key === 'assignedTo' && typeof data[key] === 'object') {
                this.formData.assignedTo = data[key]._id || data[key].id || 'Select';
              } else {
                (this.formData as any)[key] = data[key];
              }
            }
          });

          if (data.photograph) {
            this.imagePreview = data.photograph;
          }

          if (this.formData.countryCode && this.countryCodeList.length > 0) {
            const matched = this.countryCodeList.find(c => c.code === this.formData.countryCode);
            if (matched) {
              this.selectedCountryIso = matched.isoCode;
              this.onCountryIsoChange(matched.isoCode);
            }
          }
        }
      },
      error: (err) => {
        console.error('Failed to load contact details for editing:', err);
        alert('Failed to load contact details.');
      }
    });
  }

  loadAgents(): void {
    this.authService.getAgents().subscribe({
      next: (res: any) => {
        this.agents = res.data || res;
      },
      error: (err) => {
        console.error('Failed to load agents in contacts creation:', err);
      }
    });
  }

  loadCountries(): void {
    this.contactsService.getCountries().subscribe({
      next: (res: any) => {
        const list = Array.isArray(res) ? res : (res && res.data ? res.data : []);
        this.countryCodeList = list.map((c: any) => ({
          code: c.code,
          country: c.name,
          isoCode: c.isoCode
        }));

        // Match initial countryCode if present
        if (this.formData.countryCode) {
          const matched = this.countryCodeList.find(c => c.code === this.formData.countryCode);
          if (matched) {
            this.selectedCountryIso = matched.isoCode;
            this.onCountryIsoChange(matched.isoCode);
          }
        }
      },
      error: (err) => {
        console.error('Failed to load countries in contacts creation:', err);
      }
    });
  }

  onCountryIsoChange(isoCode: string): void {
    if (!isoCode) {
      this.formData.countryCode = '';
      this.cities = [];
      this.formData.city = '';
      return;
    }
    const matchedCountry = this.countryCodeList.find(c => c.isoCode === isoCode);
    if (matchedCountry) {
      this.formData.countryCode = matchedCountry.code;
      this.contactsService.getCities(matchedCountry.isoCode).subscribe({
        next: (res: any) => {
          const citiesList = Array.isArray(res) ? res : (res && res.data ? res.data : []);
          this.cities = citiesList;
          if (!this.cities.includes(this.formData.city)) {
            this.formData.city = '';
          } else if (this.formData.city) {
            this.onCityChange(this.formData.city, true);
          }
        },
        error: (err) => {
          console.error('Failed to load cities for country:', matchedCountry.isoCode, err);
          this.cities = [];
          this.formData.city = '';
        }
      });
    } else {
      this.formData.countryCode = '';
      this.cities = [];
      this.formData.city = '';
    }
  }

  onCityChange(city: string, isInitial = false): void {
    if (!city || !this.selectedCountryIso) {
      this.localities = [];
      if (!isInitial) {
        this.formData.locality = '';
        this.formData.pincode = '';
      }
      return;
    }

    this.contactsService.getPincodes(this.selectedCountryIso, city).subscribe({
      next: (res: any) => {
        const list = Array.isArray(res) ? res : (res && res.data ? res.data : []);
        this.localities = list;
        if (!isInitial) {
          this.formData.locality = '';
          this.formData.pincode = '';
        }
      },
      error: (err) => {
        console.error('Failed to load pincodes/localities:', err);
        this.localities = [];
      }
    });
  }

  onLocalityChange(localityName: string): void {
    if (!localityName) {
      this.formData.pincode = '';
      return;
    }
    const matched = this.localities.find(
      l => l.locality.trim().toLowerCase() === localityName.trim().toLowerCase()
    );
    if (matched) {
      this.formData.pincode = matched.pincode;
    }
  }

  nextStep() {
    if (this.currentStep < 4) {
      this.currentStep++;
    }
  }

  previousStep() {
    if (this.currentStep > 1) {
      this.currentStep--;
    }
  }

  goToStep(step: number) {
    this.currentStep = step;
  }

  get rating(): number {
    return this.formData.rating;
  }

  set rating(val: number) {
    this.formData.rating = val;
  }

  getSliderColor(): string {
    const val = this.rating;
    if (val <= 40) {
      return '#c60b0bff'; // Red
    } else if (val <= 70) {
      return '#f3f310ff'; // Yellow
    } else {
      return '#0de614ff'; // Green
    }
  }

  getBadgeBg(): string {
    const val = this.rating;
    if (val <= 40) {
      return '#fff'; // Red light bg
    } else if (val <= 70) {
      return '#fff'; // Yellow/Orange light bg
    } else {
      return '#fff'; // Green light bg
    }
  }

  getBadgeBorder(): string {
    const val = this.rating;
    if (val <= 33) {
      return '#fff'; // Red light border
    } else if (val <= 70) {
      return '#fff'; // Yellow/Orange light border
    } else {
      return '#fff'; // Green light border
    }
  }

  submit() {
    if (!this.formData.firstName) {
      alert('First Name is required');
      return;
    }
    if (!this.formData.customerType || this.formData.customerType === 'Select') {
      alert('Customer Type is required');
      return;
    }
    if (!this.formData.contactType || this.formData.contactType === 'Select') {
      alert('Contact Type is required');
      return;
    }
    if (!this.formData.mobile) {
      alert('Mobile number is required');
      return;
    }
    if (!this.validateName()) {
      return;
    }

    const payload: any = { ...this.formData };

    // Clean up 'Select' and empty strings to prevent backend DTO validation failures
    Object.keys(payload).forEach(key => {
      if (payload[key] === 'Select' || payload[key] === '') {
        delete payload[key];
      }
    });

    // Provide default required fields for NestJS backend DTOs if select dropdown is left default
    if (!payload.source) payload.source = 'Campaigns';
    if (!payload.branch) payload.branch = 'Global Team';
    if (payload.rating) payload.rating = Number(payload.rating);

    if (this.isEditMode && this.contactId) {
      this.contactsService.updateContact(this.contactId, payload).subscribe({
        next: (res) => {
          alert('Contact updated successfully!');
          this.router.navigate(['/all-contacts']);
        },
        error: (err) => {
          console.error('Failed to update contact:', err);
          const errMsg = err.error?.message || err.message || 'Check inputs';
          alert('Error updating contact: ' + (Array.isArray(errMsg) ? errMsg.join(', ') : errMsg));
        }
      });
    } else {
      this.contactsService.createContact(payload).subscribe({
        next: (res) => {
          alert('Contact created successfully!');
          this.router.navigate(['/all-contacts']);
        },
        error: (err) => {
          console.error('Failed to create contact:', err);
          const errMsg = err.error?.message || err.message || 'Check inputs';
          alert('Error creating contact: ' + (Array.isArray(errMsg) ? errMsg.join(', ') : errMsg));
        }
      });
    }
  }

  verifyEmail() {
    if (!this.formData.email) {
      alert('Please enter an email address first.');
      return;
    }
    this.contactsService.sendEmailOtp(this.formData.email).subscribe({
      next: (res) => {
        this.formData.emailStatus = 'Safe to send';
        alert('Email verified successfully!');
      },
      error: (err) => {
        console.error('Email verification failed:', err);
        this.formData.emailStatus = 'Not safe to send';
        const errMsg = err.error?.message || err.message || 'Invalid or dummy email.';
        alert('Email verification failed: ' + (Array.isArray(errMsg) ? errMsg.join(', ') : errMsg));
      }
    });
  }

  imagePreview: string | ArrayBuffer | null = null;
  selectedImage!: File;

  onImageSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      this.selectedImage = file;
      const reader = new FileReader();
      reader.onload = () => {
        this.imagePreview = reader.result;
        this.formData.photograph = reader.result as string;
      };
      reader.readAsDataURL(file);
    }
  }



  allowOnlyNumbers(event: KeyboardEvent) {
    const charCode = event.key.charCodeAt(0);

    // only digits 0-9 allowed
    if (charCode < 48 || charCode > 57) {
      event.preventDefault();
    }
  }


  allowOnlyLetters(value: string): string {
    return value.replace(/[^a-zA-Z\s]/g, '');
  }

  onNameInput(field: 'firstName' | 'lastName', event: any) {
    const inputValue = event.target.value;

    const filteredValue = this.allowOnlyLetters(inputValue);

    this.formData[field] = filteredValue;

    // force UI update (important)
    event.target.value = filteredValue;
  }


  validateName(): boolean {

    const nameRegex = /^[a-zA-Z\s]+$/;

    if (!this.formData.firstName || !nameRegex.test(this.formData.firstName)) {
      alert('First name must contain only letters');
      return false;
    }

    if (this.formData.lastName && !nameRegex.test(this.formData.lastName)) {
      alert('Last name must contain only letters');
      return false;
    }

    return true;
  }


}