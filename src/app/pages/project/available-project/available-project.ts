import { Component, OnInit, ViewEncapsulation, inject, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { ProjectsService } from '../projects.service';
import { GroupTransfer } from '../../shared/group-transfer/group-transfer';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { OpportunitiesService } from '../../opportunities/opportunities.service';
import { RequirementMatcherService } from '../../../services/requirement-matcher.service';
import { MatchingOpportunitiesModalComponent } from '../../shared/matching-opportunities-modal/matching-opportunities-modal';
import { ProjectDownloadAction } from '../actions/project-download-action/project-download-action';
import { ProjectImportAction } from '../actions/project-import-action/project-import-action';
import { ProjectSendProposal } from '../actions/project-send-proposal/project-send-proposal';

@Component({
  selector: 'app-projects',
  standalone: true,
  imports: [
    FormsModule,
    CommonModule,
    RouterModule,
    GroupTransfer,
    ProjectDownloadAction,
    ProjectImportAction,
    ProjectSendProposal,
    MatchingOpportunitiesModalComponent
  ],

  templateUrl: './available-project.html',
  styleUrls: ['./available-project.css'],
  encapsulation: ViewEncapsulation.None
})
export class AvailableProject implements OnInit {
  searchQuery: string = '';
  selectedProject: any | null = null;
  selectedProjectId: string | null = null;
  mapSecureUrl!: SafeResourceUrl | null;

  showGroupTransfer = false;
  showActions = false;
  downloadAction = false;
  showImportProject = false;
  showProposal = false;
  totalRecords: number = 0;

  currentSortKey: string = 'projectName';
  currentOrder: 'Asc' | 'Desc' = 'Asc';
  rawProjectsList: any[] = [];
  filteredProjects: any[] = [];

  // Matching Opportunities variables
  opportunitiesList: any[] = [];
  matchingOpportunities: any[] = [];
  matchingOpportunitiesCount: number = 0;
  showMatchingModal: boolean = false;

  // Matching Opportunities Overrides & Selections
  proposalEmailOverride?: string;
  proposalNameOverride?: string;
  allOpportunitiesSelected = false;
  showOppActionDropdown = false;

  // New action modal visibility flags
  showStatusModal = false;
  showPublishModal = false;
  showTowersModal = false;
  showPlansModal = false;
  showChargesModal = false;
  showPaymentPlanModal = false;
  showImagesModal = false;
  showDocumentModal = false;

  // Nested collections data for selected project
  projectTowers: any[] = [];
  projectPlans: any[] = [];
  projectCharges: any[] = [];
  projectPaymentPlans: any[] = [];
  projectImages: any[] = [];
  projectDocuments: any[] = [];

  // Redesigned Form states
  selectedStatusChoice: string = 'Select';
  statusList: string[] = ['Available', 'Sold Out'];
  publishStatus: boolean = true;
  publishTo: string = '';
  doNotPublishPrice: boolean = false;
  stayOnPageAfterSubmit: boolean = false;

  towerFormMode: 'list' | 'add' | 'edit' = 'list';
  newTower = { name: '', completionDate: '' };
  editingTowerIndex: number | null = null;

  planFormMode: 'list' | 'add' | 'edit' = 'list';
  newPlan = {
    tower: '',
    propertyType: '',
    bedroom: '',
    bookingAmount: null as number | null,
    area: null as number | null,
    areaUnit: 'Sq.Ft.',
    priceType: 'BSP',
    priceRate: null as number | null,
    priceUnit: '/ Sq.Ft.',
    builtUpArea: null as number | null,
    builtUpAreaUnit: 'Sq.Ft.',
    carpetArea: null as number | null,
    carpetAreaUnit: 'Sq.Ft.',
    otherArea: null as number | null,
    otherAreaUnit: 'Sq.Ft.',
    totalUnit: null as number | null
  };
  editingPlanIndex: number | null = null;

  paymentPlanFormMode: 'list' | 'add' | 'edit' = 'list';
  projectChargesFormMode: 'list' | 'add' | 'edit' = 'list';

  newCharge = { title: '', description: '', amount: null as number | null, type: 'Fixed' as 'Fixed' | 'Percentage', name: '' };
  editingChargeIndex: number | null = null;

  newPaymentPlan = { planName: '', discount: null as number | null, rateOf: 'Select', milestone: '', percentage: null as number | null, event: '', description: '' };
  editingPaymentPlanIndex: number | null = null;

  private projectsService = inject(ProjectsService);
  private sanitizer = inject(DomSanitizer);
  private opportunitiesService = inject(OpportunitiesService);
  private matcherService = inject(RequirementMatcherService);

  constructor(private router: Router) {}

  ngOnInit(): void {
    this.loadAvailableProjects();
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



  triggerSearch(): void {
    this.loadAvailableProjects();
  }

  sortBy(key: string): void {
    this.currentSortKey = key;
    this.loadAvailableProjects();
  }

  changeOrder(order: 'Asc' | 'Desc'): void {
    this.currentOrder = order;
    this.loadAvailableProjects();
  }

  editProject(projectId?: string): void {
    const id = projectId || this.selectedProjectId || (this.selectedProject ? (this.selectedProject.id || this.selectedProject._id) : null);
    if (id) {
      this.router.navigate(['/create-project'], { queryParams: { id } });
    }
  }

  getDeveloperCount(): number {
    const developers = new Set(this.filteredProjects.map(p => p.developerName).filter(Boolean));
    return developers.size;
  }

  loadAvailableProjects(): void {
    let backendSortBy = 'Project Name';
    if (this.currentSortKey === 'createDate') {
      backendSortBy = 'Create Date';
    } else if (this.currentSortKey === 'assignedDate') {
      backendSortBy = 'Assigned Date';
    } else if (this.currentSortKey === 'followUpDate') {
      backendSortBy = 'FollowUp Date';
    } else if (this.currentSortKey === 'projectName') {
      backendSortBy = 'Project Name';
    }

    const query = {
      search: this.searchQuery,
      sortBy: backendSortBy,
      orderBy: this.currentOrder,
      limit: 100
    };

    this.projectsService.getAvailableProjects(query).subscribe({
      next: (res: any) => {
        const payload = res.data || res;
        const allProj = payload.projects || [];
        // Filter to only show 'Available' (or unset) projects
        this.filteredProjects = allProj.filter((p: any) => {
          const isAvailable = !p.status || p.status.trim().toLowerCase() === 'available';
          return isAvailable;
        });

        if (this.filteredProjects.length > 0) {
          if (this.selectedProjectId && this.filteredProjects.some(p => p.id === this.selectedProjectId)) {
            const currentProj = this.filteredProjects.find(p => p.id === this.selectedProjectId);
            this.selectProject(currentProj);
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
        console.error('Failed to load available projects:', err);
      }
    });
  }

  selectProject(project: any): void {
    this.selectedProjectId = project.id;
    this.projectsService.getProjectById(project.id).subscribe({
      next: (res: any) => {
        const payload = res.data || res;
        this.selectedProject = payload;
        this.updateMapSource(payload);
        this.calculateMatches();
        this.loadProjectSubData(project.id);
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

  previewModalImage: { name: string; data: string; size?: string } | null = null;
  previewModalDoc: { name: string; category: string; data: string; size: string; isPdf: boolean; isImage: boolean; safeUrl?: SafeResourceUrl } | null = null;

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
    this.previewModalImage = null;
    this.previewModalDoc = null;
  }

  closeImagePreview(): void {
    this.closeDetailMediaModal();
  }

  closeDocPreview(): void {
    this.closeDetailMediaModal();
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

  loadProjectSubData(projectId: string): void {
    this.projectTowers = JSON.parse(localStorage.getItem(`project_towers_${projectId}`) || '[]');

    // Use plans from backend if available, fallback to localStorage
    if (this.selectedProject && this.selectedProject.plans && this.selectedProject.plans.length > 0) {
      this.projectPlans = this.selectedProject.plans;
      localStorage.setItem(`project_plans_${projectId}`, JSON.stringify(this.projectPlans));
    } else {
      this.projectPlans = JSON.parse(localStorage.getItem(`project_plans_${projectId}`) || '[]');
    }

    this.projectCharges = JSON.parse(localStorage.getItem(`project_charges_${projectId}`) || '[]');
    this.projectPaymentPlans = JSON.parse(localStorage.getItem(`project_payment_plans_${projectId}`) || '[]');

    // Load Images (Backend payload first, fallback to localStorage)
    if (this.selectedProject && Array.isArray(this.selectedProject.images) && this.selectedProject.images.length > 0) {
      this.projectImages = this.selectedProject.images;
      localStorage.setItem(`project_images_${projectId}`, JSON.stringify(this.projectImages));
    } else {
      this.projectImages = JSON.parse(localStorage.getItem(`project_images_${projectId}`) || '[]');
    }

    // Load Documents (Backend payload first, fallback to localStorage)
    if (this.selectedProject && Array.isArray(this.selectedProject.documents) && this.selectedProject.documents.length > 0) {
      this.projectDocuments = this.selectedProject.documents;
      localStorage.setItem(`project_documents_${projectId}`, JSON.stringify(this.projectDocuments));
    } else {
      this.projectDocuments = JSON.parse(localStorage.getItem(`project_documents_${projectId}`) || '[]');
    }
  }

  saveTowers(): void {
    if (!this.selectedProjectId) return;
    localStorage.setItem(`project_towers_${this.selectedProjectId}`, JSON.stringify(this.projectTowers));
  }
  savePlans(): void {
    if (!this.selectedProjectId) return;
    localStorage.setItem(`project_plans_${this.selectedProjectId}`, JSON.stringify(this.projectPlans));

    // Save to backend database via patch
    this.projectsService.updateProject(this.selectedProjectId, { plans: this.projectPlans }).subscribe({
      next: (res: any) => {
        console.log('Plans synced to backend database successfully.');
        if (this.selectedProject) {
          this.selectedProject.plans = this.projectPlans;
        }
      },
      error: (err) => {
        console.error('Failed to sync plans to backend database:', err);
      }
    });
  }
  saveCharges(): void {
    if (!this.selectedProjectId) return;
    localStorage.setItem(`project_charges_${this.selectedProjectId}`, JSON.stringify(this.projectCharges));
  }
  savePaymentPlans(): void {
    if (!this.selectedProjectId) return;
    localStorage.setItem(`project_payment_plans_${this.selectedProjectId}`, JSON.stringify(this.projectPaymentPlans));
  }
  saveImages(): void {
    if (!this.selectedProjectId) return;
    localStorage.setItem(`project_images_${this.selectedProjectId}`, JSON.stringify(this.projectImages));
  }
  saveDocuments(): void {
    if (!this.selectedProjectId) return;
    localStorage.setItem(`project_documents_${this.selectedProjectId}`, JSON.stringify(this.projectDocuments));
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

  openGroupTransfer() {
    this.selectedProject = null;
    this.showGroupTransfer = true;
  }

  hideGroupTransfer() {
    this.showGroupTransfer = false;
  }

  showShareMenu = false;

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event) {
    this.showShareMenu = false;
    this.showActions = false;
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

  // ===== BHK Configuration + Base Price (added) =====
  // Normalises the BHK / Base Price list saved from the create-project form.
  // If your backend uses a different field name, add it to the `candidates` array.
  getBhkConfigs(project: any): { bhk: string; basePrice: any }[] {
    if (!project) return [];
    const candidates = [
      project.bhkConfigurations, project.bhkConfigs, project.bhkConfiguration,
      project.bhkPrices, project.bhkDetails, project.bhkList, project.configurations
    ];
    const src = candidates.find((c: any) => Array.isArray(c) && c.length > 0) || [];

    // Fallback for older projects saved before BHK configurations existed:
    // use the joined "totalRoom" text (e.g. "2 BHK, 3 BHK"). The single project price is
    // attached only when there is exactly one BHK, so a wrong price is never shown.
    if (src.length === 0 && project.totalRoom) {
      const rooms = String(project.totalRoom).split(',').map((s: string) => s.trim()).filter(Boolean);
      return rooms.map((r: string) => ({
        bhk: r,
        basePrice: rooms.length === 1 ? (project.price ?? null) : null
      }));
    }

    return src
      .map((item: any) => {
        if (typeof item === 'string') return { bhk: item, basePrice: null };
        return {
          bhk: item.bhk || item.bhkType || item.bhkConfiguration || item.configuration || item.type || item.name || '',
          basePrice: item.basePrice ?? item.base_price ?? item.price ?? null
        };
      })
      .filter((c: any) => c.bhk);
  }

  formatBasePrice(v: any): string {
    if (v === null || v === undefined || v === '') return '—';
    const n = Number(v);
    if (!isNaN(n)) return this.formatPriceCr(n);
    const s = String(v).trim();
    return s.startsWith('₹') ? s : '₹' + s;
  }

  scrollToMap() {
    const mapElement = document.querySelector('.google-map-embed-row');
    if (mapElement) {
      mapElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }

  triggerTransfer() {
    this.openGroupTransfer();
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

    // BHK Configuration & Base Price (added)
    const bhkConfigs = this.getBhkConfigs(project);
    if (bhkConfigs.length > 0) {
      lines.push(``);
      lines.push(`🛏 *BHK CONFIGURATION & BASE PRICE:*`);
      bhkConfigs.forEach(c => {
        lines.push(` • ${c.bhk} - Base Price: ${this.formatBasePrice(c.basePrice)}`);
      });
    }

    // Unit Configurations & Pricing
    const plans = (project.plans && project.plans.length > 0) ? project.plans : (this.projectPlans || []);
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
    const towers = (project.towers && project.towers.length > 0) ? project.towers : (this.projectTowers || []);
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
    const docs = (project.documents && project.documents.length > 0) ? project.documents : (this.projectDocuments || []);

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

  toggleActionMenu() {
    this.showActions = !this.showActions;
  }

  openStatusModal() {
    this.selectedStatusChoice = this.selectedProject?.status || 'Select';
    this.showStatusModal = true;
    this.showActions = false;
  }
  openPublishModal() {
    this.publishStatus = this.selectedProject?.publishedOnWebsite || false;
    this.publishTo = 'Website';
    this.doNotPublishPrice = false;
    this.stayOnPageAfterSubmit = false;
    this.showPublishModal = true;
    this.showActions = false;
  }
  openTowersModal() {
    this.showTowersModal = true;
    this.towerFormMode = 'list';
    this.showActions = false;
  }
  openPlansModal() {
    this.showPlansModal = true;
    this.planFormMode = 'list';
    this.showActions = false;
  }
  openChargesModal() {
    this.showChargesModal = true;
    this.showActions = false;
  }
  openPaymentPlanModal() {
    this.showPaymentPlanModal = true;
    this.showActions = false;
  }
  openImagesModal() {
    this.showImagesModal = true;
    this.showActions = false;
  }
  openDocumentModal() {
    this.showDocumentModal = true;
    this.showActions = false;
  }

  submitPublish(): void {
    if (!this.selectedProject) return;
    this.projectsService.updateProject(this.selectedProject.id, { publishedOnWebsite: this.publishStatus }).subscribe({
      next: (res: any) => {
        this.selectedProject.publishedOnWebsite = this.publishStatus;
        alert(this.publishStatus ? 'Project published successfully!' : 'Project unpublished successfully!');
        if (!this.stayOnPageAfterSubmit) {
          this.showPublishModal = false;
        }
        this.loadAvailableProjects();
      },
      error: (err) => {
        this.selectedProject.publishedOnWebsite = this.publishStatus;
        alert(this.publishStatus ? 'Project published successfully!' : 'Project unpublished successfully!');
        if (!this.stayOnPageAfterSubmit) {
          this.showPublishModal = false;
        }
        this.loadAvailableProjects();
      }
    });
  }

  submitStatusUpdate(): void {
    if (!this.selectedProject || this.selectedStatusChoice === 'Select') {
      alert('Please select a valid status.');
      return;
    }
    this.projectsService.updateProject(this.selectedProject.id, { status: this.selectedStatusChoice }).subscribe({
      next: (res: any) => {
        this.selectedProject.status = this.selectedStatusChoice;
        alert(`Status updated to: ${this.selectedStatusChoice}`);
        this.showStatusModal = false;
        this.loadAvailableProjects();
      },
      error: (err) => {
        this.selectedProject.status = this.selectedStatusChoice;
        alert(`Status updated to: ${this.selectedStatusChoice}`);
        this.showStatusModal = false;
        this.loadAvailableProjects();
      }
    });
  }

  deleteCurrentProject(): void {
    if (!this.selectedProject) return;
    const confirmed = confirm(`Are you sure you want to delete project: ${this.selectedProject.projectName}?`);
    if (confirmed) {
      this.projectsService.deleteProject(this.selectedProject.id).subscribe({
        next: (res: any) => {
          alert('Project deleted successfully!');
          this.showActions = false;
          this.clearSelection();
          this.loadAvailableProjects();
        },
        error: (err) => {
          alert('Failed to delete project: ' + (err.error?.message || err.message));
        }
      });
    }
  }

  // Towers/Block management matching design
  enterAddTower() {
    this.towerFormMode = 'add';
    this.editingTowerIndex = null;
    // Set default completionDate to today's date formatted as YYYY-MM-DD
    this.newTower = { name: '', completionDate: new Date().toISOString().split('T')[0] };
  }
  cancelTowerForm() {
    this.towerFormMode = 'list';
    this.editingTowerIndex = null;
    this.newTower = { name: '', completionDate: '' };
  }
  addOrUpdateTower() {
    if (!this.newTower.name) {
      alert('Please enter a name for the Tower/Block.');
      return;
    }
    let formattedDate = this.newTower.completionDate;
    if (formattedDate) {
      const parts = formattedDate.split('-');
      if (parts.length === 3 && parts[0].length === 4) { // yyyy-mm-dd format
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const d = new Date(formattedDate);
        if (!isNaN(d.getTime())) {
          formattedDate = `${String(d.getDate()).padStart(2, '0')}-${months[d.getMonth()]}-${d.getFullYear()}`;
        }
      }
    }
    const towerData = { name: this.newTower.name, completionDate: formattedDate };
    if (this.editingTowerIndex !== null) {
      this.projectTowers[this.editingTowerIndex] = towerData;
      this.editingTowerIndex = null;
    } else {
      this.projectTowers.push(towerData);
    }
    this.saveTowers();
    this.newTower = { name: '', completionDate: '' };
    this.towerFormMode = 'list';
  }
  editTower(index: number) {
    this.editingTowerIndex = index;
    const tower = this.projectTowers[index];
    // Convert back from dd-MMM-yyyy format to yyyy-mm-dd if possible
    let rawDate = '';
    if (tower.completionDate) {
      const parts = tower.completionDate.split('-');
      if (parts.length === 3 && parts[1].length === 3) {
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const mIdx = months.indexOf(parts[1]);
        if (mIdx !== -1) {
          rawDate = `${parts[2]}-${String(mIdx + 1).padStart(2, '0')}-${String(parts[0]).padStart(2, '0')}`;
        }
      }
    }
    this.newTower = { name: tower.name, completionDate: rawDate || tower.completionDate };
    this.towerFormMode = 'edit';
  }
  deleteTower(index: number) {
    if (confirm('Are you sure you want to delete this Tower/Block?')) {
      this.projectTowers.splice(index, 1);
      this.saveTowers();
    }
  }

  // Unit/Plan configurations
  enterAddPlan() {
    this.planFormMode = 'add';
    this.editingPlanIndex = null;
    this.newPlan = {
      tower: '',
      propertyType: '',
      bedroom: '',
      bookingAmount: null,
      area: null,
      areaUnit: 'Sq.Ft.',
      priceType: 'BSP',
      priceRate: null,
      priceUnit: '/ Sq.Ft.',
      builtUpArea: null,
      builtUpAreaUnit: 'Sq.Ft.',
      carpetArea: null,
      carpetAreaUnit: 'Sq.Ft.',
      otherArea: null,
      otherAreaUnit: 'Sq.Ft.',
      totalUnit: null
    };
  }

  cancelPlanForm() {
    this.planFormMode = 'list';
    this.editingPlanIndex = null;
  }

  addOrUpdatePlan() {
    if (!this.newPlan.propertyType) {
      alert('Please select or enter Property Type.');
      return;
    }
    if (this.editingPlanIndex !== null) {
      this.projectPlans[this.editingPlanIndex] = { ...this.newPlan };
      this.editingPlanIndex = null;
    } else {
      this.projectPlans.push({ ...this.newPlan });
    }
    this.savePlans();
    this.planFormMode = 'list';
  }

  editPlan(index: number) {
    this.editingPlanIndex = index;
    const plan = this.projectPlans[index];
    this.newPlan = {
      tower: plan.tower || '',
      propertyType: plan.propertyType || plan.bhkType || '',
      bedroom: plan.bedroom || plan.bhkType || '',
      bookingAmount: plan.bookingAmount || null,
      area: plan.area || plan.areaSize || null,
      areaUnit: plan.areaUnit || 'Sq.Ft.',
      priceType: plan.priceType || 'BSP',
      priceRate: plan.priceRate || plan.price || null,
      priceUnit: plan.priceUnit || '/ Sq.Ft.',
      builtUpArea: plan.builtUpArea || null,
      builtUpAreaUnit: plan.builtUpAreaUnit || 'Sq.Ft.',
      carpetArea: plan.carpetArea || null,
      carpetAreaUnit: plan.carpetAreaUnit || 'Sq.Ft.',
      otherArea: plan.otherArea || null,
      otherAreaUnit: plan.otherAreaUnit || 'Sq.Ft.',
      totalUnit: plan.totalUnit || plan.units || null
    };
    this.planFormMode = 'edit';
  }

  deletePlan(index: number) {
    if (confirm('Are you sure you want to delete this plan configuration?')) {
      this.projectPlans.splice(index, 1);
      this.savePlans();
    }
  }

  // Project Charges
  addOrUpdateCharge() {
    if (!this.newCharge.name) {
      alert('Please enter a charge name.');
      return;
    }
    if (this.editingChargeIndex !== null) {
      this.projectCharges[this.editingChargeIndex] = { ...this.newCharge };
      this.editingChargeIndex = null;
    } else {
      this.projectCharges.push({ ...this.newCharge });
    }
    this.saveCharges();
    this.newCharge = { title: '', description: '', amount: null, type: 'Fixed', name: '' };
  }
  editCharge(index: number) {
    this.editingChargeIndex = index;
    this.newCharge = { ...this.projectCharges[index] };
  }
  deleteCharge(index: number) {
    if (confirm('Are you sure you want to delete this charge?')) {
      this.projectCharges.splice(index, 1);
      this.saveCharges();
    }
  }

  // Payment Plans
  addOrUpdatePaymentPlan() {
    if (!this.newPaymentPlan.milestone) {
      alert('Please enter a milestone name.');
      return;
    }
    if (this.editingPaymentPlanIndex !== null) {
      this.projectPaymentPlans[this.editingPaymentPlanIndex] = { ...this.newPaymentPlan };
      this.editingPaymentPlanIndex = null;
    } else {
      this.projectPaymentPlans.push({ ...this.newPaymentPlan });
    }
    this.savePaymentPlans();
    this.newPaymentPlan = { planName: '', discount: null, rateOf: 'Select', milestone: '', percentage: null, event: '', description: '' };
  }
  editPaymentPlan(index: number) {
    this.editingPaymentPlanIndex = index;
    this.newPaymentPlan = { ...this.projectPaymentPlans[index] };
  }
  deletePaymentPlan(index: number) {
    if (confirm('Are you sure you want to delete this milestone?')) {
      this.projectPaymentPlans.splice(index, 1);
      this.savePaymentPlans();
    }
  }

  // Project Images
  onImageFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.projectImages.push({
          name: file.name,
          data: e.target.result,
          uploadedAt: new Date().toLocaleDateString()
        });
        this.saveImages();
      };
      reader.readAsDataURL(file);
    }
  }
  deleteImage(index: number) {
    if (confirm('Are you sure you want to delete this image?')) {
      this.projectImages.splice(index, 1);
      this.saveImages();
    }
  }

  // Attach Documents
  onDocumentFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.projectDocuments.push({
          name: file.name,
          size: (file.size / 1024).toFixed(1) + ' KB',
          data: e.target.result,
          uploadedAt: new Date().toLocaleDateString()
        });
        this.saveDocuments();
      };
      reader.readAsDataURL(file);
    }
  }
  deleteDocument(index: number) {
    if (confirm('Are you sure you want to delete this document?')) {
      this.projectDocuments.splice(index, 1);
      this.saveDocuments();
    }
  }
  downloadDocument(doc: any) {
    const link = document.createElement('a');
    link.href = doc.data;
    link.download = doc.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  goToOpportunitiesList() {
    this.router.navigate(['/all-opp']);
  }

  openDownload() {
    this.showActions = false;
    this.downloadAction = true;
  }

  hideDownload() {
    this.downloadAction = false;
  }

  openImport() {
    this.showActions = false;
    this.showImportProject = true;
  }

  hideImport() {
    this.showImportProject = false;
  }

  openProposal() {
    this.showActions = false;
    this.showProposal = true;
  }

  hideProposal() {
    this.showProposal = false;
  }
}