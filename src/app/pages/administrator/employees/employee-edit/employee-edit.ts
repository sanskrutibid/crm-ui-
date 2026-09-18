import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
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
  selector: 'app-employee-edit',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule
  ],
  templateUrl: './employee-edit.html',
  styleUrl: './employee-edit.css'
})
export class EmployeeEdit implements OnInit {
  @Input() employeeId?: string;
  @Output() employeeUpdated = new EventEmitter<void>();
  @Output() backToList = new EventEmitter<void>();

  employeeForm!: FormGroup;
  previewImage: string = 'assets/images/user.png';
  originalEmployeeData: any = null;

  countryList: any[] = [];
  selectedCountryIso: string = 'IN';
  citiesList: string[] = [];
  locationsList: any[] = [];
  isCustomCity = false;
  isCustomLocation = false;

  // Dropdown data matching employee-add component
  departments = ['HR', 'IT', 'Sales', 'Marketing', 'Accounts', 'Support'];
  designations: string[] = [];
  managers = ['Rahul Sharma', 'Priya Patel', 'Amit Singh'];
  employmentTypes = ['Permanent', 'Contract', 'Intern', 'Consultant'];
  shifts = ['General', 'Morning', 'Evening', 'Night'];

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
        console.error('Failed to load countries in edit:', err);
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
        console.error('Failed to load cities in edit:', err);
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
        console.error('Failed to load locations in edit:', err);
        this.locationsList = [];
      }
    });
  }

  ngOnInit(): void {
    this.loadCountries();

    this.roleService.roles$.subscribe(res => {
      this.designations = res.map(r => r.roleName);
    });

    this.roleService.fetchRoles().subscribe({
      error: (err) => console.error('Error fetching roles for designations dropdown in edit:', err)
    });

    this.initForm();
    if (this.employeeId) {
      this.loadEmployeeData(this.employeeId);
    }
  }

  initForm(): void {
    this.employeeForm = this.fb.group({
      // =====================
      // Personal
      // =====================
      employeeId: [{ value: '', disabled: true }],
      firstName: ['', Validators.required],
      middleName: [''],
      lastName: ['', Validators.required],
      gender: [''],
      dob: [''],
      bloodGroup: [''],
      maritalStatus: [''],
      nationality: ['Indian'],

      // Contact
      mobile: ['', [Validators.required]],
      alternateMobile: [''],
      personalEmail: [''],
      officialEmail: ['', [Validators.required, Validators.email]],
      password: [''],
      confirmPassword: [''],
      currentAddress: [''],
      permanentAddress: [''],
      city: [''],
      location: [''],
      state: [''],
      country: ['India'],
      pincode: [''],

      // Employment
      department: ['', Validators.required],
      designation: ['', Validators.required],
      reportingManager: [''],
      joiningDate: [''],
      employmentType: ['Permanent'],
      workLocation: [''],
      shift: ['General'],
      status: ['Active'],
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

      // Documents
      aadhaarNumber: [''],
      panNumber: [''],
      passportNumber: [''],
      aadhaarCard: [''],
      panCard: [''],
      appointmentLetter: [''],

      // Emergency
      emergencyPerson: [''],
      relationship: [''],
      emergencyMobile: [''],
      emergencyAddress: ['']
    }, {
      validators: [this.accountNumberValidator(), this.passwordMatchValidator()]
    });
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

  passwordMatchValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const password = control.get('password')?.value;
      const confirmPassword = control.get('confirmPassword')?.value;
      if (!password && !confirmPassword) {
        return null;
      }
      return password === confirmPassword ? null : { passwordMismatch: true };
    };
  }

  accountNumberValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const acc = control.get('accountNumber')?.value;
      const confirm = control.get('confirmAccountNumber')?.value;
      if (!acc || !confirm) {
        return null;
      }
      return acc === confirm ? null : { accountMismatch: true };
    };
  }

  loadEmployeeData(id: string): void {
    this.employeesService.getEmployee(id).subscribe({
      next: (res: any) => {
        const data = res.data || res;
        this.originalEmployeeData = { ...data };
        
        // Format date strings to YYYY-MM-DD for binding to date inputs
        const formattedDob = this.formatDate(data.dob);
        const formattedJoiningDate = this.formatDate(data.joiningDate);
        
        this.employeeForm.patchValue({
          ...data,
          employeeId: data.employeeId || data.id || data._id || id,
          dob: formattedDob,
          joiningDate: formattedJoiningDate,
          confirmAccountNumber: data.accountNumber || '',
          confirmPassword: data.password || ''
        });

        const country = data.country || 'India';
        const city = data.city || '';
        const location = data.location || '';

        // First load countries if they aren't loaded yet
        if (this.countryList.length === 0) {
          this.contactsService.getCountries().subscribe({
            next: (countriesRes: any) => {
              const list = Array.isArray(countriesRes) ? countriesRes : (countriesRes && countriesRes.data ? countriesRes.data : []);
              this.countryList = list.map((c: any) => ({
                name: c.name,
                isoCode: c.isoCode
              }));
              this.matchCountryAndLoadCityAndLocation(country, city, location);
            },
            error: (err) => {
              console.error('Failed to load countries in loadEmployeeData:', err);
              this.matchCountryAndLoadCityAndLocation(country, city, location);
            }
          });
        } else {
          this.matchCountryAndLoadCityAndLocation(country, city, location);
        }

        if (data.profileImage) {
          this.previewImage = data.profileImage;
        }
      },
      error: (err) => {
        console.error('Failed to load employee details for editing:', err);
      }
    });
  }

  matchCountryAndLoadCityAndLocation(country: string, city: string, location: string): void {
    const matchedCountry = this.countryList.find(c => c.name.toLowerCase() === country.toLowerCase());
    if (matchedCountry) {
      this.selectedCountryIso = matchedCountry.isoCode;
      this.contactsService.getCities(matchedCountry.isoCode).subscribe({
        next: (citiesRes: any) => {
          this.citiesList = Array.isArray(citiesRes) ? citiesRes : (citiesRes && citiesRes.data ? citiesRes.data : []);
          
          const matchedCity = this.citiesList.find(c => c.toLowerCase() === city.toLowerCase());
          if (matchedCity) {
            this.isCustomCity = false;
            this.contactsService.getPincodes(this.selectedCountryIso, matchedCity).subscribe({
              next: (locationsRes: any) => {
                const locs = Array.isArray(locationsRes) ? locationsRes : (locationsRes && locationsRes.data ? locationsRes.data : []);
                this.locationsList = locs;
                
                const matchedLoc = this.locationsList.find(l => l.locality.toLowerCase() === location.toLowerCase());
                if (matchedLoc) {
                  this.isCustomLocation = false;
                } else {
                  this.isCustomLocation = location ? true : false;
                }
              },
              error: (err) => {
                console.error('Failed to load locations in edit mode:', err);
                this.isCustomLocation = location ? true : false;
              }
            });
          } else {
            this.isCustomCity = city ? true : false;
            this.isCustomLocation = location ? true : false;
          }
        },
        error: (err) => {
          console.error('Failed to load cities in edit mode:', err);
          this.isCustomCity = city ? true : false;
          this.isCustomLocation = location ? true : false;
        }
      });
    } else {
      this.selectedCountryIso = '';
      this.isCustomCity = city ? true : false;
      this.isCustomLocation = location ? true : false;
    }
  }

  formatDate(dateVal: any): string {
    if (!dateVal) return '';
    const d = new Date(dateVal);
    if (isNaN(d.getTime())) return '';
    return d.toISOString().split('T')[0];
  }

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

    // Get all values including disabled controls (like employeeId)
    const payload = { ...this.employeeForm.getRawValue() };
    delete payload.confirmAccountNumber;
    delete payload.confirmPassword;
    payload.profileImage = this.previewImage;

    if (this.employeeId) {
      this.employeesService.updateEmployee(this.employeeId, payload).subscribe({
        next: () => {
          alert('Employee Updated Successfully');
          this.employeeUpdated.emit();
        },
        error: (err) => {
          console.error('Failed to update employee:', err);
          alert('Failed to update employee: ' + (err.error?.message || err.message));
        }
      });
    }
  }

  resetForm(): void {
    if (this.originalEmployeeData) {
      const data = this.originalEmployeeData;
      const formattedDob = this.formatDate(data.dob);
      const formattedJoiningDate = this.formatDate(data.joiningDate);
      
      this.employeeForm.patchValue({
        ...data,
        dob: formattedDob,
        joiningDate: formattedJoiningDate,
        confirmAccountNumber: data.accountNumber || '',
        confirmPassword: data.password || ''
      });
      const country = data.country || 'India';
      const city = data.city || '';
      const location = data.location || '';
      this.matchCountryAndLoadCityAndLocation(country, city, location);

      this.previewImage = data.profileImage || 'assets/images/user.png';
    } else {
      this.employeeForm.reset();
      this.previewImage = 'assets/images/user.png';
      this.citiesList = [];
      this.locationsList = [];
    }
  }

  goBack(): void {
    this.backToList.emit();
  }

  get f() {
    return this.employeeForm.controls;
  }
}
