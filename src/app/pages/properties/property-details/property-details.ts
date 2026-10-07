import { Component, OnInit, inject } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { PropertiesService } from '../properties.service';
import { AuthService } from '../../auth/auth.service';
import { environment } from '../../../../environments/environment';

interface Row { label: string; value: string; }
interface Section { title: string; icon: string; rows: Row[]; chips?: string[]; }

@Component({
  selector: 'app-property-details',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './property-details.html',
  styleUrl: './property-details.css',
})
export class PropertyDetails implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private location = inject(Location);
  private sanitizer = inject(DomSanitizer);
  private propertiesService = inject(PropertiesService);
  private authService = inject(AuthService);

  loading = true;
  error = '';
  p: any = null;
  sections: Section[] = [];
  photos: string[] = [];
  videos: { url: string; name: string }[] = [];
  docs: { name: string; type: string; url: string }[] = [];
  activePhoto = 0;
  lightbox = false;
  mapUrl: SafeResourceUrl | null = null;
  agents: any[] = [];

  ngOnInit(): void {
    this.authService.getAgents().subscribe({
      next: (r: any) => { this.agents = r.data || r || []; if (this.p) this.build(); },
      error: () => {}
    });
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) { this.error = 'Property ID missing.'; this.loading = false; return; }
    this.propertiesService.getPropertyById(id).subscribe({
      next: (res: any) => {
        this.p = res?.data || res;
        this.build();
        this.loading = false;
      },
      error: () => { this.error = 'Property details load nahi ho payi.'; this.loading = false; }
    });
  }

  goBack(): void {
    if (window.history.length > 1) this.location.back();
    else this.router.navigate(['/all-properties']);
  }

  // ---------- helpers ----------
  private has(v: any): boolean {
    if (v === undefined || v === null || v === '') return false;
    if (Array.isArray(v)) return v.length > 0;
    return true;
  }
  private fmt(v: any): string {
    if (Array.isArray(v)) return v.map(x => (typeof x === 'object' ? (x.name || '') : x)).filter(Boolean).join(', ');
    if (typeof v === 'boolean') return v ? 'Yes' : 'No';
    return String(v);
  }
  private money(v: any): string {
    const n = Number(v);
    return isNaN(n) ? String(v) : '₹ ' + n.toLocaleString('en-IN');
  }
  private withUnit(v: any, unit?: string): string {
    return this.has(v) ? `${v} ${unit || ''}`.trim() : '';
  }
  private rows(defs: Array<[string, any]>): Row[] {
    return defs
      .filter(([, v]) => this.has(v) && v !== false)
      .map(([label, v]) => ({ label, value: this.fmt(v) }));
  }
  private yesNo(defs: Array<[string, any]>): Row[] {
    return defs.filter(([, v]) => v !== undefined && v !== null).map(([label, v]) => ({ label, value: v ? 'Yes' : 'No' }));
  }

  get ownerName(): string {
    const o = this.p?.ownerLandlord;
    if (!o) return '';
    if (typeof o === 'string') return o;
    return `${o.salutation ? o.salutation + ' ' : ''}${o.firstName || ''} ${o.lastName || ''}`.trim();
  }
  get ownerPhone(): string { return this.p?.ownerLandlord?.mobile || ''; }
  get ownerEmail(): string { return this.p?.ownerLandlord?.email || ''; }

  get assigneeName(): string {
    const a = this.p?.assignee;
    if (!a) return '';
    if (typeof a === 'object') return `${a.firstName || ''} ${a.lastName || ''}`.trim();
    const found = this.agents.find(x => (x._id || x.id) === a);
    return found ? `${found.firstName || ''} ${found.lastName || ''}`.trim() : '';
  }

  get title(): string {
    const p = this.p || {};
    return p.name || [p.bedroom, p.propertyType].filter(Boolean).join(' ') || 'Property';
  }
  get subtitle(): string {
    const p = this.p || {};
    return [p.buildingTowerProject, p.locality, p.city].filter(Boolean).join(', ');
  }
  get headlinePrice(): string {
    const p = this.p || {};
    const v = p.expectedPrice ?? p.price;
    return this.has(v) ? this.money(v) : '';
  }

  // ---------- build all sections ----------
  private build(): void {
    const p = this.p;
    if (!p) return;

    const localities = Array.isArray(p.localities) && p.localities.length ? p.localities.join(', ') : p.locality;

    this.sections = [
      { title: 'Basic Information', icon: 'fa-circle-info', rows: this.rows([
        ['Request Date', p.requestDate ? String(p.requestDate).split('T')[0] : ''],
        ['For', p.forType || p.fo], ['Category', p.category], ['Property Type', p.propertyType],
        ['Transaction', p.transaction], ['Ownership', p.ownership], ['Bedroom', p.bedroom],
        ['Furnishing', p.furnishing], ['Channel', p.channel], ['Status', p.status],
        ['Suitable For', p.suitableFor], ['Unique Features', p.uniqueFeature],
        ['Description', p.description], ['Remark', p.remark], ['Internal Note', p.internalNote],
        ['Documents Verified', p.verifiedDocuments ? true : ''], ['Visit Completed', p.completedVisit ? true : ''],
      ]) },
      { title: 'Location', icon: 'fa-location-dot', rows: this.rows([
        ['Address', p.address], ['Flat / Unit No.', p.flatOfficeUnitNo], ['Building / Project', p.buildingTowerProject],
        ['Developer', p.projectDeveloperName], ['Street', p.street], ['Landmark', p.landmark],
        ['Locality', localities], ['City', p.city], ['Pin Code', p.pincode || p.pinCode],
        ['State', p.state], ['District', p.district], ['Taluka / Tehsil', p.taluka], ['Village', p.village], ['Khasra No.', p.khasraNumber],
        ['Survey Number', p.surveyNumber], ['Survey Name', p.surveyName],
        ['Latitude / Longitude', (p.latitude && p.longitude) ? `${p.latitude}, ${p.longitude}` : ''],
      ]) },
      { title: 'Area', icon: 'fa-ruler-combined', rows: this.rows([
        ['Area', this.withUnit(p.area ?? p.sqft, p.areaUnit)],
        ['Built-Up Area', this.withUnit(p.builtUpArea, p.builtUpAreaUnit)],
        ['Carpet Area', this.withUnit(p.carpetArea, p.carpetAreaUnit)],
        ['Terrace Area', this.withUnit(p.terraceArea, p.terraceAreaUnit)],
        ['Plot Area', this.withUnit(p.plotArea, p.plotAreaUnit)],
        ['Area Range', this.withUnit(p.areaRange, p.areaRangeUnit)],
        ['Plot Dimension', (p.plotLength && p.plotWidth) ? `${p.plotLength} x ${p.plotWidth} ${p.plotDimensionUnit || ''}` : ''],
        ['Property Dimension', (p.propertyWidth && p.propertyDepth) ? `${p.propertyWidth} x ${p.propertyDepth}${p.propertyHeight ? ' x ' + p.propertyHeight : ''} ${p.propertyDimensionUnit || ''}` : ''],
      ]) },
      { title: 'Pricing', icon: 'fa-indian-rupee-sign', rows: [
        ...this.rows([
          ['Expected Price', this.has(p.expectedPrice ?? p.price) ? this.money(p.expectedPrice ?? p.price) : ''],
          ['Rate', this.has(p.rate) ? this.money(p.rate) : ''],
          ['Negotiable Amount', this.has(p.negotiableAmount) ? this.money(p.negotiableAmount) : ''],
          ['Maintenance', p.maintenanceType],
          ['Maintenance Charges', this.has(p.maintenanceCharges) ? this.money(p.maintenanceCharges) : ''],
          ['Security Deposit', this.has(p.securityDeposit) ? this.money(p.securityDeposit) : ''],
          ['Deposit Months', p.securityDepositMonths], ['JV Ratio', p.jvRatio],
        ]),
        ...this.yesNo([['Negotiable', p.isNegotiable], ['Deposit Negotiable', p.depositNegotiable],
          ['Refundable Deposit', p.depositRefundable], ['Paid By Licensor', p.paidByLicensor]]),
      ] },
      ...(p.isPreLeaseEnabled ? [{ title: 'Pre Lease / Pre Rented', icon: 'fa-file-contract', rows: this.rows([
        ['Lock-in (Years)', p.lockInPeriod], ['Lease (Months)', p.leasePeriod],
        ['Lease Charges', p.leaseHoldCharges], ['Rent Free (Days)', p.rentFreePeriod],
        ['Commission', p.commissionPayable], ['Rent Per Month', this.has(p.rentPerMonth) ? this.money(p.rentPerMonth) : ''],
        ['Rent Start Date', p.rentStartDate], ['Escalation (%)', p.rentEscalationPercentage],
        ['MSEB KVA', p.mseb], ['ROI (%)', p.roi], ['Property Tax', p.propertyTax],
      ]) }] : []),
      { title: 'Rooms & Structure', icon: 'fa-building', rows: this.rows([
        ['Master Bedroom', p.masterBedroom], ['Guest Room', p.guestRoom], ['Child Room', p.childRoom],
        ['Common Bath', p.bathroomCommon], ['Ensuite Bath', p.bathroomAttach], ['Other Room', p.otherRoom],
        ['Total Floors', p.totalFloor], ['Property On Floor', p.propertyOnFloor], ['Flooring', p.flooring],
        ['No. of Parking', p.noOfParking], ['No. of Lifts', p.noOfLift], ['Facing', p.facing],
        ['Age of Property', p.ageOfProperty], ['Possession', p.constructionStatus || p.availabilityPossession],
        ['Suitable Tenants', p.suitableTenants],
      ]) },
      { title: 'Commercial Workspace', icon: 'fa-briefcase', rows: this.rows([
        ['Workstations', p.workStation], ['Cabins', p.cabins], ['Conference Rooms', p.conferenceRoom],
        ['Reception', p.reception ? true : ''], ['Power Backup (KVA)', p.powerKva], ['DG Backup', p.hasDgBackup ? true : ''],
      ]) },
      { title: 'Industrial / Warehouse', icon: 'fa-industry', rows: this.rows([
        ['Pollution Zone', p.pollutionZone], ['Racking / EOT Capacity', p.tacklingCapacityEot],
        ['Floor Strength', p.floorStrength], ['STP/ETP Capacity', p.stpEtpCapacity],
        ['Loading Bays', p.loadingBays],
        ['Canopy (L x W)', (p.canopyLength || p.canopyWidth) ? `${p.canopyLength || '-'} x ${p.canopyWidth || '-'}` : ''],
        ['Fire NOC', p.freeNoc ? true : ''], ['Approval Plan', p.additionalFiles ? true : ''],
        ['Dock Levellers', p.dockLevellers ? true : ''],
      ]) },
      { title: 'Amenities & Advertisement', icon: 'fa-star', rows: [],
        chips: [...(Array.isArray(p.amenities) ? p.amenities : []),
          ...(p.advertised ? String(p.advertised).split(',').map((s: string) => s.trim()).filter(Boolean) : [])] },
      { title: 'Keywords', icon: 'fa-tags', rows: [],
        chips: [...(p.websiteKeyword ? String(p.websiteKeyword).split(',') : []),
          ...(p.keyword ? String(p.keyword).split(',') : []),
          ...(Array.isArray(p.keywords) ? p.keywords : [])].map((s: string) => s.trim()).filter(Boolean) },
      { title: 'Management & Publish', icon: 'fa-user-tie', rows: [
        ...this.rows([
          ['Owner / Landlord', this.ownerName], ['Assignee', this.assigneeName], ['Source', p.source],
          ['Branch', typeof p.branch === 'object' ? '' : p.branch], ['Visibility', p.privacy],
          ['Refer By', p.referBy], ['Key Holder', p.keyHolder], ['Folder', p.folder],
          ['Site Manager', [p.siteManager, p.siteManagerContact].filter(Boolean).join(' - ')],
          ['Sourcing Manager', [p.sourcingManager, p.sourcingManagerContact].filter(Boolean).join(' - ')],
          ['Closing Manager', [p.closingManager, p.closingManagerContact].filter(Boolean).join(' - ')],
          ['Featured', p.featured ? true : ''], ['Protected', p.protected ? true : ''],
          ['Created', p.createdAt ? new Date(p.createdAt).toLocaleString('en-IN') : ''],
          ['Last Updated', p.updatedAt ? new Date(p.updatedAt).toLocaleString('en-IN') : ''],
        ]),
      ] },
    ].filter(s => s.rows.length > 0 || (s.chips && s.chips.length > 0));

    this.buildMedia();
    this.buildDocs();

    if (p.latitude && p.longitude) {
      const url = `https://maps.google.com/maps?q=${p.latitude},${p.longitude}&z=15&output=embed`;
      this.mapUrl = this.sanitizer.bypassSecurityTrustResourceUrl(url);
    }
  }

  private buildMedia(): void {
    const p = this.p;
    const seen = new Set<string>();
    const collect = (src: any): any[] => {
      if (!src) return [];
      if (Array.isArray(src)) return src;
      if (typeof src === 'string') {
        const t = src.trim();
        if (t.startsWith('[')) { try { return JSON.parse(t); } catch { /* ignore */ } }
        return t.split(',').map(s => s.trim()).filter(Boolean);
      }
      return [src];
    };

    this.photos = [];
    [...collect(p.images), ...(this.photos.length ? [] : collect(p.photos))].forEach(i => {
      const u = this.mediaUrl(i);
      if (u && !seen.has(u)) { seen.add(u); this.photos.push(u); }
    });
    // cover photo first
    const coverIdx = collect(p.images).findIndex((i: any) => i && typeof i === 'object' && i.isCover);
    if (coverIdx > 0 && this.photos[coverIdx]) {
      const [c] = this.photos.splice(coverIdx, 1);
      this.photos.unshift(c);
    }

    this.videos = [];
    const vseen = new Set<string>();
    collect(p.videos).forEach((v: any) => {
      const u = this.mediaUrl(v);
      if (u && !vseen.has(u)) { vseen.add(u); this.videos.push({ url: u, name: (typeof v === 'object' && v.name) || 'Video' }); }
    });
  }

  private buildDocs(): void {
    const p = this.p;
    const list: { name: string; type: string; url: string }[] = [];
    const single: Array<[string, string]> = [
      ['completionCertificateDoc', 'Completion Certificate'], ['occupationCertificateDoc', 'Occupation Certificate'],
      ['nocCertificateDoc', 'NOC Certificate'], ['fireCertificateDoc', 'Fire Safety Certificate'],
    ];
    single.forEach(([key, label]) => {
      if (p[key]) list.push({ name: label, type: 'Certificate', url: this.mediaUrl(p[key]) });
    });
    [...(p.legalDocuments || []), ...(p.documents || [])].forEach((d: any) => {
      const u = this.mediaUrl(d);
      if (u) list.push({ name: d.name || 'Document', type: d.type || 'Legal Document', url: u });
    });
    this.docs = list;
  }

  mediaUrl(item: any): string {
    if (!item) return '';
    const raw = typeof item === 'string' ? item : (item.url || item.data || item.src || item.path || item.link || '');
    if (!raw) return '';
    if (/^(data:|https?:|blob:)/.test(raw)) return raw;
    const host = (environment.apiUrl || '').replace(/\/api\/v1\/?$/, '').replace(/\/+$/, '');
    return `${host}${raw.startsWith('/') ? raw : '/' + raw}`;
  }

  isEmbedVideo(url: string): boolean { return /youtube|youtu\.be|vimeo/i.test(url); }
  safeVideo(url: string): SafeResourceUrl {
    let u = url;
    const yt = url.match(/(?:v=|youtu\.be\/)([\w-]{6,})/);
    if (yt) u = `https://www.youtube.com/embed/${yt[1]}`;
    return this.sanitizer.bypassSecurityTrustResourceUrl(u);
  }
  safeDoc(url: string): SafeResourceUrl { return this.sanitizer.bypassSecurityTrustResourceUrl(url); }

  openLightbox(i: number): void { this.activePhoto = i; this.lightbox = true; }
  next(e?: Event): void { e?.stopPropagation(); this.activePhoto = (this.activePhoto + 1) % this.photos.length; }
  prev(e?: Event): void { e?.stopPropagation(); this.activePhoto = (this.activePhoto - 1 + this.photos.length) % this.photos.length; }

  edit(): void { this.router.navigate(['/edit-property', this.p?.id || this.p?._id]); }
}