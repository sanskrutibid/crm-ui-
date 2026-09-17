import { Component, Input, Output, EventEmitter, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LeadsService } from '../leads.service';
import { TemplatesService } from '../../templates/templates.service';

@Component({
  selector: 'app-send-sms',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './send-sms.html',
  styleUrl: './send-sms.css'
})
export class SendSms implements OnInit {
  @Input() leadId = '';
  @Input() leadDetails: any;
  @Output() close = new EventEmitter<void>();

  private leadsService = inject(LeadsService);
  private templatesService = inject(TemplatesService);

  leadName = '';

  selectedTemplate = '';

  dltTemplateId = '';

  message = '';

  scheduleDate = '';

  scheduleTime = '';

  templates: any[] = [];

  ngOnInit() {
    if (this.leadDetails) {
      this.leadName = this.leadDetails.name || '';
    }
    const today = new Date();
    this.scheduleDate = today.toISOString().split('T')[0];
    this.scheduleTime = '12:00';
    this.loadTemplates();
  }

  loadTemplates() {
    this.templatesService.getTemplates({ limit: 100, templateType: 'SMS' }).subscribe({
      next: (res: any) => {
        const payload = res.data || res;
        this.templates = payload.templates || payload || [];
      },
      error: (err) => {
        console.error('Failed to load SMS templates:', err);
      }
    });
  }

  onTemplateChange() {
    const matched = this.templates.find(t => t.name === this.selectedTemplate || t.id === this.selectedTemplate);
    if (matched) {
      this.message = matched.editorContent || matched.fileContent || '';
      this.dltTemplateId = matched.templateId || matched.dltTemplateId || '';
    }
  }

  scheduleSms() {
    if (!this.leadId) {
      alert('Error: No Lead Selected');
      return;
    }
    if (!this.message) {
      alert('Please enter message body');
      return;
    }

    const payload = {
      template: this.selectedTemplate || 'General SMS',
      dltTemplateId: this.dltTemplateId || '—',
      message: this.message,
      scheduleDate: this.scheduleDate,
      scheduleTime: this.scheduleTime
    };

    this.leadsService.sendSms(this.leadId, payload).subscribe({
      next: () => {
        alert('SMS scheduled successfully');
        this.close.emit();
      },
      error: (err) => {
        console.error('Failed to send SMS:', err);
        alert('Error sending SMS');
      }
    });
  }

  cancelSms() {
    this.close.emit();
  }
}