import { Component, Input, Output, EventEmitter, OnInit, inject, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { OpportunitiesService } from '../../../opportunities.service';

@Component({
  selector: 'app-opportunity-followup',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './opportunity-followup.html',
  styleUrl: './opportunity-followup.css',
})
export class OpportunityFollowup implements OnInit {
  @Input() opportunityId = '';
  @Input() opportunityDetails: any;
  @Output() close = new EventEmitter<void>();
  @Output() followupSaved = new EventEmitter<void>();

  private opportunitiesService = inject(OpportunitiesService);

  currentUpdate: string = '';
  nextRemark: string = '';
  nextAction: string = 'Initiated';
  scheduleDate: string = '';
  scheduleTime: string = '';
  score: number = 0;
  address: string = '';

  smsReminder = false;
  emailReminder = false;
  propertyAlert = false;
  stayOnPage = false;

  interestedList: string[] = [
    'ASP OL Media',
    'IT Park',
    '3000 Sqft'
  ];

  currentUpdates = [
    'Reschedule Follow-up',
    'Conversation done',
    'Conversation done(via WhatsApp)',
    'Phone not reachable',
    'Phone is ringing',
    'Disconnecting call',
    'Call me later'
  ];

  nextActions = [
    { label: 'Initiated', score: 0 },
    { label: 'General Follow-Up', score: 25 },
    { label: 'Office visits[Meeting]', score: 26 },
    { label: 'Inspection [Site Visit Planned]', score: 50 },
    { label: 'Inspection [Site Visit Completed]', score: 75 },
    { label: 'Finalization [Site Visit Completed]', score: 75 },
    { label: 'Completed', score: 100 }
  ];

  // Interested In multi-select options
  showInterestedDropdown = false;
  interestedSearchQuery = '';
  interestedInOptions = [
    'Residential Apartment', 'Residential Independent House / Villa', 'Residential Independent / Builder Floor',
    'Residential Studio Apartment', 'Residential Farm House', 'Guest house/ banquet hall', 'Residential Row House',
    'Residential Twin Bungalow', 'Residential Twin Apartment', 'Residential Duplex', 'Residential Terrace',
    'Residential Penthouse', 'Residential Tenement', 'Residential Bungalow', 'Residential Triplex',
    'Residential basement', 'Residential Row Villa', 'Weekend Villa', 'Residential Building', 'Sky Villa',
    'Commercial Serviced Apartment', 'Commercial Shop', 'Commercial Showroom', 'Commercial Office/Space',
    'Commercial Time share', 'Commercial Space in Retail Mall', 'Commercial Office in Business Park',
    'Commercial Office in IT Park', 'Commercial Business centre', 'Commercial Hotel/ Resort',
    'Commercial Financial Institution', 'Commercial Medical/Hospital  Premise', 'Corporate House',
    'Commercial Institutes', 'Commercial Labor Camp', 'Commercial Chemical Zone', 'Commercial Restaurant',
    'Commercial Flat', 'Commercial Terrace Restaurant', 'Commercial Education Institutes', 'Commercial Built to Suit',
    'Home Stay', 'Commercial Multiplex', 'Commercial basement', 'Commercial bungalow', 'Co-Working Office Spaces',
    'Commercial Shop Cum Office Spaces(SCO)', 'Commercial Shop Cum Flat(SCF)', 'Commercial Booth',
    'Commercial Bay Shop', 'Commercial Building', 'PG', 'Special Economic Zone (SEZ)', 'Cloud Kitchen',
    'Institutional Building', 'Corporate Building', 'Educational Building', 'Hostels', 'Industrial Cold storage',
    'Industrial Factory', 'Industrial Manufacturing', 'Warehouse/Godown', 'Industrial Building', 'Industrial Shed/Gala',
    'Residential  Land / Plot', 'Commercial  Land / Plot', 'Industrial Land / Plot', 'Agricultural Farm/Land',
    'Transfer of Development Rights (TDR)', 'Party Plot', 'Amenity Land', 'Institutional Plot', 'Corporate Plots',
    'Open Plot', 'Villa Plot'
  ];

  constructor() {
    const today = new Date();
    this.scheduleDate = today.toISOString().substring(0, 10);
    this.scheduleTime = this.getCurrentTime();
  }

  ngOnInit() {
    if (this.opportunityDetails) {
      this.nextAction = this.opportunityDetails.schedulePurpose || 'Initiated';
      this.scheduleDate = this.opportunityDetails.scheduleDate ? this.opportunityDetails.scheduleDate.split('T')[0] : this.scheduleDate;
      this.scheduleTime = this.opportunityDetails.scheduleTime || this.scheduleTime;
      this.address = this.opportunityDetails.scheduleWhere || this.opportunityDetails.whereFollowup || '';
      
      const remark = this.opportunityDetails.scheduleRemark || this.opportunityDetails.remark || '';
      if (remark.includes(' - ')) {
        const parts = remark.split(' - ');
        if (this.currentUpdates.includes(parts[0])) {
          this.currentUpdate = parts[0];
          this.nextRemark = parts.slice(1).join(' - ');
        } else {
          this.currentUpdate = 'Reschedule Follow-up';
          this.nextRemark = remark;
        }
      } else {
        this.currentUpdate = 'Reschedule Follow-up';
        this.nextRemark = remark;
      }

      this.smsReminder = !!this.opportunityDetails.sendWhatsAppToCustomer;
      this.emailReminder = !!this.opportunityDetails.sendEmailToCustomer;
      this.propertyAlert = !!this.opportunityDetails.matchingAlert;

      if (this.opportunityDetails.keyword) {
        this.interestedList = this.opportunityDetails.keyword.split(',').map((x: string) => x.trim()).filter((x: string) => !!x);
      }

      this.onNextActionChange();
    }
  }

  getCurrentTime(): string {
    const date = new Date();
    let hours = date.getHours();
    let minutes = date.getMinutes();
    const hh = hours < 10 ? '0' + hours : hours;
    const mm = minutes < 10 ? '0' + minutes : minutes;
    return `${hh}:${mm}`;
  }

  removeTag(index: number) {
    this.interestedList.splice(index, 1);
  }

  addTag(tag: string) {
    if (tag && !this.interestedList.includes(tag)) {
      this.interestedList.push(tag);
    }
  }

  get filteredInterestedOptions(): string[] {
    if (!this.interestedSearchQuery) {
      return this.interestedInOptions;
    }
    const q = this.interestedSearchQuery.toLowerCase();
    return this.interestedInOptions.filter(opt => opt.toLowerCase().includes(q));
  }

  toggleInterestedOption(opt: string) {
    if (this.interestedList.includes(opt)) {
      const index = this.interestedList.indexOf(opt);
      this.interestedList.splice(index, 1);
    } else {
      this.interestedList.push(opt);
    }
  }

  addCustomTag(event: any) {
    event.preventDefault();
    const val = this.interestedSearchQuery.trim();
    if (val) {
      if (!this.interestedList.includes(val)) {
        this.interestedList.push(val);
      }
      this.interestedSearchQuery = '';
    }
  }

  onNextActionChange() {
    const matched = this.nextActions.find(a => a.label === this.nextAction);
    this.score = matched ? matched.score : 0;
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    const target = event.target as HTMLElement;
    if (!target.closest('.interested-in-container')) {
      this.showInterestedDropdown = false;
    }
  }

  scheduleFollowup() {
    if (!this.opportunityId) {
      alert('Error: No opportunity selected.');
      return;
    }
    if (!this.currentUpdate) {
      alert('Please select current update status.');
      return;
    }
    if (!this.nextRemark) {
      alert('Please enter next remark.');
      return;
    }

    const payload: any = {
      schedulePurpose: this.nextAction,
      scheduleRemark: this.currentUpdate ? `${this.currentUpdate} - ${this.nextRemark}` : this.nextRemark,
      scheduleDate: this.scheduleDate,
      scheduleTime: this.scheduleTime,
      scheduleWhere: this.address,
      keyword: this.interestedList.join(', '),
      sendWhatsAppToCustomer: this.smsReminder,
      sendEmailToCustomer: this.emailReminder,
      matchingAlert: this.propertyAlert
    };

    this.opportunitiesService.updateOpportunity(this.opportunityId, payload).subscribe({
      next: (res) => {
        alert('Follow-up Scheduled Successfully!');
        this.followupSaved.emit();
        if (!this.stayOnPage) {
          this.close.emit();
        }
      },
      error: (err) => {
        console.error('Failed to schedule followup:', err);
        const errMsg = err.error?.message || err.message || 'Failed to schedule followup. Please try again.';
        alert('Error: ' + (Array.isArray(errMsg) ? errMsg.join(', ') : errMsg));
      }
    });
  }

  cancel() {
    this.close.emit();
  }
}