import { Component, OnInit, ViewEncapsulation, inject, ChangeDetectorRef, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { PropertiesService } from '../properties.service';
import { environment } from '../../../../environments/environment';
import { CreateAudience } from '../actions/create-audience/create-audience';
import { PropertySendGroupSmsAction } from '../actions/property-send-group-sms-action/property-send-group-sms-action';
import { PropertySendGroupEmailAction } from '../actions/property-send-group-email-action/property-send-group-email-action';
import { PropertyGroupDeleteAction } from '../actions/property-group-delete-action/property-group-delete-action';
import { PropertyDownlaodAction } from '../actions/property-downlaod-action/property-downlaod-action';
import { PropertyImportAction } from '../actions/property-import-action/property-import-action';
import { PropertyChangeStatus } from '../actions/cards/property-change-status/property-change-status';
import { PropertySendSms } from '../actions/cards/property-send-sms/property-send-sms';
import { PropertySendEmail } from '../actions/cards/property-send-email/property-send-email';
import { PropertyQuickNote } from '../actions/cards/property-quick-note/property-quick-note';
import { PropertyHistory } from '../actions/cards/property-history/property-history';
import { PropertyShortlistedProperties } from '../actions/cards/property-shortlisted-properties/property-shortlisted-properties';
import { PropertyShortlistedProjects } from '../actions/cards/property-shortlisted-projects/property-shortlisted-projects';
import { PropertySiteVisit } from '../actions/cards/property-site-visit/property-site-visit';
import { PropertyAttachDocument } from '../actions/cards/property-attach-document/property-attach-document';
import { PropertyDelete } from '../actions/cards/property-delete/property-delete';
import { PropertyTermsCondition } from '../actions/cards/property-terms-condition/property-terms-condition';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { PropertyPublish } from '../actions/cards/property-publish/property-publish';
import { PropertySendProposal } from '../actions/cards/property-send-proposal/property-send-proposal';

import { OpportunitiesService } from '../../opportunities/opportunities.service';
import { RequirementMatcherService } from '../../../services/requirement-matcher.service';
import { MatchingOpportunitiesModalComponent } from '../../shared/matching-opportunities-modal/matching-opportunities-modal';

@Component({
  selector: 'app-my-properties',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule,CreateAudience,
    PropertySendGroupSmsAction, PropertySendGroupEmailAction,PropertyGroupDeleteAction,
    PropertyDownlaodAction,PropertyImportAction,PropertyChangeStatus,PropertySendSms,
    PropertySendEmail,PropertyQuickNote,PropertyHistory,PropertyShortlistedProperties,
    PropertyShortlistedProjects,PropertySiteVisit,PropertyAttachDocument,PropertyDelete,
    PropertyTermsCondition,PropertyPublish,PropertySendProposal,MatchingOpportunitiesModalComponent
  ],
  templateUrl: './my-property.html',
  styleUrl: './my-property.css',
  encapsulation: ViewEncapsulation.None
})
export class MyProperty implements OnInit {
  searchQuery: string = '';
  selectedProperty: any | null = null;
  propertiesListRaw: any[] = [];
  totalRecords: number = 0;

  showSortDropdown = false;
  showOrderDropdown = false;

  showActions = false;



  currentSortKey: string = 'Create Date';
  currentOrder: 'Asc' | 'Desc' = 'Desc';

  mapSecureUrl!: SafeResourceUrl | null;
  showShareMenu = false;

  opportunitiesList: any[] = [];
  matchingOpportunities: any[] = [];
  matchingOpportunitiesCount: number = 0;
  showMatchingModal: boolean = false;

  private propertiesService = inject(PropertiesService);
  private opportunitiesService = inject(OpportunitiesService);
  private matcherService = inject(RequirementMatcherService);
  private cdr = inject(ChangeDetectorRef);
  private sanitizer = inject(DomSanitizer);

  ngOnInit() {
    this.loadOpportunities();
    this.loadProperties();
  }

  loadOpportunities() {
    this.opportunitiesService.getOpportunities({ limit: 500 }).subscribe({
      next: (res: any) => {
        const payload = res.data || res;
        this.opportunitiesList = payload.opportunities || [];
        if (this.selectedProperty) {
          this.calculateMatchingOpportunities();
        }
      },
      error: (err) => console.error('Failed to load opportunities for matching:', err)
    });
  }

