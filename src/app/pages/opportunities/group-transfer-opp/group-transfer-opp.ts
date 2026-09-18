import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../auth/auth.service';
import { BranchesService } from '../../../services/branches.service';

@Component({
  selector: 'app-group-transfer-Opp',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './group-transfer-opp.html',
  styleUrls: ['./group-transfer-opp.css']
})
export class GroupTransferOpp implements OnInit {
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
      error: (err) => console.error('Error loading branches in GroupTransferOpp:', err)
    });
  }

  loadAgents() {
    this.authService.getAgents().subscribe({
      next: (res: any) => {
        this.agentsList = res.data || res || [];
      },
      error: (err) => {
        console.error('Error loading agents in GroupTransferOpp:', err);
      }
    });
  }

  goBack() {
    this.router.navigate(['/my-opportunities']);
  }
}