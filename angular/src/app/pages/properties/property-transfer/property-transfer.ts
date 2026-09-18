import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../auth/auth.service';
import { BranchesService } from '../../../services/branches.service';

@Component({
  selector: 'app-property-transfer',
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './property-transfer.html',
  styleUrl: './property-transfer.css',
})
export class PropertyTransfer implements OnInit {
  private authService = inject(AuthService);
  private branchesService = inject(BranchesService);

  constructor(private router: Router) {}

  transferType = 'opportunity';

  folder = '';
  branch = '';
  assignTo = '';

  mode = 'regular';

  permission = '';

  comment = '';

  agentsList: any[] = [];
  branchesList: string[] = [];

  ngOnInit() {
    this.loadAgents();
    this.loadBranches();
  }

  loadBranches() {
    this.branchesService.getBranchNames().subscribe({
      next: (names) => {
        this.branchesList = names;
      },
      error: (err) => console.error('Error loading branches in PropertyTransfer:', err)
    });
  }

  loadAgents() {
    this.authService.getAgents().subscribe({
      next: (res: any) => {
        this.agentsList = res.data || res || [];
      },
      error: (err) => {
        console.error('Error loading agents in PropertyTransfer:', err);
      }
    });
  }

  goBack() {
    this.router.navigate(['/my-properties']);
  }
}