  calculateMatchingOpportunities() {
    if (!this.selectedProperty) {
      this.matchingOpportunities = [];
      this.matchingOpportunitiesCount = 0;
      return;
    }
    this.matchingOpportunities = this.matcherService.matchPropertyWithOpportunities(this.selectedProperty, this.opportunitiesList);
    this.matchingOpportunitiesCount = this.matchingOpportunities.length;
    this.cdr.detectChanges();
  }

  openMatchingOpportunitiesModal() {
    this.showMatchingModal = true;
  }


  loadProperties() {
    const query = {
      sortBy: this.currentSortKey,
      orderBy: this.currentOrder,
      limit: 100
    };

    this.propertiesService.getMyProperties(query).subscribe({
      next: (res: any) => {
        const payload = res.data || res;

        this.propertiesListRaw = payload.properties || [];
        this.totalRecords = payload.total || this.propertiesListRaw.length;

        // Default me koi property select mat karo
        this.selectedProperty = null;

        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Failed to load my properties:', err);
      }
    });
  }

  toggleSortDropdown() {
    this.showSortDropdown = !this.showSortDropdown;
    if (this.showSortDropdown) this.showOrderDropdown = false;
  }

  toggleOrderDropdown() {
    this.showOrderDropdown = !this.showOrderDropdown;
    if (this.showOrderDropdown) this.showSortDropdown = false;
  }

  setSortBy(key: string) {
    this.currentSortKey = key;
    this.showSortDropdown = false;
    this.loadProperties();
  }

  setSortOrder(order: 'Asc' | 'Desc') {
    this.currentOrder = order;
    this.showOrderDropdown = false;
    this.loadProperties();
  }

  onSearch() {
    // Reactive searching via getter propertiesList
  }

  selectProperty(property: any): void {
    this.selectedProperty = this.mapPropertyProperties(property);
    this.updateMapSource(this.selectedProperty);
    this.calculateMatchingOpportunities();
    this.cdr.detectChanges();

    const id = property.id || property._id;
    this.propertiesService.getPropertyById(id).subscribe({
      next: (res: any) => {
        const payload = res.data || res;
        this.selectedProperty = this.mapPropertyProperties(payload);
        this.updateMapSource(this.selectedProperty);
        this.calculateMatchingOpportunities();
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Failed to load property details:', err);
      }
    });
  }
  updateMapSource(selectedProperty: any) {
    throw new Error('Method not implemented.');
  }

  clearSelection(): void {
    this.selectedProperty = null;
    this.mapSecureUrl = null;
  }
 

  get propertyIds(): string[] {
    return this.propertiesList.map(p => p.id).filter(id => !!id);
  }

  get contactIds(): string[] {
    const ids = this.propertiesList
      .map(p => p.ownerLandlord?.id || p.ownerLandlord?._id || (typeof p.ownerLandlord === 'string' ? p.ownerLandlord : null))
      .filter(id => !!id && /^[0-9a-fA-F]{24}$/.test(id));
    return Array.from(new Set(ids));
  }

  get propertiesList() {
    let list = this.propertiesListRaw.map(p => this.mapPropertyProperties(p));
    if (this.searchQuery) {
      const q = this.searchQuery.toLowerCase();
      list = list.filter(item =>
        (item.title && item.title.toLowerCase().includes(q)) ||
        (item.ownerName && item.ownerName.toLowerCase().includes(q)) ||
        (item.location && item.location.toLowerCase().includes(q)) ||
        (item.description && item.description.toLowerCase().includes(q)) ||
        (item.id && item.id.toLowerCase() === q)
      );
    }
    return list;
  }

  getMediaUrl(item: any): string {
    if (!item) return '';
    let rawUrl = '';
    if (typeof item === 'string') {
      rawUrl = item;
    } else if (typeof item === 'object') {
      rawUrl = item.url || item.data || item.src || item.path || item.link || '';
    }
    if (!rawUrl) return '';
    if (rawUrl.startsWith('data:') || rawUrl.startsWith('http://') || rawUrl.startsWith('https:') || rawUrl.startsWith('blob:')) {
      return rawUrl;
    }
    const backendHost = (environment.apiUrl || 'http://localhost:3000').replace(/\/api\/v1\/?$/, '').replace(/\/+$/, '');
    const cleanPath = rawUrl.startsWith('/') ? rawUrl : `/${rawUrl}`;
    return `${backendHost}${cleanPath}`;
  }

