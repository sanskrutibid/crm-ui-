import { CommonModule } from '@angular/common';
import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  ValidationErrors,
  ValidatorFn,
  Validators
} from '@angular/forms';
import { EmployeesService } from '../employees.service';
import { RoleServiceTs } from '../../../control-panel/services/role.service';
import { ContactsService } from '../../../contacts/contacts.service';

@Component({
  selector: 'app-employee-add',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule
  ],
  templateUrl: './employee-add.html',
  styleUrl: './employee-add.css'
})
export class EmployeeAdd implements OnInit {
  @Output() employeeAdded = new EventEmitter<void>();

  employeeForm!: FormGroup;

  previewImage: string = 'assets/images/user.png';

  countryList: any[] = [];
  selectedCountryIso: string = 'IN';
  citiesList: string[] = [];
  locationsList: any[] = [];
  isCustomCity = false;
  isCustomLocation = false;

  // ==========================
  // Dropdown Data
  // ==========================

  departments = [
    'HR',
    'IT',
    'Sales',
    'Marketing',
    'Accounts',
    'Support'
  ];

  designations: string[] = [];

  managers = [
    'Rahul Sharma',
    'Priya Patel',
    'Amit Singh'
  ];

  employmentTypes = [
    'Permanent',
    'Contract',
    'Intern',
    'Consultant'
  ];

  shifts = [
    'General',
    'Morning',
    'Evening',
    'Night'
  ];

  constructor(
    private fb: FormBuilder,
    private readonly employeesService: EmployeesService,
    private readonly roleService: RoleServiceTs,
    private readonly contactsService: ContactsService
  ) {}

  loadCountries(): void {
    this.contactsService.getCountries().subscribe({
      next: (res: any) => {
        const list = Array.isArray(res) ? res : (res && res.data ? res.data : []);
        this.countryList = list.map((c: any) => ({
          name: c.name,
          isoCode: c.isoCode
        }));
      },
      error: (err) => {
        console.error('Failed to load countries:', err);
      }
    });
  }

  loadCities(countryIso: string, isInitial = false): void {
    if (!countryIso) {
      this.citiesList = [];
      return;
    }
    this.contactsService.getCities(countryIso).subscribe({
      next: (res: any) => {
        this.citiesList = Array.isArray(res) ? res : (res && res.data ? res.data : []);
        if (!isInitial) {
          this.employeeForm.patchValue({
            city: '',
            location: '',
            pincode: ''
          });
          this.locationsList = [];
        }
      },
      error: (err) => {
        console.error('Failed to load cities:', err);
        this.citiesList = [];
      }
    });
  }

  loadLocations(city: string, isInitial = false): void {
    if (!city || !this.selectedCountryIso) {
      this.locationsList = [];
      return;
    }
    this.contactsService.getPincodes(this.selectedCountryIso, city).subscribe({
      next: (res: any) => {
        const list = Array.isArray(res) ? res : (res && res.data ? res.data : []);
        this.locationsList = list;
        if (!isInitial) {
          this.employeeForm.patchValue({
            location: '',
            pincode: ''
          });
        }
      },
      error: (err) => {
        console.error('Failed to load locations:', err);
        this.locationsList = [];
      }
    });
  }

