import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';
import { AuthService } from '../../../auth/auth.service';
import { AttendanceService } from '../../../attendance/attendance.service';

@Component({
  selector: 'app-attendance-mark',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule
  ],
  templateUrl: './attendance-mark.html',
  styleUrl: './attendance-mark.css'
})
export class AttendanceMark implements OnInit {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private attendanceService = inject(AttendanceService);

  attendanceForm: FormGroup;
  users: any[] = [];

  constructor() {
    this.attendanceForm = this.fb.group({
      employee: ['', Validators.required],
      date: [new Date().toISOString().split('T')[0], Validators.required],
      status: ['Present'],
      checkIn: ['09:00'],
      checkOut: ['18:00'],
      workingHours: ['09:00'],
      lateBy: ['00:00'],
      remarks: ['']
    });
  }

  ngOnInit(): void {
    this.authService.getAgents().subscribe({
      next: (res: any) => {
        const list = res.data || res || [];
        this.users = list.map((usr: any) => ({
          id: usr.id || usr._id,
          name: `${usr.firstName} ${usr.lastName || ''}`
        }));
      },
      error: (err) => {
        console.error('Failed to load users for marking attendance:', err);
      }
    });

    // Listen to changes to calculate working hours and late-by times
    this.attendanceForm.get('checkIn')?.valueChanges.subscribe(() => this.calculateTimes());
    this.attendanceForm.get('checkOut')?.valueChanges.subscribe(() => this.calculateTimes());
    this.attendanceForm.get('status')?.valueChanges.subscribe((status) => {
      if (status === 'Absent' || status === 'Leave') {
        this.attendanceForm.patchValue({
          checkIn: '',
          checkOut: '',
          workingHours: '',
          lateBy: ''
        }, { emitEvent: false });
      } else {
        const checkIn = this.attendanceForm.get('checkIn')?.value || '09:00';
        const checkOut = this.attendanceForm.get('checkOut')?.value || '18:00';
        this.attendanceForm.patchValue({
          checkIn: checkIn || '09:00',
          checkOut: checkOut || '18:00'
        }, { emitEvent: false });
        this.calculateTimes();
      }
    });
  }

  calculateTimes(): void {
    const status = this.attendanceForm.get('status')?.value;
    if (status === 'Absent' || status === 'Leave') {
      return;
    }

    const checkIn = this.attendanceForm.get('checkIn')?.value;
    const checkOut = this.attendanceForm.get('checkOut')?.value;

    if (checkIn) {
      const [inH, inM] = checkIn.split(':').map(Number);
      const inMinutes = inH * 60 + inM;
      const standardMinutes = 9 * 60; // 09:00 AM

      if (inMinutes > standardMinutes) {
        const diff = inMinutes - standardMinutes;
        const h = Math.floor(diff / 60);
        const m = diff % 60;
        this.attendanceForm.patchValue({
          lateBy: `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
        }, { emitEvent: false });
      } else {
        this.attendanceForm.patchValue({
          lateBy: '00:00'
        }, { emitEvent: false });
      }
    }

    if (checkIn && checkOut) {
      const [inH, inM] = checkIn.split(':').map(Number);
      const [outH, outM] = checkOut.split(':').map(Number);

      const inMin = inH * 60 + inM;
      let outMin = outH * 60 + outM;

      if (outMin < inMin) {
        outMin += 24 * 60; // next day
      }

      const diff = outMin - inMin;
      const h = Math.floor(diff / 60);
      const m = diff % 60;

      this.attendanceForm.patchValue({
        workingHours: `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
      }, { emitEvent: false });
    }
  }

  saveAttendance() {
    if (this.attendanceForm.invalid) {
      this.attendanceForm.markAllAsTouched();
      return;
    }

    const formVal = this.attendanceForm.value;
    const payload = {
      userId: formVal.employee,
      date: formVal.date,
      status: formVal.status,
      checkIn: formVal.checkIn || undefined,
      checkOut: formVal.checkOut || undefined,
      workingHours: formVal.workingHours || undefined,
      lateBy: formVal.lateBy || undefined,
      remarks: formVal.remarks || undefined
    };

    this.attendanceService.saveManualAttendance(payload).subscribe({
      next: (res) => {
        alert('Attendance Manually Saved Successfully!');
        this.attendanceForm.reset({
          employee: '',
          date: new Date().toISOString().split('T')[0],
          status: 'Present',
          checkIn: '09:00',
          checkOut: '18:00',
          workingHours: '09:00',
          lateBy: '00:00',
          remarks: ''
        });
      },
      error: (err) => {
        console.error('Failed to save manual attendance:', err);
        alert('Failed to save attendance: ' + (err.error?.message || err.message));
      }
    });
  }
}