import { Component, Input, Output, EventEmitter, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TemplatesService } from '../../../../templates/templates.service';
import { OpportunitiesService } from '../../../../opportunities/opportunities.service';
import { QuillModule } from 'ngx-quill';

@Component({
  selector: 'app-property-send-email',
  standalone: true,
 imports: [FormsModule, QuillModule, CommonModule],
  templateUrl: './property-send-email.html',
  styleUrl: './property-send-email.css',
})
export class PropertySendEmail implements OnInit {
    @Input() propertyId!: string;
  @Input() opportunityDetails: any;
  @Output() close = new EventEmitter<void>();

    private opportunitiesService = inject(OpportunitiesService);
    private templatesService = inject(TemplatesService);
  
    customerName = '';
  
    selectedTemplate = '';
  
    toEmail = '';
  
    subject = '';
  
    message = '';
  
    scheduleDate = '';
  
    scheduleTime = '';
  
    templates: any[] = [];
  
    ngOnInit() {
      if (this.opportunityDetails) {
        this.customerName = this.opportunityDetails.name || '';
        this.toEmail = this.opportunityDetails.contactId?.email || this.opportunityDetails.email || '';
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
      if (!this.propertyId) {
        alert('Error: No opportunity selected.');
        return;
      }
      if (!this.toEmail) {
        alert('Please enter recipient email.');
        return;
      }
      if (!this.subject) {
        alert('Please enter subject.');
        return;
      }
      if (!this.message) {
        alert('Please enter email body.');
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
  
      this.opportunitiesService.sendEmail(this.propertyId, payload).subscribe({
        next: () => {
          alert('Email sent successfully.');
          this.close.emit();
        },
        error: (err) => {
          console.error('Failed to send Email:', err);
          alert('Failed to send Email.');
        }
      });
  
    }
  
    cancel() {
      this.close.emit();
    }
  
  }