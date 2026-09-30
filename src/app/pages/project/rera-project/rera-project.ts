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
  projectDocuments: any[] = [];

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
        if (this.selectedProject && Array.isArray(this.selectedProject.documents) && this.selectedProject.documents.length > 0) {
          this.projectDocuments = this.selectedProject.documents;
          localStorage.setItem(`project_documents_${id}`, JSON.stringify(this.projectDocuments));
        } else {
          this.projectDocuments = JSON.parse(localStorage.getItem(`project_documents_${id}`) || '[]');
        }
      },
      error: (err) => {
        console.error('Failed to load project details:', err);
      }
    });
  }


  // Media Lightbox Carousel State
  selectedDetailMediaModal: {
    url?: SafeResourceUrl | string;
    rawUrl?: string;
    safeUrl?: SafeResourceUrl;
    type: 'image' | 'video' | 'document' | 'pdf';
    name?: string;
    category?: string;
    size?: string;
    isPdf?: boolean;
    isImage?: boolean;
    isVideo?: boolean;
    isDoc?: boolean;
  } | null = null;
  detailMediaList: any[] = [];
  detailMediaIndex: number = 0;

  buildProjectMediaList(): any[] {
    const list: any[] = [];
    const images = (this.projectImages && this.projectImages.length > 0) ? this.projectImages : (this.selectedProject?.images || []);
    const documents = (this.projectDocuments && this.projectDocuments.length > 0) ? this.projectDocuments : (this.selectedProject?.documents || []);
    const videos = (this.selectedProject?.videos) || [];

    // Add Images
    images.forEach((img: any, idx: number) => {
      const url = typeof img === 'string' ? img : (img.data || img.url || '');
      const name = typeof img === 'string' ? `Image ${idx + 1}` : (img.name || `Image ${idx + 1}`);
      if (url) {
        list.push({
          id: 'img_' + idx,
          type: 'image',
          name: name,
          url: url,
          rawUrl: url,
          isImage: true,
          uploadedAt: img.uploadedAt || ''
        });
      }
    });

    // Add Video Link / Videos
    if (this.selectedProject?.videoUrl) {
      list.push({
        id: 'vid_main',
        type: 'video',
        name: 'Project Walkthrough Video',
        url: this.selectedProject.videoUrl,
        rawUrl: this.selectedProject.videoUrl,
        isVideo: true
      });
    }
    videos.forEach((vid: any, idx: number) => {
      const url = typeof vid === 'string' ? vid : (vid.data || vid.url || '');
      const name = typeof vid === 'string' ? `Video ${idx + 1}` : (vid.name || `Video ${idx + 1}`);
      if (url) {
        list.push({
          id: 'vid_' + idx,
          type: 'video',
          name: name,
          url: url,
          rawUrl: url,
          isVideo: true
        });
      }
    });

    // Add Documents
    documents.forEach((doc: any, idx: number) => {
      const docName = doc.name || `Document ${idx + 1}`;
      const data = doc.data || doc.url || '';
      const isPdf = (docName).toLowerCase().endsWith('.pdf') || (data && data.startsWith('data:application/pdf'));
      const isImg = /\.(jpg|jpeg|png|webp|gif)$/i.test(docName) || (data && data.startsWith('data:image/'));

      let safeUrl: SafeResourceUrl | undefined;
      if (isPdf && data) {
        safeUrl = this.sanitizer.bypassSecurityTrustResourceUrl(data);
      }

      list.push({
        id: 'doc_' + idx,
        type: isImg ? 'image' : (isPdf ? 'pdf' : 'document'),
        name: docName,
        category: doc.category || 'Project Document',
        size: doc.size || '',
        data: data,
        url: data,
        rawUrl: data,
        isPdf,
        isImage: isImg,
        isDoc: !isImg && !isPdf,
        safeUrl,
        uploadedAt: doc.uploadedAt || ''
      });
    });

    return list;
  }

  openMediaLightbox(itemToFocus?: any): void {
    this.detailMediaList = this.buildProjectMediaList();
    if (this.detailMediaList.length === 0) {
      if (itemToFocus) {
        const isPdf = (itemToFocus.name || '').toLowerCase().endsWith('.pdf') || (itemToFocus.data && itemToFocus.data.startsWith('data:application/pdf'));
        const isImage = /\.(jpg|jpeg|png|webp|gif)$/i.test(itemToFocus.name || '') || (itemToFocus.data && itemToFocus.data.startsWith('data:image/'));
        const url = itemToFocus.data || itemToFocus.url || '';
        this.detailMediaList = [{
          type: isImage ? 'image' : (isPdf ? 'pdf' : 'document'),
          name: itemToFocus.name || 'Media',
          url,
          rawUrl: url,
          isPdf,
          isImage,
          safeUrl: isPdf ? this.sanitizer.bypassSecurityTrustResourceUrl(url) : undefined
        }];
      } else {
        return;
      }
    }

    let targetIndex = 0;
    if (itemToFocus) {
      const matchIndex = this.detailMediaList.findIndex(m =>
        (m.rawUrl && (m.rawUrl === itemToFocus.data || m.rawUrl === itemToFocus.url || m.rawUrl === itemToFocus)) ||
        (m.name && itemToFocus.name && m.name === itemToFocus.name)
      );
      if (matchIndex !== -1) {
        targetIndex = matchIndex;
      }
    }

    this.detailMediaIndex = targetIndex;
    this.selectedDetailMediaModal = this.detailMediaList[targetIndex];
  }

  openImagePreview(img: any): void {
    this.openMediaLightbox(img);
  }

  openDocPreview(doc: any): void {
    this.openMediaLightbox(doc);
  }

  selectDetailMediaIndex(idx: number, event?: Event): void {
    if (event) event.stopPropagation();
    if (idx >= 0 && idx < this.detailMediaList.length) {
      this.detailMediaIndex = idx;
      this.selectedDetailMediaModal = this.detailMediaList[idx];
    }
  }

  prevDetailMedia(event?: Event): void {
    if (event) event.stopPropagation();
    if (this.detailMediaList.length <= 1) return;
    this.detailMediaIndex = (this.detailMediaIndex - 1 + this.detailMediaList.length) % this.detailMediaList.length;
    this.selectedDetailMediaModal = this.detailMediaList[this.detailMediaIndex];
  }

  nextDetailMedia(event?: Event): void {
    if (event) event.stopPropagation();
    if (this.detailMediaList.length <= 1) return;
    this.detailMediaIndex = (this.detailMediaIndex + 1) % this.detailMediaList.length;
    this.selectedDetailMediaModal = this.detailMediaList[this.detailMediaIndex];
  }

  closeDetailMediaModal(): void {
    this.selectedDetailMediaModal = null;
  }

  downloadDocument(doc: any) {
    if (!doc || !doc.data) return;
    const link = document.createElement('a');
    link.href = doc.data;
    link.download = doc.name || 'document';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  @HostListener('document:keydown', ['$event'])
  handleKeyboardEvent(event: KeyboardEvent) {
    if (this.selectedDetailMediaModal) {
      if (event.key === 'ArrowRight') {
        this.nextDetailMedia();
      } else if (event.key === 'ArrowLeft') {
        this.prevDetailMedia();
      } else if (event.key === 'Escape') {
        this.closeDetailMediaModal();
      }
    }
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

  generateProjectShareDetails(project: any): string {
    if (!project) return '';

    const lines: string[] = [];
    const projName = project.projectName || project.publicName || 'Project Details';
    const devName = project.developerName;
    const rera = project.reraNumber;

    lines.push(`🏢 *${projName.toUpperCase()}*`);
    if (devName) lines.push(`🏗 *Developer:* ${devName}`);
    if (rera) lines.push(`📜 *RERA No:* ${rera}`);
    if (project.status && project.status !== 'Select') lines.push(`🏷 *Status:* ${project.status}`);
    lines.push(``);

    // Location
    const locationParts = [project.locality, project.city, project.state].filter(Boolean).join(', ');
    if (locationParts) {
      lines.push(`📍 *Location:* ${locationParts}`);
    }
    if (project.address && project.address !== locationParts) {
      lines.push(`🗺 *Address:* ${project.address}`);
    }

    // Key Stats
    if (project.projectAreaValue) {
      lines.push(`📐 *Total Project Area:* ${project.projectAreaValue} ${project.projectAreaUnit || 'Sq.Ft'}`);
    }
    if (project.transactionType) {
      lines.push(`🔄 *Transaction Type:* ${project.transactionType}`);
    }
    if (project.possession || project.possessionDate) {
      const poss = project.possessionDate ? `${project.possession} (${project.possessionDate})` : project.possession;
      lines.push(`🔑 *Possession:* ${poss}`);
    }

    // Unit Configurations & Pricing
    const plans = (project.plans && project.plans.length > 0) ? project.plans : [];
    if (plans && plans.length > 0) {
      lines.push(``);
      lines.push(`🏠 *UNIT CONFIGURATIONS & PRICING:*`);
      plans.forEach((plan: any, i: number) => {
        const bhk = plan.propertyType || plan.bedroom || plan.bhkType || `Option ${i+1}`;
        const area = plan.carpetArea ? `${plan.carpetArea} ${plan.carpetAreaUnit || 'Sq.Ft'}` : (plan.area ? `${plan.area} ${plan.areaUnit || 'Sq.Ft'}` : '');
        const rate = plan.priceRate ? `₹${plan.priceRate.toLocaleString('en-IN')} ${plan.priceUnit || '/ Sq.Ft.'}` : '';
        const booking = plan.bookingAmount ? `Booking: ₹${plan.bookingAmount.toLocaleString('en-IN')}` : '';
        const parts = [bhk, area ? `(${area})` : '', rate, booking].filter(Boolean).join(' • ');
        lines.push(` • ${parts}`);
      });
    }

    // Towers / Blocks
    const towers = (project.towers && project.towers.length > 0) ? project.towers : [];
    if (towers && towers.length > 0) {
      lines.push(``);
      lines.push(`🏙 *TOWERS / BLOCKS:*`);
      towers.forEach((t: any) => {
        const comp = t.completionDate ? `(Possession: ${t.completionDate})` : '';
        lines.push(` • ${t.name} ${comp}`);
      });
    }

    // Description / Remarks
    const desc = project.description || project.remark;
    if (desc) {
      lines.push(``);
      lines.push(`📝 *Description:*`);
      lines.push(desc.length > 300 ? desc.substring(0, 300) + '...' : desc);
    }

    // Contact Information
    if (project.siteManager || project.siteManagerContact) {
      lines.push(``);
      lines.push(`📞 *Contact Person:* ${project.siteManager || 'Site Manager'} (${project.siteManagerContact || ''})`);
    }

    // Media & Docs Summary
    const images = (project.images && project.images.length > 0) ? project.images : (this.projectImages || []);
    const docs = (project.documents && project.documents.length > 0) ? project.documents : [];

    if (images.length > 0 || docs.length > 0) {
      lines.push(``);
      lines.push(`📸 *ATTACHED MEDIA & DOCUMENTS:*`);
      if (images.length > 0) {
        lines.push(` • Photos: ${images.length} Image(s) Attached`);
      }
      if (docs.length > 0) {
        lines.push(` • Documents: ${docs.length} File(s) (Brochure / Plans / Certificates)`);
      }
    }

    if (project.videoUrl) {
      lines.push(`🎥 *Video Walkthrough:* ${project.videoUrl}`);
    }

    lines.push(``);
    lines.push(`🔗 *View Details Online:* ${window.location.href}`);

    return lines.join('\n');
  }

  async shareOnWhatsApp(project?: any) {
    const targetProject = project || this.selectedProject;
    if (!targetProject) return;

    this.showShareMenu = false;
    const text = this.generateProjectShareDetails(targetProject);

    const images = (targetProject.images && targetProject.images.length > 0) ? targetProject.images : (this.projectImages || []);

    let files: File[] = [];
    if (images.length > 0 && typeof navigator !== 'undefined' && (navigator as any).share) {
      try {
        const filePromises = images.map(async (img: any, idx: number) => {
          try {
            const urlStr = typeof img === 'string' ? img : (img.data || img.url || '');
            if (!urlStr) return null;
            if (urlStr.startsWith('data:')) {
              const parts = urlStr.split(',');
              const mimeMatch = parts[0].match(/:(.*?);/);
              const mime = mimeMatch ? mimeMatch[1] : 'image/png';
              const bstr = atob(parts[1]);
              let n = bstr.length;
              const u8arr = new Uint8Array(n);
              while (n--) {
                u8arr[n] = bstr.charCodeAt(n);
              }
              const ext = mime.split('/')[1]?.split('+')[0] || 'png';
              return new File([u8arr], `${(targetProject.projectName || 'project').replace(/\s+/g, '_')}_photo_${idx + 1}.${ext}`, { type: mime });
            } else if (urlStr.startsWith('http')) {
              const res = await fetch(urlStr);
              const blob = await res.blob();
              return new File([blob], `${(targetProject.projectName || 'project').replace(/\s+/g, '_')}_photo_${idx + 1}.png`, { type: blob.type || 'image/png' });
            }
          } catch (e) {
            return null;
          }
          return null;
        });

        const fetched = await Promise.all(filePromises);
        files = fetched.filter((f): f is File => f !== null);
      } catch (e) {
        console.warn('Could not prepare image files for native share:', e);
      }
    }

    if (files.length > 0 && (navigator as any).share && (navigator as any).canShare && (navigator as any).canShare({ files })) {
      try {
        await (navigator as any).share({
          title: targetProject.projectName || 'Project Details',
          text: text,
          files: files
        });
        return;
      } catch (e) {
        console.warn('Native share failed or cancelled, using WhatsApp URL fallback:', e);
      }
    }

    const targetUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
    window.open(targetUrl, '_blank');
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