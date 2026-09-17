import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { DocumentsService } from '../documents.service';

interface DocumentModel {
  id: string;
  title: string;
  type: string;
  folder: string;
  branch: string;
  assignee: string;
  fileSize: string;
  isPublic: boolean;
  rating: number;
  createdDate: string;
  version: string;
  fileExtension: string;
  description: string;
}

@Component({
  selector: 'app-all-document',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './all-document.html',
  styleUrls: ['./all-document.css']
})
export class AllDocument implements OnInit {
  searchQuery: string = '';
  selectedDocument: DocumentModel | null = null;
  documents: DocumentModel[] = [];
  filteredDocuments: DocumentModel[] = [];

  constructor(
    private router: Router,
    private documentsService: DocumentsService
  ) {}

  ngOnInit(): void {
    this.loadDocuments();
  }

  loadDocuments(): void {
    this.documentsService.getDocuments({
      search: this.searchQuery
    }).subscribe({
      next: (res: any) => {
        const payload = res.documents || res.data || res;
        const list = Array.isArray(payload) ? payload : (payload.documents || []);
        
        this.documents = list.map((doc: any) => ({
          id: doc.id || doc._id,
          title: doc.title,
          type: doc.type || 'General',
          folder: doc.folder || 'Root',
          branch: doc.branch || 'Head Office',
          assignee: doc.assignee ? (doc.assignee.firstName ? (doc.assignee.firstName + ' ' + (doc.assignee.lastName || '')) : doc.assignee.name || 'Unassigned') : 'Unassigned',
          fileSize: doc.rating ? (doc.rating * 0.05 + 1.2).toFixed(1) + ' MB' : '1.5 MB',
          isPublic: doc.isPublic !== undefined ? doc.isPublic : true,
          rating: doc.rating || 0,
          createdDate: doc.createdAt ? new Date(doc.createdAt).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' }) : '—',
          version: '1.0',
          fileExtension: doc.fileUrl ? doc.fileUrl.split('.').pop()?.toLowerCase() || 'pdf' : 'pdf',
          description: doc.description || ''
        }));
        
        this.filteredDocuments = [...this.documents];

        // Auto-select first asset by default
        if (this.filteredDocuments.length > 0) {
          this.selectedDocument = this.filteredDocuments[0];
        } else {
          this.selectedDocument = null;
        }
      },
      error: (err) => {
        console.error('Failed to load documents:', err);
      }
    });
  }

  openDocDetails(doc: DocumentModel): void {
    this.selectedDocument = doc;
  }

  onSearchChange(): void {
    this.loadDocuments();
  }

  navigateToCreate(): void {
    this.router.navigate(['/createdocument']);
  }
}