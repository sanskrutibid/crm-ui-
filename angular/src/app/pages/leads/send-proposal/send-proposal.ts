import { Component, Input, Output, EventEmitter, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LeadsService } from '../leads.service';

@Component({
  selector: 'app-send-proposal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './send-proposal.html',
  styleUrl: './send-proposal.css'
})
export class SendProposal implements OnInit {
  @Input() leadId = '';
  @Input() leadDetails: any;
  @Output() close = new EventEmitter<void>();

  private leadsService = inject(LeadsService);

  leadName = '';

  selectedLanguage = 'English';
  selectedModule = '';
  selectedProject = '';
  selectedTemplate = 'WHATSAPP-DESKTOP(PROJECT)';

  languages = [
    'English',
    'Hindi',
    'Marathi'
  ];

  modules = [
    'Sales',
    'Projects',
    'Inventory'
  ];

  projects = [
    'Le Casa',
    'Metro Heights',
    'Green Valley',
    'Palm Residency'
  ];

  templates = [
    'WHATSAPP-DESKTOP(PROJECT)',
    'EMAIL(PROJECT)',
    'SMS(PROJECT)'
  ];

  ngOnInit() {
    if (this.leadDetails) {
      this.leadName = this.leadDetails.name || '';
    }
  }

  sendProposal() {
    if (!this.leadId) {
      alert('Error: No Lead Selected');
      return;
    }
    if (!this.selectedProject) {
      alert('Please select a project');
      return;
    }

    const payload = {
      language: this.selectedLanguage,
      module: this.selectedModule || 'Projects',
      propertyProject: this.selectedProject,
      template: this.selectedTemplate
    };

    this.leadsService.sendProposal(this.leadId, payload).subscribe({
      next: () => {
        alert('Proposal sent successfully');
        this.close.emit();
      },
      error: (err) => {
        console.error('Failed to send proposal:', err);
        alert('Error sending proposal');
      }
    });
  }

  cancelProposal() {
    this.close.emit();
  }
}