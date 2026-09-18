import { CommonModule } from '@angular/common';
import { Component, Input, Output, EventEmitter, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { LeadsService } from '../leads.service';

@Component({
  selector: 'app-followup',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './followup.html',
  styleUrl: './followup.css',
})
export class Followup implements OnInit {
  @Input() leadId = '';
  @Input() leadName = '';
  @Input() leadDetails: any;

  @Output() close = new EventEmitter<void>();
  @Output() followupSaved = new EventEmitter<void>();

  private leadsService = inject(LeadsService);

  currentUpdate = '';
  nextRemark = '';
  nextAction = 'Follow-Up Scheduled';

  scheduleDate = '';
  scheduleTime = '';

  interestedIn = '';
  followupAddress = ''; // UI field not in backend schema, will be logged/merged

  smsReminder = false;
  emailReminder = false;
  termsAccepted = false;

  ngOnInit() {
    if (this.leadDetails) {
      this.interestedIn = this.leadDetails.interestedIn || this.leadDetails.requirement || '';
      this.scheduleDate = this.leadDetails.scheduleDate || this.getTodayDate();
      this.scheduleTime = this.leadDetails.scheduleTime || '14:30';
      this.currentUpdate = this.leadDetails.outcome || '';
      this.nextRemark = this.leadDetails.nextRemark || '';
      this.nextAction = this.leadDetails.purpose || 'Follow-Up Scheduled';
    } else {
      this.scheduleDate = this.getTodayDate();
      this.scheduleTime = '14:30';
    }
  }

  getTodayDate(): string {
    const today = new Date();
    return today.toISOString().split('T')[0];
  }

  saveFollowup() {
    if (!this.leadId) {
      alert('Error: No Lead Selected');
      return;
    }
    if (!this.currentUpdate) {
      alert('Please select current update status');
      return;
    }
    if (!this.nextRemark) {
      alert('Please enter next remark');
      return;
    }
    if (!this.scheduleDate) {
      alert('Please select schedule date');
      return;
    }

    const payload: any = {
      outcome: this.currentUpdate,
      nextRemark: this.nextRemark,
      purpose: this.nextAction,
      scheduleDate: this.scheduleDate,
      scheduleTime: this.scheduleTime,
      interestedIn: this.interestedIn,
    };

    this.leadsService.updateLead(this.leadId, payload).subscribe({
      next: (res) => {
        alert('Followup scheduled successfully!');
        this.followupSaved.emit();
        this.close.emit();
      },
      error: (err) => {
        console.error('Failed to save lead followup:', err);
        const errMsg = err.error?.message || err.message || 'Followup scheduling failed';
        alert('Error: ' + (Array.isArray(errMsg) ? errMsg.join(', ') : errMsg));
      }
    });
  }

  cancel() {
    this.close.emit();
  }
}
