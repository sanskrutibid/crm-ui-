import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ContactsService } from '../../contacts.service';
import { TemplatesService } from '../../../templates/templates.service';

@Component({
  selector: 'app-create-audience',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './create-audience.html',
  styleUrl: './create-audience.css',
})
export class CreateAudience implements OnInit {
  @Input() filters: any = {};
  @Input() totalRecords: number = 0;
  @Output() closeAudience = new EventEmitter<void>();

  audienceName: string = '';
  audienceType: string = '';
  selectedTemplateId: string = '';
  schedule: string = 'On Demand';

  scheduleDate: string = '';
  scheduleTime: string = '';
  selectedWeeks: string[] = [];
  selectedDays: number[] = [];

  templates: any[] = [];
  isSubmitting: boolean = false;
  statusMessage: string = '';
  statusType: 'success' | 'error' | '' = '';

  weekdays: string[] = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  monthDays: number[] = Array.from({ length: 31 }, (_, i) => i + 1);

  constructor(
    private readonly contactsService: ContactsService,
    private readonly templatesService: TemplatesService
  ) { }

  ngOnInit() {
    this.setDefaultDateTime();
  }

  setDefaultDateTime() {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    this.scheduleDate = `${yyyy}-${mm}-${dd}`;

    const hh = String(today.getHours()).padStart(2, '0');
    const min = String(today.getMinutes()).padStart(2, '0');
    this.scheduleTime = `${hh}:${min}`;
  }

  onTypeChange() {
    this.templates = [];
    this.selectedTemplateId = '';

    if (!this.audienceType) return;

    this.templatesService.getTemplates({ limit: 100, templateType: this.audienceType }).subscribe({
      next: (res: any) => {
        const payload = res.data || res;
        this.templates = payload.templates || payload || [];
      },
      error: (err: any) => {
        console.error('Failed to load templates:', err);
        this.templates = [];
      }
    });
  }

  toggleWeekday(day: string) {
    if (this.selectedWeeks.includes(day)) {
      this.selectedWeeks = this.selectedWeeks.filter(w => w !== day);
    } else {
      this.selectedWeeks.push(day);
    }
  }

  toggleMonthDay(dayNum: number) {
    if (this.selectedDays.includes(dayNum)) {
      this.selectedDays = this.selectedDays.filter(d => d !== dayNum);
    } else {
      this.selectedDays.push(dayNum);
    }
  }

  closeAudienceForm() {
    this.closeAudience.emit();
  }

  onSubmit(event: Event) {
    event.preventDefault();

    if (!this.audienceName.trim()) {
      this.statusMessage = 'Audience name is required.';
      this.statusType = 'error';
      return;
    }

    if (!this.audienceType) {
      this.statusMessage = 'Audience type is required.';
      this.statusType = 'error';
      return;
    }

    if (!this.selectedTemplateId) {
      this.statusMessage = 'Please select a template.';
      this.statusType = 'error';
      return;
    }

    if (this.schedule === 'Weekly' && this.selectedWeeks.length === 0) {
      this.statusMessage = 'Please select at least one weekday.';
      this.statusType = 'error';
      return;
    }

    if (this.schedule === 'Monthly' && this.selectedDays.length === 0) {
      this.statusMessage = 'Please select at least one day of the month.';
      this.statusType = 'error';
      return;
    }

    this.isSubmitting = true;
    this.statusMessage = 'Creating audience campaign...';
    this.statusType = '';

    // Convert time to 12-hour format with AM/PM for backend consistency
    let formattedTime = this.scheduleTime;
    if (this.scheduleTime) {
      const [hoursStr, minutesStr] = this.scheduleTime.split(':');
      const hours = parseInt(hoursStr, 10);
      const ampm = hours >= 12 ? 'pm' : 'am';
      const hours12 = hours % 12 || 12;
      formattedTime = `${String(hours12).padStart(2, '0')}:${minutesStr}${ampm}`;
    }

    const matchedTemplate = this.templates.find(t => t.id === this.selectedTemplateId);
    const templateName = matchedTemplate?.name || 'Selected Template';

    // If schedule is Daily, Weekly, or Monthly, auto-set date to today
    let targetDate = this.scheduleDate;
    if (this.schedule !== 'On Demand') {
      const today = new Date();
      const yyyy = today.getFullYear();
      const mm = String(today.getMonth() + 1).padStart(2, '0');
      const dd = String(today.getDate()).padStart(2, '0');
      targetDate = `${yyyy}-${mm}-${dd}`;
    }

    const payload: any = {
      name: this.audienceName,
      type: this.audienceType,
      template: templateName,
      templateId: matchedTemplate?.templateId || this.selectedTemplateId,
      schedule: this.schedule,
      scheduleDate: targetDate,
      scheduleTime: formattedTime,
      filters: this.filters
    };

    if (this.schedule === 'Weekly') {
      payload.setWeeks = this.selectedWeeks;
    } else if (this.schedule === 'Monthly') {
      payload.setDays = this.selectedDays;
    }

    this.contactsService.createAudience(payload).subscribe({
      next: (res: any) => {
        this.isSubmitting = false;
        this.statusMessage = 'Audience created and scheduled successfully!';
        this.statusType = 'success';
        setTimeout(() => {
          this.closeAudienceForm();
        }, 1800);
      },
      error: (err: any) => {
        this.isSubmitting = false;
        const errMsg = err.error?.message || err.message || 'Failed to create audience.';
        this.statusMessage = Array.isArray(errMsg) ? errMsg.join(', ') : errMsg;
        this.statusType = 'error';
      }
    });
  }
}