  ngOnInit(): void {
    this.loadCountries();
    this.loadCities('IN', true);

    this.roleService.roles$.subscribe(res => {
      this.designations = res.map(r => r.roleName);
    });

    this.roleService.fetchRoles().subscribe({
      error: (err) => console.error('Error fetching roles for designations dropdown:', err)
    });

    this.employeeForm = this.fb.group({
      // Personal
      employeeId: [''],
      firstName: ['', Validators.required],
      middleName: [''],
      lastName: ['', Validators.required],
      gender: ['Male'],
      dob: [''],
      bloodGroup: [''],
      maritalStatus: ['Single'],
      nationality: ['Indian'],

      // Contact
      mobile: ['', [Validators.required]],
      alternateMobile: [''],
      personalEmail: [''],
      officialEmail: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(4)]],
      confirmPassword: ['', Validators.required],
      currentAddress: [''],
      permanentAddress: [''],
      city: [''],
      location: [''],
      state: [''],
      country: ['India'],
      pincode: [''],

      // Employment
      department: ['Sales', Validators.required],
      designation: ['Sales Agent', Validators.required],
      reportingManager: [''],
      joiningDate: [new Date().toISOString().substring(0, 10)],
      employmentType: ['Permanent'],
      workLocation: ['Office'],
      shift: ['General'],
      salary: [''],
      salaryType: ['Monthly'],

      // Bank
      accountHolderName: [''],
      bankName: [''],
      branchName: [''],
      accountNumber: [''],
      confirmAccountNumber: [''],
      ifscCode: [''],
      micrCode: [''],
      upiId: [''],
      salaryAccount: ['Yes'],

      // Documents (Optional)
      aadhaarNumber: [''],
      panNumber: [''],
      passportNumber: [''],
      aadhaarCard: [''],
      panCard: [''],
      appointmentLetter: [''],

      // Emergency (Optional)
      emergencyPerson: [''],
      relationship: [''],
      emergencyMobile: [''],
      emergencyAddress: ['']
    },
    {
      validators: [this.accountNumberValidator(), this.passwordMatchValidator()]
    });

    this.setupEmployeeIdGeneration();

  }

  onCountryChange(event: any): void {
    const countryName = event.target.value;
    const matched = this.countryList.find(c => c.name === countryName);
    if (matched) {
      this.selectedCountryIso = matched.isoCode;
      this.employeeForm.patchValue({
        country: matched.name,
        state: '',
        city: '',
        location: '',
        pincode: ''
      });
      this.loadCities(matched.isoCode);
    } else {
      this.selectedCountryIso = '';
      this.employeeForm.patchValue({
        country: countryName,
        state: '',
        city: '',
        location: '',
        pincode: ''
      });
      this.citiesList = [];
      this.locationsList = [];
    }
  }

  onCityChange(event: any): void {
    const value = event.target.value;
    if (value === 'Other') {
      this.isCustomCity = true;
      this.isCustomLocation = true;
      this.locationsList = [];
      this.employeeForm.patchValue({
        city: '',
        location: '',
        state: '',
        pincode: ''
      });
    } else if (value && this.selectedCountryIso) {
      this.isCustomCity = false;
      this.isCustomLocation = false;
      this.employeeForm.patchValue({
        city: value,
        location: '',
        pincode: ''
      });
      this.loadLocations(value);
    } else {
      this.isCustomCity = false;
      this.isCustomLocation = false;
      this.locationsList = [];
      this.employeeForm.patchValue({
        city: '',
        location: '',
        pincode: ''
      });
    }
  }

  onLocationChange(event: any): void {
    const value = event.target.value;
    if (value === 'Other') {
      this.isCustomLocation = true;
      this.employeeForm.patchValue({
        location: '',
        pincode: ''
      });
    } else if (value) {
      this.isCustomLocation = false;
      const matched = this.locationsList.find(l => l.locality === value);
      if (matched) {
        this.employeeForm.patchValue({
          location: value,
          pincode: matched.pincode
        });
      }
    } else {
      this.isCustomLocation = false;
      this.employeeForm.patchValue({
        location: '',
        pincode: ''
      });
    }
  }

  toggleCustomCity(custom: boolean): void {
    this.isCustomCity = custom;
    if (!custom) {
      this.locationsList = [];
      this.employeeForm.patchValue({
        city: '',
        location: '',
        state: '',
        pincode: ''
      });
    } else {
      this.isCustomLocation = true;
    }
  }

  toggleCustomLocation(custom: boolean): void {
    this.isCustomLocation = custom;
    if (!custom) {
      const cityVal = this.employeeForm.get('city')?.value;
      if (cityVal && this.selectedCountryIso) {
        this.loadLocations(cityVal);
      }
      this.employeeForm.patchValue({
        location: '',
        pincode: ''
      });
    }
  }

  setupEmployeeIdGeneration(): void {
    const fieldsToWatch = ['firstName', 'lastName', 'designation', 'dob', 'joiningDate'];
    fieldsToWatch.forEach(field => {
      this.employeeForm.get(field)?.valueChanges.subscribe(() => {
        this.updateGeneratedEmployeeId();
      });
    });
  }

  updateGeneratedEmployeeId(): void {
    const firstName = this.employeeForm.get('firstName')?.value || '';
    const lastName = this.employeeForm.get('lastName')?.value || '';
    const designation = this.employeeForm.get('designation')?.value || '';
    const dob = this.employeeForm.get('dob')?.value || '';
    const joiningDate = this.employeeForm.get('joiningDate')?.value || '';

    if (!firstName.trim() && !lastName.trim()) {
      this.employeeForm.patchValue({ employeeId: '' }, { emitEvent: false });
      return;
    }

    const fn = firstName.trim().toUpperCase();
    const ln = lastName.trim().toUpperCase();
    const des = designation.trim().toUpperCase();

    const fChar = fn ? fn.charAt(0) : 'X';
    const lChar = ln ? ln.charAt(0) : 'X';
    const dChar = des ? des.charAt(0) : 'X';

    let dobDay = '00';
    if (dob) {
      const d = new Date(dob);
      if (!isNaN(d.getTime())) {
        dobDay = String(d.getDate()).padStart(2, '0');
      }
    }

    let jdYearDigit = '0';
    if (joiningDate) {
      const d = new Date(joiningDate);
      if (!isNaN(d.getTime())) {
        jdYearDigit = String(d.getFullYear()).slice(-1);
      }
    }

    const docDay = String(new Date().getDate()).padStart(2, '0');

    const generatedId = `${fChar}${lChar}${dChar}${dobDay}${jdYearDigit}${docDay}`;
    this.employeeForm.patchValue({ employeeId: generatedId }, { emitEvent: false });
  }

  // ==========================
  // Image Upload
  // ==========================

  onImageSelected(event: any): void {

    const file = event.target.files[0];

    if (!file) return;

    const reader = new FileReader();

    reader.onload = () => {

      this.previewImage = reader.result as string;

    };

    reader.readAsDataURL(file);

  }

  onFileSelected(event: any, controlName: string): void {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        this.employeeForm.patchValue({
          [controlName]: reader.result as string
        });
      };
      reader.readAsDataURL(file);
    } else {
      this.employeeForm.patchValue({
        [controlName]: ''
      });
    }
  }

  // ==========================
  // Account Number Match
  // ==========================

  accountNumberValidator(): ValidatorFn {

    return (
      control: AbstractControl
    ): ValidationErrors | null => {

      const acc =
        control.get('accountNumber')?.value;

      const confirm =
        control.get('confirmAccountNumber')?.value;

      if (!acc || !confirm) {

        return null;

      }

      return acc === confirm
        ? null
        : { accountMismatch: true };

    };

  }

  passwordMatchValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const password = control.get('password')?.value;
      const confirmPassword = control.get('confirmPassword')?.value;
      if (!password || !confirmPassword) {
        return null;
      }
      return password === confirmPassword ? null : { passwordMismatch: true };
    };
  }

  // ==========================
  // Submit
  // ==========================

  saveEmployee(): void {
    if (this.employeeForm.invalid) {
      this.employeeForm.markAllAsTouched();
      
      const invalidFields: string[] = [];
      const controls = this.employeeForm.controls;
      for (const name in controls) {
        if (controls[name].invalid) {
          const friendlyName = name
            .replace(/([A-Z])/g, ' $1')
            .replace(/^./, str => str.toUpperCase());
          invalidFields.push(friendlyName);
        }
      }
      
      alert('Please fill out all required fields correctly:\n' + invalidFields.join(', '));
      return;
    }

    const payload = { ...this.employeeForm.value };
    // Remove confirm fields since they are just for frontend validation
    delete payload.confirmAccountNumber;
    delete payload.confirmPassword;
    
    // In our frontend schema, previewImage is a base64 string, so we map it to profileImage in the backend
    payload.profileImage = this.previewImage;
    payload.status = 'Active';

    this.employeesService.createEmployee(payload).subscribe({
      next: () => {
        alert('Employee Added Successfully');
        this.employeeAdded.emit();
      },
      error: (err) => {
        console.error('Failed to create employee:', err);
        alert('Failed to add employee: ' + (err.error?.message || err.message));
      }
    });
  }

  // ==========================
  // Reset
  // ==========================

  resetForm(): void {

    this.employeeForm.reset();

    this.previewImage = 'assets/images/user.png';

  }

  // ==========================
  // Getter
  // ==========================

  get f() {

    return this.employeeForm.controls;

  }

}