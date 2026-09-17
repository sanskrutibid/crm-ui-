import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ContactsService } from '../../contacts/contacts.service';
import { PropertiesService } from '../../properties/properties.service';
import { SaleAgreementService } from '../sale-agreement.service';

@Component({
  selector: 'app-create-agreement',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './create-agreement.html',
  styleUrl: './create-agreement.css',
})
export class CreateAgreement implements OnInit {
  currentStep = 1;
  contacts: any[] = [];
  properties: any[] = [];

  agreementData: any = {
    buyer: '',
    inNameOf: '',
    property: '',
    agreementDate: '',
    validTo: '',
    crNumber: '',
    agreementValue: null,
    advanceMaintenance: null,
    buyersContribution: null,
    brokerageBuyer: null,
    brokerageSeller: null,
    brokerageTotal: null,
    parkingCharges: null,
    loanAmount: null,
    transferType: '50/50',
    transferCharges: null,
    developmentCharges: null,
    registrationCost: null,
    documentationCharges: null,
    stampDuty: null,
    furnitureAndFixtures: null,
    otherExpense: null,
    vatPercent: null,
    interestRatePercent: null,
    gstPercent: null,
    termsAndConditions: '',
  };

  private contactsService = inject(ContactsService);
  private propertiesService = inject(PropertiesService);
  private saleAgreementService = inject(SaleAgreementService);
  private router = inject(Router);

  ngOnInit(): void {
    this.loadContacts();
    this.loadProperties();
  }

  loadContacts(): void {
    this.contactsService.getContacts({ limit: 500 }).subscribe({
      next: (res: any) => {
        const payload = res.data || res;
        this.contacts = payload.contacts || [];
      },
      error: (err) => {
        console.error('Failed to load contacts for agreement:', err);
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
        console.error('Failed to load properties for agreement:', err);
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

    if (!data.buyer) {
      alert('Please select a buyer');
      this.currentStep = 1;
      return;
    }
    if (!data.property) {
      alert('Please select a property');
      this.currentStep = 1;
      return;
    }

    // Convert values to numeric types if specified
    const payload: any = {
      buyer: data.buyer,
      inNameOf: data.inNameOf || undefined,
      property: data.property,
      agreementDate: data.agreementDate || undefined,
      validTo: data.validTo || undefined,
      crNumber: data.crNumber || undefined,
      agreementValue: data.agreementValue != null && data.agreementValue !== '' ? Number(data.agreementValue) : undefined,
      advanceMaintenance: data.advanceMaintenance != null && data.advanceMaintenance !== '' ? Number(data.advanceMaintenance) : undefined,
      buyersContribution: data.buyersContribution != null && data.buyersContribution !== '' ? Number(data.buyersContribution) : undefined,
      brokerageBuyer: data.brokerageBuyer != null && data.brokerageBuyer !== '' ? Number(data.brokerageBuyer) : undefined,
      brokerageSeller: data.brokerageSeller != null && data.brokerageSeller !== '' ? Number(data.brokerageSeller) : undefined,
      brokerageTotal: data.brokerageTotal != null && data.brokerageTotal !== '' ? Number(data.brokerageTotal) : undefined,
      parkingCharges: data.parkingCharges != null && data.parkingCharges !== '' ? Number(data.parkingCharges) : undefined,
      loanAmount: data.loanAmount != null && data.loanAmount !== '' ? Number(data.loanAmount) : undefined,
      transferType: data.transferType || undefined,
      transferCharges: data.transferCharges != null && data.transferCharges !== '' ? Number(data.transferCharges) : undefined,
      developmentCharges: data.developmentCharges != null && data.developmentCharges !== '' ? Number(data.developmentCharges) : undefined,
      registrationCost: data.registrationCost != null && data.registrationCost !== '' ? Number(data.registrationCost) : undefined,
      documentationCharges: data.documentationCharges != null && data.documentationCharges !== '' ? Number(data.documentationCharges) : undefined,
      stampDuty: data.stampDuty != null && data.stampDuty !== '' ? Number(data.stampDuty) : undefined,
      furnitureAndFixtures: data.furnitureAndFixtures != null && data.furnitureAndFixtures !== '' ? Number(data.furnitureAndFixtures) : undefined,
      otherExpense: data.otherExpense != null && data.otherExpense !== '' ? Number(data.otherExpense) : undefined,
      vatPercent: data.vatPercent != null && data.vatPercent !== '' ? Number(data.vatPercent) : undefined,
      interestRatePercent: data.interestRatePercent != null && data.interestRatePercent !== '' ? Number(data.interestRatePercent) : undefined,
      gstPercent: data.gstPercent != null && data.gstPercent !== '' ? Number(data.gstPercent) : undefined,
      termsAndConditions: data.termsAndConditions || undefined,
    };

    this.saleAgreementService.createSaleAgreement(payload).subscribe({
      next: () => {
        alert('Sale Agreement Published Successfully!');
        this.router.navigate(['/sold-agreement']);
      },
      error: (err) => {
        console.error('Failed to create sale agreement:', err);
        const errMsg = err.error?.message || err.message || 'Check inputs';
        alert('Error creating sale agreement: ' + (Array.isArray(errMsg) ? errMsg.join(', ') : errMsg));
      }
    });
  }
}