  private mapPropertyProperties(p: any): any {
    if (!p) return null;

    const user = p.assignedTo || {};
    const owner = p.ownerLandlord || {};
    const ownerName = owner.firstName
      ? `${owner.firstName} ${owner.lastName || ''}`.trim()
      : (typeof p.ownerLandlord === 'string' ? p.ownerLandlord : 'Unknown');

    const getBackendHostUrl = (): string => {
      const url = environment.apiUrl || 'http://localhost:3000';
      return url.replace(/\/api\/v1\/?$/, '').replace(/\/+$/, '');
    };

    const getMediaUrl = (item: any): string => {
      if (!item) return '';
      let rawUrl = '';
      if (typeof item === 'string') {
        rawUrl = item;
      } else if (typeof item === 'object') {
        rawUrl = item.url || item.data || item.src || item.path || item.link || '';
      }
      if (!rawUrl) return '';
      if (rawUrl.startsWith('data:') || rawUrl.startsWith('http://') || rawUrl.startsWith('https://') || rawUrl.startsWith('blob:')) {
        return rawUrl;
      }
      const cleanPath = rawUrl.startsWith('/') ? rawUrl : `/${rawUrl}`;
      return `${getBackendHostUrl()}${cleanPath}`;
    };

    const propId = p.id || p._id;
    let photosList: any[] = [];
    let rawPhotos = p.images || p.photos || [];
    let rawPhotosSources: any[] = [];
    const extractPhotos = (source: any) => {
      if (!source) return;
      if (typeof source === 'string') {
        const trimmed = source.trim();
        if (trimmed.startsWith('[')) {
          try {
            const parsed = JSON.parse(trimmed);
            if (Array.isArray(parsed)) rawPhotosSources.push(...parsed);
            return;
          } catch(e) {}
        }
        if (trimmed) {
          rawPhotosSources.push(...trimmed.split(',').map((s: string) => s.trim()).filter(Boolean));
        }
      } else if (Array.isArray(source)) {
        rawPhotosSources.push(...source);
      } else if (typeof source === 'object') {
        rawPhotosSources.push(source);
      }
    };

    extractPhotos(p.images);
    if (rawPhotosSources.length === 0) {
      extractPhotos(p.photos);
    }

    const seenPhotoKeys = new Set<string>();
    const addPhotoToOutput = (img: any) => {
      const url = getMediaUrl(img);
      if (!url) return;
      const key = url.length > 200 ? url.substring(0, 100) + url.substring(url.length - 100) : url;
      if (!seenPhotoKeys.has(key)) {
        seenPhotoKeys.add(key);
        photosList.push({
          url: url,
          name: typeof img === 'object' ? (img.name || 'Photo') : 'Photo',
          size: typeof img === 'object' ? (img.size || '') : '',
          isCover: typeof img === 'object' ? !!img.isCover : false
        });
      }
    };

    if (rawPhotosSources.length > 0) {
      rawPhotosSources.forEach(addPhotoToOutput);
    }

    if (photosList.length === 0 && propId) {
      const localPhotos = localStorage.getItem(`property_photos_${propId}`);
      if (localPhotos) {
        try {
          const parsed = JSON.parse(localPhotos);
          if (Array.isArray(parsed)) {
            parsed.forEach(addPhotoToOutput);
          }
        } catch(e) {}
      }
    }
    if (photosList.length > 0 && !photosList.some(p => p.isCover)) {
      photosList[0].isCover = true;
    }

    const getDedupeKey = (urlStr: string) => {
      if (!urlStr) return '';
      const u = urlStr.trim();
      return u.length > 300 ? u.length + '_' + u.substring(0, 150) + '_' + u.substring(u.length - 150) : u;
    };

    let videosList: any[] = [];
    let rawVideosSources: any[] = [];
    const extractVideos = (source: any) => {
      if (!source) return;
      if (typeof source === 'string') {
        const trimmed = source.trim();
        if (trimmed.startsWith('[')) {
          try {
            const parsed = JSON.parse(trimmed);
            if (Array.isArray(parsed)) rawVideosSources.push(...parsed);
            return;
          } catch(e) {}
        }
        if (trimmed) {
          rawVideosSources.push(...trimmed.split(',').map((s: string) => s.trim()).filter(Boolean));
        }
      } else if (Array.isArray(source)) {
        rawVideosSources.push(...source);
      } else if (typeof source === 'object') {
        rawVideosSources.push(source);
      }
    };
    extractVideos(p.videos);
    if (p.videoUrl) {
      if (typeof p.videoUrl === 'string' && (p.videoUrl.includes('youtube') || p.videoUrl.includes('vimeo'))) {
        // stream URL handled below
      } else {
        extractVideos(p.videoUrl);
      }
    }

    const seenVidKeys = new Set<string>();
    const addVideoToOutput = (vid: any) => {
      const url = getMediaUrl(vid);
      if (!url) return;
      const key = getDedupeKey(url);
      if (!seenVidKeys.has(key)) {
        seenVidKeys.add(key);
        videosList.push({
          url: url,
          name: typeof vid === 'object' ? (vid.name || 'Video') : 'Video',
          size: typeof vid === 'object' ? (vid.size || '') : ''
        });
      }
    };

    if (rawVideosSources.length > 0) {
      rawVideosSources.forEach(addVideoToOutput);
    }

    if (videosList.length === 0 && propId) {
      const localVideos = localStorage.getItem(`property_videos_${propId}`);
      if (localVideos) {
        try {
          const parsed = JSON.parse(localVideos);
          if (Array.isArray(parsed)) {
            parsed.forEach(addVideoToOutput);
          }
        } catch(e) {}
      }
    }

    let cleanVideoUrl = '';
    if (p.videoUrl && typeof p.videoUrl === 'string') {
      const formatted = getMediaUrl(p.videoUrl);
      if (formatted.includes('youtube') || formatted.includes('vimeo')) {
        cleanVideoUrl = formatted;
      } else if (videosList.length > 0) {
        cleanVideoUrl = videosList[0].url;
      }
    } else if (videosList.length > 0) {
      cleanVideoUrl = videosList[0].url;
    }

    const rawKw = [p.keyword, p.websiteKeyword].filter(Boolean).join(', ');
    const keywordsArray = rawKw ? rawKw.split(',').map((k: string) => k.trim()).filter(Boolean) : [];
    const uniqueKeywordsArray = Array.from(new Set(keywordsArray));

    return {
      ...p,

      id: propId,
      ownerMobile: owner.mobile || '',
      ownerEmail: owner.email || '',

      title: p.name || p.buildingTowerProject,

      ownerName: ownerName,

      location: p.address,

      propertyType: p.propertyType,
      forType: p.forType,
      transaction: p.transaction,
      ownership: p.ownership,

      bedroom: p.bedroom,
      furnishing: p.furnishing,

      description: p.description,
      remark: p.remark,

      city: p.city,
      locality: p.locality,
      landmark: p.landmark,
      pincode: p.pinCode,

      developerName: p.developerName,
      buildingProject: p.projectBuilding,

      area: p.area,
      areaUnit: p.areaUnit,

      builtUpArea: p.builtUpArea,
      carpetArea: p.carpetArea,
      terraceArea: p.terraceArea,
      plotArea: p.plotArea,

      expectedPrice: p.expectedPrice,
      price: p.expectedPrice,

      rate: p.rate,
      maintenance: p.maintenanceCharges,
      securityDeposit: p.securityDeposit,

      ageOfProperty: p.ageOfProperty,
      possession: p.possessionStatus,

      totalFloor: p.totalFloor,
      propertyOnFloor: p.propertyOnFloor,

      flooring: p.flooring,

      parking: p.noOfParking,
      lift: p.noOfLift,

      facing: p.facing,

      amenities: p.amenities || [],
      suitableFor: p.suitableFor || [],
      uniqueFeatures: p.uniqueFeatures || [],

      sourceType: p.sourceType,
      statusTag: p.statusTag,
      siteManager: p.siteManager || '',
      siteManagerContact: p.siteManagerContact || '',
      sourcingManager: p.sourcingManager || '',
      sourcingManagerContact: p.sourcingManagerContact || '',
      closingManager: p.closingManager || '',
      closingManagerContact: p.closingManagerContact || '',

      assignedTo: user.firstName
        ? `${user.firstName} ${user.lastName}`
        : 'Administrator',

      publishStatus: p.status,

      createdDate: p.createdAt,
      photos: photosList,
      videos: videosList,
      videoUrl: cleanVideoUrl,
      keywordsList: uniqueKeywordsArray
    };
  }

