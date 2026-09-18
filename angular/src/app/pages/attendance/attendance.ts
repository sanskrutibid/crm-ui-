import { Component, OnInit, OnDestroy, inject, ChangeDetectorRef, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
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

  ngOnInit(): void {
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

  // Dynamic Leaflet map loader & initializer
  private initMap(): void {
    this.loadLeaflet().then(() => {
      const L = (window as any).L;
      if (!L) return;

      const mapContainer = document.getElementById('attendance-map');
      if (!mapContainer) return;

      // If map is already initialized, clear previous layers instead of recreating it
      if (!this.map) {
        this.map = L.map('attendance-map').setView([this.simulatedLat, this.simulatedLng], 14);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; OpenStreetMap contributors'
        }).addTo(this.map);
      } else {
        this.clearMapLayers();
      }

      const pathPoints = this.timeline?.path || [];
      if (pathPoints.length === 0) return;

      const latLngs = pathPoints.map(p => [p.latitude, p.longitude]);

      // Draw path line
      const polyline = L.polyline(latLngs, { color: '#3b82f6', weight: 4, opacity: 0.8 }).addTo(this.map);
      this.mapLayers.push(polyline);

      // Start / Punch-in Marker
      const startLoc = this.timeline?.punchInLocation;
      if (startLoc) {
        const startIcon = L.divIcon({
          className: 'custom-map-icon start-icon',
          html: `<div style="background-color: #10b981; width: 12px; height: 12px; border-radius: 50%; border: 2px solid white;"></div>`
        });
        const startMarker = L.marker([startLoc.latitude, startLoc.longitude], { icon: startIcon })
          .addTo(this.map)
          .bindPopup(`<b>Punch In</b><br>${new Date(this.timeline!.punchInTime).toLocaleTimeString()}`);
        this.mapLayers.push(startMarker);
      }

      // End / Punch-out Marker
      const endLoc = this.timeline?.punchOutLocation;
      if (endLoc && this.timeline?.punchOutTime) {
        const endIcon = L.divIcon({
          className: 'custom-map-icon end-icon',
          html: `<div style="background-color: #ef4444; width: 12px; height: 12px; border-radius: 50%; border: 2px solid white;"></div>`
        });
        const endMarker = L.marker([endLoc.latitude, endLoc.longitude], { icon: endIcon })
          .addTo(this.map)
          .bindPopup(`<b>Punch Out</b><br>${new Date(this.timeline!.punchOutTime).toLocaleTimeString()}`);
        this.mapLayers.push(endMarker);
      }

      // Draw Holding / Stop points
      const holdingPoints = this.timeline?.holdingPoints || [];
      holdingPoints.forEach((stop, index) => {
        const stopMarker = L.circle([stop.latitude, stop.longitude], {
          color: '#f59e0b',
          fillColor: '#fbbf24',
          fillOpacity: 0.5,
          radius: 30
        }).addTo(this.map)
          .bindPopup(`<b>Halt #${index + 1}</b><br>Duration: ${stop.durationMinutes} mins<br>Time: ${new Date(stop.startTime).toLocaleTimeString()} - ${new Date(stop.endTime).toLocaleTimeString()}`);
        this.mapLayers.push(stopMarker);
      });

      // Fit map view bounds to include all path coordinates
      if (latLngs.length > 0) {
        this.map.fitBounds(L.latLngBounds(latLngs), { padding: [40, 40] });
      }
    });
  }

  private clearMapLayers(): void {
    this.mapLayers.forEach(layer => layer.remove());
    this.mapLayers = [];
  }

  private clearMap(): void {
    if (this.map) {
      this.clearMapLayers();
    }
  }

  // Helper promise loader for Leaflet scripts via CDN
  private loadLeaflet(): Promise<void> {
    if ((window as any).L) {
      return Promise.resolve();
    }
    return new Promise((resolve) => {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(link);

      const script = document.createElement('script');
      script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
      script.onload = () => resolve();
      document.body.appendChild(script);
    });
  }
}
