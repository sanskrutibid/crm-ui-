import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DocumentsService } from '../documents.service';

interface LegalDocStructure {
  id: string;
  title: string;
  createdDate: string;
  fileSizeKb: string;
  fileName: string;
  description: string;
}

@Component({
  selector: 'app-legal-document',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './legal-document.html',
  styleUrls: ['./legal-document.css']
})
export class LegalDocument implements OnInit {
  searchQuery: string = '';
  selectedLegalDoc: LegalDocStructure | null = null;
  legalDocs: LegalDocStructure[] = [];

  constructor(private documentsService: DocumentsService) {}

  ngOnInit(): void {
    this.loadLegalDocuments();
  }

  loadLegalDocuments(): void {
    this.documentsService.getLegalDocuments({
      search: this.searchQuery
    }).subscribe({
      next: (res: any) => {
        const payload = res.documents || res.data || res;
        const list = Array.isArray(payload) ? payload : (payload.documents || []);

        this.legalDocs = list.map((doc: any) => {
          const extension = doc.fileUrl ? doc.fileUrl.split('.').pop()?.toLowerCase() || 'pdf' : 'pdf';
          return {
            id: doc.id || doc._id,
            title: doc.title,
            createdDate: doc.createdAt ? new Date(doc.createdAt).toLocaleString('en-US', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—',
            fileSizeKb: doc.rating ? (doc.rating * 1.5).toFixed(2) : '12.50',
            fileName: doc.title ? (doc.title.substring(0, 15) + '... ' + extension) : ('doc.' + extension),
            description: doc.description || 'No description provided.'
          };
        });

        // Auto-select first asset if exists
        if (this.legalDocs.length > 0) {
          this.selectedLegalDoc = this.legalDocs[0];
        } else {
          this.selectedLegalDoc = null;
        }
      },
      error: (err) => {
        console.error('Failed to load legal documents:', err);
      }
    });
  }

  selectLegalDocument(doc: LegalDocStructure): void {
    this.selectedLegalDoc = doc;
  }

  resetToSearch(): void {
    this.selectedLegalDoc = null;
  }

  filterDocuments(): void {
    this.loadLegalDocuments();
  }
}