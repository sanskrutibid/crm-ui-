import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ContactsService } from '../../contacts/contacts.service';
import { TemplatesService } from '../../templates/templates.service';

@Component({
  selector: 'app-create-audience',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './create-audience.html',
  styleUrl: './create-audience.css',
})
export class CreateAudience implements OnInit {
  @Input() totalRecords = 0;
  @Input() contactIds: string[] = [];
  @Output() close = new EventEmitter<void>();

  audienceName = '';
  audienceType = '';
  selectedTemplateId = '';
  scheduleType = '';
  scheduleDate = '';
  scheduleTime = '';
  
  templates: any[] = [];
  isSubmitting = false;

  constructor(
    private readonly contactsService: ContactsService,
    private readonly templatesService: TemplatesService
  ) {}

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

  submitAudience() {
    if (!this.audienceName.trim()) {
      alert('Audience name is required.');
      return;
    }

    if (!this.audienceType) {
      alert('Audience type is required.');
      return;
    }

    if (!this.selectedTemplateId) {
      alert('Please select a template.');
      return;
    }

    if (!this.scheduleType) {
      alert('Please select a schedule.');
      return;
    }

    if (this.scheduleType === 'later' && (!this.scheduleDate || !this.scheduleTime)) {
      alert('Please specify date and time for scheduled campaign.');
      return;
    }

    this.isSubmitting = true;

    // Determine target schedule date/time
    let targetDate = this.scheduleDate;
    let rawTime = this.scheduleTime;

    if (this.scheduleType === 'now') {
      const today = new Date();
      const yyyy = today.getFullYear();
      const mm = String(today.getMonth() + 1).padStart(2, '0');
      const dd = String(today.getDate()).padStart(2, '0');
      targetDate = `${yyyy}-${mm}-${dd}`;

      const hh = String(today.getHours()).padStart(2, '0');
      const min = String(today.getMinutes()).padStart(2, '0');
      rawTime = `${hh}:${min}`;
    }

    // Convert time to 12-hour format with AM/PM for backend consistency
    let formattedTime = rawTime;
    if (rawTime) {
      const [hoursStr, minutesStr] = rawTime.split(':');
      const hours = parseInt(hoursStr, 10);
      const ampm = hours >= 12 ? 'pm' : 'am';
      const hours12 = hours % 12 || 12;
      formattedTime = `${String(hours12).padStart(2, '0')}:${minutesStr}${ampm}`;
    }

    const matchedTemplate = this.templates.find(t => t.id === this.selectedTemplateId);
    const templateName = matchedTemplate?.name || 'Selected Template';

    const payload: any = {
      name: this.audienceName,
      type: this.audienceType,
      template: templateName,
      templateId: matchedTemplate?.templateId || this.selectedTemplateId,
      schedule: 'On Demand',
      scheduleDate: targetDate,
      scheduleTime: formattedTime,
      contactIds: this.contactIds
    };

    this.contactsService.createAudience(payload).subscribe({
      next: (res: any) => {
        this.isSubmitting = false;
        alert('Audience created successfully!');
        this.close.emit();
      },
      error: (err: any) => {
        this.isSubmitting = false;
        const errMsg = err.error?.message || err.message || 'Failed to create audience.';
        alert('Error: ' + (Array.isArray(errMsg) ? errMsg.join(', ') : errMsg));
      }
    });
  }
}