  selectedDetailMediaModal: { url: string; type: 'image' | 'video'; name?: string } | null = null;
  detailMediaList: Array<{ url: string; type: 'image' | 'video'; name: string }> = [];
  detailMediaIndex: number = 0;

  openDetailMediaModal(url: string, type: 'image' | 'video', name?: string) {
    this.detailMediaList = [];
    const seen = new Set<string>();

    const getDedupeKey = (urlStr: string) => {
      if (!urlStr) return '';
      const u = urlStr.trim();
      return u.length > 300 ? u.length + '_' + u.substring(0, 150) + '_' + u.substring(u.length - 150) : u;
    };

    const addMedia = (itemUrl: string, itemType: 'image' | 'video', itemName?: string) => {
      if (!itemUrl) return;
      const key = getDedupeKey(itemUrl);
      if (!seen.has(key)) {
        seen.add(key);
        this.detailMediaList.push({
          url: itemUrl,
          type: itemType,
          name: itemName || (itemType === 'image' ? 'Property Photo' : 'Property Video')
        });
      }
    };

    if (this.selectedProperty) {
      const p = this.selectedProperty;
      if (Array.isArray(p.photos)) {
        p.photos.forEach((ph: any) => addMedia(ph.url || ph.data || (typeof ph === 'string' ? ph : ''), 'image', ph.name));
      }
      if (Array.isArray(p.images)) {
        p.images.forEach((img: any) => addMedia(img.url || img.data || (typeof img === 'string' ? img : ''), 'image', img.name));
      }
      if (Array.isArray(p.videos)) {
        p.videos.forEach((vid: any) => addMedia(vid.url || vid.data || (typeof vid === 'string' ? vid : ''), 'video', vid.name));
      }
      if (p.videoUrl) {
        addMedia(p.videoUrl, 'video', 'Walkthrough Video');
      }
    }

    if (url) {
      addMedia(url, type, name);
    }

    const foundIdx = this.detailMediaList.findIndex(m => m.url === url);
    this.detailMediaIndex = foundIdx >= 0 ? foundIdx : 0;
    this.selectedDetailMediaModal = this.detailMediaList[this.detailMediaIndex] || (url ? { url, type, name: name || 'Media View' } : null);
  }

