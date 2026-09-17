import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DocumentsService, EmpDocument } from '../documents.service';

@Component({
  selector: 'app-expiring-documents',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './expiring-documents.html',
  styleUrl: './expiring-documents.css'
})
export class ExpiringDocuments implements OnInit {
  expiredCount = 0;
  expiringSoon = 0;
  validDocuments = 0;
  documents: any[] = [];
  isLoading = false;

  constructor(private documentsService: DocumentsService) {}

  ngOnInit(): void {
    this.loadDocuments();

    this.documentsService.documents$.subscribe(list => {
      this.processDocuments(list || []);
    });
  }

  loadDocuments(): void {
    this.isLoading = true;
    this.documentsService.getDocuments().subscribe({
      next: (res: any) => {
        this.isLoading = false;
        const list: EmpDocument[] = Array.isArray(res) ? res : (res?.documents || res?.data || []);
        this.processDocuments(list);
      },
      error: (err) => {
        this.isLoading = false;
        const list = this.documentsService.getStoredDocuments();
        this.processDocuments(list);
      }
    });
  }

  processDocuments(rawDocs: EmpDocument[]): void {
    let expired = 0;
    let soon = 0;
    let valid = 0;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const processedList = rawDocs.map(doc => {
      let status: 'Expired' | 'Expiring Soon' | 'Valid' = 'Valid';
      let daysText = 'N/A';

      if (doc.status === 'Expired') {
        status = 'Expired';
        daysText = 'Expired';
      } else if (doc.expiryDate && doc.expiryDate !== '-') {
        const expDate = new Date(doc.expiryDate);
        if (!isNaN(expDate.getTime())) {
          expDate.setHours(0, 0, 0, 0);
          const diffTime = expDate.getTime() - today.getTime();
          const daysCount = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

          if (daysCount < 0) {
            status = 'Expired';
            daysText = 'Expired';
          } else if (daysCount <= 30) {
            status = 'Expiring Soon';
            daysText = `${daysCount} Days`;
          } else {
            status = 'Valid';
            daysText = `${daysCount} Days`;
          }
        }
      }

      if (status === 'Expired') {
        expired++;
      } else if (status === 'Expiring Soon') {
        soon++;
      } else {
        valid++;
      }

      return {
        id: doc.employeeId || doc.id || '-',
        name: doc.employeeName || 'Employee',
        image: doc.frontFile || doc.backFile || 'assets/images/user.png',
        document: doc.documentType || 'Document',
        number: doc.documentNumber || '-',
        expiry: doc.expiryDate || '-',
        days: daysText,
        status: status,
        rawDoc: doc
      };
    });

    this.expiredCount = expired;
    this.expiringSoon = soon;
    this.validDocuments = valid;
    this.documents = processedList;
  }
}