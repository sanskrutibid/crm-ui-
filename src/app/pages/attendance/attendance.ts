import { GoogleMapsLoaderService } from '../../services/google-maps-loader.service';
import { Component, OnInit, OnDestroy, inject, ChangeDetectorRef, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { AttendanceService, LocationPoint, HoldingPoint, AgentTimeline } from './attendance.service';
import { AuthService } from '../auth/auth.service';

@Component({
  selector: 'app-attendance',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './attendance.html',
  styleUrls: ['./attendance.css']
})
export class AttendanceComponent implements OnInit, OnDestroy {
  private attendanceService = inject(AttendanceService);
  private authService = inject(AuthService);
  private cdr = inject(ChangeDetectorRef);
  private googleMapsLoader = inject(GoogleMapsLoaderService);
  private sanitizer = inject(DomSanitizer);

  mapSecureUrl!: SafeResourceUrl;
  hasSdkMap: boolean = false;

  // User & Date selectors
  currentUserId: string = '';
  selectedUserId: string = '';
  selectedDate: string = new Date().toISOString().split('T')[0];
  agents: any[] = [];
  isPrivileged: boolean = false;

  // Current status
  isPunchedIn: boolean = false;
  currentLat: number | null = null;
  currentLng: number | null = null;
  geoError: string = '';
  loadingStatus: boolean = false;
  trackingActive: boolean = false;
  trackingIntervalId: any = null;

  // Simulator helper (adds minor shifts to coordinates to draw paths)
  simulatedLat: number = 28.5355;
  simulatedLng: number = 77.391;

  // Timeline data
  timeline: AgentTimeline | null = null;
  timelineError: string = '';

  // Map variables
  private map: any = null;
  private mapLayers: any[] = [];

    updateMapSource(lat: number = 21.1458, lng: number = 79.0882, zoom: number = 14): void {
    const url = `https://maps.google.com/maps?q=${lat},${lng}&t=&z=${zoom}&ie=UTF8&iwloc=&output=embed`;
    this.mapSecureUrl = this.sanitizer.bypassSecurityTrustResourceUrl(url);
  }

  ngOnInit(): void {
    this.updateMapSource();
    const user = this.authService.currentUserValue;
    if (user) {
      this.currentUserId = user.id;
      this.selectedUserId = user.id;
      this.isPrivileged = user.role === 'Super Admin' || user.role === 'Admin' || user.role === 'Manager';
    }

    if (typeof window !== 'undefined') {
      const loginLat = localStorage.getItem('vaultstone_login_lat');
      const loginLng = localStorage.getItem('vaultstone_login_lng');
      if (loginLat && loginLng) {
        this.simulatedLat = parseFloat(loginLat);
        this.simulatedLng = parseFloat(loginLng);
      }
    }

    this.initCurrentLocation();
    this.loadAgents();
  }

  loadAgents(): void {
    if (!this.isPrivileged) {
      this.selectedUserId = this.currentUserId;
      this.loadTodayTimeline();
      return;
    }

    this.authService.getAgents().subscribe({
      next: (res: any) => {
        this.agents = res.data || res;
        if (this.agents.length > 0) {
          const isAgent = this.agents.some(a => a.id === this.selectedUserId);
          if (!isAgent) {
            this.selectedUserId = this.agents[0].id;
          }
        }
        this.loadTodayTimeline();
      },
      error: (err) => {
        console.error('Failed to load agents in attendance:', err);
        this.loadTodayTimeline();
      }
    });
  }

  ngOnDestroy(): void {
    this.stopTrackingInterval();
  }

  // Fetch current geolocation coordinates
  initCurrentLocation(): void {
    if (typeof window !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          this.currentLat = position.coords.latitude;
          this.currentLng = position.coords.longitude;
          this.simulatedLat = position.coords.latitude;
          this.simulatedLng = position.coords.longitude;
          this.cdr.detectChanges();
        },
        (error) => {
          this.geoError = 'Geolocation access denied. Using mock coordinates for simulation.';
          console.warn('Geolocation error:', error);
          this.cdr.detectChanges();
        }
      );
    } else {
      this.geoError = 'Geolocation not supported by this browser.';
    }
  }

  // Punch In Action
  punchIn(): void {
    this.loadingStatus = true;
    if (typeof window !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          this.currentLat = position.coords.latitude;
          this.currentLng = position.coords.longitude;
          this.simulatedLat = position.coords.latitude;
          this.simulatedLng = position.coords.longitude;
          this.executePunchIn(this.currentLat, this.currentLng);
        },
        (error) => {
          console.warn('Geolocation failed for punch-in, using simulated coordinates:', error);
          this.executePunchIn(this.simulatedLat, this.simulatedLng);
        },
        { enableHighAccuracy: true }
      );
    } else {
      this.executePunchIn(this.simulatedLat, this.simulatedLng);
    }
  }

  private executePunchIn(lat: number, lng: number): void {
    this.attendanceService.punchIn(lat, lng).subscribe({
      next: (res) => {
        this.isPunchedIn = true;
        this.loadingStatus = false;
        alert('Punched in successfully!');
        this.startTrackingInterval();
        this.loadTodayTimeline();
      },
      error: (err) => {
        this.loadingStatus = false;
        alert(err.error?.message || 'Failed to punch in');
        // If already active today, update state
        if (err.status === 409) {
          this.isPunchedIn = true;
          this.startTrackingInterval();
          this.loadTodayTimeline();
        }
      }
    });
  }

  // Punch Out Action
  punchOut(): void {
    this.loadingStatus = true;
    if (typeof window !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          this.currentLat = position.coords.latitude;
          this.currentLng = position.coords.longitude;
          this.simulatedLat = position.coords.latitude;
          this.simulatedLng = position.coords.longitude;
          this.executePunchOut(this.currentLat, this.currentLng);
        },
        (error) => {
          console.warn('Geolocation failed for punch-out, using simulated coordinates:', error);
          this.executePunchOut(this.simulatedLat, this.simulatedLng);
        },
        { enableHighAccuracy: true }
      );
    } else {
      this.executePunchOut(this.simulatedLat, this.simulatedLng);
    }
  }

  private executePunchOut(lat: number, lng: number): void {
    this.attendanceService.punchOut(lat, lng).subscribe({
      next: (res) => {
        this.isPunchedIn = false;
        this.loadingStatus = false;
        alert('Punched out successfully!');
        this.stopTrackingInterval();
        this.loadTodayTimeline();
      },
      error: (err) => {
        this.loadingStatus = false;
        alert(err.error?.message || 'Failed to punch out');
      }
    });
  }

  // Push manual / simulated coordinate
  pushSimulatedLocation(): void {
    // Generate minor drift (approx 20-100 meters)
    this.simulatedLat += (Math.random() - 0.5) * 0.002;
    this.simulatedLng += (Math.random() - 0.5) * 0.002;

    const lat = this.simulatedLat;
    const lng = this.simulatedLng;

    this.attendanceService.trackLocation(lat, lng).subscribe({
      next: (res) => {
        console.log('Location tracked successfully:', lat, lng);
        this.loadTodayTimeline();
      },
      error: (err) => {
        console.error('Failed to track location:', err);
      }
    });
  }

  // Track actual live location periodically
  trackLiveLocation(): void {
    if (typeof window !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          this.currentLat = position.coords.latitude;
          this.currentLng = position.coords.longitude;
          
          this.attendanceService.trackLocation(this.currentLat, this.currentLng).subscribe({
            next: (res) => {
              console.log('Live location tracked successfully:', this.currentLat, this.currentLng);
              this.loadTodayTimeline();
            },
            error: (err) => {
              console.error('Failed to track live location:', err);
            }
          });
        },
        (error) => {
          console.warn('Live location access error, falling back to simulated drift:', error);
          this.pushSimulatedLocation();
        },
        { enableHighAccuracy: true }
      );
    } else {
      this.pushSimulatedLocation();
    }
  }

  // Timer interval for periodic tracking
  startTrackingInterval(): void {
    if (this.trackingActive) return;
    this.trackingActive = true;
    this.trackLiveLocation(); // initial push

    // Push coordinates every 30 seconds
    this.trackingIntervalId = setInterval(() => {
      this.trackLiveLocation();
    }, 30000);
  }

  stopTrackingInterval(): void {
    this.trackingActive = false;
    if (this.trackingIntervalId) {
      clearInterval(this.trackingIntervalId);
      this.trackingIntervalId = null;
    }
  }

  // Load timeline for selected user and date
  loadTodayTimeline(): void {
    if (!this.selectedUserId) return;
    this.timelineError = '';

    this.attendanceService.getAgentTimeline(this.selectedUserId, this.selectedDate).subscribe({
      next: (res) => {
        this.timeline = res && res.data !== undefined ? res.data : res;
        if (!this.timeline) {
          this.isPunchedIn = false;
          this.timelineError = 'No attendance history found for this date.';
          this.cdr.detectChanges();
          this.clearMap();
          return;
        }
        this.isPunchedIn = this.timeline?.status === 'ACTIVE';
        this.cdr.detectChanges();
        this.initMap();
      },
      error: (err) => {
        this.timeline = null;
        this.isPunchedIn = false;
        this.timelineError = 'No attendance history found for this date.';
        this.cdr.detectChanges();
        this.clearMap();
      }
    });
  }

  private initMap(): void {
    this.googleMapsLoader.load().then((googleMaps: any) => {
      if (!googleMaps) return;

      const mapContainer = document.getElementById('attendance-map');
      if (!mapContainer) return;

      if (!this.map) {
        this.map = new googleMaps.Map(mapContainer, {
          center: { lat: this.simulatedLat, lng: this.simulatedLng },
          zoom: 14,
          mapTypeId: googleMaps.MapTypeId.ROADMAP,
          zoomControl: true,
          streetViewControl: false,
          mapTypeControl: false,
          fullscreenControl: false
        });
      } else {
        this.clearMapLayers();
      }

      const pathPoints = this.timeline?.path || [];
      if (pathPoints.length === 0) return;

      const latLngs = pathPoints.map(p => ({ lat: p.latitude, lng: p.longitude }));

      // Draw path line
      const polyline = new googleMaps.Polyline({
        path: latLngs,
        geodesic: true,
        strokeColor: '#3b82f6',
        strokeOpacity: 0.85,
        strokeWeight: 4,
        map: this.map
      });
      this.mapLayers.push(polyline);

      // Start / Punch-in Marker
      const startLoc = this.timeline?.punchInLocation;
      if (startLoc) {
        const startMarker = new googleMaps.Marker({
          position: { lat: startLoc.latitude, lng: startLoc.longitude },
          map: this.map,
          title: 'Punch In',
          icon: {
            path: googleMaps.SymbolPath.CIRCLE,
            scale: 7,
            fillColor: '#10b981',
            fillOpacity: 1,
            strokeColor: '#ffffff',
            strokeWeight: 2
          }
        });
        const startInfo = new googleMaps.InfoWindow({
          content: '<div style="font-family: inherit; font-size: 12px; padding: 2px;"><strong style="color: #10b981;">● Punch In</strong><br/>Time: ' + new Date(this.timeline!.punchInTime).toLocaleTimeString() + '</div>'
        });
        startMarker.addListener('click', () => startInfo.open(this.map, startMarker));
        this.mapLayers.push(startMarker);
      }

      // End / Punch-out Marker
      const endLoc = this.timeline?.punchOutLocation;
      if (endLoc && this.timeline?.punchOutTime) {
        const endMarker = new googleMaps.Marker({
          position: { lat: endLoc.latitude, lng: endLoc.longitude },
          map: this.map,
          title: 'Punch Out',
          icon: {
            path: googleMaps.SymbolPath.CIRCLE,
            scale: 7,
            fillColor: '#ef4444',
            fillOpacity: 1,
            strokeColor: '#ffffff',
            strokeWeight: 2
          }
        });
        const endInfo = new googleMaps.InfoWindow({
          content: '<div style="font-family: inherit; font-size: 12px; padding: 2px;"><strong style="color: #ef4444;">● Punch Out</strong><br/>Time: ' + new Date(this.timeline!.punchOutTime).toLocaleTimeString() + '</div>'
        });
        endMarker.addListener('click', () => endInfo.open(this.map, endMarker));
        this.mapLayers.push(endMarker);
      }

      // Draw Holding / Stop points
      const holdingPoints = this.timeline?.holdingPoints || [];
      holdingPoints.forEach((stop, index) => {
        const stopCircle = new googleMaps.Circle({
          strokeColor: '#f59e0b',
          strokeOpacity: 0.8,
          strokeWeight: 2,
          fillColor: '#fbbf24',
          fillOpacity: 0.45,
          map: this.map,
          center: { lat: stop.latitude, lng: stop.longitude },
          radius: 30
        });
        const stopMarker = new googleMaps.Marker({
          position: { lat: stop.latitude, lng: stop.longitude },
          map: this.map,
          title: 'Halt #' + (index + 1),
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
          content: '<div style="font-family: inherit; font-size: 12px; padding: 2px;"><strong>Halt #' + (index + 1) + '</strong><br/>Duration: ' + (stop.durationMinutes || 0) + ' mins</div>'
        });
        stopMarker.addListener('click', () => haltInfo.open(this.map, stopMarker));
        this.mapLayers.push(stopCircle, stopMarker);
      });

      // Fit map view bounds
      if (latLngs.length > 0) {
        const bounds = new googleMaps.LatLngBounds();
        latLngs.forEach((pt) => bounds.extend(pt));
        this.map.fitBounds(bounds, { top: 40, right: 40, bottom: 40, left: 40 });
      }
    });
  }

  private clearMapLayers(): void {
    this.mapLayers.forEach(layer => {
      if (layer && typeof layer.setMap === 'function') {
        layer.setMap(null);
      }
    });
    this.mapLayers = [];
  }

  private clearMap(): void {
    if (this.map) {
      this.clearMapLayers();
    }
  }
}
