import { Component, Output, EventEmitter, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TemplatesService } from '../../../templates/templates.service';
import { ContactsService } from '../../contacts.service';

@Component({
  selector: 'app-send-group-sms',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './send-group-sms.html',
  styleUrl: './send-group-sms.css',
})
export class SendGroupSms implements OnInit {
  @Input() filters: any = {};
  @Input() totalRecords: number = 0;
  @Output() closeSms = new EventEmitter<void>();

  templates: any[] = [];
  selectedTemplateId: string = '';

  dltTemplateId: string = '';
  message: string = '';
  schedule: string = 'On Demand';
  scheduleDate: string = '';
  scheduleTime: string = '';

  selectedWeeks: string[] = [];
  selectedDays: number[] = [];

  isSending: boolean = false;
  statusMessage: string = '';
  statusType: 'success' | 'error' | '' = '';

  weekdays: string[] = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  monthDays: number[] = Array.from({ length: 31 }, (_, i) => i + 1);

  constructor(
    private readonly templatesService: TemplatesService,
    private readonly contactsService: ContactsService
  ) {}

  ngOnInit() {
    this.loadTemplates();
    this.setDefaultDateTime();
  }

  loadTemplates() {
    this.templatesService.getTemplates({ limit: 100, templateType: 'SMS' }).subscribe({
      next: (res: any) => {
        const payload = res.data || res;
        this.templates = payload.templates || payload || [];
      },
      error: (err) => console.error('Failed to load SMS templates:', err)
    });
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

  onTemplateChange() {
    if (!this.selectedTemplateId) return;
    const template = this.templates.find(t => t.id === this.selectedTemplateId);
    if (template) {
      this.message = template.editorContent || template.fileContent || '';
      if (template.templateId) {
        this.dltTemplateId = template.templateId;
      }
    }
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

  closeSmsForm() {
    this.closeSms.emit(); 
  }

  sendSms(event: Event) {
    event.preventDefault();
    if (!this.message) {
      this.statusMessage = 'Message content is required.';
      this.statusType = 'error';
      return;
    }

    if (this.schedule === 'Weekly' && this.selectedWeeks.length === 0) {
      this.statusMessage = 'Please select at least one day of the week.';
      this.statusType = 'error';
      return;
    }

    if (this.schedule === 'Monthly' && this.selectedDays.length === 0) {
      this.statusMessage = 'Please select at least one date of the month.';
      this.statusType = 'error';
      return;
    }

    this.isSending = true;
    this.statusMessage = 'Scheduling group SMS...';
    this.statusType = '';

    // Convert scheduleTime into 12-hour format with AM/PM (e.g. 17:42 -> 05:42pm)
    let formattedTime = this.scheduleTime;
    if (this.scheduleTime) {
      const [hoursStr, minutesStr] = this.scheduleTime.split(':');
      const hours = parseInt(hoursStr, 10);
      const ampm = hours >= 12 ? 'pm' : 'am';
      const hours12 = hours % 12 || 12;
      formattedTime = `${String(hours12).padStart(2, '0')}:${minutesStr}${ampm}`;
    }

    const tempName = this.templates.find(t => t.id === this.selectedTemplateId)?.name || 'Custom Template';

    // If schedule is Daily, Weekly, or Monthly, set scheduleDate to today's date automatically
    let targetDate = this.scheduleDate;
    if (this.schedule !== 'On Demand') {
      const today = new Date();
      const yyyy = today.getFullYear();
      const mm = String(today.getMonth() + 1).padStart(2, '0');
      const dd = String(today.getDate()).padStart(2, '0');
      targetDate = `${yyyy}-${mm}-${dd}`;
    }

    const payload: any = {
      template: tempName,
      dltTemplateId: this.dltTemplateId,
      message: this.message,
      scheduleDate: targetDate,
      scheduleTime: formattedTime,
      schedule: this.schedule,
      filters: this.filters
    };

    if (this.schedule === 'Weekly') {
      payload.setWeeks = this.selectedWeeks;
    } else if (this.schedule === 'Monthly') {
      payload.setDays = this.selectedDays;
    }

    this.contactsService.sendGroupSms(payload).subscribe({
      next: (res: any) => {
        this.isSending = false;
        this.statusMessage = `Group SMS scheduled successfully for ${res.count || this.totalRecords} contacts!`;
        this.statusType = 'success';
        setTimeout(() => {
          this.closeSmsForm();
        }, 1800);
      },
      error: (err) => {
        this.isSending = false;
        const errMsg = err.error?.message || err.message || 'Failed to send group SMS.';
        this.statusMessage = Array.isArray(errMsg) ? errMsg.join(', ') : errMsg;
        this.statusType = 'error';
      }
    });
  }
}

