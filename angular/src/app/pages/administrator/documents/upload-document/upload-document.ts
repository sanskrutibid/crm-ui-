import { Component, OnInit, Output, EventEmitter, Input, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
  AbstractControl,
  ValidationErrors
} from '@angular/forms';
import { EmployeesService } from '../../employees/employees.service';
import { DocumentsService, EmpDocument } from '../documents.service';

export interface DocValidationConfig {
  label: string;
  pattern?: RegExp;
  maxLength: number;
  placeholder: string;
  errorMessage: string;
  requiresBackImage: boolean;
  requiresExpiry: boolean;
}

@Component({
  selector: 'app-upload-document',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule
  ],
  templateUrl: './upload-document.html',
  styleUrl: './upload-document.css'
})
export class UploadDocument implements OnInit, OnChanges {
  @Input() editData: EmpDocument | null = null;
  @Output() saved = new EventEmitter<void>();
  @Output() cancel = new EventEmitter<void>();

  documentForm: FormGroup;
  employees: { id: string; name: string; department?: string }[] = [];

  isEditMode = false;
  requiresBackImage = false;
  requiresExpiryDate = false;
  currentValidationHint = '';
  currentPlaceholder = 'Enter document number';

  frontFileName = '';
  frontFilePreview: string | null = null;
  backFileName = '';
  backFilePreview: string | null = null;

  isSubmitting = false;

  docConfigs: { [key: string]: DocValidationConfig } = {
    'Aadhaar Card': {
      label: 'Aadhaar Number',
      pattern: /^(\d{12}|\d{4}\s\d{4}\s\d{4})$/,
      maxLength: 14,
      placeholder: 'e.g. 1234 5678 9012',
      errorMessage: 'Aadhaar Card must contain exactly 12 digits (e.g. 1234 5678 9012).',
      requiresBackImage: true,
      requiresExpiry: false
    },
    'PAN Card': {
      label: 'PAN Number',
      pattern: /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/,
      maxLength: 10,
      placeholder: 'e.g. ABCDE1234F',
      errorMessage: 'PAN Number must be 10 characters (5 letters, 4 numbers, 1 letter, e.g. ABCDE1234F).',
      requiresBackImage: false,
      requiresExpiry: false
    },
    'Passport': {
      label: 'Passport Number',
      pattern: /^[A-Z]{1}[0-9]{7}$/,
      maxLength: 8,
      placeholder: 'e.g. A1234567',
      errorMessage: 'Passport Number must start with 1 letter followed by 7 digits (e.g. A1234567).',
      requiresBackImage: true,
      requiresExpiry: true
    },
    'Driving License': {
      label: 'DL Number',
      pattern: /^[A-Z0-9\s-]{10,16}$/,
      maxLength: 16,
      placeholder: 'e.g. MH1420240001234',
      errorMessage: 'Driving License must be 10 to 16 alphanumeric characters.',
      requiresBackImage: true,
      requiresExpiry: true
    },
    'Voter ID': {
      label: 'Voter ID Number',
      pattern: /^[A-Z]{3}[0-9]{7}$/,
      maxLength: 10,
      placeholder: 'e.g. ABC1234567',
      errorMessage: 'Voter ID must be 3 letters followed by 7 digits (e.g. ABC1234567).',
      requiresBackImage: true,
      requiresExpiry: false
    }
  };

  constructor(
    private fb: FormBuilder,
    private employeesService: EmployeesService,
    private documentsService: DocumentsService
  ) {
    this.documentForm = this.fb.group({
      id: [''],
      employeeId: ['', Validators.required],
      documentType: ['', Validators.required],
      documentNumber: ['', Validators.required],
      issueDate: [''],
      expiryDate: [''],
      status: ['Verified'],
      remarks: ['']
    });
  }

  ngOnInit(): void {
    this.loadEmployeesList();

    // Listen for Document Type Changes to update dynamic validations & image inputs
    this.documentForm.get('documentType')?.valueChanges.subscribe(type => {
      this.onDocumentTypeChange(type);
    });

    if (this.editData) {
      this.loadEditData(this.editData);
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['editData'] && changes['editData'].currentValue) {
      this.loadEditData(changes['editData'].currentValue);
    }
  }

  private loadEditData(data: EmpDocument): void {
    this.isEditMode = true;
    this.documentForm.patchValue({
      id: data.id || data._id || '',
      employeeId: data.employeeId,
      documentType: data.documentType,
      documentNumber: data.documentNumber,
      issueDate: data.issueDate || '',
      expiryDate: data.expiryDate === '-' ? '' : (data.expiryDate || ''),
      status: data.status || 'Verified',
      remarks: data.remarks || ''
    });

    if (data.frontFile) {
      this.frontFilePreview = data.frontFile;
      this.frontFileName = 'Existing_Front_Side';
    }
    if (data.backFile) {
      this.backFilePreview = data.backFile;
      this.backFileName = 'Existing_Back_Side';
    }

    this.onDocumentTypeChange(data.documentType);
  }

  loadEmployeesList(): void {
    this.employeesService.getEmployees().subscribe({
      next: (res: any) => {
        const payload = res.data || res;
        const list = Array.isArray(payload) ? payload : [];
        if (list.length > 0) {
          this.employees = list.map((emp: any, index: number) => ({
            id: emp.employeeId || emp.id || emp._id || `EMP${String(index + 1).padStart(3, '0')}`,
            name: emp.firstName ? `${emp.firstName} ${emp.lastName || ''}`.trim() : (emp.name || 'Employee'),
            department: emp.department || 'General'
          }));
        } else {
          this.useFallbackEmployees();
        }
      },
      error: (err) => {
        console.error('Failed to load employees list for document upload:', err);
        this.useFallbackEmployees();
      }
    });
  }

