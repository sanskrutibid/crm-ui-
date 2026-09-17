import { Component, OnInit, ViewEncapsulation, inject, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { ProjectsService } from '../projects.service';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { OpportunitiesService } from '../../opportunities/opportunities.service';

@Component({
  selector: 'app-all-rera-projects',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
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

  ngOnInit(): void {
    this.applyFilters();
    this.loadOpportunities();
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

  loadOpportunities(): void {
    this.opportunitiesService.getOpportunities({ limit: 1000 }).subscribe({
      next: (res: any) => {
        const payload = res.data || res;
        this.opportunitiesList = payload.opportunities || [];
        this.calculateMatches();
      },
      error: (err) => {
        console.error('Failed to load opportunities for matching:', err);
      }
    });
  }

  calculateMatches(): void {
    if (!this.selectedProject || this.opportunitiesList.length === 0) {
      this.matchingOpportunities = [];
      this.matchingOpportunitiesCount = 0;
      return;
    }

    const project = this.selectedProject;
    this.matchingOpportunities = this.opportunitiesList.filter(opp => {
      // 1. City Match (Case-Insensitive)
      const projectCity = (project.city || '').trim().toLowerCase();
      const oppCity = (opp.city || '').trim().toLowerCase();
      if (projectCity && oppCity && projectCity !== oppCity) {
        return false;
      }

      // 2. Locality Match (case-insensitive substring match)
      const projectLocality = (project.locality || '').trim().toLowerCase();
      const oppLocality = (opp.locality || '').trim().toLowerCase();
      if (projectLocality && oppLocality) {
        if (!projectLocality.includes(oppLocality) && !oppLocality.includes(projectLocality)) {
          return false;
        }
      }

      // 3. Price & Budget Match
      const projectPrice = parseFloat(project.price);
      if (!isNaN(projectPrice)) {
        const budgetMin = parseFloat(opp.minBudget || opp.budgetMin);
        const budgetMax = parseFloat(opp.maxBudget || opp.budgetMax);
        if (!isNaN(budgetMax) && projectPrice > budgetMax) {
          return false;
        }
        if (!isNaN(budgetMin) && projectPrice < budgetMin) {
          return false;
        }
      }

      // 4. Area Match
      const projectArea = parseFloat(project.projectArea);
      if (!isNaN(projectArea)) {
        const areaMin = parseFloat(opp.minArea || opp.areaMin);
        const areaMax = parseFloat(opp.maxArea || opp.areaMax);
        if (!isNaN(areaMax) && projectArea > areaMax) {
          return false;
        }
        if (!isNaN(areaMin) && projectArea < areaMin) {
          return false;
        }
      }

      // 5. Type Match
      const projectType = (project.type || '').trim().toLowerCase();
      const oppType = (opp.lookingFor || '').trim().toLowerCase();
      if (projectType && oppType && projectType !== oppType) {
        return false;
      }

      // 6. BHK Configuration Match
      const projectRoom = (project.totalRoom || '').trim().toLowerCase();
      const oppRoom = (opp.bedroom || '').trim().toLowerCase();
      if (projectRoom && oppRoom && projectRoom !== oppRoom) {
        return false;
      }

      return true;
    }).map(opp => {
      const contact = opp.customer || {};
      const customerName = contact.firstName 
        ? `${contact.firstName} ${contact.lastName || ''}`.trim() 
        : (typeof opp.customer === 'string' ? opp.customer : 'Unknown Customer');
      return {
        ...opp,
        customerName
      };
    });

    this.matchingOpportunitiesCount = this.matchingOpportunities.length;
  }

  openMatchingOpportunitiesModal(): void {
    this.showMatchingModal = true;
  }

  closeMatchingModal(): void {
    this.showMatchingModal = false;
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