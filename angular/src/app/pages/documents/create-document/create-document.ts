import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { DocumentsService } from '../documents.service';

@Component({
  selector: 'app-create-document',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './create-document.html',
  styleUrls: ['./create-document.css']
})
export class CreateDocument implements OnInit {
  currentStep: number = 1;
  docForm!: FormGroup;
  fileName: string = '';
  selectedFile: File | null = null;

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private documentsService: DocumentsService
  ) {}

  ngOnInit(): void {
    this.docForm = this.fb.group({
      type: ['General', Validators.required],
      title: ['', Validators.required],
      description: [''],
      rating: [10],
      folder: [''],
      branch: ['', Validators.required],
      assignee: [''],
      isPublic: [true]
    });
  }

  // Step 1 validation check
  isStep1Invalid(): boolean {
    const typeValid = this.docForm.get('type')?.valid;
    const titleValid = this.docForm.get('title')?.valid;
    return !(typeValid && titleValid);
  }

  // File selection handler
  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      this.fileName = file.name;
      this.selectedFile = file;
    }
  }

  // Navigation controls
  nextStep(): void {
    if (this.currentStep < 3) {
      this.currentStep++;
    }
  }

  prevStep(): void {
    if (this.currentStep > 1) {
      this.currentStep--;
    }
  }

  onCancel(): void {
    this.currentStep = 1;
    this.docForm.reset({ type: 'General', rating: 10, isPublic: true });
    this.fileName = '';
    this.selectedFile = null;
  }

  onSubmit(): void {
    if (this.docForm.valid && this.selectedFile) {
      const formVal = this.docForm.value;
      
      // Map frontend selection strings to backend compatible ObjectIds
      let assigneeId: string | undefined = undefined;
      if (formVal.assignee === 'Gourav') {
        assigneeId = '60d5ecb8b394142e88a38c20';
      } else if (formVal.assignee === 'Admin') {
        assigneeId = '60d5ecb8b394142e88a38c21';
      }

      const payload: any = {
        type: formVal.type,
        title: formVal.title,
        description: formVal.description,
        rating: Number(formVal.rating),
        folder: formVal.folder || 'General Documents',
        branch: formVal.branch === 'HeadOffice' ? 'Head Office' : (formVal.branch || 'Global Team'),
        assignee: assigneeId,
        isPublic: formVal.isPublic,
        fileUrl: `uploads/documents/${this.selectedFile.name}`
      };
      if (!assigneeId) {
        delete payload.assignee;
      }

      this.documentsService.createDocument(payload).subscribe({
        next: () => {
          alert('Document Created & Published Successfully!');
          this.router.navigate(['/all-documents']);
        },
        error: (err) => {
          console.error('Failed to create document:', err);
          alert('Failed to create and publish document.');
        }
      });
    }
  }
}