  private useFallbackEmployees(): void {
    this.employees = [];
  }

  onDocumentTypeChange(type: string): void {
    const docNumberControl = this.documentForm.get('documentNumber');
    const expiryControl = this.documentForm.get('expiryDate');
    const config = this.docConfigs[type];

    if (config) {
      this.requiresBackImage = config.requiresBackImage;
      this.requiresExpiryDate = config.requiresExpiry;
      this.currentPlaceholder = config.placeholder;
      this.currentValidationHint = config.errorMessage;

      // Update validators for documentNumber
      const validators = [Validators.required];
      if (config.pattern) {
        validators.push(Validators.pattern(config.pattern));
      }
      if (config.maxLength) {
        validators.push(Validators.maxLength(config.maxLength));
      }
      docNumberControl?.setValidators(validators);

      // Expiry Date validation if required
      if (config.requiresExpiry) {
        expiryControl?.setValidators([Validators.required]);
      } else {
        expiryControl?.clearValidators();
      }
    } else {
      // General / Other Documents
      this.requiresBackImage = false;
      this.requiresExpiryDate = false;
      this.currentPlaceholder = 'Enter document identifier or number';
      this.currentValidationHint = 'Enter document reference or serial number';
      docNumberControl?.setValidators([Validators.required, Validators.maxLength(30)]);
      expiryControl?.clearValidators();
    }

    docNumberControl?.updateValueAndValidity();
    expiryControl?.updateValueAndValidity();
  }

  onDocumentNumberInput(event: any): void {
    const type = this.documentForm.get('documentType')?.value;
    let inputVal = event.target.value || '';

    // Auto-uppercase for PAN, Passport, Voter ID
    if (['PAN Card', 'Passport', 'Voter ID', 'Driving License'].includes(type)) {
      inputVal = inputVal.toUpperCase();
      this.documentForm.get('documentNumber')?.setValue(inputVal, { emitEvent: false });
    }

    // Auto-formatting for Aadhaar Card: allow only digits and insert space after every 4 digits
    if (type === 'Aadhaar Card') {
      const cleaned = inputVal.replace(/\D/g, '').slice(0, 12);
      let formatted = cleaned;
      if (cleaned.length > 4 && cleaned.length <= 8) {
        formatted = `${cleaned.slice(0, 4)} ${cleaned.slice(4)}`;
      } else if (cleaned.length > 8) {
        formatted = `${cleaned.slice(0, 4)} ${cleaned.slice(4, 8)} ${cleaned.slice(8)}`;
      }
      this.documentForm.get('documentNumber')?.setValue(formatted, { emitEvent: false });
    }
  }

  onFrontFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      this.frontFileName = file.name;
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.frontFilePreview = e.target.result;
      };
      reader.readAsDataURL(file);
    }
  }

  onBackFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      this.backFileName = file.name;
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.backFilePreview = e.target.result;
      };
      reader.readAsDataURL(file);
    }
  }

  removeFrontFile(): void {
    this.frontFileName = '';
    this.frontFilePreview = null;
  }

  removeBackFile(): void {
    this.backFileName = '';
    this.backFilePreview = null;
  }

  saveDocument(): void {
    if (this.documentForm.invalid) {
      this.documentForm.markAllAsTouched();
      return;
    }

    if (!this.frontFilePreview) {
      alert('Please upload the Front image/file for the document.');
      return;
    }

    if (this.requiresBackImage && !this.backFilePreview) {
      alert(`For "${this.documentForm.value.documentType}", both Front and Back side images are required.`);
      return;
    }

    this.isSubmitting = true;
    const formVal = this.documentForm.value;
    const selectedEmp = this.employees.find(e => e.id === formVal.employeeId);

    const docPayload: EmpDocument = {
      id: formVal.id || undefined,
      employeeId: formVal.employeeId,
      employeeName: selectedEmp ? selectedEmp.name : 'Employee',
      department: selectedEmp ? selectedEmp.department : 'General',
      documentType: formVal.documentType,
      documentNumber: formVal.documentNumber,
      issueDate: formVal.issueDate || undefined,
      expiryDate: formVal.expiryDate || '-',
      frontFile: this.frontFilePreview || undefined,
      backFile: this.backFilePreview || undefined,
      remarks: formVal.remarks || '',
      uploadDate: new Date().toISOString().split('T')[0],
      status: formVal.status || 'Verified'
    };

    if (this.isEditMode && formVal.id) {
      this.documentsService.updateDocument(formVal.id, docPayload).subscribe({
        next: () => {
          this.isSubmitting = false;
          alert(`Document "${docPayload.documentType}" updated successfully!`);
          this.saved.emit();
        },
        error: (err) => {
          this.isSubmitting = false;
          console.error('Failed to update document:', err);
          alert('Failed to update document.');
        }
      });
    } else {
      this.documentsService.saveDocument(docPayload).subscribe({
        next: () => {
          this.isSubmitting = false;
          alert(`🎉 Document "${docPayload.documentType}" uploaded successfully for ${docPayload.employeeName}!`);
          this.saved.emit();
        },
        error: (err) => {
          this.isSubmitting = false;
          console.error('Failed to save document:', err);
          alert('Failed to upload document.');
        }
      });
    }
  }

  onCancel(): void {
    this.cancel.emit();
  }
}