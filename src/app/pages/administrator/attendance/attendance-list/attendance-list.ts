import { Component, OnInit, OnDestroy, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AttendanceService } from '../../../attendance/attendance.service';
import { AuthService } from '../../../auth/auth.service';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

@Component({
  selector: 'app-attendance-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './attendance-list.html',
  styleUrl: './attendance-list.css'
})
export class AttendanceList implements OnInit, OnDestroy {
  private attendanceService = inject(AttendanceService);
  private authService = inject(AuthService);
  private cdr = inject(ChangeDetectorRef);

  employees: any[] = [];

  // Filters
  filterDate: string = new Date().toISOString().split('T')[0];
  filterDepartment: string = 'All Departments';
  filterStatus: string = 'All';
  searchQuery: string = '';

  // Tracking state
  selectedEmployee: any = null;
  isTrackingOpen: boolean = false;
  totalDistanceKm: number = 0;
  haltCount: number = 0;
  lastUpdateTime: string = '--';

  simulatedPath: any[] = [];
  trackingTimeline: any[] = [];
  zoomedSelfie: string | null = null;

  // Login Details Modal state
  isLoginDetailsOpen = false;
  selectedLoginDetails: any = null;

  // Map variables
  private map: any = null;
  private mapLayers: any[] = [];

  ngOnInit(): void {
    this.loadAttendanceList();
  }

  ngOnDestroy(): void {
    this.clearMapLayers();
    if (this.map) {
      this.map.remove();
      this.map = null;
    }
  }

