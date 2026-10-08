import { Component, OnInit, ViewEncapsulation, inject, ChangeDetectorRef, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
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
import { formatAreaWithHectare } from '../../../services/area-converter.util';

@Component({
  selector: 'app-available-properties',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, CreateAudience,
    PropertySendGroupSmsAction, PropertySendGroupEmailAction, PropertyGroupDeleteAction,
    PropertyDownlaodAction, PropertyImportAction, PropertyChangeStatus, PropertySendSms,
    PropertySendEmail, PropertyQuickNote, PropertyHistory, PropertyShortlistedProperties,
    PropertyShortlistedProjects, PropertySiteVisit, PropertyAttachDocument, PropertyDelete,
    PropertyTermsCondition, PropertyPublish, PropertySendProposal, MatchingOpportunitiesModalComponent
  ],
  templateUrl: './available-property.html',
  styleUrl: './available-property.css',
  encapsulation: ViewEncapsulation.None
})
export class AvailableProperty implements OnInit {
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
  private route = inject(ActivatedRoute);

  ngOnInit() {
    this.loadOpportunities();
    this.route.queryParams.subscribe(params => {
      if (params['search']) {
        this.searchQuery = params['search'];
      }
    });
    this.loadProperties();
  }

  // =====================================================================
  // OPPORTUNITY MATCHING
  // =====================================================================
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

