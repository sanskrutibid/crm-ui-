import { Component, Input, Output, EventEmitter, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TemplatesService } from '../../../templates/templates.service';
import { ProjectsService } from '../../projects.service';

@Component({
  selector: 'app-project-send-proposal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './project-send-proposal.html',
  styleUrl: './project-send-proposal.css',
})
export class ProjectSendProposal implements OnInit {
  @Input() projectId!: string;
  @Input() projectDetails: any;
  @Output() close = new EventEmitter<void>();

  @Input() emailOverride?: string;
  @Input() customerNameOverride?: string;

  private readonly projectsService = inject(ProjectsService);
  private readonly templatesService = inject(TemplatesService);

  customerName = '';
  selectedTemplate = '';
  toEmail = '';
  subject = '';
  message = '';
  scheduleDate = '';
  scheduleTime = '';
  templates: any[] = [];

  ngOnInit() {
    if (this.projectDetails) {
      const contact = this.projectDetails.contactId || {};
      this.customerName = this.customerNameOverride || (contact.firstName
        ? `${contact.firstName} ${contact.lastName || ''}`.trim()
        : 'Customer');
      this.toEmail = this.emailOverride || contact.email || this.projectDetails.email || '';
      
      this.subject = `Project Proposal: ${this.projectDetails.projectName || 'New Development'}`;
      this.message = `Dear Customer,\n\nWe are pleased to share the project details of "${this.projectDetails.projectName || 'our project'}" developed by "${this.projectDetails.developerName || 'Unknown Developer'}".\n\nLocation: ${this.projectDetails.locality || 'Unknown Locality'}, ${this.projectDetails.city || 'Unknown City'}\nPrice: ${this.projectDetails.price ? this.projectDetails.price.toLocaleString('en-IN') + ' onwards' : 'Contact for Price'}\nUnits / Room: ${this.projectDetails.totalRoom || 'N/A'}\n\nPlease let us know your convenient time for a detailed site visit or call.\n\nWarm regards,\nSales Team`;
    } else {
      this.customerName = this.customerNameOverride || 'Customer';
      this.toEmail = this.emailOverride || '';
      this.subject = 'Project Proposal';
      this.message = 'Dear Customer,\n\nPlease find attached the details of the project proposal.';
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

  sendProposal() {
    if (!this.projectId) {
      alert('Error: No project selected.');
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
      alert('Please enter email/proposal body.');
      return;
    }

    const payload = {
      template: this.selectedTemplate || 'General Proposal',
      to: this.toEmail,
      subject: this.subject,
      body: this.message,
      scheduleDate: this.scheduleDate,
      scheduleTime: this.scheduleTime
    };

    this.projectsService.sendProposal(this.projectId, payload).subscribe({
      next: () => {
        alert('Proposal email sent/scheduled successfully.');
        this.close.emit();
      },
      error: (err) => {
        console.error('Failed to send Proposal:', err);
        alert('Failed to send Proposal.');
      }
    });
  }

  cancel() {
    this.close.emit();
  }
}
