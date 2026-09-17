import { Component, OnInit, HostListener, ElementRef, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { TasksService } from '../tasks.service';

@Component({
  selector: 'app-open-tasks',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './open-tasks.html',
  styleUrls: ['./open-tasks.css']
})
export class OpenTasks implements OnInit {
  
  totalRecords: number = 0;
  searchQuery: string = '';
  
  tasks: any[] = []; 
  filteredTasks: any[] = [];
  selectedTaskDetail: any = null;

  // Dropdown states
  selectedSort: string = 'Create Date'; 
  selectedOrder: string = 'ASC';        
  isSortDropdownOpen: boolean = false;
  isOrderDropdownOpen: boolean = false;
completionPercentage: any;
completedCount: any;
openCount: any;
pendingCount: any;

  constructor(
    private eRef: ElementRef,
    private tasksService: TasksService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadTasks();
  }

  loadTasks(): void {
    const sortByField = this.selectedSort === 'Task Title' ? 'task' : 'createdAt';
    const sortOrderField = this.selectedOrder.toLowerCase() as 'asc' | 'desc';

    this.tasksService.getTasks({
      status: 'Open',
      search: this.searchQuery,
      sortBy: sortByField,
      sortOrder: sortOrderField
    }).subscribe({
      next: (res: any) => {
        const payload = res.data || res;
        this.tasks = payload.tasks || [];
        this.filteredTasks = this.tasks;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Failed to load open tasks:', err);
      }
    });

    this.tasksService.getTaskCounts().subscribe({
      next: (res: any) => {
        const payload = res.data || res;
        this.totalRecords = payload.all || 0;
        this.openCount = payload.open || 0;
        this.completedCount = payload.closed || 0;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Failed to load task counts:', err);
      }
    });
  }

  onSearch(): void {
    this.loadTasks();
  }

  onAdvanceSearch(): void {
    console.log('Advance Search click hua');
  }

  toggleTaskStatus(task: any, event: Event): void {
    event.stopPropagation();
    const newStatus = task.status === 'Open' ? 'Closed' : 'Open';
    this.tasksService.updateTask(task.id, { status: newStatus }).subscribe({
      next: (res: any) => {
        alert(`Task status updated to ${newStatus}`);
        const updatedTask = res.data || res;
        if (this.selectedTaskDetail && (this.selectedTaskDetail.id === task.id || this.selectedTaskDetail._id === task.id)) {
          this.selectedTaskDetail.status = newStatus;
        }
        this.loadTasks();
      },
      error: (err) => {
        console.error('Failed to update task status:', err);
        alert('Failed to update task status');
      }
    });
  }

  viewTaskDetail(task: any, event: Event): void {
    if (event) {
      event.stopPropagation();
    }
    this.selectedTaskDetail = task;
    this.cdr.detectChanges();

    this.tasksService.getTaskById(task.id).subscribe({
      next: (res: any) => {
        this.selectedTaskDetail = res.data || res;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Failed to fetch task details:', err);
      }
    });
  }

  clearSelection(): void {
    this.selectedTaskDetail = null;
  }

  closeTaskDetail(): void {
    this.selectedTaskDetail = null;
  }

  deleteTask(id: string): void {
    if (confirm('Are you sure you want to delete this task?')) {
      this.tasksService.deleteTask(id).subscribe({
        next: () => {
          alert('Task deleted successfully');
          this.selectedTaskDetail = null;
          this.loadTasks();
        },
        error: (err) => {
          console.error('Failed to delete task:', err);
          alert('Failed to delete task');
        }
      });
    }
  }

  // Dropdowns logic
  toggleSortDropdown(event: Event): void {
    event.stopPropagation();
    this.isSortDropdownOpen = !this.isSortDropdownOpen;
    this.isOrderDropdownOpen = false; 
  }

  toggleOrderDropdown(event: Event): void {
    event.stopPropagation();
    this.isOrderDropdownOpen = !this.isOrderDropdownOpen;
    this.isSortDropdownOpen = false; 
  }

  selectSort(value: string): void {
    this.selectedSort = value;
    this.isSortDropdownOpen = false;
    this.loadTasks();
  }

  selectOrder(value: string): void {
    this.selectedOrder = value;
    this.isOrderDropdownOpen = false;
    this.loadTasks();
  }

  @HostListener('document:click', ['$event'])
  clickout(event: Event) {
    if (!this.eRef.nativeElement.contains(event.target)) {
      this.isSortDropdownOpen = false;
      this.isOrderDropdownOpen = false;
    }
  }
}
