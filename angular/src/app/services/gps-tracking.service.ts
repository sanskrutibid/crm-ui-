import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { AttendanceService } from '../pages/attendance/attendance.service';

export interface GpsLocation {
  latitude: number;
  longitude: number;
  accuracy?: number;
  timestamp: number;
  address?: string;
}

@Injectable({
  providedIn: 'root'
})
export class GpsTrackingService {
  private attendanceService = inject(AttendanceService);

  private watchId: number | null = null;
  private trackingIntervalId: any = null;

  private currentPositionSubject = new BehaviorSubject<GpsLocation | null>(null);
  public currentPosition$: Observable<GpsLocation | null> = this.currentPositionSubject.asObservable();

  private trackingActiveSubject = new BehaviorSubject<boolean>(false);
  public trackingActive$: Observable<boolean> = this.trackingActiveSubject.asObservable();

  private permissionErrorSubject = new BehaviorSubject<string>('');
  public permissionError$: Observable<string> = this.permissionErrorSubject.asObservable();

  constructor() {}

  public startTracking(): void {
    if (typeof window === 'undefined' || !navigator.geolocation) {
      this.permissionErrorSubject.next('Geolocation is not supported by your browser.');
      return;
    }

    this.permissionErrorSubject.next('');
    this.trackingActiveSubject.next(true);

    // Initial position fetch
    this.fetchCurrentPosition();

    // Start watchPosition for real-time continuous movement updates
    if (this.watchId === null) {
      this.watchId = navigator.geolocation.watchPosition(
        (pos) => {
          const location: GpsLocation = {
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
            accuracy: pos.coords.accuracy,
            timestamp: pos.timestamp
          };
          this.currentPositionSubject.next(location);
          this.permissionErrorSubject.next('');
        },
        (err) => {
          console.warn('GPS WatchPosition warning:', err.message);
          if (err.code === err.PERMISSION_DENIED) {
            this.permissionErrorSubject.next('Google Location permission denied. Please allow location access in your browser.');
          }
        },
        {
          enableHighAccuracy: true,
          maximumAge: 10000,
          timeout: 20000
        }
      );
    }

    // Interval to periodically sync live location coordinates to Attendance API (every 30 seconds)
    if (!this.trackingIntervalId) {
      this.trackingIntervalId = setInterval(() => {
        const current = this.currentPositionSubject.value;
        if (current) {
          this.attendanceService.trackLocation(current.latitude, current.longitude).subscribe({
            next: () => console.log('Continuous background GPS synced successfully'),
            error: (err) => console.warn('Background GPS sync notice:', err?.message || err)
          });
        }
      }, 30000);
    }
  }

  public stopTracking(): void {
    if (typeof window !== 'undefined' && navigator.geolocation && this.watchId !== null) {
      navigator.geolocation.clearWatch(this.watchId);
      this.watchId = null;
    }

    if (this.trackingIntervalId) {
      clearInterval(this.trackingIntervalId);
      this.trackingIntervalId = null;
    }

    this.trackingActiveSubject.next(false);
    this.currentPositionSubject.next(null);
  }

  public fetchCurrentPosition(): Promise<GpsLocation> {
    return new Promise((resolve, reject) => {
      if (typeof window === 'undefined' || !navigator.geolocation) {
        const loginLat = localStorage.getItem('vaultstone_login_lat');
        const loginLng = localStorage.getItem('vaultstone_login_lng');
        const fallbackLat = loginLat ? parseFloat(loginLat) : 28.5355;
        const fallbackLng = loginLng ? parseFloat(loginLng) : 77.391;
        const fallback = { latitude: fallbackLat, longitude: fallbackLng, accuracy: 10, timestamp: Date.now() };
        this.currentPositionSubject.next(fallback);
        resolve(fallback);
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const location: GpsLocation = {
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
            accuracy: pos.coords.accuracy,
            timestamp: pos.timestamp
          };
          this.currentPositionSubject.next(location);
          this.permissionErrorSubject.next('');
          resolve(location);
        },
        (err) => {
          console.warn('Geolocation getCurrentPosition failed:', err.message);
          this.permissionErrorSubject.next('Failed to retrieve current location coordinates.');
          const loginLat = localStorage.getItem('vaultstone_login_lat');
          const loginLng = localStorage.getItem('vaultstone_login_lng');
          const fallbackLat = loginLat ? parseFloat(loginLat) : 28.5355;
          const fallbackLng = loginLng ? parseFloat(loginLng) : 77.391;
          const lastLoc = this.currentPositionSubject.value || { latitude: fallbackLat, longitude: fallbackLng, accuracy: 15, timestamp: Date.now() };
          resolve(lastLoc);
        },
        { enableHighAccuracy: true, timeout: 15000 }
      );
    });
  }
}
