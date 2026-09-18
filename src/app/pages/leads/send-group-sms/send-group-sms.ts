import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { LeadsService } from '../leads.service';
import { TemplatesService } from '../../templates/templates.service';

@Component({
  selector: 'app-send-group-sms',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './send-group-sms.html',
  styleUrl: './send-group-sms.css',
})
export class SendGroupSms implements OnInit {
  @Input() totalRecords = 0;
  @Input() leadIds: string[] = [];
  @Output() close = new EventEmitter<void>();

  selectedTemplate = '';
  dltTemplateId = '';
  message = '';
  scheduleDate = '';
  scheduleTime = '';

  templates: any[] = [];
  isSubmitting = false;

  private leadsService = inject(LeadsService);
  private templatesService = inject(TemplatesService);

  ngOnInit() {
    this.setDefaultDateTime();
    this.loadTemplates();
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

  loadTemplates() {
    this.templatesService.getTemplates({ limit: 100, templateType: 'SMS' }).subscribe({
      next: (res: any) => {
        const payload = res.data || res;
        this.templates = payload.templates || payload || [];
      },
      error: (err: any) => {
        console.error('Failed to load SMS templates:', err);
      }
    });
  }

  onTemplateChange() {
    const matched = this.templates.find(t => t.name === this.selectedTemplate || t.id === this.selectedTemplate);
    if (matched) {
      this.message = matched.editorContent || matched.fileContent || matched.body || matched.content || '';
      this.dltTemplateId = matched.templateId || matched.dltTemplateId || '';
    }
  }

  scheduleSms() {
    if (!this.selectedTemplate) {
      alert('Please select a template.');
      return;
    }

    if (!this.message.trim()) {
      alert('Message content is required.');
      return;
    }

    this.isSubmitting = true;

    // Convert time to 12-hour format with AM/PM for backend consistency
    let formattedTime = this.scheduleTime;
    if (this.scheduleTime) {
      const [hoursStr, minutesStr] = this.scheduleTime.split(':');
      const hours = parseInt(hoursStr, 10);
      const ampm = hours >= 12 ? 'pm' : 'am';
      const hours12 = hours % 12 || 12;
      formattedTime = `${String(hours12).padStart(2, '0')}:${minutesStr}${ampm}`;
    }

    const payload = {
      template: this.selectedTemplate,
      dltTemplateId: this.dltTemplateId,
      message: this.message,
      scheduleDate: this.scheduleDate,
      scheduleTime: formattedTime,
      leadIds: this.leadIds
    };

    this.leadsService.sendGroupSms(payload).subscribe({
      next: (res: any) => {
        this.isSubmitting = false;
        alert(`SMS scheduled successfully for ${res.count || this.totalRecords} leads!`);
        this.close.emit();
      },
      error: (err: any) => {
        this.isSubmitting = false;
        alert('Failed to schedule SMS: ' + (err.error?.message || err.message));
      }
    });
  }
}