  // =====================================================================
  // LOAD / SORT / SELECT
  // =====================================================================
  loadProperties() {
    const query: any = {
      sortBy: this.currentSortKey,
      orderBy: this.currentOrder,
      limit: 100
    };

    this.propertiesService.getAvailableProperties(query).subscribe({
      next: (res: any) => {
        const payload = res.data || res;
        this.propertiesListRaw = payload.properties || [];
        this.totalRecords = payload.total || this.propertiesListRaw.length;

        // Do not auto-select any property by default
        this.selectedProperty = null;

        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Failed to load properties:', err);
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
    // Reactive client-side search via getter propertiesList
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

  clearSelection(): void {
    this.selectedProperty = null;
    this.mapSecureUrl = null;

  }


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

  openOwnerWhatsApp(property: any) {
    if (!property) return;
    const rawMobile = property.ownerMobile || property.ownerLandlord?.mobile || '';
    if (!rawMobile) {
      alert('Owner mobile number is not available.');
      return;
    }
    let cleanMobile = String(rawMobile).replace(/[^0-9]/g, '');
    if (!cleanMobile) {
      alert('Invalid owner mobile number.');
      return;
    }
    if (cleanMobile.length === 10) {
      cleanMobile = '91' + cleanMobile;
    }
    window.open(`https://api.whatsapp.com/send?phone=${cleanMobile}`, '_blank');
  }

  openGoogleMaps(property: any) {
    if (!property) return;

    const lat = property.latitude ?? property.lat;
    const lng = property.longitude ?? property.lng ?? property.long;

    if (lat !== undefined && lat !== null && lng !== undefined && lng !== null &&
        String(lat).trim() !== '' && String(lng).trim() !== '' &&
        !isNaN(Number(lat)) && !isNaN(Number(lng))) {
      window.open(`https://www.google.com/maps/search/?api=1&query=${lat},${lng}`, '_blank');
      return;
    }

    const parts = [
      property.address,
      property.landmark,
      property.locality,
      property.taluka,
      property.city,
      property.state,
      property.pincode || property.pinCode
    ].filter(p => p && typeof p === 'string' && p.trim().length > 0 && p.trim() !== '—');

    let query = '';
    if (parts.length > 0) {
      query = parts.join(', ');
    } else if (property.location && property.location !== '—') {
      query = property.location;
    } else if (property.title && property.title !== 'Unnamed Property') {
      query = property.title;
    }

    if (query) {
      window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`, '_blank');
    } else {
      alert('Location details (address, pincode, or coordinates) not available for this property.');
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

  // =====================================================================
  // BHK RULES
  // Only residential types keep BHK / room data. For commercial, land,
  // industrial etc. the BHK fields are blanked, so they are never shown
  // and never shared.
  // =====================================================================
  private readonly BHK_FIELDS = ['bedroom', 'masterBedroom', 'guestRoom', 'childRoom', 'otherRoom'];

  private readonly NON_BHK_TYPES = [
    'commercial', 'office', 'shop', 'showroom', 'retail', 'warehouse', 'godown',
    'industrial', 'factory', 'shed', 'land', 'plot', 'agricultural',
    'coworking', 'co-working'
  ];

  private supportsBhk(p: any): boolean {
    const type = [p?.propertyType, p?.category, p?.subType].filter(Boolean).join(' ').toLowerCase();
    if (!type) return true;
    return !this.NON_BHK_TYPES.some(k => type.includes(k));
  }

  formatArea(area: any, unit?: any): string {
    return formatAreaWithHectare(area, unit);
  }

  // =====================================================================
  // SHARE / WHATSAPP  (original logic kept; only BHK rule added)
  // =====================================================================
  generatePropertyShareDetails(property: any): string {
    if (!property) return '';

    const title = property.title || property.name || property.buildingProject || 'Property Details';
    const propType = property.propertyType || '';
    const forType = property.forType || '';
    const transaction = property.transaction || '';
    const price = property.expectedPrice || property.price || property.rentPerMonth || '';
    // CHANGE: BHK only for property types that have BHK
    const bedroom = this.supportsBhk(property) ? (property.bedroom || '') : '';
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
      lines.push(`📐 *Area:* ${this.formatArea(area, areaUnit)}`);
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

    if (property.khasraNumber || property.village) {
      const agriParts = [
        property.khasraNumber ? `Khasra: ${property.khasraNumber}` : '',
        property.village ? `Village: ${property.village}` : '',
        property.taluka ? `Taluka: ${property.taluka}` : ''
      ].filter(Boolean).join(' | ');
      lines.push(`🌾 *Land Details:* ${agriParts}`);
    }

    if (property.irrigation) {
      const irrText = property.irrigationType && property.irrigation === 'Irrigation'
        ? `${property.irrigation} (${property.irrigationType})`
        : property.irrigation;
      lines.push(`💧 *Irrigation:* ${irrText}`);
    }

    if (uniqueFeatures) {
      lines.push(`⭐ *Key Highlights:* ${uniqueFeatures}`);
    }

    if (amenities) {
      lines.push(`✨ *Amenities:* ${amenities}`);
    }

    if (mediaVideoText && typeof mediaVideoText === 'string') {
      const vUrl = mediaVideoText.trim();
      if (vUrl.startsWith('http://') || vUrl.startsWith('https://')) {
        lines.push(`🎥 *Video Walkthrough:* ${vUrl}`);
      }
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

    // Check localStorage fallback if media not in property object
    const propId = property.id || property._id;
    if (rawPhotos.length === 0 && propId) {
      const localPhotos = localStorage.getItem(`property_photos_${propId}`);
      if (localPhotos) {
        try {
          const parsed = JSON.parse(localPhotos);
          if (Array.isArray(parsed)) parsed.forEach(p => collectItem(p, rawPhotos));
        } catch(e) {}
      }
    }
    if (rawVideos.length === 0 && propId) {
      const localVideos = localStorage.getItem(`property_videos_${propId}`);
      if (localVideos) {
        try {
          const parsed = JSON.parse(localVideos);
          if (Array.isArray(parsed)) parsed.forEach(v => collectItem(v, rawVideos));
        } catch(e) {}
      }
    }

    const fileFromItem = async (item: any, defaultType: 'image' | 'video', index: number): Promise<File | null> => {
      try {
        if (!item) return null;
        if (item instanceof File) return item;
        if (item && item.file instanceof File) return item.file;

        let urlStr = '';
        let name = '';
        if (typeof item === 'string') {
          urlStr = item;
        } else if (typeof item === 'object') {
          urlStr = item.url || item.data || item.src || item.path || '';
          if (item.name) name = item.name;
        }
        urlStr = this.getMediaUrl(urlStr || item);
        if (!urlStr) return null;

        // Skip third-party video embeds (YouTube / Vimeo) from file conversion
        if (urlStr.includes('youtube.com') || urlStr.includes('youtu.be') || urlStr.includes('vimeo.com')) {
          return null;
        }

        let blob: Blob | null = null;
        let mime = '';

        if (urlStr.startsWith('data:')) {
          const match = urlStr.match(/^data:([^;]+);base64,(.+)$/s);
          if (match) {
            mime = match[1];
            try {
              const res = await fetch(urlStr);
              blob = await res.blob();
            } catch (err) {
              const cleanB64 = match[2].replace(/[\s\r\n]/g, '');
              const bstr = atob(cleanB64);
              let n = bstr.length;
              const u8arr = new Uint8Array(n);
              while (n--) {
                u8arr[n] = bstr.charCodeAt(n);
              }
              blob = new Blob([u8arr], { type: mime });
            }
          }
        } else {
          const res = await fetch(urlStr);
          if (!res.ok) return null;
          blob = await res.blob();
        }

        if (!blob) return null;

        if (!mime) mime = blob.type;
        if (!mime || mime === 'application/octet-stream') {
          mime = defaultType === 'image' ? 'image/jpeg' : 'video/mp4';
        }

        let ext = defaultType === 'image' ? 'jpg' : 'mp4';
        if (mime.includes('png')) ext = 'png';
        else if (mime.includes('webp')) ext = 'webp';
        else if (mime.includes('gif')) ext = 'gif';
        else if (mime.includes('jpeg') || mime.includes('jpg')) ext = 'jpg';
        else if (mime.includes('mp4')) ext = 'mp4';
        else if (mime.includes('webm')) ext = 'webm';

        let cleanName = name ? name.trim() : `${defaultType}_${index + 1}`;
        cleanName = cleanName.replace(/\.[a-zA-Z0-9]+$/, '');
        const finalFileName = `${cleanName}.${ext}`;

        return new File([blob], finalFileName, { type: mime });
      } catch (e) {
        return null;
      }
    };

    let files: File[] = [];
    try {
      const photoPromises = rawPhotos.slice(0, 10).map((p, i) => fileFromItem(p, 'image', i));
      const videoPromises = rawVideos.slice(0, 2).map((v, i) => fileFromItem(v, 'video', i));
      const fetchedFiles = await Promise.all([...photoPromises, ...videoPromises]);
      files = fetchedFiles.filter((f): f is File => f !== null && f.size > 0 && f.size < 40 * 1024 * 1024);
    } catch (e) {
      console.warn('Error fetching media files for share:', e);
    }

    if (navigator.share) {
      try {
        const shareTitle = property.buildingTowerProject || property.title || 'Property Details';
        let shared = false;

        if (files.length > 0) {
          // 1. Try sharing all files (images + videos) together with text
          if (navigator.canShare) {
            if (navigator.canShare({ files, text, title: shareTitle })) {
              await navigator.share({ title: shareTitle, text, files });
              shared = true;
            } else if (navigator.canShare({ files, text })) {
              await navigator.share({ text, files });
              shared = true;
            } else if (navigator.canShare({ files })) {
              await navigator.share({ files });
              shared = true;
            }
          }

          // 2. If mixed media is rejected, try image files
          if (!shared) {
            const imageFiles = files.filter(f => f.type.startsWith('image/'));
            if (imageFiles.length > 0 && navigator.canShare) {
              if (navigator.canShare({ files: imageFiles, text, title: shareTitle })) {
                await navigator.share({ title: shareTitle, text, files: imageFiles });
                shared = true;
              } else if (navigator.canShare({ files: imageFiles, text })) {
                await navigator.share({ text, files: imageFiles });
                shared = true;
              } else if (navigator.canShare({ files: imageFiles })) {
                await navigator.share({ files: imageFiles });
                shared = true;
              }
            }
          }

          // 3. If imageFiles was not shared and videoFiles exist, try video files
          if (!shared) {
            const videoFiles = files.filter(f => f.type.startsWith('video/'));
            if (videoFiles.length > 0 && navigator.canShare) {
              if (navigator.canShare({ files: videoFiles, text, title: shareTitle })) {
                await navigator.share({ title: shareTitle, text, files: videoFiles });
                shared = true;
              } else if (navigator.canShare({ files: videoFiles, text })) {
                await navigator.share({ text, files: videoFiles });
                shared = true;
              } else if (navigator.canShare({ files: videoFiles })) {
                await navigator.share({ files: videoFiles });
                shared = true;
              }
            }
          }

          // 4. Fallback if canShare is absent but navigator.share exists
          if (!shared && !navigator.canShare) {
            try {
              await navigator.share({ title: shareTitle, text, files });
              shared = true;
            } catch (shareErr: any) {
              if (shareErr.name === 'AbortError') return;
            }
          }
        }

        if (shared) {
          return;
        }

        if (files.length === 0) {
          await navigator.share({ title: shareTitle, text });
          return;
        }
      } catch (e: any) {
        if (e && e.name === 'AbortError') {
          return;
        }
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
    if (directToOwner) {
      return this.openOwnerWhatsApp(property);
    }
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

  // =====================================================================
  // LIST + MAPPING
  // =====================================================================
  get propertiesList() {
    let list = this.propertiesListRaw.map(p => this.mapPropertyProperties(p));
    if (this.searchQuery) {
      const q = this.searchQuery.toLowerCase();
      list = list.filter(item =>
        (item.title && item.title.toLowerCase().includes(q)) ||
        (item.ownerName && item.ownerName.toLowerCase().includes(q)) ||
        (item.location && item.location.toLowerCase().includes(q)) ||
        (item.description && item.description.toLowerCase().includes(q)) ||
        (item.id && String(item.id).toLowerCase() === q)
      );
    }
    return list;
  }

  private getDedupeKey(urlStr: string): string {
    if (!urlStr) return '';
    const u = urlStr.trim();
    return u.length > 300 ? u.length + '_' + u.substring(0, 150) + '_' + u.substring(u.length - 150) : u;
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
    if (rawUrl.startsWith('data:') || rawUrl.startsWith('http://') || rawUrl.startsWith('https://') || rawUrl.startsWith('blob:')) {
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

    const formattedDate = p.createdAt
      ? new Date(p.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
      : '—';

    const formattedPrice = p.expectedPrice
      ? `₹${(p.expectedPrice / 10000000).toFixed(2)} Cr`
      : (p.price || '—');

    const propId = p.id || p._id;

    // ---------- Photos ----------
    const photosList: any[] = [];
    const rawPhotosSources: any[] = [];
    const extractInto = (source: any, target: any[]) => {
      if (!source) return;
      if (typeof source === 'string') {
        const trimmed = source.trim();
        if (trimmed.startsWith('[')) {
          try {
            const parsed = JSON.parse(trimmed);
            if (Array.isArray(parsed)) target.push(...parsed);
            return;
          } catch (e) {}
        }
        if (trimmed) {
          target.push(...trimmed.split(',').map((s: string) => s.trim()).filter(Boolean));
        }
      } else if (Array.isArray(source)) {
        target.push(...source);
      } else if (typeof source === 'object') {
        target.push(source);
      }
    };

    extractInto(p.images, rawPhotosSources);
    extractInto(p.photos, rawPhotosSources);

    const seenPhotoKeys = new Set<string>();
    const addPhotoToOutput = (img: any) => {
      const url = this.getMediaUrl(img);
      if (!url) return;
      const key = this.getDedupeKey(url);
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

    rawPhotosSources.forEach(addPhotoToOutput);

    if (photosList.length === 0 && propId) {
      const localPhotos = localStorage.getItem(`property_photos_${propId}`);
      if (localPhotos) {
        try {
          const parsed = JSON.parse(localPhotos);
          if (Array.isArray(parsed)) parsed.forEach(addPhotoToOutput);
        } catch (e) {}
      }
    }
    if (photosList.length > 0 && !photosList.some(ph => ph.isCover)) {
      photosList[0].isCover = true;
    }

    // ---------- Videos ----------
    const videosList: any[] = [];
    const rawVideosSources: any[] = [];

    extractInto(p.videos, rawVideosSources);
    if (p.videoUrl) {
      const isStream = typeof p.videoUrl === 'string' && (p.videoUrl.includes('youtube') || p.videoUrl.includes('vimeo'));
      if (!isStream) extractInto(p.videoUrl, rawVideosSources);
    }

    const seenVidKeys = new Set<string>();
    const seenVidNames = new Set<string>();
    const addVideoToOutput = (vid: any) => {
      const url = this.getMediaUrl(vid);
      if (!url) return;
      const key = this.getDedupeKey(url);
      const name = typeof vid === 'object' ? (vid.name || '') : '';
      const nameKey = name ? name.toLowerCase().trim() : '';

      if (!seenVidKeys.has(key) && (!nameKey || !seenVidNames.has(nameKey))) {
        seenVidKeys.add(key);
        if (nameKey) seenVidNames.add(nameKey);
        videosList.push({
          url: url,
          name: typeof vid === 'object' ? (vid.name || 'Video') : 'Video',
          size: typeof vid === 'object' ? (vid.size || '') : ''
        });
      }
    };

    rawVideosSources.forEach(addVideoToOutput);

    if (propId) {
      const localVideos = localStorage.getItem(`property_videos_${propId}`);
      if (localVideos) {
        try {
          const parsed = JSON.parse(localVideos);
          if (Array.isArray(parsed)) parsed.forEach(addVideoToOutput);
        } catch (e) {}
      }
    }

    let cleanVideoUrl = '';
    if (p.videoUrl && typeof p.videoUrl === 'string') {
      const formatted = this.getMediaUrl(p.videoUrl);
      if (formatted) {
        const isExternalStream = formatted.includes('youtube') || formatted.includes('vimeo') || formatted.includes('youtu.be');
        const isAlreadyInVideos = videosList.some(v => v.url === formatted || v.url === p.videoUrl);
        if (isExternalStream || !isAlreadyInVideos) {
          cleanVideoUrl = formatted;
        }
      }
    }

    // ---------- Keywords ----------
    const rawKw = [p.keyword, p.websiteKeyword].filter(Boolean).join(', ');
    const keywordsArray = rawKw ? rawKw.split(',').map((k: string) => k.trim()).filter(Boolean) : [];
    const uniqueKeywordsArray = Array.from(new Set(keywordsArray));

    // ---------- Legal docs ----------
    const savedDocsRaw = propId ? localStorage.getItem(`property_legal_docs_${propId}`) : null;
    let localDocs: any = {};
    if (savedDocsRaw) {
      try { localDocs = JSON.parse(savedDocsRaw); } catch (e) {}
    }

    const compDoc = p.completionCertificateDoc || localDocs.completionCertificateDoc || '';
    const occDoc = p.occupationCertificateDoc || localDocs.occupationCertificateDoc || '';
    const nocDoc = p.nocCertificateDoc || localDocs.nocCertificateDoc || '';
    const fireDoc = p.fireCertificateDoc || localDocs.fireCertificateDoc || '';
    const customDocs = (Array.isArray(p.legalDocuments) && p.legalDocuments.length > 0)
      ? p.legalDocuments
      : (Array.isArray(localDocs.legalDocuments) ? localDocs.legalDocuments : []);

    let rawName = (p.name || p.buildingTowerProject || p.projectBuilding || '').trim();
    if (!rawName && p.title && p.title !== 'Unnamed Property') {
      rawName = p.title.replace(/\s*\([^)]*\)\s*$/, '').trim();
    }
    const hasName = !!rawName && rawName.toLowerCase() !== 'unnamed property';

    const catParts = [p.category, p.propertyType]
      .filter((v: any) => v && typeof v === 'string' && v.trim().length > 0)
      .map((v: string) => v.trim());
    const uniqueCatParts = Array.from(new Set(catParts));
    const catType = uniqueCatParts.join(' - ');

    let computedTitle = 'Unnamed Property';
    if (hasName && catType) {
      if (rawName.toLowerCase().includes(catType.toLowerCase())) {
        computedTitle = rawName;
      } else {
        computedTitle = `${rawName} (${catType})`;
      }
    } else if (hasName) {
      computedTitle = rawName;
    } else if (catType) {
      computedTitle = catType;
    }

    const mapped: any = {
      ...p,
      id: propId,
      title: computedTitle,
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
      khasraNumber: p.khasraNumber || '',
      village: p.village || '',
      taluka: p.taluka || '',
      irrigation: p.irrigation || '',
      irrigationType: p.irrigationType || '',
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
      photos: photosList,
      videos: videosList,
      videoUrl: cleanVideoUrl,
      keywordsList: uniqueKeywordsArray,
      completionCertificate: !!p.completionCertificate || !!localDocs.completionCertificate || !!compDoc,
      completionCertificateDoc: compDoc,
      occupationCertificate: !!p.occupationCertificate || !!localDocs.occupationCertificate || !!occDoc,
      occupationCertificateDoc: occDoc,
      nocCertificate: !!p.nocCertificate || !!localDocs.nocCertificate || !!nocDoc,
      nocCertificateDoc: nocDoc,
      fireCertificate: !!p.fireCertificate || !!localDocs.fireCertificate || !!fireDoc,
      fireCertificateDoc: fireDoc,
      legalDocuments: customDocs
    };

    // No BHK data for property types that have no BHK option
    if (!this.supportsBhk(p)) {
      this.BHK_FIELDS.forEach(f => (mapped[f] = ''));
    }

    return mapped;
  }

  // =====================================================================
  // MEDIA LIGHTBOX
  // =====================================================================
  selectedDetailMediaModal: { url: string; type: 'image' | 'video'; name?: string } | null = null;
  detailMediaList: Array<{ url: string; type: 'image' | 'video'; name: string }> = [];
  detailMediaIndex: number = 0;

  openDetailMediaModal(url: string, type: 'image' | 'video', name?: string) {
    this.detailMediaList = [];
    const seen = new Set<string>();

    const addMedia = (itemUrl: string, itemType: 'image' | 'video', itemName?: string) => {
      if (!itemUrl) return;
      const key = this.getDedupeKey(itemUrl);
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

  // =====================================================================
  // ACTION MENU
  // =====================================================================
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

  // =====================================================================
  // GROUP ACTIONS (top bar)
  // =====================================================================
  showCreateAudience = false;
  showSendSms = false;
  showSendEmail = false;
  groupDeleteAction = false;
  downloadAction = false;
  showImportProperty = false;

  private closeAllGroupActions() {
    this.showCreateAudience = false;
    this.showSendSms = false;
    this.showSendEmail = false;
    this.groupDeleteAction = false;
    this.downloadAction = false;
    this.showImportProperty = false;
  }

  openCreateAudience() { this.closeAllGroupActions(); this.showCreateAudience = true; }
  hideCreateAudience() { this.showCreateAudience = false; }

  openSendSms() { this.closeAllGroupActions(); this.showSendSms = true; }
  hideSendSms() { this.showSendSms = false; }

  openSendEmail() { this.closeAllGroupActions(); this.showSendEmail = true; }
  hideSendEmail() { this.showSendEmail = false; }

  openGroupDelete() { this.closeAllGroupActions(); this.groupDeleteAction = true; }
  hideGroupDelete() { this.groupDeleteAction = false; }

  openDownload() { this.closeAllGroupActions(); this.downloadAction = true; }
  hideDownload() { this.downloadAction = false; }

  openImportProperty() { this.closeAllGroupActions(); this.showImportProperty = true; }
  hideImportProperty() { this.showImportProperty = false; }

  // =====================================================================
  // PROFILE ACTIONS (selected property)
  // =====================================================================
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
    this.showProposal = false;
  }

  openChangeStatus() { this.closeAllProfileActions(); this.showChangeStatus = true; }
  openSendSmsopp() { this.closeAllProfileActions(); this.showSendSmsopp = true; }
  openSendEmailopp() { this.closeAllProfileActions(); this.showSendEmailopp = true; }
  openQuickNote() { this.closeAllProfileActions(); this.showQuickNote = true; }
  openHistory() { this.closeAllProfileActions(); this.showHistory = true; }
  openShortlistedProperties() { this.closeAllProfileActions(); this.showShortlistedProperties = true; }
  openShortlistedProjects() { this.closeAllProfileActions(); this.showShortlistedProjects = true; }
  openSiteVisit() { this.closeAllProfileActions(); this.showSiteVisit = true; }
  openAttachDocument() { this.closeAllProfileActions(); this.showAttachDocument = true; }
  openDelete() { this.closeAllProfileActions(); this.showDelete = true; }
  openTerms() { this.closeAllProfileActions(); this.showTerms = true; }
  openPublish() { this.closeAllProfileActions(); this.showPublish = true; }
  openProposal() { this.closeAllProfileActions(); this.showProposal = true; }

  // =====================================================================
  // LEGAL DOCUMENTS
  // =====================================================================
  private saveLegalDocsLocally(propId: string) {
    const savedDocsRaw = localStorage.getItem(`property_legal_docs_${propId}`);
    let localDocs: any = {};
    if (savedDocsRaw) {
      try { localDocs = JSON.parse(savedDocsRaw); } catch (e) {}
    }
    localDocs.legalDocuments = this.selectedProperty.legalDocuments;
    try {
      localStorage.setItem(`property_legal_docs_${propId}`, JSON.stringify(localDocs));
    } catch (e) {}
  }

  onDocumentSaved(newDoc: any) {
    if (!this.selectedProperty) return;
    if (!Array.isArray(this.selectedProperty.legalDocuments)) {
      this.selectedProperty.legalDocuments = [];
    }
    this.selectedProperty.legalDocuments.push(newDoc);
    const propId = this.selectedProperty.id;
    if (propId) this.saveLegalDocsLocally(propId);
  }

  removeAttachedDocument(docIndex: number) {
    if (this.selectedProperty && Array.isArray(this.selectedProperty.legalDocuments)) {
      this.selectedProperty.legalDocuments.splice(docIndex, 1);
      const propId = this.selectedProperty.id;
      if (propId) {
        this.saveLegalDocsLocally(propId);
        this.propertiesService.updateProperty(propId, { legalDocuments: this.selectedProperty.legalDocuments }).subscribe({
          next: () => {},
          error: () => {}
        });
      }
    }
  }

  isVideoInList(url?: string, list?: any[]): boolean {
    if (!url || !list || list.length === 0) return false;
    const trimmed = url.trim().toLowerCase();
    return list.some(item => {
      const itemUrl = (item?.url || item?.data || item?.src || (typeof item === 'string' ? item : '')).trim().toLowerCase();
      const itemName = (item?.name || '').trim().toLowerCase();
      return itemUrl === trimmed || (itemName && trimmed.includes(itemName));
    });
  }
}