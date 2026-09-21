import { Component, OnInit, ViewEncapsulation, inject, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { ProjectsService } from '../projects.service';
import { GroupTransfer } from '../../shared/group-transfer/group-transfer';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { OpportunitiesService } from '../../opportunities/opportunities.service';
import { ProjectDownloadAction } from '../actions/project-download-action/project-download-action';
import { ProjectImportAction } from '../actions/project-import-action/project-import-action';
import { ProjectSendProposal } from '../actions/project-send-proposal/project-send-proposal';

@Component({
  selector: 'app-all-projects',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    GroupTransfer,
    ProjectDownloadAction,
    ProjectImportAction,
    ProjectSendProposal
  ],
  templateUrl: './all-project.html',
  styleUrl: './all-project.css',
  encapsulation: ViewEncapsulation.None
})
export class AllProject implements OnInit {
  searchQuery: string = '';
  selectedProjectId: string | null = null;
  selectedProject: any = null; 
  mapSecureUrl!: SafeResourceUrl | null;

  showGroupTransfer = false;
  showActions = false;
  downloadAction = false;
  showImportProject = false;
  showProposal = false;
  rawProjectsList: any[] = [];
  totalRecords: number = 0;
  
  currentSortKey: 'projectName' | 'developerName' | 'launchDate' | 'createdAt' = 'projectName';
  currentOrder: 'asc' | 'desc' = 'asc';

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
  private route = inject(ActivatedRoute);

  constructor(private router: Router) {}

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      this.searchQuery = params['search'] || '';
      this.applyFilterAndSort();
    });
    this.loadOpportunities();
  }

  changeSortKey(key: 'projectName' | 'developerName' | 'launchDate' | 'createdAt'): void {
    this.currentSortKey = key;
    this.applyFilterAndSort();
  }

  changeOrder(order: 'asc' | 'desc'): void {
    this.currentOrder = order;
    this.applyFilterAndSort();
  }

  triggerSearch(): void {
    this.applyFilterAndSort();
  }

  getDeveloperCount(): number {
    const developers = new Set(this.filteredProjects.map(p => p.developerName).filter(Boolean));
    return developers.size;
  }

  applyFilterAndSort(): void {
    let backendSortBy = 'Project Name';
    if (this.currentSortKey === 'createdAt') {
      backendSortBy = 'Create Date';
    } else if (this.currentSortKey === 'launchDate') {
      backendSortBy = 'Launch Date';
    } else if (this.currentSortKey === 'developerName') {
      backendSortBy = 'Display Name';
    }

    const query = {
      search: this.searchQuery,
      sortBy: backendSortBy,
      orderBy: this.currentOrder === 'asc' ? 'Asc' : 'Desc' as any,
      limit: 100
    };

    this.projectsService.getProjects(query).subscribe({
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
        console.error('Failed to retrieve projects from API:', err);
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
        this.loadProjectSubData(id);
      },
      error: (err) => {
        console.error('Failed to retrieve project details by ID:', err);
      }
    });
  }

  editProject(projectId?: string): void {
    const id = projectId || this.selectedProjectId || (this.selectedProject ? (this.selectedProject.id || this.selectedProject._id) : null);
    if (id) {
      this.router.navigate(['/create-project'], { queryParams: { id } });
    }
  }

  previewModalImage: { name: string; data: string; size?: string } | null = null;
  previewModalDoc: { name: string; category: string; data: string; size: string; isPdf: boolean; isImage: boolean; safeUrl?: SafeResourceUrl } | null = null;

  openImagePreview(img: any): void {
    this.previewModalImage = img;
  }

  closeImagePreview(): void {
    this.previewModalImage = null;
  }

  openDocPreview(doc: any): void {
    const isPdf = (doc.name || '').toLowerCase().endsWith('.pdf') || (doc.data && doc.data.startsWith('data:application/pdf'));
    const isImage = /\.(jpg|jpeg|png|webp|gif)$/i.test(doc.name || '') || (doc.data && doc.data.startsWith('data:image/'));

    let safeUrl: SafeResourceUrl | undefined;
    if (isPdf && doc.data) {
      safeUrl = this.sanitizer.bypassSecurityTrustResourceUrl(doc.data);
    }

    this.previewModalDoc = {
      name: doc.name || 'Document',
      category: doc.category || 'General Document',
      size: doc.size || '',
      data: doc.data || '',
      isPdf,
      isImage,
      safeUrl
    };
  }

  closeDocPreview(): void {
    this.previewModalDoc = null;
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
    console.log('Selection cleared. Back to master view dashboard panels.');
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
      },
      error: (err) => {
        this.selectedProject.publishedOnWebsite = this.publishStatus;
        alert(this.publishStatus ? 'Project published successfully!' : 'Project unpublished successfully!');
        if (!this.stayOnPageAfterSubmit) {
          this.showPublishModal = false;
        }
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
        const proj = this.filteredProjects.find(p => p.id === this.selectedProject.id);
        if (proj) proj.status = this.selectedStatusChoice;
        alert(`Status updated to: ${this.selectedStatusChoice}`);
        this.showStatusModal = false;
      },
      error: (err) => {
        this.selectedProject.status = this.selectedStatusChoice;
        const proj = this.filteredProjects.find(p => p.id === this.selectedProject.id);
        if (proj) proj.status = this.selectedStatusChoice;
        alert(`Status updated to: ${this.selectedStatusChoice}`);
        this.showStatusModal = false;
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
          this.applyFilterAndSort();
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

  // Project Images (Max 8 limit)
  onImageFileSelected(event: any) {
    if (this.projectImages.length >= 8) {
      alert('Maximum limit of 8 images reached for this project.');
      event.target.value = '';
      return;
    }
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e: any) => {
        if (this.projectImages.length < 8) {
          this.projectImages.push({
            name: file.name,
            data: e.target.result,
            uploadedAt: new Date().toLocaleDateString()
          });
          this.saveImages();
        }
      };
      reader.readAsDataURL(file);
    }
    event.target.value = '';
  }
  deleteImage(index: number) {
    if (confirm('Are you sure you want to delete this image?')) {
      this.projectImages.splice(index, 1);
      this.saveImages();
    }
  }

  // Attach Documents (Max 8 limit)
  onDocumentFileSelected(event: any) {
    if (this.projectDocuments.length >= 8) {
      alert('Maximum limit of 8 documents reached for this project.');
      event.target.value = '';
      return;
    }
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e: any) => {
        if (this.projectDocuments.length < 8) {
          this.projectDocuments.push({
            name: file.name,
            size: (file.size / 1024).toFixed(1) + ' KB',
            data: e.target.result,
            uploadedAt: new Date().toLocaleDateString()
          });
          this.saveDocuments();
        }
      };
      reader.readAsDataURL(file);
    }
    event.target.value = '';
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