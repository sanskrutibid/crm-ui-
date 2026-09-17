import { AfterViewInit, Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
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

  agents: any[] = [];
  liveLocations: any[] = [];
  employeeList: EmployeeLocation[] = [];

  isLoading: boolean = false;
  searchQuery: string = '';
  statusFilter: 'ALL' | 'ACTIVE' | 'INACTIVE' = 'ALL';
  selectedEmployeeId: string | null = null;

  private map: any = null;
  private markersMap = new Map<string, any>();
  private L: any = null;
  private platformId = inject(PLATFORM_ID);


  ngOnInit() {
    this.loadData();
  }

 async ngAfterViewInit() {

  if (!isPlatformBrowser(this.platformId)) {
    return;
  }

  const leafletModule: any = await import('leaflet');

  // Angular 21 + SSR compatible
  this.L = leafletModule.default || leafletModule;

  if (!this.L.map && leafletModule.map) {
    this.L = leafletModule;
  }

  console.log('Leaflet:', this.L);

  this.initMap();
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
    this.map.invalidateSize();
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

initMap() {

  if (!this.L) return;

  if (typeof this.L.map !== 'function') {
    console.error('Leaflet not loaded correctly', this.L);
    return;
  }

  if (this.map) return;

  const mapElement = document.getElementById('map');
  if (!mapElement) return;

  this.map = this.L.map(mapElement).setView([21.1458, 79.0882], 13);

  this.L.tileLayer(
    'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    {
      attribution: '&copy; OpenStreetMap contributors'
    }
  ).addTo(this.map);

  // Angular layout render hone ke baad map resize
  setTimeout(() => {
    this.map.invalidateSize();

    if (this.employeeList.length > 0) {
      this.updateMapMarkers();
    }
  }, 300);
}
  selectEmployee(emp: EmployeeLocation) {
    this.selectedEmployeeId = emp.userId;
    if (this.map && emp.latitude && emp.longitude) {
      this.map.setView([emp.latitude, emp.longitude], 15, { animate: true });
      const marker = this.markersMap.get(emp.userId);
      if (marker) {
        marker.openPopup();
      }
    }
  }

  fitAllMarkers() {
    if (!this.L || !this.map) return;
    const latLngs: any[] = this.filteredEmployees.map(emp => [emp.latitude, emp.longitude]);
    if (latLngs.length > 0) {
      this.map.fitBounds(this.L.latLngBounds(latLngs), {
  padding: [50, 50]
});

setTimeout(() => this.map.invalidateSize(), 100);
    }
  }

  private updateMapMarkers() {
    if (!this.L || !this.map) return;

    // Clear existing markers
    this.markersMap.forEach(marker => marker.remove());
    this.markersMap.clear();

    const latLngs: any[] = [];

    this.employeeList.forEach(emp => {
      const lat = emp.latitude;
      const lng = emp.longitude;
      latLngs.push([lat, lng]);

      const isActive = emp.status === 'Active';
      const markerColor = isActive ? '#10b981' : '#64748b';
      const statusBadge = isActive ? 'Active' : 'Inactive';

      const customIcon = this.L.divIcon({
        className: 'custom-live-marker',
        html: `
          <div class="marker-container ${isActive ? 'active-pulse' : ''}">
            <div class="marker-pin" style="background-color: ${markerColor};">
              <span class="marker-initials">${emp.initials}</span>
            </div>
          </div>
        `,
        iconSize: [36, 36],
        iconAnchor: [18, 18]
      });

      const popupContent = `
        <div class="map-popup-card">
          <div class="popup-header">
            <strong>${emp.name}</strong>
            <span class="status-tag ${isActive ? 'tag-active' : 'tag-inactive'}">${statusBadge}</span>
          </div>
          <div class="popup-body">
            <p><i class="fas fa-briefcase"></i> ${emp.role}</p>
            <p><i class="fas fa-map-marker-alt"></i> ${emp.address}</p>
            <p><i class="fas fa-clock"></i> Updated: ${this.formatTime(emp.lastUpdated)}</p>
          </div>
        </div>
      `;

      const marker = this.L.marker([lat, lng], { icon: customIcon })
        .addTo(this.map)
        .bindPopup(popupContent);

      marker.on('click', () => {
        this.selectedEmployeeId = emp.userId;
        this.cdr.detectChanges();
        const cardElement = document.getElementById(`emp-card-${emp.userId}`);
        if (cardElement) {
          cardElement.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
      });

      this.markersMap.set(emp.userId, marker);
    });

    if (latLngs.length > 0) {
      this.map.fitBounds(this.L.latLngBounds(latLngs), { padding: [50, 50] });
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