import { AfterViewInit, Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';
import { AttendanceService } from '../../attendance/attendance.service';
import { AuthService } from '../../auth/auth.service';
import { PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { GoogleMapsLoaderService } from '../../../services/google-maps-loader.service';

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
  private googleMapsLoader = inject(GoogleMapsLoaderService);
  private platformId = inject(PLATFORM_ID);
  private sanitizer = inject(DomSanitizer);

  mapSecureUrl!: SafeResourceUrl;
  hasSdkMap: boolean = false;

  agents: any[] = [];
  selectedUserId: string = '';
  selectedDate: string = new Date().toISOString().split('T')[0];
  totalDistance: number = 0;

  private map: any = null;
  private mapLayers: any[] = [];

    updateMapSource(lat: number = 21.1458, lng: number = 79.0882, zoom: number = 13): void {
    const url = `https://maps.google.com/maps?q=${lat},${lng}&t=&z=${zoom}&ie=UTF8&iwloc=&output=embed`;
    this.mapSecureUrl = this.sanitizer.bypassSecurityTrustResourceUrl(url);
  }

  ngOnInit() {
    this.updateMapSource();
    this.loadAgents();
  }

  async ngAfterViewInit() {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }
    await this.initMap();
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
    } catch (err) {
      console.error('Failed to load Google Maps in time-lines:', err);
    }
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
    this.mapLayers.forEach(layer => {
      if (layer && typeof layer.setMap === 'function') {
        layer.setMap(null);
      }
    });
    this.mapLayers = [];
  }

  private drawRoute(timeline: any) {
    if (!this.map || !timeline || typeof window === 'undefined' || !(window as any).google?.maps) return;
    const googleMaps = (window as any).google.maps;

    const pathPoints = timeline.path || [];
    if (pathPoints.length === 0) return;

    const latLngs = pathPoints.map((p: any) => ({ lat: p.latitude, lng: p.longitude }));

    // Draw route path line
    const polyline = new googleMaps.Polyline({
      path: latLngs,
      geodesic: true,
      strokeColor: '#2563eb',
      strokeOpacity: 0.9,
      strokeWeight: 5,
      map: this.map
    });
    this.mapLayers.push(polyline);

    // Punch In Marker
    const startLoc = timeline.punchInLocation || pathPoints[0];
    if (startLoc) {
      const startMarker = new googleMaps.Marker({
        position: { lat: startLoc.latitude, lng: startLoc.longitude },
        map: this.map,
        title: 'Punch In',
        icon: {
          path: googleMaps.SymbolPath.CIRCLE,
          scale: 8,
          fillColor: '#10b981',
          fillOpacity: 1,
          strokeColor: '#ffffff',
          strokeWeight: 2
        }
      });
      const startInfoWindow = new googleMaps.InfoWindow({
        content: `<div style="font-family: inherit; font-size: 12px; padding: 2px;">
          <strong style="color: #10b981;">● Punch In</strong><br/>
          Time: ${new Date(timeline.punchInTime || Date.now()).toLocaleTimeString()}
        </div>`
      });
      startMarker.addListener('click', () => startInfoWindow.open(this.map, startMarker));
      this.mapLayers.push(startMarker);
    }

    // Punch Out Marker
    const endLoc = timeline.punchOutLocation || pathPoints[pathPoints.length - 1];
    if (endLoc && timeline.punchOutTime) {
      const endMarker = new googleMaps.Marker({
        position: { lat: endLoc.latitude, lng: endLoc.longitude },
        map: this.map,
        title: 'Punch Out',
        icon: {
          path: googleMaps.SymbolPath.CIRCLE,
          scale: 8,
          fillColor: '#ef4444',
          fillOpacity: 1,
          strokeColor: '#ffffff',
          strokeWeight: 2
        }
      });
      const endInfoWindow = new googleMaps.InfoWindow({
        content: `<div style="font-family: inherit; font-size: 12px; padding: 2px;">
          <strong style="color: #ef4444;">● Punch Out</strong><br/>
          Time: ${new Date(timeline.punchOutTime).toLocaleTimeString()}
        </div>`
      });
      endMarker.addListener('click', () => endInfoWindow.open(this.map, endMarker));
      this.mapLayers.push(endMarker);
    }

    // Halt markers
    const holdingPoints = timeline.holdingPoints || [];
    holdingPoints.forEach((stop: any, index: number) => {
      const stopCircle = new googleMaps.Circle({
        strokeColor: '#f59e0b',
        strokeOpacity: 0.8,
        strokeWeight: 2,
        fillColor: '#fbbf24',
        fillOpacity: 0.45,
        map: this.map,
        center: { lat: stop.latitude, lng: stop.longitude },
        radius: 35
      });
      const stopMarker = new googleMaps.Marker({
        position: { lat: stop.latitude, lng: stop.longitude },
        map: this.map,
        title: `Halt #${index + 1}`,
        icon: {
          path: googleMaps.SymbolPath.CIRCLE,
          scale: 5,
          fillColor: '#f59e0b',
          fillOpacity: 1,
          strokeColor: '#ffffff',
          strokeWeight: 1.5
        }
      });
      const haltInfo = new googleMaps.InfoWindow({
        content: `<div style="font-family: inherit; font-size: 12px; padding: 2px;">
          <strong>Halt #${index + 1}: ${stop.label || 'Stop'}</strong><br/>
          Duration: ${stop.durationMinutes || 0} mins
        </div>`
      });
      stopMarker.addListener('click', () => haltInfo.open(this.map, stopMarker));
      this.mapLayers.push(stopCircle, stopMarker);
    });

    if (latLngs.length > 0) {
      const bounds = new googleMaps.LatLngBounds();
      latLngs.forEach((pt: any) => bounds.extend(pt));
      this.map.fitBounds(bounds, { top: 40, right: 40, bottom: 40, left: 40 });
    }
  }
}