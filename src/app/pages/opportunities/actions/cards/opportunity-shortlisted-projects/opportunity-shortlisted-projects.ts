import { CommonModule } from '@angular/common';
import { Component, Output, EventEmitter, Input, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-opportunity-shortlisted-projects',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './opportunity-shortlisted-projects.html',
  styleUrl: './opportunity-shortlisted-projects.css',
})
export class OpportunityShortlistedProjects implements OnInit {
  @Input() lead: any;
  @Output() close = new EventEmitter<void>();

  selectedStatus = 'all';

  projects = [
    {
      name: 'Green Valley Township',
      location: 'Nagpur',
      image: 'assets/images/project1.jpg',
      status: 'pending'
    },
    {
      name: 'Royal Residency',
      location: 'Pune',
      image: 'assets/images/project2.jpg',
      status: 'accepted'
    },
    {
      name: 'Dream City',
      location: 'Mumbai',
      image: 'assets/images/project3.jpg',
      status: 'rejected'
    }
  ];

  filteredProjects = [...this.projects];

  ngOnInit() {
    this.filterByCustomerCity();
  }

  filterByCustomerCity() {
    const city = (this.lead?.city || '').trim().toLowerCase();
    if (city) {
      const matched = this.projects.filter(p => p.location.toLowerCase().includes(city));
      if (matched.length > 0) {
        this.projects = matched;
      }
    }
    this.filterProjects();
  }

  filterProjects() {
    if (this.selectedStatus === 'all') {
      this.filteredProjects = [...this.projects];
    } else {
      this.filteredProjects = this.projects.filter(
        project => project.status === this.selectedStatus
      );
    }
  }
}
