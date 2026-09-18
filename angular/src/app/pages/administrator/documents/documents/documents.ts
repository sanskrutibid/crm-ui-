import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

import { DocumentsList } from '../documents-list/documents-list';
import { UploadDocument } from '../upload-document/upload-document';
import { ExpiringDocuments } from '../expiring-documents/expiring-documents';

import { EmpDocument } from '../documents.service';

@Component({
  selector: 'app-documents',
  standalone: true,
  imports: [
    CommonModule,
    DocumentsList,
    UploadDocument,
    ExpiringDocuments
  ],
  templateUrl: './documents.html',
  styleUrl: './documents.css'
})
export class Documents {
  selectedTab = 'list';
  selectedDocForEdit: EmpDocument | null = null;

  changeTab(tab: string) {
    if (tab !== 'upload') {
      this.selectedDocForEdit = null;
    }
    this.selectedTab = tab;
  }

  onNavigateToUpload(): void {
    this.selectedDocForEdit = null;
    this.selectedTab = 'upload';
  }

  onEditDocument(doc: EmpDocument): void {
    this.selectedDocForEdit = doc;
    this.selectedTab = 'upload';
  }

  onDocumentSaved(): void {
    this.selectedDocForEdit = null;
    this.selectedTab = 'list';
  }

  onCancelUpload(): void {
    this.selectedDocForEdit = null;
    this.selectedTab = 'list';
  }
}