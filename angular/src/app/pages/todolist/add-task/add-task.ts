import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink, RouterModule } from '@angular/router';
import { TasksService } from '../tasks.service';
import { AuthService } from '../../auth/auth.service';
import { Location } from '@angular/common';
import { BranchesService } from '../../../services/branches.service';

@Component({
  selector: 'app-add-task',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './add-task.html',
  styleUrls: ['./add-task.css']
})
export class AddTask implements OnInit {
  taskForm = {
    task: '',
    description: '',
    scheduledDate: '',
    scheduleTime: '',
    branch: '',
    assignedTo: ''
  };

  agents: any[] = [];
  branchList: string[] = [];
  private authService = inject(AuthService);
  private branchesService = inject(BranchesService);

  constructor(
    private router: Router,
    private tasksService: TasksService,
    private location: Location
  ) {}

  ngOnInit(): void {
    this.loadAgents();
    this.loadBranches();
  }

  loadBranches(): void {
    this.branchesService.getBranchNames().subscribe({
      next: (names) => {
        this.branchList = names;
      },
      error: (err) => console.error('Error loading branches in AddTask:', err)
    });
  }

  loadAgents(): void {
    this.authService.getAgents().subscribe({
      next: (res: any) => {
        this.agents = res.data || res;
      },
      error: (err) => {
        console.error('Failed to load agents in task creation:', err);
      }
    });
  }

  submitTaskForm(): void {
    if (!this.taskForm.task.trim()) {
      alert('Task summary is required');
      return;
    }
    if (!this.taskForm.scheduledDate) {
      alert('Scheduled date is required');
      return;
    }
    if (!this.taskForm.scheduleTime) {
      alert('Schedule time is required');
      return;
    }

    const payload: any = { ...this.taskForm };
    if (!payload.description?.trim()) delete payload.description;
    if (!payload.branch || payload.branch === 'Select Branch') delete payload.branch;
    if (!payload.assignedTo || payload.assignedTo === 'Select User') delete payload.assignedTo;

    this.tasksService.createTask(payload).subscribe({
      next: (res) => {
        alert('Task created successfully!');
        this.router.navigate(['/all-tasks']);
      },
      error: (err) => {
        console.error('Failed to create task:', err);
        const errMsg = err.error?.message || err.message || 'Check inputs';
        alert('Error creating task: ' + (Array.isArray(errMsg) ? errMsg.join(', ') : errMsg));
      }
    });
  }

  goBack(): void {
    this.router.navigate(['/all-tasks']);
  }

  goBackPage(): void {
  if (window.history.length > 1) {
    this.location.back();
  } else {
    this.router.navigate(['/all-tasks']);
  }
}
}
