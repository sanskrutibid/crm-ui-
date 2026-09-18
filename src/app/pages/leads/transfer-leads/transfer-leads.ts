import { Component, Input, Output, EventEmitter, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LeadsService } from '../leads.service';
import { AuthService } from '../../auth/auth.service';
import { BranchesService } from '../../../services/branches.service';

@Component({
  selector: 'app-transfer-leads',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './transfer-leads.html',
  styleUrl: './transfer-leads.css'
})
export class TransferLeads implements OnInit {
  @Input() leadId = '';
  @Input() leadDetails: any;

  @Output() close = new EventEmitter<void>();
  @Output() transferCompleted = new EventEmitter<void>();

  private leadsService = inject(LeadsService);
  private authService = inject(AuthService);
  private branchesService = inject(BranchesService);

  transferType = 'Lead Transfer';

  folder = '';
  branch = '';
  assignTo = '';
  permission = '';

  comment = '';

  sendWhatsappAssignee = false;
  sendWhatsappCustomer = false;
  sendEmailAssignee = false;
  sendEmailCustomer = false;
  stayOnPage = false;

  agentsList: any[] = [];
  branchesList: string[] = [];

  ngOnInit() {
    this.loadAgents();
    this.loadBranches();
    if (this.leadDetails) {
      this.branch = this.leadDetails.branch || '';
      // Support nested object or flat ID
      this.assignTo = this.leadDetails.assignedTo?._id || this.leadDetails.assignedTo?.id || (typeof this.leadDetails.assignedTo === 'string' ? this.leadDetails.assignedTo : '');
    }
  }

  loadBranches() {
    this.branchesService.getBranchNames().subscribe({
      next: (names) => {
        this.branchesList = names;
      },
      error: (err) => console.error('Error loading branches in TransferLeads:', err)
    });
  }

  loadAgents() {
    this.authService.getAgents().subscribe({
      next: (res: any) => {
        this.agentsList = res.data || res || [];
      },
      error: (err) => {
        console.error('Failed to load agents in TransferLeads:', err);
      }
    });
  }

  transferLead() {
    if (!this.leadId) {
      alert('Error: No Lead Selected');
      return;
    }
    if (!this.branch) {
      alert('Please select a branch');
      return;
    }
    if (!this.assignTo) {
      alert('Please select an assignee');
      return;
    }

    const payload: any = {
      branch: this.branch,
      assignedTo: this.assignTo
    };

    this.leadsService.updateLead(this.leadId, payload).subscribe({
      next: (res) => {
        if (this.comment) {
          // Log the comment so it shows up in history timeline
          this.leadsService.addQuickNote(this.leadId, {
            commentType: 'Transfer Comment',
            comment: this.comment
          }).subscribe({
            next: () => {
              alert('Lead transferred successfully!');
              this.transferCompleted.emit();
              this.close.emit();
            },
            error: (err) => {
              console.error('Failed to add transfer quick note:', err);
              alert('Lead transferred successfully! (Comment history log failed)');
              this.transferCompleted.emit();
              this.close.emit();
            }
          });
        } else {
          alert('Lead transferred successfully!');
          this.transferCompleted.emit();
          this.close.emit();
        }
      },
      error: (err) => {
        console.error('Failed to transfer lead:', err);
        const errMsg = err.error?.message || err.message || 'Transfer failed';
        alert('Error: ' + (Array.isArray(errMsg) ? errMsg.join(', ') : errMsg));
      }
    });
  }

  cancelTransfer() {
    this.close.emit();
  }
}