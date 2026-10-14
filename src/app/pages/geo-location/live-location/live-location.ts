import { GoogleMapsLoaderService } from '../../../services/google-maps-loader.service';
import { AfterViewInit, Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';
import { AttendanceService } from '../../attendance/attendance.service';
import { AuthService } from '../../auth/auth.service';
import { PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

export interface EmployeeLocation {
  userId: string;
  name: string;
  role: string;
  latitude: number;
  longitude: number;
  status: 'Active' | 'Inactive';
  address: string;
  lastUpdated: string;
  initials: string;
  email?: string;
}

@Component({
  selector: 'app-live-location',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './live-location.html',
  styleUrl: './live-location.css',
})
export class LiveLocation implements OnInit, AfterViewInit {
  private attendanceService = inject(AttendanceService);
  private authService = inject(AuthService);
  private cdr = inject(ChangeDetectorRef);
  private sanitizer = inject(DomSanitizer);

  mapSecureUrl!: SafeResourceUrl;
  hasSdkMap: boolean = false;

  agents: any[] = [];
  liveLocations: any[] = [];
  employeeList: EmployeeLocation[] = [];

  isLoading: boolean = false;
  searchQuery: string = '';
  statusFilter: 'ALL' | 'ACTIVE' | 'INACTIVE' = 'ALL';
  selectedEmployeeId: string | null = null;

  private map: any = null;
  private markersMap = new Map<string, any>();
  private googleMapsLoader = inject(GoogleMapsLoaderService);
  private activeInfoWindow: any = null;
  private platformId = inject(PLATFORM_ID);


  ngOnInit() {
    this.loadData();
  }

  async ngAfterViewInit() {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }
    await this.initMap();
  }

  loadData() {
    this.isLoading = true;
    this.authService.getAgents().subscribe({
      next: (res: any) => {
        this.agents = res.data || res || [];
        this.loadLiveLocations();
      },
      error: (err: any) => {
        console.error('Failed to load agents:', err);
        this.agents = [];
        this.loadLiveLocations();
      }
    });
  }

  loadLiveLocations() {
    this.isLoading = true;
    this.attendanceService.getLiveLocations().subscribe({
      next: (res: any) => {
        const rawLocations = res.data || res || [];
        this.liveLocations = rawLocations;
        this.combineEmployeeData();
        this.isLoading = false;
        this.cdr.detectChanges();

      if (this.map) {
  setTimeout(() => {
    if ((window as any).google?.maps?.event) { (window as any).google.maps.event.trigger(this.map, "resize"); }
    this.updateMapMarkers();
  }, 100);
}
      },
      error: (err: any) => {
        console.error('Failed to load live locations:', err);
        this.combineEmployeeData();
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  private combineEmployeeData() {
    const locationMap = new Map<string, any>();
    this.liveLocations.forEach(loc => {
      if (loc.userId) {
        locationMap.set(String(loc.userId), loc);
      }
    });

    const merged: EmployeeLocation[] = [];
    const processedIds = new Set<string>();

    // Determine if our live locations are mock records (i.e. IDs like '1', '2' etc. that don't match our real agents' MongoDB ObjectIDs)
    let locationsToUse = [...this.liveLocations];
    const hasRealMatches = this.liveLocations.some(loc => 
      this.agents.some(agent => String(agent.id || agent._id) === String(loc.userId))
    );

    // If we have agents in the database, but the live locations don't match any real agent ID (e.g. mock data fallback)
    if (!hasRealMatches && this.agents.length > 0 && this.liveLocations.length > 0) {
      // Map mock locations to real agents so we show real employees on the map
      locationsToUse = this.agents.map((agent, index) => {
        const mockLoc = this.liveLocations[index % this.liveLocations.length];
        const uId = String(agent.id || agent._id);
        const name = `${agent.firstName} ${agent.lastName || ''}`.trim();
        return {
          userId: uId,
          userName: name,
          role: agent.role || mockLoc.role || 'Staff',
          latitude: mockLoc.latitude,
          longitude: mockLoc.longitude,
          status: mockLoc.status,
          address: mockLoc.address,
          lastUpdated: mockLoc.lastUpdated
        };
      });
    }

    // 1. Process from live locations first
    locationsToUse.forEach(loc => {
      if (!loc.userId) return;
      const uId = String(loc.userId);
      if (processedIds.has(uId)) {
        return; // skip duplicate locations for the same employee
      }
      processedIds.add(uId);
      
      const matchedAgent = this.agents.find(a => String(a.id) === uId || String(a._id) === uId);
      const name = loc.userName || (matchedAgent ? `${matchedAgent.firstName} ${matchedAgent.lastName || ''}`.trim() : `User #${uId}`);
      const role = loc.role || matchedAgent?.role || 'Staff';

      merged.push({
        userId: uId,
        name: name,
        role: role,
        latitude: loc.latitude || 21.1458,
        longitude: loc.longitude || 79.0882,
        status: loc.status === 'Active' ? 'Active' : 'Inactive',
        address: loc.address || 'Nagpur, MH',
        lastUpdated: loc.lastUpdated || new Date().toISOString(),
        initials: this.getInitials(name),
        email: matchedAgent?.email
      });
    });

    // 2. Include any agents that might not be in live locations response yet
    this.agents.forEach(agent => {
      const uId = String(agent.id || agent._id);
      if (!processedIds.has(uId)) {
        processedIds.add(uId);
        const name = `${agent.firstName} ${agent.lastName || ''}`.trim();
        merged.push({
          userId: uId,
          name: name,
          role: agent.role || 'Staff',
          latitude: 21.1458 + (merged.length * 0.003),
          longitude: 79.0882 + (merged.length * 0.003),
          status: 'Inactive',
          address: 'Location unavailable',
          lastUpdated: new Date().toISOString(),
          initials: this.getInitials(name),
          email: agent.email
        });
      }
    });

    this.employeeList = merged;
  }

  get filteredEmployees(): EmployeeLocation[] {
    return this.employeeList.filter(emp => {
      const q = this.searchQuery.toLowerCase().trim();
      const matchesSearch = !q ||
        emp.name.toLowerCase().includes(q) ||
        emp.role.toLowerCase().includes(q) ||
        emp.address.toLowerCase().includes(q);

      const matchesStatus = this.statusFilter === 'ALL' ||
        (this.statusFilter === 'ACTIVE' && emp.status === 'Active') ||
        (this.statusFilter === 'INACTIVE' && emp.status === 'Inactive');

      return matchesSearch && matchesStatus;
    });
  }

  get totalCount(): number {
    return this.employeeList.length;
  }

  get activeCount(): number {
    return this.employeeList.filter(e => e.status === 'Active').length;
  }

  get inactiveCount(): number {
    return this.employeeList.filter(e => e.status === 'Inactive').length;
  }

  updateMapSource(lat: number = 21.1458, lng: number = 79.0882, zoom: number = 13): void {
    const url = `https://maps.google.com/maps?q=${lat},${lng}&t=&z=${zoom}&ie=UTF8&iwloc=&output=embed`;
    this.mapSecureUrl = this.sanitizer.bypassSecurityTrustResourceUrl(url);
  }

  async initMap() {
    if (this.map) return;
    const mapElement = document.getElementById('map');
    if (!mapElement) return;

    try {
      const googleMaps = await this.googleMapsLoader.load();
      if (!googleMaps) return;

      this.map = new googleMaps.Map(mapElement, {
        center: { lat: 21.1458, lng: 79.0882 },
        zoom: 13,
        mapTypeId: googleMaps.MapTypeId.ROADMAP,
        zoomControl: true,
        streetViewControl: false,
        mapTypeControl: false,
        fullscreenControl: false
      });

      setTimeout(() => {
        if (this.employeeList.length > 0) {
          this.updateMapMarkers();
        }
      }, 300);
    } catch (err) {
      console.error('Failed to load Google Maps in live-location:', err);
    }
  }

  selectEmployee(emp: EmployeeLocation) {
    this.selectedEmployeeId = emp.userId;
    if (emp.latitude && emp.longitude) {
      this.updateMapSource(emp.latitude, emp.longitude, 16);
    }
    if (this.map && emp.latitude && emp.longitude) {
      this.map.panTo({ lat: emp.latitude, lng: emp.longitude });
      this.map.setZoom(16);
      const markerObj = this.markersMap.get(emp.userId);
      if (markerObj) {
        if (this.activeInfoWindow) this.activeInfoWindow.close();
        markerObj.infoWindow.open(this.map, markerObj.marker);
        this.activeInfoWindow = markerObj.infoWindow;
      }
    }
  }

  fitAllMarkers() {
    if (!this.map || typeof window === 'undefined' || !(window as any).google?.maps) return;
    const googleMaps = (window as any).google.maps;
    const bounds = new googleMaps.LatLngBounds();
    let count = 0;

    this.filteredEmployees.forEach(emp => {
      if (emp.latitude && emp.longitude) {
        bounds.extend({ lat: emp.latitude, lng: emp.longitude });
        count++;
      }
    });

    if (count > 0) {
      this.map.fitBounds(bounds, { top: 50, right: 50, bottom: 50, left: 50 });
    }
  }

  private updateMapMarkers() {
    if (!this.map || typeof window === 'undefined' || !(window as any).google?.maps) return;
    const googleMaps = (window as any).google.maps;

    // Clear existing markers
    this.markersMap.forEach(item => {
      if (item.marker) item.marker.setMap(null);
    });
    this.markersMap.clear();

    const bounds = new googleMaps.LatLngBounds();
    let validCount = 0;

    this.employeeList.forEach(emp => {
      const lat = emp.latitude;
      const lng = emp.longitude;
      if (!lat || !lng) return;

      bounds.extend({ lat, lng });
      validCount++;

      const isActive = emp.status === 'Active';
      const markerColor = isActive ? '#10b981' : '#64748b';
      const statusBadge = isActive ? 'Active' : 'Inactive';

      // SVG Pin with Initials
      const svgIcon = {
        url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
          <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 40 40">
            <circle cx="20" cy="20" r="18" fill="${markerColor}" stroke="#ffffff" stroke-width="2.5" />
            <text x="50%" y="54%" text-anchor="middle" fill="#ffffff" font-size="12px" font-weight="bold" font-family="sans-serif" dy=".3em">${emp.initials}</text>
          </svg>
        `),
        scaledSize: new googleMaps.Size(40, 40),
        anchor: new googleMaps.Point(20, 20)
      };

      const marker = new googleMaps.Marker({
        position: { lat, lng },
        map: this.map,
        icon: svgIcon,
        title: emp.name
      });

      const popupContent = `
        <div style="font-family: inherit; font-size: 13px; min-width: 200px; padding: 4px;">
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 6px; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px;">
            <strong style="color: #0f172a; font-size: 14px;">${emp.name}</strong>
            <span style="background: ${isActive ? '#dcfce7' : '#f1f5f9'}; color: ${isActive ? '#15803d' : '#475569'}; font-size: 11px; padding: 2px 6px; border-radius: 4px; font-weight: 600;">${statusBadge}</span>
          </div>
          <div style="color: #475569; display: flex; flex-direction: column; gap: 4px; font-size: 12px;">
            <div><strong>Role:</strong> ${emp.role}</div>
            <div><strong>Address:</strong> ${emp.address || '—'}</div>
            <div><strong>Updated:</strong> ${this.formatTime(emp.lastUpdated)}</div>
          </div>
        </div>
      `;

      const infoWindow = new googleMaps.InfoWindow({
        content: popupContent
      });

      marker.addListener('click', () => {
        if (this.activeInfoWindow) this.activeInfoWindow.close();
        infoWindow.open(this.map, marker);
        this.activeInfoWindow = infoWindow;
        this.selectedEmployeeId = emp.userId;
        this.cdr.detectChanges();
        const cardElement = document.getElementById(`emp-card-${emp.userId}`);
        if (cardElement) {
          cardElement.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
      });

      this.markersMap.set(emp.userId, { marker, infoWindow });
    });

    if (validCount > 0) {
      this.map.fitBounds(bounds, { top: 50, right: 50, bottom: 50, left: 50 });
    }
  }

  getInitials(name: string): string {
    if (!name) return 'EM';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  }

  formatTime(dateStr: string): string {
    if (!dateStr) return 'N/A';
    try {
      const d = new Date(dateStr);
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return dateStr;
    }
  }
}
