import { Component, Input, Output, EventEmitter, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';
import { HolidaysService, Holiday } from '../holidays.service';

@Component({
  selector: 'app-add-holiday',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule
  ],
  templateUrl: './add-holiday.html',
  styleUrl: './add-holiday.css'
})
export class AddHoliday implements OnInit, OnChanges {
  @Input() editData: Holiday | null = null;
  @Output() saved = new EventEmitter<void>();
  @Output() cancel = new EventEmitter<void>();

  holidayForm: FormGroup;
  isEditMode = false;
  isSubmitting = false;
  showEmailPreview = true;

  constructor(
    private fb: FormBuilder,
    private holidaysService: HolidaysService
  ) {
    this.holidayForm = this.fb.group({
      id: [''],
      holidayName: ['', Validators.required],
      holidayDate: ['', Validators.required],
      day: [''],
      holidayType: ['National Holiday', Validators.required],
      applicableFor: ['All Employees'],
      description: [''],
      status: ['Active'],
      notifyEmployees: [true]
    });
  }

  ngOnInit(): void {
    this.holidayForm.get('holidayDate')?.valueChanges.subscribe((dateVal) => {
      if (dateVal) {
        const calculatedDay = this.holidaysService.getDayNameFromDate(dateVal);
        this.holidayForm.patchValue({ day: calculatedDay }, { emitEvent: false });
      }
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

  private loadEditData(data: Holiday): void {
    this.isEditMode = true;
    this.holidayForm.patchValue({
      id: data.id || data._id || '',
      holidayName: data.name || (data as any).holidayName || '',
      holidayDate: data.date || '',
      day: data.day || this.holidaysService.getDayNameFromDate(data.date),
      holidayType: data.type || (data as any).holidayType || 'National Holiday',
      applicableFor: data.applicableFor || 'All Employees',
      description: data.description || '',
      status: data.status || 'Active',
      notifyEmployees: data.notifyEmployees !== undefined ? data.notifyEmployees : true
    });
  }

  toggleEmailPreview(): void {
    this.showEmailPreview = !this.showEmailPreview;
  }

  saveHoliday(): void {
    if (this.holidayForm.invalid) {
      this.holidayForm.markAllAsTouched();
      return;
    }

    this.isSubmitting = true;
    const formVal = this.holidayForm.value;
    const dateVal = formVal.holidayDate;
    const computedDay = formVal.day || this.holidaysService.getDayNameFromDate(dateVal);

    const payload: Holiday = {
      id: formVal.id || undefined,
      name: formVal.holidayName,
      date: dateVal,
      day: computedDay,
      type: formVal.holidayType,
      applicableFor: formVal.applicableFor,
      description: formVal.description,
      status: formVal.status,
      notifyEmployees: formVal.notifyEmployees
    };

    if (this.isEditMode && formVal.id) {
      this.holidaysService.updateHoliday(formVal.id, payload).subscribe({
        next: (res) => {
          this.isSubmitting = false;
          let msg = 'Holiday updated successfully!';
          if (payload.notifyEmployees) {
            this.holidaysService.sendEmailNotification(payload).subscribe();
            msg += ' Dynamic announcement email dispatched to employees.';
          }
          alert(msg);
          this.saved.emit();
        },
        error: (err) => {
          this.isSubmitting = false;
          console.error(err);
          alert('Failed to update holiday.');
        }
      });
    } else {
      this.holidaysService.createHoliday(payload).subscribe({
        next: (res) => {
          this.isSubmitting = false;
          let msg = `🎉 Holiday "${payload.name}" added successfully!`;
          if (payload.notifyEmployees) {
            this.holidaysService.sendEmailNotification(payload).subscribe();
            msg += '\n📧 Automated formatted email notification sent to all employees!';
          }
          alert(msg);
          this.saved.emit();
        },
        error: (err) => {
          this.isSubmitting = false;
          console.error(err);
          alert('Failed to create holiday.');
        }
      });
    }
  }

  onCancel(): void {
    this.cancel.emit();
  }
}