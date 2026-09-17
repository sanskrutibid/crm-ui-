import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { SaleAgreementService } from '../sale-agreement.service';

@Component({
  selector: 'app-sold-agreement',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './sold-agreement.html',
  styleUrl: './sold-agreement.css',
})
export class SoldAgreement implements OnInit {
  selectedSaleAgreement: any = null;
  totalRecords = 0;

  saleAgreements: any[] = [];

  private saleAgreementService = inject(SaleAgreementService);

  constructor() {}

  ngOnInit(): void {
    this.loadSaleAgreements();
  }

  loadSaleAgreements(search: string = ''): void {
    this.saleAgreementService.getSaleAgreements({ search, limit: 1000 }).subscribe({
      next: (res: any) => {
        const payload = res.data || res;
        this.saleAgreements = payload.saleAgreements || [];
        this.totalRecords = payload.total || this.saleAgreements.length;
      },
      error: (err) => {
        console.error('Failed to load sale agreements:', err);
      }
    });
  }

  openDetails(agreement: any) {
    this.selectedSaleAgreement = agreement;
  }

  closeDetails() {
    this.selectedSaleAgreement = null;
  }

  deleteAgreement(id: string, event: Event) {
    event.stopPropagation();
    if (confirm('Are you sure you want to delete this sale agreement?')) {
      this.saleAgreementService.deleteSaleAgreement(id).subscribe({
        next: () => {
          alert('Sale agreement deleted successfully!');
          this.loadSaleAgreements();
          if (this.selectedSaleAgreement && this.selectedSaleAgreement.id === id) {
            this.closeDetails();
          }
        },
        error: (err) => {
          console.error('Failed to delete sale agreement:', err);
          const errMsg = err.error?.message || err.message || 'Check connection';
          alert('Error deleting sale agreement: ' + (Array.isArray(errMsg) ? errMsg.join(', ') : errMsg));
        }
      });
    }
  }
}