import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DocumentsService, EmpDocument } from '../documents.service';

@Component({
  selector: 'app-documents-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './documents-list.html',
  styleUrl: './documents-list.css'
})
export class DocumentsList implements OnInit {
  @Output() navigateToUpload = new EventEmitter<void>();
  @Output() editDocument = new EventEmitter<EmpDocument>();

  documents: EmpDocument[] = [];
  filteredDocuments: EmpDocument[] = [];
  isLoading = false;

  // View Details Modal State
  selectedDocForView: EmpDocument | null = null;

  // Filters
  selectedDepartment = 'All';
  selectedDocType = 'All';
  selectedStatus = 'All';
  searchQuery = '';

  constructor(private documentsService: DocumentsService) {}

  ngOnInit(): void {
    this.documents = this.documentsService.getStoredDocuments();
    this.applyFilters();

    this.loadDocuments();

    this.documentsService.documents$.subscribe(list => {
      this.documents = list || [];
      this.applyFilters();
    });
  }

  loadDocuments(): void {
    this.isLoading = true;
    this.documentsService.getDocuments().subscribe({
      next: (res: any) => {
        this.isLoading = false;
        const list = Array.isArray(res) ? res : (res?.documents || res?.data || []);
        this.documents = list || [];
        this.applyFilters();
      },
      error: (err) => {
        this.isLoading = false;
        this.documents = this.documentsService.getStoredDocuments();
        this.applyFilters();
      }
    });
  }

  applyFilters(): void {
    let result = [...this.documents];

    // Filter by Department
    if (this.selectedDepartment && this.selectedDepartment !== 'All') {
      result = result.filter(d => d.department === this.selectedDepartment);
    }

    // Filter by Document Type
    if (this.selectedDocType && this.selectedDocType !== 'All') {
      result = result.filter(d => d.documentType === this.selectedDocType);
    }

    // Filter by Status
    if (this.selectedStatus && this.selectedStatus !== 'All') {
      result = result.filter(d => d.status === this.selectedStatus);
    }

    // Search Query
    if (this.searchQuery && this.searchQuery.trim() !== '') {
      const q = this.searchQuery.toLowerCase().trim();
      result = result.filter(d =>
        d.employeeName.toLowerCase().includes(q) ||
        d.employeeId.toLowerCase().includes(q) ||
        d.documentNumber.toLowerCase().includes(q) ||
        d.documentType.toLowerCase().includes(q)
      );
    }

    this.filteredDocuments = result;
  }

  onUploadNewClick(): void {
    this.navigateToUpload.emit();
  }

  onViewClick(doc: EmpDocument): void {
    this.selectedDocForView = doc;
  }

  closeViewModal(): void {
    this.selectedDocForView = null;
  }

  onEditClick(doc: EmpDocument): void {
    if (this.selectedDocForView) {
      this.closeViewModal();
    }
    this.editDocument.emit(doc);
  }

  onDownloadClick(doc: EmpDocument): void {
    const fileUrl = doc.frontFile || doc.backFile;
    if (!fileUrl) {
      alert('No attached file available for download.');
      return;
    }

    // Download front file or open image in new tab
    const link = document.createElement('a');
    link.href = fileUrl;
    link.download = `${doc.employeeName}_${doc.documentType.replace(/\s+/g, '_')}`;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  onDeleteClick(doc: EmpDocument): void {
    const confirmDelete = confirm(`Are you sure you want to delete ${doc.documentType} for ${doc.employeeName}?`);
    if (!confirmDelete) return;

    const id = doc.id || doc._id;
    if (!id) return;

    this.documentsService.deleteDocument(id).subscribe({
      next: () => {
        alert(`Document "${doc.documentType}" has been deleted.`);
        if (this.selectedDocForView) {
          this.closeViewModal();
        }
        this.loadDocuments();
      },
      error: (err) => {
        console.error('Failed to delete document:', err);
        alert('Failed to delete document.');
      }
    });
  }
}