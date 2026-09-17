import { Component, Input, Output, EventEmitter, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { QuillModule } from 'ngx-quill';
import { LeadsService } from '../leads.service';
import { TemplatesService } from '../../templates/templates.service';

@Component({
  selector: 'app-send-email',
  standalone: true,
  imports: [CommonModule, FormsModule, QuillModule],
  templateUrl: './send-email.html',
  styleUrl: './send-email.css'
})
export class SendEmail implements OnInit {
  @Input() leadId = '';
  @Input() leadDetails: any;
  @Output() close = new EventEmitter<void>();

  private leadsService = inject(LeadsService);
  private templatesService = inject(TemplatesService);

  leadName = '';

  selectedTemplate = '';

  toEmail = '';

  subject = '';

  message = '';

  scheduleDate = '';

  scheduleTime = '';

  templates: any[] = [];

  ngOnInit() {
    if (this.leadDetails) {
      this.leadName = this.leadDetails.name || '';
      this.toEmail = this.leadDetails.email || '';
    }
    const today = new Date();
    this.scheduleDate = today.toISOString().split('T')[0];
    this.scheduleTime = '12:00';
    this.loadTemplates();
  }

  loadTemplates() {
    this.templatesService.getTemplates({ limit: 100, templateType: 'Email' }).subscribe({
      next: (res: any) => {
        const payload = res.data || res;
        this.templates = payload.templates || payload || [];
      },
      error: (err) => {
        console.error('Failed to load Email templates:', err);
      }
    });
  }

  onTemplateChange() {
    const matched = this.templates.find(t => t.name === this.selectedTemplate || t.id === this.selectedTemplate);
    if (matched) {
      this.message = matched.editorContent || matched.fileContent || '';
      this.subject = matched.name;
    }
  }

  sendEmail() {
    if (!this.leadId) {
      alert('Error: No Lead Selected');
      return;
    }
    if (!this.toEmail) {
      alert('Please enter recipient email');
      return;
    }
    if (!this.subject) {
      alert('Please enter subject');
      return;
    }
    if (!this.message) {
      alert('Please enter message body');
      return;
    }

    const payload = {
      template: this.selectedTemplate || 'General Email',
      to: this.toEmail,
      subject: this.subject,
      message: this.message,
      scheduleDate: this.scheduleDate,
      scheduleTime: this.scheduleTime
    };

    this.leadsService.sendEmail(this.leadId, payload).subscribe({
      next: () => {
        alert('Email sent/scheduled successfully');
        this.close.emit();
      },
      error: (err) => {
        console.error('Failed to send Email:', err);
        alert('Error sending Email');
      }
    });
  }

  discardEmail() {
    this.close.emit();
  }
}