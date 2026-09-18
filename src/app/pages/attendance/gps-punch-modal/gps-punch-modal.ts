import { Component, EventEmitter, Input, Output, OnInit, OnDestroy, inject, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AttendanceService } from '../attendance.service';
import { GpsTrackingService, GpsLocation } from '../../../services/gps-tracking.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-gps-punch-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './gps-punch-modal.html',
  styleUrl: './gps-punch-modal.css'
})
export class GpsPunchModal implements OnInit, OnDestroy {
  private attendanceService = inject(AttendanceService);
  private gpsTrackingService = inject(GpsTrackingService);

  @Input() isOpen = false;
  @Output() close = new EventEmitter<void>();
  @Output() punched = new EventEmitter<any>();

  @ViewChild('videoElement') videoElement?: ElementRef<HTMLVideoElement>;
  @ViewChild('canvasElement') canvasElement?: ElementRef<HTMLCanvasElement>;

  purpose: string = 'OFFICE-IN';
  comment: string = '';
  selfieImage: string = '';
  isCameraActive = false;
  isSubmitting = false;

  currentLocation: GpsLocation | null = null;
  permissionError: string = '';
  private posSub?: Subscription;
  private errSub?: Subscription;

  purposeOptions = [
    { label: 'OFFICE-IN', value: 'OFFICE-IN' },
    { label: 'OFFICE-OUT', value: 'OFFICE-OUT' },
    { label: 'SITE-IN', value: 'SITE-IN' },
    { label: 'SITE-OUT', value: 'SITE-OUT' },
    { label: 'ON-THE-WAY', value: 'ON-THE-WAY' },
    { label: 'OUT-OF-OFFICE', value: 'OUT-OF-OFFICE' }
  ];

  private mediaStream: MediaStream | null = null;

  ngOnInit(): void {
    this.posSub = this.gpsTrackingService.currentPosition$.subscribe(loc => {
      this.currentLocation = loc;
    });

    this.errSub = this.gpsTrackingService.permissionError$.subscribe(err => {
      this.permissionError = err;
    });

    // Refresh location on modal load
    this.gpsTrackingService.fetchCurrentPosition();
  }

  ngOnDestroy(): void {
    this.posSub?.unsubscribe();
    this.errSub?.unsubscribe();
    this.stopCamera();
  }

  closeModal(): void {
    this.stopCamera();
    this.close.emit();
  }

  // Camera handling for optional selfie
  async startCamera(): Promise<void> {
    try {
      this.isCameraActive = true;
      this.mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } }
      });
      setTimeout(() => {
        if (this.videoElement && this.mediaStream) {
          this.videoElement.nativeElement.srcObject = this.mediaStream;
        }
      }, 200);
    } catch (err) {
      console.warn('Camera access error:', err);
      alert('Camera access unavailable. You can upload a photo instead.');
      this.isCameraActive = false;
    }
  }

  captureSelfie(): void {
    if (!this.videoElement || !this.canvasElement) return;
    const video = this.videoElement.nativeElement;
    const canvas = this.canvasElement.nativeElement;
    canvas.width = video.videoWidth || 320;
    canvas.height = video.videoHeight || 240;

    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      this.selfieImage = canvas.toDataURL('image/jpeg', 0.8);
      this.stopCamera();
    }
  }

  onFileSelected(event: any): void {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.selfieImage = e.target.result;
      };
      reader.readAsDataURL(file);
    }
  }

  removeSelfie(): void {
    this.selfieImage = '';
    this.stopCamera();
  }

  stopCamera(): void {
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach(track => track.stop());
      this.mediaStream = null;
    }
    this.isCameraActive = false;
  }

  submitPunch(): void {
    if (!this.purpose) {
      alert('Please select a Purpose for GPS Punching.');
      return;
    }

    const lat = this.currentLocation?.latitude || 28.5355;
    const lng = this.currentLocation?.longitude || 77.391;

    this.isSubmitting = true;

    this.attendanceService.gpsPunch({
      purpose: this.purpose,
      comment: this.comment,
      latitude: lat,
      longitude: lng,
      selfieImage: this.selfieImage
    }).subscribe({
      next: (res) => {
        this.isSubmitting = false;
        alert(`GPS Punch (${this.purpose}) submitted successfully!`);
        this.punched.emit(res);
        this.closeModal();
      },
      error: (err) => {
        this.isSubmitting = false;
        console.error('GPS Punch error:', err);
        alert(err?.error?.message || 'Failed to submit GPS Punch.');
      }
    });
  }
}
