import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ContactsService } from '../../contacts/contacts.service';
import { PropertiesService } from '../../properties/properties.service';
import { RentAgreementService } from '../rent-agreement.service';

@Component({
  selector: 'app-addrent-agreement',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './addrent-agreement.html',
  styleUrl: './addrent-agreement.css',
})
export class AddrentAgreement implements OnInit {
  currentStep = 1;
  daysList: string[] = [];
  
  contacts: any[] = [];
  properties: any[] = [];

  agreementData: any = {
    tenant: '',
    inNameOf: '',
    property: '',
    agreementDate: '',
    validTo: '',
    crNumber: '',
    rentPerMonth: null,
    securityDeposit: null,
    registrationCost: null,
    brokerageTotal: null,
    documentationCharges: null,
    stampDuty: null,
    otherExpense: null,
    furnitureAndFixtures: null,
    legalChargesPaidBy: 'Equally',
    rentReminderDay: '5th Day',
    termsAndConditions: '',
    sendLeaseExpiryAlertToOwner: false,
    sendLeaseExpiryAlertToTenant: false,
    sendSmsRentReminderToTenant: false,
  };

  private contactsService = inject(ContactsService);
  private propertiesService = inject(PropertiesService);
  private rentAgreementService = inject(RentAgreementService);
  private router = inject(Router);

  ngOnInit() {
    this.generateDaysList();
    this.loadContacts();
    this.loadProperties();
  }

  generateDaysList() {
    for (let i = 1; i <= 31; i++) {
      let suffix = 'th';
      if (i === 1 || i === 21 || i === 31) suffix = 'st';
      else if (i === 2 || i === 22) suffix = 'nd';
      else if (i === 3 || i === 23) suffix = 'rd';

      this.daysList.push(`${i}${suffix} Day`);
    }
  }

  loadContacts(): void {
    this.contactsService.getContacts({ limit: 500 }).subscribe({
      next: (res: any) => {
        const payload = res.data || res;
        this.contacts = payload.contacts || [];
      },
      error: (err) => {
        console.error('Failed to load contacts for rent agreement:', err);
      }
    });
  }

  loadProperties(): void {
    this.propertiesService.getProperties({ limit: 500 }).subscribe({
      next: (res: any) => {
        const payload = res.data || res;
        this.properties = payload.properties || [];
      },
      error: (err) => {
        console.error('Failed to load properties for rent agreement:', err);
      }
    });
  }

  nextStep() {
    if (this.currentStep < 3) {
      this.currentStep++;
    } else {
      this.submitAgreement();
    }
  }

  prevStep() {
    if (this.currentStep > 1) {
      this.currentStep--;
    }
  }

  submitAgreement() {
    const data = this.agreementData;

    // Basic Validation Check logic
    if (!data.tenant) {
      alert('Please select a tenant');
      this.currentStep = 1;
      return;
    }
    if (!data.property) {
      alert('Please select a property');
      this.currentStep = 1;
      return;
    }

    const num = parseInt(data.rentReminderDay, 10);
    const rentReminderDay = isNaN(num) ? undefined : num;

    const payload: any = {
      tenant: data.tenant,
      inNameOf: data.inNameOf || undefined,
      property: data.property,
      agreementDate: data.agreementDate || undefined,
      validTo: data.validTo || undefined,
      crNumber: data.crNumber || undefined,
      rentPerMonth: data.rentPerMonth != null && data.rentPerMonth !== '' ? Number(data.rentPerMonth) : undefined,
      securityDeposit: data.securityDeposit != null && data.securityDeposit !== '' ? Number(data.securityDeposit) : undefined,
      registrationCost: data.registrationCost != null && data.registrationCost !== '' ? Number(data.registrationCost) : undefined,
      brokerageTotal: data.brokerageTotal != null && data.brokerageTotal !== '' ? Number(data.brokerageTotal) : undefined,
      documentationCharges: data.documentationCharges != null && data.documentationCharges !== '' ? Number(data.documentationCharges) : undefined,
      stampDuty: data.stampDuty != null && data.stampDuty !== '' ? Number(data.stampDuty) : undefined,
      otherExpense: data.otherExpense != null && data.otherExpense !== '' ? Number(data.otherExpense) : undefined,
      furnitureAndFixtures: data.furnitureAndFixtures != null && data.furnitureAndFixtures !== '' ? Number(data.furnitureAndFixtures) : undefined,
      legalChargesPaidBy: data.legalChargesPaidBy || undefined,
      rentReminderDay,
      termsAndConditions: data.termsAndConditions || undefined,
      sendLeaseExpiryAlertToOwner: !!data.sendLeaseExpiryAlertToOwner,
      sendLeaseExpiryAlertToTenant: !!data.sendLeaseExpiryAlertToTenant,
      sendSmsRentReminderToTenant: !!data.sendSmsRentReminderToTenant,
    };

    this.rentAgreementService.createRentAgreement(payload).subscribe({
      next: () => {
        alert('Rent Agreement Published Successfully!');
        this.router.navigate(['/rent-agreement']);
      },
      error: (err) => {
        console.error('Failed to create rent agreement:', err);
        const errMsg = err.error?.message || err.message || 'Check inputs';
        alert('Error creating rent agreement: ' + (Array.isArray(errMsg) ? errMsg.join(', ') : errMsg));
      }
    });
  }
}