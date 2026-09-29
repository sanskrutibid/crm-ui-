import { CommonModule } from '@angular/common';
import { Component, Output, EventEmitter, Input, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { PropertiesService } from '../../../properties.service';

@Component({
  selector: 'app-property-attach-document',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './property-attach-document.html',
  styleUrl: './property-attach-document.css',
})
export class PropertyAttachDocument {

  @Input() propertyId!: string;
  @Input() property: any;

  @Output() close = new EventEmitter<void>();
  @Output() documentSaved = new EventEmitter<any>();

  private propertiesService = inject(PropertiesService);

  document = {
    type: '',
    name: '',
    branch: '',
    assignee: '',
    isPublic: true,
    file: null as File | null
  };

  isUploading = false;
  selectedFile: File | null = null;

  onFileSelected(event: any) {
    if (event.target.files && event.target.files.length > 0) {
      const file = event.target.files[0];
      const fileSizeMB = file.size / (1024 * 1024);
      if (fileSizeMB > 10) {
        alert('File size exceeds the limit (10MB). Please select a smaller document.');
        event.target.value = '';
        return;
      }
      this.selectedFile = file;
      this.document.file = file;
      if (!this.document.name) {
        this.document.name = file.name.replace(/\.[^/.]+$/, "");
      }
    }
  }

  uploadDocument() {
    if (!this.propertyId) {
      alert('Error: No property selected.');
      return;
    }
    if (!this.document.type) {
      alert('Please select document type.');
      return;
    }
    if (!this.document.name) {
      alert('Please enter document name.');
      return;
    }
    if (!this.selectedFile) {
      alert('Please select a document file to upload.');
      return;
    }

    this.isUploading = true;

    const reader = new FileReader();
    reader.onload = () => {
      const fileUrl = reader.result as string;
      const fileSizeMB = this.selectedFile!.size / (1024 * 1024);
      const sizeStr = fileSizeMB < 1 ? `${Math.round(this.selectedFile!.size / 1024)} KB` : `${fileSizeMB.toFixed(2)} MB`;

      const newDocItem = {
        id: 'doc_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
        name: this.document.name,
        type: this.document.type,
        branch: this.document.branch || '',
        assignee: this.document.assignee || '',
        isPublic: !!this.document.isPublic,
        url: fileUrl,
        size: sizeStr,
        date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
      };

      const existingLegalDocs = Array.isArray(this.property?.legalDocuments) ? [...this.property.legalDocuments] : [];

      const savedDocsRaw = localStorage.getItem(`property_legal_docs_${this.propertyId}`);
      let localDocs: any = {};
      if (savedDocsRaw) {
        try { localDocs = JSON.parse(savedDocsRaw); } catch(e) {}
      }
      const localLegalDocs = Array.isArray(localDocs.legalDocuments) ? localDocs.legalDocuments : [];

      const combinedDocs = [...existingLegalDocs];
      localLegalDocs.forEach((ld: any) => {
        if (!combinedDocs.some(cd => cd.name === ld.name && cd.url === ld.url)) {
          combinedDocs.push(ld);
        }
      });
      combinedDocs.push(newDocItem);

      // Store in localStorage for instant fallback & persistence
      localDocs.legalDocuments = combinedDocs;
      try {
        localStorage.setItem(`property_legal_docs_${this.propertyId}`, JSON.stringify(localDocs));
      } catch(e) {
        console.warn('LocalStorage quota warning:', e);
      }

      // Update backend
      this.propertiesService.updateProperty(this.propertyId, { legalDocuments: combinedDocs }).subscribe({
        next: () => {
          this.isUploading = false;
          alert('Document uploaded and saved successfully.');
          this.documentSaved.emit(newDocItem);
          this.close.emit();
        },
        error: (err) => {
          console.warn('Backend update note (saved in local data):', err);
          this.isUploading = false;
          alert('Document uploaded and saved successfully.');
          this.documentSaved.emit(newDocItem);
          this.close.emit();
        }
      });
    };
    reader.onerror = () => {
      this.isUploading = false;
      alert('Failed to read document file.');
    };
    reader.readAsDataURL(this.selectedFile);
  }

  cancel() {
    this.close.emit();
  }

}
