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
  showBankDetails = false; // Bank Detail ON/OFF toggle
  agents: any[] = [];
  selectedCountryIso = '';
  isEditMode = false;
  contactId: string | null = null;

  // When opened from the lead form: "/create-contact?returnUrl=/create-lead"
  private returnUrl: string | null = null;

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
    linkdin: '',
    preferredLanguage: 'English',
    rating: 53,
    customerRemark: '',

    keyword: '',
    source: 'Select',
    branch: 'Select',
    assignedTo: 'Select',
    photograph: '',
    // Backend accepts only 'Private' or 'Branch'
    visibility: 'Private',
  };

  contactTypes: string[] = [];

  // Multiple keyword support
  keywords: string[] = [];
  keywordInput = '';

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
    // Only allow internal paths as return target.
    const ru = this.route.snapshot.queryParamMap.get('returnUrl');
    this.returnUrl = ru && ru.startsWith('/') && !ru.startsWith('//') ? ru : null;

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

  // Back / Cancel: go back to the lead form if we came from there.
  goBack(): void {
    this.router.navigateByUrl(this.returnUrl || '/all-contacts');
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

          // Old records may still carry an invalid visibility value.
          if (this.formData.visibility !== 'Branch') {
            this.formData.visibility = 'Private';
          }

          // Open the Bank Detail section if bank data already exists.
          if (
            this.formData.bankName ||
            this.formData.bankAccountNumber ||
            this.formData.ifscCode ||
            this.formData.professionalAddress ||
            this.formData.professionalCity ||
            this.formData.professionalLocality
          ) {
            this.showBankDetails = true;
          }

          if (data.photograph) {
            this.imagePreview = data.photograph;
          }

          // Load previously saved keywords when editing a contact.
          if (Array.isArray(data.keywords)) {
            this.keywords = data.keywords
              .map((keyword: any) => String(keyword).trim())
              .filter((keyword: string) => keyword.length > 0);
          } else if (typeof data.keyword === 'string' && data.keyword.trim()) {
            this.keywords = data.keyword
              .split(',')
              .map((keyword: string) => keyword.trim())
              .filter((keyword: string) => keyword.length > 0);
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

  addKeyword(): void {
    const value = this.keywordInput.trim();

    if (!value) {
      return;
    }

    // Prevent duplicate keywords (case-insensitive).
    const alreadyExists = this.keywords.some(
      keyword => keyword.toLowerCase() === value.toLowerCase()
    );

    if (!alreadyExists) {
      this.keywords.push(value);
    }

    this.keywordInput = '';
  }

  removeKeyword(index: number): void {
    if (index >= 0 && index < this.keywords.length) {
      this.keywords.splice(index, 1);
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
    return '#fff';
  }

  getBadgeBorder(): string {
    return '#fff';
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
    if (!this.formData.countryCode) {
      alert('Please select country code');
      this.currentStep = 1;
      return;
    }
    if (!this.formData.mobile) {
      alert('Mobile number is required');
      return;
    }
    if (!this.validateName()) {
      return;
    }

    // Store all keywords as one comma-separated value.
    this.formData.keyword = this.keywords.join(', ');

    const payload: any = { ...this.formData };

    // Clean up 'Select' and empty strings to prevent backend DTO validation failures
    Object.keys(payload).forEach(key => {
      if (payload[key] === 'Select' || payload[key] === '') {
        delete payload[key];
      }
    });

    // Required backend fields fallback
    if (!payload.source) payload.source = 'Campaigns';
    if (!payload.branch) payload.branch = 'Global Team';
    if (payload.rating) payload.rating = Number(payload.rating);

    if (this.isEditMode && this.contactId) {
      this.contactsService.updateContact(this.contactId, payload).subscribe({
        next: () => {
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
        next: (res: any) => {
          alert('Contact created successfully!');

          const newId = res?.data?.id || res?.id;

          // Opened from the lead form -> go back and auto-select this contact.
          if (this.returnUrl && newId) {
            const tree = this.router.parseUrl(this.returnUrl);
            tree.queryParams = { ...tree.queryParams, newContactId: newId };
            this.router.navigateByUrl(tree);
          } else {
            this.router.navigate(['/all-contacts']);
          }
        },
        error: (err) => {
          console.error('Failed to create contact:', err);
          const errMsg = err.error?.message || err.message || 'Check inputs';
          alert('Error creating contact: ' + (Array.isArray(errMsg) ? errMsg.join(', ') : errMsg));
        }
      });
    }
  }

  verifyEmail(): void {
    if (!this.formData.email || !this.formData.email.trim()) {
      alert('Please enter an email address first.');
      return;
    }

    this.contactsService.sendEmailOtp(this.formData.email.trim()).subscribe({
      next: () => {
        alert('Verification OTP has been sent to the customer email.');
      },
      error: (err) => {
        console.error('Email verification failed:', err);
        const errMsg =
          err.error?.message ||
          err.message ||
          'Unable to send verification email.';

        alert(
          'Unable to send verification email: ' +
          (Array.isArray(errMsg) ? errMsg.join(', ') : errMsg)
        );
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
    if (event.key.length === 1 && (charCode < 48 || charCode > 57)) {
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