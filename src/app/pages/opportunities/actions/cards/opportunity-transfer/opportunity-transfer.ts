import { Component, Input, Output, EventEmitter, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { OpportunitiesService } from '../../../opportunities.service';
import { AuthService } from '../../../../auth/auth.service';
import { BranchesService } from '../../../../../services/branches.service';

@Component({
  selector: 'app-opportunity-transfer',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './opportunity-transfer.html',
  styleUrl: './opportunity-transfer.css'
})
export class OpportunityTransfer implements OnInit {
  @Input() opportunityId = '';
  @Input() opportunityDetails: any;
  @Output() close = new EventEmitter<void>();
  @Output() transferCompleted = new EventEmitter<void>();

  private opportunitiesService = inject(OpportunitiesService);
  private authService = inject(AuthService);
  private branchesService = inject(BranchesService);

  // Transfer Type
  transferType: string = 'Opportunity Transfer';

  // Dropdowns
  folder: string = '';
  branch: string = '';
  assignTo: string = '';
  permission: string = '';

  agentsList: any[] = [];
  branchesList: string[] = [];

  // Checkboxes
  smsAssignee = false;
  smsCustomer = false;

  emailAssignee = true;
  emailCustomer = false;

  stayOnPage = false;

  // Comment
  comment = '';

  ngOnInit() {
    this.loadAgents();
    this.loadBranches();
    if (this.opportunityDetails) {
      this.branch = this.opportunityDetails.branch || '';
      this.assignTo = this.opportunityDetails.assignedTo?._id || this.opportunityDetails.assignedTo?.id || (typeof this.opportunityDetails.assignedTo === 'string' ? this.opportunityDetails.assignedTo : '');
      this.folder = this.opportunityDetails.folder || '';
    }
  }

  loadBranches() {
    this.branchesService.getBranchNames().subscribe({
      next: (names) => {
        this.branchesList = names;
      },
      error: (err) => console.error('Error loading branches in OpportunityTransfer:', err)
    });
  }

  loadAgents() {
    this.authService.getAgents().subscribe({
      next: (res: any) => {
        this.agentsList = res.data || res || [];
      },
      error: (err) => {
        console.error('Failed to load agents in OpportunityTransfer:', err);
      }
    });
  }

  // Transfer Button
  transferOpportunity() {
    if (!this.opportunityId) {
      alert('Error: No opportunity selected.');
      return;
    }

    const payload: any = {
      folder: this.folder || undefined,
      branch: this.branch || undefined,
      assignedTo: this.assignTo || undefined
    };

    this.opportunitiesService.updateOpportunity(this.opportunityId, payload).subscribe({
      next: (res) => {
        alert('Opportunity Transferred Successfully');
        this.transferCompleted.emit();
        this.close.emit();
      },
      error: (err) => {
        console.error('Failed to transfer opportunity:', err);
        alert('Failed to transfer opportunity.');
      }
    });

  }

  // Cancel Button
  cancelTransfer() {

    this.close.emit();

  }

}