import { Component, OnInit, ViewEncapsulation, inject, ChangeDetectorRef, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { PropertiesService } from '../properties.service';
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


@Component({
  selector: 'app-backlog-property',
  standalone: true,
      imports: [CommonModule, RouterModule, FormsModule,CreateAudience,
    PropertySendGroupSmsAction, PropertySendGroupEmailAction,PropertyGroupDeleteAction,
    PropertyDownlaodAction,PropertyImportAction,PropertyChangeStatus,PropertySendSms,
    PropertySendEmail,PropertyQuickNote,PropertyHistory,PropertyShortlistedProperties,
    PropertyShortlistedProjects,PropertySiteVisit,PropertyAttachDocument,PropertyDelete,
    PropertyTermsCondition,PropertyPublish,PropertySendProposal
  ],
  templateUrl: './backlog-property.html',
  styleUrl: './backlog-property.css',
  encapsulation: ViewEncapsulation.None
})
export class BacklogProperty implements OnInit {
  searchQuery: string = '';
  selectedProperty: any | null = null;
  propertiesListRaw: any[] = [];
  totalRecords: number = 0;

  showSortDropdown = false;
  showOrderDropdown = false;

  currentSortKey: string = 'Create Date';
  currentOrder: 'Asc' | 'Desc' = 'Desc';

  mapSecureUrl!: SafeResourceUrl | null;
  showShareMenu = false;

  private propertiesService = inject(PropertiesService);
  private cdr = inject(ChangeDetectorRef);
  private sanitizer = inject(DomSanitizer);

  ngOnInit() {
    this.loadProperties();
  }

  loadProperties() {
    const query = {
      sortBy: this.currentSortKey,
      orderBy: this.currentOrder,
      limit: 100
    };

    this.propertiesService.getProperties(query).subscribe({
      next: (res: any) => {
        const payload = res.data || res;
        this.propertiesListRaw = payload.properties || [];
        this.totalRecords = payload.total || this.propertiesListRaw.length;
        if (this.propertiesListRaw.length > 0) {
          if (!this.selectedProperty || !this.propertiesListRaw.some(p => (p.id || p._id) === (this.selectedProperty?.id || this.selectedProperty?._id))) {
            this.selectProperty(this.propertiesListRaw[0]);
          }
        } else {
          this.selectedProperty = null;
        }
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Failed to load backlog properties:', err);
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
    // Reactive client search via getter
  }

  selectProperty(property: any): void {
    this.selectedProperty = this.mapPropertyProperties(property);
    this.updateMapSource(this.selectedProperty);
    this.cdr.detectChanges();

    const id = property.id || property._id;
    this.propertiesService.getPropertyById(id).subscribe({
      next: (res: any) => {
        const payload = res.data || res;
        this.selectedProperty = this.mapPropertyProperties(payload);
        this.updateMapSource(this.selectedProperty);
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Failed to load property details:', err);
      }
    });
  }

  clearSelection(): void {
    this.selectedProperty = null;
    this.mapSecureUrl = null;
  }

  // @HostListener('document:click', ['$event'])
  // onDocumentClick(event: Event) {
  //   this.showShareMenu = false;
  // }

  toggleShareMenu(event: Event) {
    event.stopPropagation();
    this.showShareMenu = !this.showShareMenu;
  }

  encodeQuery(val: string): string {
    return encodeURIComponent(val || '');
  }

  scrollToMap() {
    const mapElement = document.querySelector('.google-map-embed-row');
    if (mapElement) {
      mapElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }

  initiateIvrCall(property: any) {
    const mobile = property?.ownerMobile;
    if (mobile) {
      alert(`Initiating IVR Call to: ${mobile}`);
    } else {
      alert('IVR Call failed: Owner mobile number is not available.');
    }
  }

  shareOnWhatsApp(property: any) {
    const text = `Check out this property: ${property.title} located at ${property.locality || ''}, ${property.city || ''}. Price: ${property.price}. Link: ${window.location.href}`;
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, '_blank');
    this.showShareMenu = false;
  }

  shareOnLinkedIn(property: any) {
    const url = window.location.href;
    window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`, '_blank');
    this.showShareMenu = false;
  }

  shareOnTwitter(property: any) {
    const text = `Check out this property: ${property.title} located at ${property.locality || ''}, ${property.city || ''}. Price: ${property.price}.`;
    const url = window.location.href;
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`, '_blank');
    this.showShareMenu = false;
  }

  updateMapSource(property: any) {
    let coordinates = ''; 
    if (property && property.latitude && property.longitude) {
      coordinates = `${property.latitude},${property.longitude}`;
    } else if (property && property.location) {
      coordinates = property.location;
    } else if (property && property.address) {
      coordinates = property.address;
    }
 
    if (coordinates) {
      const embedUrl = `https://maps.google.com/maps?q=${encodeURIComponent(coordinates)}&t=&z=15&ie=UTF8&iwloc=&output=embed`;
      this.mapSecureUrl = this.sanitizer.bypassSecurityTrustResourceUrl(embedUrl);
    } else {
      this.mapSecureUrl = null;
    }
  }

  get propertiesList() {
    const todayStr = new Date().toISOString().split('T')[0];
    let list = this.propertiesListRaw.map(p => this.mapPropertyProperties(p));

    // Overdue properties are those with scheduled followup date (requestDate) in the past
    list = list.filter(item => item.requestDate && item.requestDate < todayStr);

    if (this.searchQuery) {
      const q = this.searchQuery.toLowerCase();
      list = list.filter(item =>
        (item.title && item.title.toLowerCase().includes(q)) ||
        (item.ownerName && item.ownerName.toLowerCase().includes(q)) ||
        (item.location && item.location.toLowerCase().includes(q)) ||
        (item.description && item.description.toLowerCase().includes(q))
      );
    }
    return list;
  }

  private mapPropertyProperties(p: any): any {
    if (!p) return null;

    const user = p.assignedTo || {};
    const owner = p.ownerLandlord || {};
    const ownerName = owner.firstName
      ? `${owner.firstName} ${owner.lastName || ''}`.trim()
      : (typeof p.ownerLandlord === 'string' ? p.ownerLandlord : 'Unknown');

    const formattedDate = p.createdAt 
      ? new Date(p.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) 
      : '—';

    const formattedPrice = p.expectedPrice 
      ? `₹${(p.expectedPrice / 10000000).toFixed(2)} Cr` 
      : (p.price || '—');

    return {
      ...p,
      id: p.id || p._id,
      title: p.name || p.buildingTowerProject || 'Unnamed Property',
      ownerName: ownerName,
      ownerMobile: owner.mobile || '',
      ownerEmail: owner.email || '',
      location: p.address || p.location || '—',
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
      area: p.area || (p.sqft ? `${p.sqft} sqft` : ''),
      areaUnit: p.areaUnit,
      builtUpArea: p.builtUpArea,
      carpetArea: p.carpetArea,
      terraceArea: p.terraceArea,
      plotArea: p.plotArea,
      expectedPrice: p.expectedPrice,
      price: formattedPrice,
      rate: p.rate,
      maintenance: p.maintenanceCharges,
      securityDeposit: p.securityDeposit,
      ageOfProperty: p.ageOfProperty || '—',
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
      sourceType: p.sourceType || p.source || 'Direct',
      statusTag: p.statusTag || p.status || 'Available',
      siteManager: p.siteManager || '',
      siteManagerContact: p.siteManagerContact || '',
      sourcingManager: p.sourcingManager || '',
      sourcingManagerContact: p.sourcingManagerContact || '',
      closingManager: p.closingManager || '',
      closingManagerContact: p.closingManagerContact || '',
      assignedTo: user.firstName
        ? `${user.firstName} ${user.lastName || ''}`.trim()
        : 'Administrator',
      publishStatus: p.status || 'Available',
      createdDate: formattedDate,
      floor: p.propertyOnFloor ? `${p.propertyOnFloor} Floor` : '',
      buildingName: p.buildingTowerProject || ''
    };
  }
showActions = false;
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


}