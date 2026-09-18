import { Component, EventEmitter, Input, Output, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../auth/auth.service';
import { BranchesService } from '../../../services/branches.service';

@Component({
  selector: 'app-group-transfer',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './group-transfer.html',
  styleUrl: './group-transfer.css'
})
export class GroupTransfer implements OnInit {
  private authService = inject(AuthService);
  private branchesService = inject(BranchesService);

  constructor(private router: Router) {}

  @Input() title = 'Transfer Records';
  @Input() totalRecords = 0;

  @Input() showTransferType = true;
  @Input() transferLabel = 'Customer Transfer';

  @Input() showAssignMode = true;
  @Input() showComment = true;

  @Output() close = new EventEmitter<void>();

  transferType = '';
  folder = '';
  branch = '';
  assignTo = '';
  assignMode = '';
  permission = '';
  comment = '';

  folders = [
    { label: 'Marketing', value: 'marketing' },
    { label: 'Sales', value: 'sales' },
    { label: 'Support', value: 'support' }
  ];

  branches: { label: string; value: string }[] = [];

  assignUsers: { label: string; value: string }[] = [];

  permissions = [
    { label: 'Private', value: 'private' },
    { label: 'Branch', value: 'branch' }
  ];

  ngOnInit() {
    this.loadAgents();
    this.loadBranches();
  }

  loadBranches() {
    this.branchesService.getBranchNames().subscribe({
      next: (names) => {
        this.branches = names.map(n => ({ label: n, value: n }));
      },
      error: (err) => console.error('Error loading branches in GroupTransfer:', err)
    });
  }

  loadAgents() {
    this.authService.getAgents().subscribe({
      next: (res: any) => {
        const list = res.data || res || [];
        if (Array.isArray(list) && list.length > 0) {
          this.assignUsers = list.map((emp: any) => {
            const name = `${emp.firstName || ''} ${emp.lastName || ''}`.trim() || emp.name || emp.email || 'Employee';
            const role = emp.role ? ` (${emp.role})` : '';
            return {
              label: name + role,
              value: emp.id || emp._id || name
            };
          });
        }
      },
      error: (err) => {
        console.error('Error loading employees in GroupTransfer:', err);
      }
    });
  }



  closeTransfer() {
    this.close.emit();
  }

  transferRecords() {
    console.log({
      transferType: this.transferType,
      folder: this.folder,
      branch: this.branch,
      assignTo: this.assignTo,
      assignMode: this.assignMode,
      permission: this.permission,
      comment: this.comment
    });

    
  }

goBackToMyLeads() {
  this.router.navigate(['/my-leads']);
}

}