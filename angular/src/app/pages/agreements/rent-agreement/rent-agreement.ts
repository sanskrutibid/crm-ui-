import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { RentAgreementService } from '../rent-agreement.service';

interface RentAgreements {
  id: number;
  type: string;
  position: string;
  building?: string;
  tenant: { firstName: string; lastName: string };
  inNameOf: string;
  property: any;
  agreementDate: string;
  validTo: string;
  crNumber: string;
  rentPerMonth: number;
  securityDeposit: number;
  registrationCost: number;
  brokerage: number;
  documentationCharges: number;
  stampDuty: number;
  otherExpense: number;
  furnitureFixtures: number;
  legalChargesPaidBy: string;
  rentReminderDay: string;
  termsConditions: string;
  alertLandlord: boolean;
  alertTenant: boolean;
  smsReminder: boolean;
  sendSmsRentReminderToTenant: boolean; 
}

@Component({
  selector: 'app-rent-agreement-list',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './rent-agreement.html',
  styleUrls: ['./rent-agreement.css']
})
export class RentAgreement implements OnInit {
  totalRecords: number = 0;
  selectedAgreement: any = null; 
  tenantName?: string;
  sendSmsRentReminderToTenant?: boolean;

  private router = inject(Router);
  private rentAgreementService = inject(RentAgreementService);

  agreements: RentAgreements[] = [
    {
      id: 1,
      type: 'Success',
      position: 'Top Right',
      tenant: { firstName: 'Jethalal', lastName: 'Gada' },
      inNameOf: 'Champaklal Gada',
      property: { name: 'Gokul Dham - Apartment 102' },
      agreementDate: '2026-01-15',
      validTo: '2027-01-14',
      crNumber: 'CR77210',
      rentPerMonth: 25000,
      securityDeposit: 75000,
      registrationCost: 3000,
      brokerage: 12500,
      documentationCharges: 1000,
      stampDuty: 5000,
      otherExpense: 1500,
      furnitureFixtures: 0,
      legalChargesPaidBy: 'Equally',
      rentReminderDay: '5th Day',
      termsConditions: '1. Rent must be paid on or before the due date.',
      alertLandlord: true,
      alertTenant: true,
      smsReminder: true,
      sendSmsRentReminderToTenant: true 
    },
    {
      id: 2,
      type: 'Success',
      position: 'Top Right',
      tenant: { firstName: 'Taarak', lastName: 'Mehta' },
      inNameOf: 'Anjali Mehta',
      property: { name: 'Gokul Dham - Apartment 103' },
      agreementDate: '2026-03-01',
      validTo: '2029-02-28',
      crNumber: 'CR88450',
      rentPerMonth: 32000,
      securityDeposit: 100000,
      registrationCost: 3500,
      brokerage: 16000,
      documentationCharges: 1200,
      stampDuty: 7000,
      otherExpense: 0,
      furnitureFixtures: 5000,
      legalChargesPaidBy: 'Tenant/Licensee',
      rentReminderDay: '1st Day',
      termsConditions: 'No structural changes allowed in the flat.',
      alertLandlord: true,
      alertTenant: false,
      smsReminder: true,
      sendSmsRentReminderToTenant: false 
    }
  ];

  constructor() {}

  ngOnInit(): void {
    this.loadRentAgreements();
  }

  loadRentAgreements(search: string = ''): void {
    this.rentAgreementService.getRentAgreements({ search, limit: 1000 }).subscribe({
      next: (res: any) => {
        const payload = res.data || res;
        this.agreements = payload.rentAgreements || [];
        this.totalRecords = payload.total || this.agreements.length;
      },
      error: (err) => {
        console.error('Failed to load rent agreements:', err);
      }
    });
  }

  formatReminderDay(day: any): string {
    if (!day) return 'N/A';
    const num = parseInt(day, 10);
    if (isNaN(num)) return day;
    let suffix = 'th';
    if (num === 1 || num === 21 || num === 31) suffix = 'st';
    else if (num === 2 || num === 22) suffix = 'nd';
    else if (num === 3 || num === 23) suffix = 'rd';
    return `${num}${suffix} Day`;
  }

  openDetails(agreement: any) {
    this.selectedAgreement = agreement;
  }

  closeDetails() {
    this.selectedAgreement = null;
  }

  navigateToCreate(): void {
    this.router.navigate(['/create-rent-agreement']);
  }

  deleteAgreement(id: any, event: Event) {
    event.stopPropagation();
    if (confirm('Are you sure you want to delete this agreement?')) {
      this.rentAgreementService.deleteRentAgreement(id).subscribe({
        next: () => {
          alert('Rent agreement deleted successfully!');
          this.loadRentAgreements();
          if (this.selectedAgreement?.id === id) {
            this.closeDetails();
          }
        },
        error: (err) => {
          console.error('Failed to delete rent agreement:', err);
          const errMsg = err.error?.message || err.message || 'Check connection';
          alert('Error deleting rent agreement: ' + (Array.isArray(errMsg) ? errMsg.join(', ') : errMsg));
        }
      });
    }
  }
}