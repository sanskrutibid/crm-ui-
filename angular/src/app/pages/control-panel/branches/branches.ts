import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';
import { FormsModule } from '@angular/forms';
import { BranchesService, BranchItem } from '../../../services/branches.service';

@Component({
  selector: 'app-branches',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule
  ],
  templateUrl: './branches.html',
  styleUrls: ['./branches.css']
})
export class Branches implements OnInit {
  private branchesService = inject(BranchesService);

  constructor(private fb: FormBuilder) {
    this.branchForm = this.fb.group({
      name: ['', Validators.required],
      owner: ['', Validators.required],
      assignee: ['', Validators.required],
      routing: ['Round Robin', Validators.required],
      duration: [0, Validators.required]
    });
  }

  showCreateForm = false;
  searchText = '';
  selectedBranch: any = null;
  branchForm!: FormGroup;

  branches: BranchItem[] = [];

  ngOnInit() {
    this.loadBranches();
  }

  loadBranches() {
    this.branchesService.getBranches().subscribe({
      next: (list) => {
        this.branches = list;
        if (list.length > 0 && !this.selectedBranch) {
          this.selectedBranch = list[0];
        }
      },
      error: (err) => {
        console.error('Failed to load branches:', err);
      }
    });
  }

  filteredBranches() {
    if (!this.searchText) {
      return this.branches;
    }
    return this.branches.filter(branch =>
      branch.name
        .toLowerCase()
        .includes(this.searchText.toLowerCase())
    );
  }

  selectBranch(branch: any) {
    this.selectedBranch = branch;
  }

  openCreateBranch() {
    this.showCreateForm = true;
    this.branchForm.reset({
      routing: 'Round Robin',
      duration: 0
    });
  }

  cancelBranch() {
    this.showCreateForm = false;
  }

  saveBranch() {
    if (this.branchForm.invalid) {
      this.branchForm.markAllAsTouched();
      return;
    }

    const value = this.branchForm.value;
    const newBranchPayload: Partial<BranchItem> = {
      name: value.name,
      owner: value.owner,
      assignee: value.assignee,
      routing: value.routing,
      duration: value.duration,
      members: 0
    };

    this.branchesService.createBranch(newBranchPayload).subscribe({
      next: (res) => {
        const created = res.data || newBranchPayload;
        this.loadBranches();
        this.selectedBranch = created;
        this.showCreateForm = false;
        this.branchForm.reset();
      },
      error: (err) => {
        console.error('Error creating branch:', err);
        this.showCreateForm = false;
      }
    });
  }
}