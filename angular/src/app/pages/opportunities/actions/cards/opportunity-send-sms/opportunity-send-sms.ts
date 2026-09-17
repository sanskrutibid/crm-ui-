import { Component, Input, Output, EventEmitter, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { OpportunitiesService } from '../../../opportunities.service';
import { TemplatesService } from '../../../../templates/templates.service';

@Component({
  selector: 'app-opportunity-send-sms',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './opportunity-send-sms.html',
  styleUrl: './opportunity-send-sms.css',
})
export class OpportunitySendSms implements OnInit {
  @Input() opportunityId = '';
  @Input() opportunityDetails: any;
  @Output() close = new EventEmitter<void>();

  private opportunitiesService = inject(OpportunitiesService);
  private templatesService = inject(TemplatesService);

  customerName = '';

  selectedTemplate = '';

  dltId = '';

  message = '';

  scheduleDate = '';

  scheduleTime = '';

  templates: any[] = [];

  ngOnInit() {
    if (this.opportunityDetails) {
      this.customerName = this.opportunityDetails.name || '';
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
      this.dltId = matched.templateId || matched.dltTemplateId || '';
    }
  }

  scheduleSMS() {
    if (!this.opportunityId) {
      alert('Error: No opportunity selected.');
      return;
    }
    if (!this.message) {

      alert('Please enter SMS.');

      return;

    }

    const payload = {
      template: this.selectedTemplate || 'General SMS',
      dltTemplateId: this.dltId || '—',
      message: this.message,
      scheduleDate: this.scheduleDate,
      scheduleTime: this.scheduleTime
    };

    this.opportunitiesService.sendSms(this.opportunityId, payload).subscribe({
      next: () => {
        alert('SMS Scheduled Successfully.');
        this.close.emit();
      },
      error: (err) => {
        console.error('Failed to send SMS:', err);
        alert('Failed to send SMS.');
      }
    });

  }

  cancel() {
    this.close.emit();
  }

}