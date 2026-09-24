import { Component, OnInit, ViewEncapsulation, inject, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { ProjectsService } from '../projects.service';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { OpportunitiesService } from '../../opportunities/opportunities.service';

import { RequirementMatcherService } from '../../../services/requirement-matcher.service';
import { MatchingOpportunitiesModalComponent } from '../../shared/matching-opportunities-modal/matching-opportunities-modal';

@Component({
  selector: 'app-all-rera-projects',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, MatchingOpportunitiesModalComponent],
  templateUrl: './rera-project.html',
  styleUrl: './rera-project.css',
  encapsulation: ViewEncapsulation.None
})
export class ReraProject implements OnInit {
  searchQuery: string = '';
  selectedProjectId: string | null = null;
  selectedProject: any = null;
  mapSecureUrl!: SafeResourceUrl | null;

  // Sorting values matching backend expectants:
  // "Last 7 days", "Last 30 days", "Last 90 days"
  currentSortFilter: string = 'Create Date';
  sortLabelText: string = 'SORT BY';

  filteredProjects: any[] = [];

  // Matching Opportunities variables
  opportunitiesList: any[] = [];
  matchingOpportunities: any[] = [];
  matchingOpportunitiesCount: number = 0;
  showMatchingModal: boolean = false;
  projectImages: any[] = [];

  private projectsService = inject(ProjectsService);
  private sanitizer = inject(DomSanitizer);
  private opportunitiesService = inject(OpportunitiesService);
  private matcherService = inject(RequirementMatcherService);
  private router = inject(Router);

  ngOnInit(): void {
    this.applyFilters();
    this.loadOpportunities();
  }

  loadOpportunities(): void {
    this.opportunitiesService.getOpportunities({ limit: 500 }).subscribe({
      next: (res: any) => {
        const payload = res.data || res;
        this.opportunitiesList = payload.opportunities || [];
        this.calculateMatches();
      },
      error: (err) => console.error('Failed to load opportunities:', err)
    });
  }

  calculateMatches(): void {
    if (!this.selectedProject) {
      this.matchingOpportunities = [];
      this.matchingOpportunitiesCount = 0;
      return;
    }
    this.matchingOpportunities = this.matcherService.matchProjectWithOpportunities(this.selectedProject, this.opportunitiesList);
    this.matchingOpportunitiesCount = this.matchingOpportunities.length;
  }

  openMatchingOpportunitiesModal(): void {
    this.showMatchingModal = true;
  }

  closeMatchingModal(): void {
    this.showMatchingModal = false;
  }



  editProject(projectId?: string): void {
    const id = projectId || this.selectedProjectId || (this.selectedProject ? (this.selectedProject.id || this.selectedProject._id) : null);
    if (id) {
      this.router.navigate(['/create-project'], { queryParams: { id } });
    }
  }

  changeDaysFilter(daysFilter: string, label: string): void {
    this.currentSortFilter = daysFilter;
    this.sortLabelText = label;
    this.applyFilters();
  }

  triggerSearch(): void {
    this.applyFilters();
  }

  getDeveloperCount(): number {
    const developers = new Set(this.filteredProjects.map(p => p.developerName).filter(Boolean));
    return developers.size;
  }

  applyFilters(): void {
    const query = {
      search: this.searchQuery,
      sortBy: this.currentSortFilter,
      limit: 100
    };

    this.projectsService.getReraProjects(query).subscribe({
      next: (res: any) => {
        const payload = res.data || res;
        this.filteredProjects = payload.projects || [];
        if (this.filteredProjects.length > 0) {
          if (this.selectedProjectId && this.filteredProjects.some(p => p.id === this.selectedProjectId)) {
            this.selectProject(this.selectedProjectId);
          } else {
            this.selectedProject = null;
            this.selectedProjectId = null;
          }
        } else {
          this.selectedProject = null;
          this.selectedProjectId = null;
        }
      },
      error: (err) => {
        console.error('Failed to load RERA projects:', err);
      }
    });
  }

  selectProject(id: string): void {
    this.selectedProjectId = id;
    this.projectsService.getProjectById(id).subscribe({
      next: (res: any) => {
        const payload = res.data || res;
        this.selectedProject = payload;
        this.updateMapSource(payload);
        this.calculateMatches();
        this.projectImages = JSON.parse(localStorage.getItem(`project_images_${id}`) || '[]');
      },
      error: (err) => {
        console.error('Failed to load project details:', err);
      }
    });
  }


  updateMapSource(project: any) {
    let coordinates = ''; 
    if (project && project.latitude && project.longitude) {
      coordinates = `${project.latitude},${project.longitude}`;
    } else if (project && project.address) {
      coordinates = project.address;
    }
 
    if (coordinates) {
      const embedUrl = `https://maps.google.com/maps?q=${encodeURIComponent(coordinates)}&t=&z=15&ie=UTF8&iwloc=&output=embed`;
      this.mapSecureUrl = this.sanitizer.bypassSecurityTrustResourceUrl(embedUrl);
    } else {
      this.mapSecureUrl = null;
    }
  }

  clearSelection(): void {
    this.selectedProject = null;
    this.selectedProjectId = null;
  }

  showShareMenu = false;

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event) {
    this.showShareMenu = false;
  }

  toggleShareMenu(event: Event) {
    event.stopPropagation();
    this.showShareMenu = !this.showShareMenu;
  }

  encodeQuery(val: string): string {
    return encodeURIComponent(val || '');
  }

  formatPriceCr(price: number | null | undefined): string {
    if (!price) return '—';
    if (price >= 10000000) {
      return `₹${(price / 10000000).toFixed(2)} Cr`;
    } else if (price >= 100000) {
      return `₹${(price / 100000).toFixed(2)} Lac`;
    }
    return `₹${price.toLocaleString('en-IN')}`;
  }

  scrollToMap() {
    const mapElement = document.querySelector('.google-map-embed-row');
    if (mapElement) {
      mapElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }

  triggerTransfer() {
    alert('Transfer options are not directly applicable to RERA projects list.');
  }

  initiateIvrCall(project: any) {
    const mobile = project?.contactId?.mobile;
    if (mobile) {
      alert(`Initiating IVR Call to: ${mobile}`);
    } else {
      alert('IVR Call failed: Owner mobile number is not available.');
    }
  }

  shareOnWhatsApp(project: any) {
    const text = `Check out this project: ${project.projectName} located at ${project.locality || ''}, ${project.city || ''}. Link: ${window.location.href}`;
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, '_blank');
    this.showShareMenu = false;
  }

  shareOnLinkedIn(project: any) {
    const url = window.location.href;
    window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`, '_blank');
    this.showShareMenu = false;
  }

  shareOnTwitter(project: any) {
    const text = `Check out this project: ${project.projectName} located at ${project.locality || ''}, ${project.city || ''}.`;
    const url = window.location.href;
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`, '_blank');
    this.showShareMenu = false;
  }
}