  prevDetailMedia(event?: Event) {
    if (event) event.stopPropagation();
    if (this.detailMediaList.length <= 1) return;
    this.detailMediaIndex = (this.detailMediaIndex - 1 + this.detailMediaList.length) % this.detailMediaList.length;
    this.selectedDetailMediaModal = this.detailMediaList[this.detailMediaIndex];
  }

  nextDetailMedia(event?: Event) {
    if (event) event.stopPropagation();
    if (this.detailMediaList.length <= 1) return;
    this.detailMediaIndex = (this.detailMediaIndex + 1) % this.detailMediaList.length;
    this.selectedDetailMediaModal = this.detailMediaList[this.detailMediaIndex];
  }

  selectDetailMediaIndex(idx: number, event?: Event) {
    if (event) event.stopPropagation();
    if (idx >= 0 && idx < this.detailMediaList.length) {
      this.detailMediaIndex = idx;
      this.selectedDetailMediaModal = this.detailMediaList[idx];
    }
  }

  closeDetailMediaModal() {
    this.selectedDetailMediaModal = null;
    this.detailMediaList = [];
    this.detailMediaIndex = 0;
  }

  @HostListener('window:keydown', ['$event'])
  handleKeyboardEvent(event: KeyboardEvent) {
    if (!this.selectedDetailMediaModal) return;
    if (event.key === 'ArrowLeft') {
      this.prevDetailMedia();
    } else if (event.key === 'ArrowRight') {
      this.nextDetailMedia();
    } else if (event.key === 'Escape') {
      this.closeDetailMediaModal();
    }
  }