  loadAttendanceList(): void {
    this.authService.getAgents().subscribe({
      next: (res: any) => {
        const list = res.data || res || [];
        const currentUser = this.authService.currentUserValue;

        if (list.length === 0) {
          this.employees = [];
          this.cdr.detectChanges();
          return;
        }

        // Fetch timeline for each user for the selected date
        const timelineRequests = list.map((usr: any) => {
          const usrId = usr.id || usr._id;
          return this.attendanceService.getAgentTimeline(usrId, this.filterDate).pipe(
            catchError(() => of(null)) // return null if no timeline (Absent)
          );
        });

        forkJoin(timelineRequests as any).subscribe((timelines: any) => {
          this.employees = list.map((usr: any, index: number) => {
            const usrId = usr.id || usr._id;
            const timeline = timelines[index] && timelines[index].data !== undefined ? timelines[index].data : timelines[index];
            const isCurrentUser = currentUser && (currentUser.id === usrId || currentUser.email === usr.email);

            let checkIn = '--';
            let checkOut = '--';
            let hours = '--';
            let status = 'Absent';

            const todayStr = new Date().toISOString().split('T')[0];
            const isToday = this.filterDate === todayStr;

            // Check if there is an active local session for current user
            if (isCurrentUser && isToday) {
              const punchDate = localStorage.getItem('crm_punch_date');
              const isPunchDateMatched = punchDate === todayStr;
              const punchStatus = isPunchDateMatched ? localStorage.getItem('crm_punch_status') : null;
              const localPunches = isPunchDateMatched ? JSON.parse(localStorage.getItem('crm_gps_punches') || '[]') : [];

              if (punchStatus === 'ACTIVE') {
                status = 'Present';
                checkIn = localPunches.length > 0
                  ? new Date(localPunches[localPunches.length - 1].timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                  : '09:00 AM';
              } else if (punchStatus === 'COMPLETED') {
                status = 'Present';
                checkIn = localPunches.length > 0
                  ? new Date(localPunches[localPunches.length - 1].timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                  : '09:00 AM';
                checkOut = localPunches.length > 0
                  ? new Date(localPunches[0].timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                  : '06:00 PM';
                hours = '09:00';
              } else if (timeline) {
                status = 'Present';
                checkIn = timeline.punchInTime ? new Date(timeline.punchInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--';
                checkOut = timeline.punchOutTime ? new Date(timeline.punchOutTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--';
                if (timeline.punchInTime && timeline.punchOutTime) {
                  const diffMs = new Date(timeline.punchOutTime).getTime() - new Date(timeline.punchInTime).getTime();
                  const diffHrs = Math.floor(diffMs / 3600000);
                  const diffMins = Math.floor((diffMs % 3600000) / 60000);
                  hours = `${String(diffHrs).padStart(2, '0')}:${String(diffMins).padStart(2, '0')}`;
                }
              }
            } else if (timeline) {
              if (timeline.manualStatus) {
                status = timeline.manualStatus;
              } else {
                status = 'Present';
                // Check if Late (checked in after 09:15 AM)
                if (timeline.punchInTime) {
                  const pinTime = new Date(timeline.punchInTime);
                  const limitTime = new Date(timeline.punchInTime);
                  limitTime.setHours(9, 15, 0);
                  if (pinTime.getTime() > limitTime.getTime()) {
                    status = 'Late';
                  }
                }
              }

              checkIn = timeline.punchInTime ? new Date(timeline.punchInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--';
              checkOut = timeline.punchOutTime ? new Date(timeline.punchOutTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--';

              // Calculate working hours
              if (timeline.workingHours) {
                hours = timeline.workingHours;
              } else if (timeline.punchInTime && timeline.punchOutTime) {
                const diffMs = new Date(timeline.punchOutTime).getTime() - new Date(timeline.punchInTime).getTime();
                const diffHrs = Math.floor(diffMs / 3600000);
                const diffMins = Math.floor((diffMs % 3600000) / 60000);
                hours = `${String(diffHrs).padStart(2, '0')}:${String(diffMins).padStart(2, '0')}`;
              }
            } else {
              if (usr.status === 'Leave' || usr.status === 'Inactive') {
                status = usr.status;
              } else {
                status = 'Absent';
              }
            }

            return {
              id: usrId,
              name: `${usr.firstName} ${usr.lastName || ''}`,
              department: usr.department || usr.role || 'Sales',
              image: usr.image || 'assets/images/user.png',
              checkIn,
              checkOut,
              hours,
              status,
              personalEmail: usr.email,
              loginDetails: timeline?.loginDetails || null
            };
          });
          this.cdr.detectChanges();
        });
      },
      error: (err) => {
        console.error('Failed to load users for attendance list:', err);
      }
    });
  }

  getFilteredEmployees() {
    return this.employees.filter(emp => {
      const matchDept = this.filterDepartment === 'All Departments' || emp.department.toLowerCase() === this.filterDepartment.toLowerCase();
      const matchStatus = this.filterStatus === 'All' || emp.status.toLowerCase() === this.filterStatus.toLowerCase();
      const matchSearch = !this.searchQuery || emp.name.toLowerCase().includes(this.searchQuery.toLowerCase()) || emp.id.toLowerCase().includes(this.searchQuery.toLowerCase());
      return matchDept && matchStatus && matchSearch;
    });
  }

  viewTracking(emp: any): void {
    if (emp.status === 'Absent' || emp.status === 'Leave') {
      alert(`${emp.name} is marked as ${emp.status} today. No tracking routes are available.`);
      return;
    }

    this.selectedEmployee = emp;
    this.isTrackingOpen = true;
    this.loadTrackingDetails(emp);
  }

  closeTracking(): void {
    this.isTrackingOpen = false;
    this.selectedEmployee = null;
    this.clearMapLayers();
  }

  openLoginDetailsModal(emp: any): void {
    this.selectedLoginDetails = emp;
    this.isLoginDetailsOpen = true;
  }

  closeLoginDetailsModal(): void {
    this.isLoginDetailsOpen = false;
    this.selectedLoginDetails = null;
  }

  loadTrackingDetails(emp: any): void {
    const currentUser = this.authService.currentUserValue;
    const isCurrentUser = !!currentUser && (currentUser.id === emp.id || currentUser.email === emp.personalEmail);

    this.attendanceService.getAgentTimeline(emp.id, this.filterDate).subscribe({
      next: (res: any) => {
        const timeline = res.data || res;
        if (timeline && timeline.path && timeline.path.length > 0) {
          this.trackingTimeline = (timeline.path || []).map((p: any, idx: number) => ({
            id: `PUNCH_${idx}`,
            purpose: idx === 0 ? 'OFFICE-IN' : (idx === timeline.path.length - 1 && timeline.punchOutTime ? 'OFFICE-OUT' : 'WAYPOINT'),
            comment: idx === 0 ? 'Checked In' : (idx === timeline.path.length - 1 && timeline.punchOutTime ? 'Checked Out' : 'Location tracked.'),
            latitude: p.latitude,
            longitude: p.longitude,
            selfieImage: idx === 0 && timeline.punchInLocation?.selfieImage ? timeline.punchInLocation.selfieImage : '',
            timestamp: p.timestamp
          }));

          this.simulatedPath = (timeline.path || []).map((p: any) => ({
            latitude: p.latitude,
            longitude: p.longitude,
            timestamp: p.timestamp
          }));

          this.totalDistanceKm = timeline.totalDistanceKm || 0;
          this.haltCount = timeline.holdingPoints?.length || 0;
          this.lastUpdateTime = timeline.path && timeline.path.length > 0 
            ? new Date(timeline.path[timeline.path.length - 1].timestamp).toLocaleTimeString() 
            : '--';
        } else {
          this.fallbackOrClear(emp, isCurrentUser);
        }
        this.cdr.detectChanges();
        setTimeout(() => this.initTrackingMap(), 100);
      },
      error: (err) => {
        console.error('Failed to load tracking details from backend:', err);
        this.fallbackOrClear(emp, isCurrentUser);
        this.cdr.detectChanges();
        setTimeout(() => this.initTrackingMap(), 100);
      }
    });
  }

  private fallbackOrClear(emp: any, isCurrentUser: boolean): void {
    if (isCurrentUser) {
      // Load real punches and path from localStorage crm_gps_punches
      const localPunches = JSON.parse(localStorage.getItem('crm_gps_punches') || '[]');
      this.trackingTimeline = localPunches.map((p: any) => ({
        id: p.id,
        purpose: p.purpose,
        comment: p.comment || 'Punched in coordinates.',
        latitude: p.latitude,
        longitude: p.longitude,
        selfieImage: p.selfieImage || '',
        timestamp: p.timestamp
      }));

      // Sort chronological
      this.trackingTimeline.sort((a: any, b: any) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

      // Map path
      this.simulatedPath = localPunches.map((p: any) => ({
        latitude: p.latitude,
        longitude: p.longitude,
        timestamp: p.timestamp
      })).reverse();

      this.totalDistanceKm = 2.4; // default mock distance
      this.haltCount = 0;
      this.lastUpdateTime = this.trackingTimeline.length > 0
        ? new Date(this.trackingTimeline[this.trackingTimeline.length - 1].timestamp).toLocaleTimeString()
        : '--';
    } else {
      this.trackingTimeline = [];
      this.simulatedPath = [];
      this.totalDistanceKm = 0;
      this.haltCount = 0;
      this.lastUpdateTime = '--';
    }
  }

  private initTrackingMap(): void {
    this.loadLeaflet().then(() => {
      const L = (window as any).L;
      if (!L) return;

      const mapContainer = document.getElementById('admin-tracking-map');
      if (!mapContainer) return;

      if (!this.map) {
        this.map = L.map('admin-tracking-map').setView([28.5355, 77.391], 14);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; OpenStreetMap contributors'
        }).addTo(this.map);
      } else {
        this.clearMapLayers();
      }

      const pathPoints = this.simulatedPath || [];
      if (pathPoints.length === 0) {
        this.map.setView([28.5355, 77.391], 14);
        return;
      }

      const latLngs = pathPoints.map(p => [p.latitude, p.longitude]);

      // Draw path line
      const polyline = L.polyline(latLngs, { color: '#4f46e5', weight: 5, opacity: 0.8 }).addTo(this.map);
      this.mapLayers.push(polyline);

      // Start / Punch-in Marker
      const startLoc = pathPoints[0];
      if (startLoc) {
        const startIcon = L.divIcon({
          className: 'custom-map-icon start-icon',
          html: `<div style="background-color: #10b981; width: 14px; height: 14px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 5px rgba(0,0,0,0.3);"></div>`
        });
        const startMarker = L.marker([startLoc.latitude, startLoc.longitude], { icon: startIcon })
          .addTo(this.map)
          .bindPopup(`<b>Start Location (Check In)</b><br>${new Date(startLoc.timestamp).toLocaleTimeString()}`);
        this.mapLayers.push(startMarker);
      }

      // End / Punch-out Marker
      if (pathPoints.length > 1 && (this.selectedEmployee.status === 'Present' || this.selectedEmployee.status === 'Late')) {
        const endLoc = pathPoints[pathPoints.length - 1];
        const endIcon = L.divIcon({
          className: 'custom-map-icon end-icon',
          html: `<div style="background-color: #ef4444; width: 14px; height: 14px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 5px rgba(0,0,0,0.3);"></div>`
        });
        const endMarker = L.marker([endLoc.latitude, endLoc.longitude], { icon: endIcon })
          .addTo(this.map)
          .bindPopup(`<b>End Location (Check Out)</b><br>${new Date(endLoc.timestamp).toLocaleTimeString()}`);
        this.mapLayers.push(endMarker);
      }

      // Draw punch events
      this.trackingTimeline.forEach((punch: any, index: number) => {
        let color = '#3b82f6';
        if (punch.purpose.includes('OFFICE-IN')) color = '#10b981';
        if (punch.purpose.includes('OFFICE-OUT')) color = '#ef4444';
        if (punch.purpose.includes('SITE')) color = '#a855f7';
        if (punch.purpose.includes('WAY')) color = '#f59e0b';

        const punchIcon = L.divIcon({
          className: `custom-map-icon punch-${punch.purpose.toLowerCase()}`,
          html: `<div style="background-color: ${color}; width: 20px; height: 20px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 6px rgba(0,0,0,0.4); display: flex; align-items: center; justify-content: center; color: white; font-size: 10px; font-weight: bold;">${index + 1}</div>`
        });

        const marker = L.marker([punch.latitude, punch.longitude], { icon: punchIcon })
          .addTo(this.map)
          .bindPopup(`<b>Event #${index + 1}: ${punch.purpose}</b><br>${new Date(punch.timestamp).toLocaleTimeString()}<br><i>${punch.comment}</i>`);
        this.mapLayers.push(marker);
      });

      // Fit map view bounds
      if (latLngs.length > 0) {
        this.map.fitBounds(L.latLngBounds(latLngs), { padding: [50, 50] });
      }
    });
  }

  private clearMapLayers(): void {
    this.mapLayers.forEach(layer => layer.remove());
    this.mapLayers = [];
  }

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

  zoomSelfie(img: string): void {
    this.zoomedSelfie = img;
  }

  closeZoomSelfie(): void {
    this.zoomedSelfie = null;
  }
}
