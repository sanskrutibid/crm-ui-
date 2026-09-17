import { AfterViewInit, Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AttendanceService } from '../../attendance/attendance.service';
import { AuthService } from '../../auth/auth.service';
import { PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

@Component({
  selector: 'app-time-lines',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './time-lines.html',
  styleUrls: ['./time-lines.css']
})
export class TimeLines implements OnInit, AfterViewInit {
  private attendanceService = inject(AttendanceService);
  private authService = inject(AuthService);
  private cdr = inject(ChangeDetectorRef);

  agents: any[] = [];
  selectedUserId: string = '';
  selectedDate: string = new Date().toISOString().split('T')[0];
  totalDistance: number = 0;

  private map: any = null;
  private mapLayers: any[] = [];
  private platformId = inject(PLATFORM_ID);
private L: any = null;

  ngOnInit() {
    this.loadAgents();
  }

async ngAfterViewInit() {

  if (!isPlatformBrowser(this.platformId)) {
    return;
  }

  const leafletModule: any = await import('leaflet');

  // Angular 21 + Vite compatibility
  this.L = leafletModule.default || leafletModule;

  // Agar default ke andar map nahi hai to module hi use karo
  if (!this.L.map && leafletModule.map) {
    this.L = leafletModule;
  }

  console.log('Leaflet:', this.L);

  this.initMap();
}

  loadAgents() {
    this.authService.getAgents().subscribe({
      next: (res: any) => {
        this.agents = res.data || res;
        if (this.agents.length > 0) {
          this.selectedUserId = this.agents[0].id;
        }
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        console.error('Failed to load agents:', err);
      }
    });
  }

initMap() {

  if (!this.L) {
    console.error('Leaflet not loaded');
    return;
  }

  if (typeof this.L.map !== 'function') {
    console.error('Leaflet map function missing', this.L);
    return;
  }

  if (this.map) return;

  const mapElement = document.getElementById('map');
  if (!mapElement) return;

  this.map = this.L.map(mapElement).setView([21.1458,79.0882],13);

  this.L.tileLayer(
    'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    {
      attribution:'© OpenStreetMap'
    }
  ).addTo(this.map);
}

  searchTimeline() {
    if (!this.selectedUserId || !this.selectedDate) return;

    this.clearMapLayers();

    this.attendanceService.getAgentTimeline(this.selectedUserId, this.selectedDate).subscribe({
      next: (res: any) => {
        const timeline = res && res.data !== undefined ? res.data : res;
        this.totalDistance = timeline ? (timeline.totalDistanceKm || 0) : 0;
        this.drawRoute(timeline);
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        console.error('Failed to load timeline:', err);
        this.totalDistance = 0;
        this.cdr.detectChanges();
      }
    });
  }

  private clearMapLayers() {
    this.mapLayers.forEach(layer => layer.remove());
    this.mapLayers = [];
  }

  private drawRoute(timeline: any) {
    if (!this.L || !this.map || !timeline) return;

    const pathPoints = timeline.path || [];
    if (pathPoints.length === 0) return;

    const latLngs = pathPoints.map((p: any) => [p.latitude, p.longitude]);

    // Draw path line
    const polyline = this.L.polyline(latLngs, {
      color: '#1976d2',
      weight: 5
    }).addTo(this.map);
    this.mapLayers.push(polyline);

    // Punch In Marker
    const startLoc = timeline.punchInLocation || pathPoints[0];
    if (startLoc) {
      const startMarker = this.L.marker([startLoc.latitude, startLoc.longitude])
        .addTo(this.map)
        .bindPopup(`<b>Punch In</b><br>Time: ${new Date(timeline.punchInTime).toLocaleTimeString()}`);
      this.mapLayers.push(startMarker);
    }

    // Punch Out Marker
    const endLoc = timeline.punchOutLocation || pathPoints[pathPoints.length - 1];
    if (endLoc && timeline.punchOutTime) {
      const endMarker = this.L.marker([endLoc.latitude, endLoc.longitude])
        .addTo(this.map)
        .bindPopup(`<b>Punch Out</b><br>Time: ${new Date(timeline.punchOutTime).toLocaleTimeString()}`);
      this.mapLayers.push(endMarker);
    }

    // Halt markers
    const holdingPoints = timeline.holdingPoints || [];
    holdingPoints.forEach((stop: any, index: number) => {
      const stopMarker = this.L.circle([stop.latitude, stop.longitude], {
        color: '#f59e0b',
        fillColor: '#fbbf24',
        fillOpacity: 0.5,
        radius: 30
      }).addTo(this.map)
        .bindPopup(`<b>Halt #${index + 1}: ${stop.label || 'Stop'}</b><br>Duration: ${stop.durationMinutes} mins`);
      this.mapLayers.push(stopMarker);
    });

    if (latLngs.length > 0) {
      this.map.fitBounds(this.L.latLngBounds(latLngs), { padding: [40, 40] });
    }
  }
}