  toggleActionMenu() {
    this.showActions = !this.showActions;
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {

    const target = event.target as HTMLElement;

    if (!target.closest('.action-dropdown')) {
      this.showActions = false;
    }

  }
  
  showCreateAudience = false;

  openCreateAudience() {
    this.showSendSms = false;
    this.showSendEmail = false;
    this.groupDeleteAction = false;
    this.downloadAction = false;
    // this.showCreateFolder = false;
    // this.showGroupTransfer = false;
    this.showImportProperty = false;

    this.showCreateAudience = true;
  }

  hideCreateAudience() {
    this.showCreateAudience = false;
  }

  showSendSms = false;
  openSendSms() {
    this.showCreateAudience = false;
    this.groupDeleteAction = false;
    this.downloadAction = false;
    // this.showCreateFolder = false;
    // this.showGroupTransfer = false;
    this.showImportProperty = false;
    this.showSendEmail = false;

    this.showSendSms = true;
  }

  hideSendSms() {
    this.showSendSms = false;
  }

  showSendEmail = false;

  openSendEmail() {
    this.showCreateAudience = false;
    this.showSendSms = false;
    this.groupDeleteAction = false;
    this.downloadAction = false;
    // this.showCreateFolder = false;
    // this.showGroupTransfer = false;
    this.showImportProperty = false;

    this.showSendEmail = true;
  }

  hideSendEmail() {

    this.showSendEmail = false;
  }

  groupDeleteAction = false;

  openGroupDelete() {
    this.showCreateAudience = false;
    this.showSendSms = false;
    this.showSendEmail = false;
    this.downloadAction = false;
    // this.showCreateFolder = false;
    // this.showGroupTransfer = false;
    this.showImportProperty = false;

    this.groupDeleteAction = true;
  }

  hideGroupDelete() {
    this.groupDeleteAction = false;
  }

  downloadAction = false;
  openDownload() {

    this.showCreateAudience = false;
    this.showSendSms = false;
    this.showSendEmail = false;
    this.groupDeleteAction = false;
    // this.showCreateFolder = false;

    this.downloadAction = true;
  }

  hideDownload() {
    this.downloadAction = false;
  }

  showImportProperty = false;

  openImportProperty() {

    this.showCreateAudience = false;
    this.showSendSms = false;
    this.showSendEmail = false;
    this.groupDeleteAction = false;
    this.downloadAction = false;
    // this.showCreateFolder = false;
    // this.showGroupTransfer = false;

    this.showImportProperty = true;
  }

  hideImportProperty() {
    this.showImportProperty = false;
  }

showChangeStatus = false;
showSendSmsopp = false;
showSendEmailopp = false;
showQuickNote = false;
showHistory = false;
showShortlistedProperties = false;
showShortlistedProjects = false;
showSiteVisit = false;
showAttachDocument = false;
showDelete = false;
showTerms = false;
showPublish = false;
showProposal = false;

private closeAllProfileActions() {
  this.showChangeStatus = false;
  this.showSendSmsopp = false;
  this.showSendEmailopp = false;
  this.showQuickNote = false;
  this.showHistory = false;
  this.showShortlistedProperties = false;
  this.showShortlistedProjects = false;
  this.showSiteVisit = false;
  this.showAttachDocument = false;
  this.showDelete = false;
  this.showTerms = false;
  this.showPublish = false;
  this.showProposal = false
}

  encodeQuery(val: string): string {
    return encodeURIComponent(val || '');
  }

 toggleShareMenu(event: Event) {
    event.stopPropagation();
    this.showShareMenu = !this.showShareMenu;
  }

  scrollToMap() {
    const mapElement = document.querySelector('.google-map-embed-row');
    if (mapElement) {
      mapElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }
  openChangeStatus() {
    this.closeAllProfileActions();
    this.showChangeStatus = true;
  }

  openSendSmsopp() {
    this.closeAllProfileActions();
    this.showSendSmsopp = true;
  }

  openSendEmailopp() {
    this.closeAllProfileActions();
    this.showSendEmailopp = true;
  }

  openQuickNote() {
    this.closeAllProfileActions();
    this.showQuickNote = true;
  }

  openHistory() {
    this.closeAllProfileActions();
    this.showHistory = true;
  }

  openShortlistedProperties() {
    this.closeAllProfileActions();
    this.showShortlistedProperties = true;
  }

  openShortlistedProjects() {
    this.closeAllProfileActions();
    this.showShortlistedProjects = true;
  }

  openSiteVisit() {
    this.closeAllProfileActions();
    this.showSiteVisit = true;
  }

  openAttachDocument() {
    this.closeAllProfileActions();
    this.showAttachDocument = true;
  }

  openDelete() {
    this.closeAllProfileActions();
    this.showDelete = true;
  }

openTerms() {
  this.closeAllProfileActions();
  this.showTerms = true;
}
openPublish() {
  this.closeAllProfileActions();
  this.showPublish = true;
}

openProposal() {
  this.closeAllProfileActions();
  this.showProposal = true;
}



  initiateIvrCall(project: any) {
    const mobile = project?.contactId?.mobile;
    if (mobile) {
      alert(`Initiating IVR Call to: ${mobile}`);
    } else {
      alert('IVR Call failed: Owner mobile number is not available.');
    }
  }


  generatePropertyShareDetails(property: any): string {
    if (!property) return '';

    const title = property.title || property.name || property.buildingProject || 'Property Details';
    const propType = property.propertyType || '';
    const forType = property.forType || '';
    const transaction = property.transaction || '';
    const price = property.expectedPrice || property.price || property.rentPerMonth || '';
    const bedroom = property.bedroom || '';
    const furnishing = property.furnishing || '';
    const area = property.area || '';
    const areaUnit = property.areaUnit || 'Sq-Ft';
    const city = property.city || '';
    const locality = property.locality || '';
    const address = property.address || '';
    const landmark = property.landmark || '';
    const facing = property.facing || '';
    const floor = (property.propertyOnFloor || property.totalFloor)
      ? `${property.propertyOnFloor || ''}${property.totalFloor ? ' of ' + property.totalFloor : ''}`
      : '';

    let mediaImageText = '';
    if (Array.isArray(property.photos) && property.photos.length > 0) {
      const cover = property.photos.find((p: any) => p.isCover) || property.photos[0];
      if (cover && cover.url) {
        mediaImageText = cover.url;
      }
    } else if (property.images && Array.isArray(property.images) && property.images.length > 0) {
      const cover = property.images[0];
      mediaImageText = typeof cover === 'string' ? cover : (cover.url || cover.data || '');
    }

    let mediaVideoText = '';
    if (property.videoUrl) {
      mediaVideoText = property.videoUrl;
    } else if (Array.isArray(property.videos) && property.videos.length > 0) {
      const firstVid = property.videos[0];
      if (firstVid && firstVid.url) {
        mediaVideoText = firstVid.url;
      }
    }

    const amenities = Array.isArray(property.amenities) ? property.amenities.join(', ') : (property.amenities || '');
    const uniqueFeatures = Array.isArray(property.uniqueFeatures) ? property.uniqueFeatures.join(', ') : (property.uniqueFeatures || '');
    const description = property.description || property.remark || '';

    const lines: string[] = [];
    lines.push(`🏠 *${title.toUpperCase()}*`);
    lines.push(``);

    if (propType || forType || transaction) {
      const specs = [propType, forType, transaction].filter(Boolean).join(' • ');
      lines.push(`📋 *Type:* ${specs}`);
    }

    if (price && price !== '—') {
      lines.push(`💰 *Price:* ${price}`);
    }

    if (bedroom || furnishing) {
      const bedFurn = [bedroom, furnishing].filter(Boolean).join(' | ');
      lines.push(`🛏 *Configuration:* ${bedFurn}`);
    }

    if (area) {
      lines.push(`📐 *Area:* ${area} ${areaUnit}`);
    }

    if (locality || city || address) {
      const locStr = [locality, city, landmark].filter(Boolean).join(', ');
      lines.push(`📍 *Location:* ${locStr}`);
      if (address && address !== locStr && address !== '—') {
        lines.push(`🗺 *Address:* ${address}`);
      }
    }

    if (facing || floor) {
      const flFc = [facing ? `Facing: ${facing}` : '', floor ? `Floor: ${floor}` : ''].filter(Boolean).join(' | ');
      lines.push(`🧭 *Details:* ${flFc}`);
    }

    if (uniqueFeatures) {
      lines.push(`⭐ *Key Highlights:* ${uniqueFeatures}`);
    }

    if (amenities) {
      lines.push(`✨ *Amenities:* ${amenities}`);
    }

    if (description) {
      lines.push(``);
      lines.push(`📝 *Description:*`);
      lines.push(description.length > 300 ? description.substring(0, 300) + '...' : description);
    }


    return lines.join('\n');
  }

  async shareProperty(property: any, directToOwner: boolean = false) {
    if (!property) return;
    this.showShareMenu = false;
    const text = this.generatePropertyShareDetails(property);

    const rawPhotos: any[] = [];
    const rawVideos: any[] = [];
    const seenUrls = new Set<string>();

    const getDedupeKey = (urlStr: string) => {
      if (!urlStr) return '';
      const u = urlStr.trim();
      return u.length > 300 ? u.length + '_' + u.substring(0, 150) + '_' + u.substring(u.length - 150) : u;
    };

    const collectItem = (item: any, target: any[]) => {
      if (!item) return;
      let urlStr = '';
      if (typeof item === 'string') urlStr = item;
      else if (typeof item === 'object') urlStr = item.url || item.data || item.src || item.path || '';
      urlStr = this.getMediaUrl(urlStr || item);
      if (!urlStr) return;
      const key = getDedupeKey(urlStr);
      if (!seenUrls.has(key)) {
        seenUrls.add(key);
        target.push(item);
      }
    };

    if (Array.isArray(property.photos)) property.photos.forEach((p: any) => collectItem(p, rawPhotos));
    if (Array.isArray(property.images)) property.images.forEach((p: any) => collectItem(p, rawPhotos));
    if (Array.isArray(property.videos)) property.videos.forEach((v: any) => collectItem(v, rawVideos));
    if (property.videoUrl) {
      collectItem(property.videoUrl, rawVideos);
    }

    const fileFromItem = async (item: any, defaultType: 'image' | 'video', index: number): Promise<File | null> => {
      try {
        let urlStr = '';
        let name = `${defaultType}_${index + 1}`;
        if (typeof item === 'string') {
          urlStr = item;
        } else if (item && typeof item === 'object') {
          urlStr = item.url || item.data || item.src || item.path || '';
          if (item.name) name = item.name;
        }
        urlStr = this.getMediaUrl(urlStr || item);
        if (!urlStr) return null;

        if (urlStr.startsWith('data:')) {
          const parts = urlStr.split(',');
          const mimeMatch = parts[0].match(/:(.*?);/);
          const mime = mimeMatch ? mimeMatch[1] : (defaultType === 'image' ? 'image/png' : 'video/mp4');
          const bstr = atob(parts[1]);
          let n = bstr.length;
          const u8arr = new Uint8Array(n);
          while (n--) {
            u8arr[n] = bstr.charCodeAt(n);
          }
          const ext = mime.split('/')[1]?.split('+')[0] || (defaultType === 'image' ? 'png' : 'mp4');
          return new File([u8arr], `${name}.${ext}`, { type: mime });
        } else {
          const res = await fetch(urlStr);
          const blob = await res.blob();
          const mime = blob.type || (defaultType === 'image' ? 'image/png' : 'video/mp4');
          const ext = mime.split('/')[1]?.split('+')[0] || (defaultType === 'image' ? 'png' : 'mp4');
          return new File([blob], `${name}.${ext}`, { type: mime });
        }
      } catch (e) {
        return null;
      }
    };

    let files: File[] = [];
    try {
      const photoPromises = rawPhotos.map((p, i) => fileFromItem(p, 'image', i));
      const videoPromises = rawVideos.map((v, i) => fileFromItem(v, 'video', i));
      const fetchedFiles = await Promise.all([...photoPromises, ...videoPromises]);
      files = fetchedFiles.filter((f): f is File => f !== null);
    } catch (e) {
      console.warn('Error fetching media files for share:', e);
    }

    if (navigator.share) {
      try {
        const shareData: ShareData = {
          title: property.buildingTowerProject || property.title || 'Property Details',
          text: text
        };

        if (files.length > 0) {
          if (navigator.canShare && navigator.canShare({ files })) {
            shareData.files = files;
          } else {
            const imageFiles = files.filter(f => f.type.startsWith('image/'));
            if (imageFiles.length > 0 && navigator.canShare && navigator.canShare({ files: imageFiles })) {
              shareData.files = imageFiles;
            }
          }
        }

        await navigator.share(shareData);
        return;
      } catch (e) {
        console.warn('Native navigator.share failed or cancelled:', e);
      }
    }

    let targetUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
    if (directToOwner && property.ownerMobile) {
      const cleanMobile = String(property.ownerMobile).replace(/[^0-9]/g, '');
      if (cleanMobile) {
        targetUrl = `https://api.whatsapp.com/send?phone=${cleanMobile}&text=${encodeURIComponent(text)}`;
      }
    }
    window.open(targetUrl, '_blank');
  }

  shareOnWhatsApp(property: any, directToOwner: boolean = false) {
    return this.shareProperty(property, directToOwner);
  }

  shareOnLinkedIn(property: any) {
    if (!property) return;
    const text = this.generatePropertyShareDetails(property);
    const postUrl = `https://www.linkedin.com/feed/?shareActive=true&text=${encodeURIComponent(text)}`;
    window.open(postUrl, '_blank');
    this.showShareMenu = false;
  }

  shareOnTwitter(property: any) {
    if (!property) return;
    const text = this.generatePropertyShareDetails(property);
    const url = window.location.href;
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`, '_blank');
    this.showShareMenu = false;
  }
}