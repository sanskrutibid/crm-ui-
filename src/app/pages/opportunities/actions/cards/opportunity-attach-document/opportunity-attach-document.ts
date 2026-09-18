import { CommonModule } from '@angular/common';
import { Component, Output, EventEmitter } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-opportunity-attach-document',
  standalone: true,
  imports: [CommonModule,FormsModule],
  templateUrl: './opportunity-attach-document.html',
  styleUrl: './opportunity-attach-document.css',
})
export class OpportunityAttachDocument {
  @Output() close = new EventEmitter<void>();

  document = {

    type: '',

    name: '',

    branch: '',

    assignee: '',

    isPublic: true,

    file: null as File | null

  };

  onFileSelected(event: any) {

    if (event.target.files.length > 0) {

      this.document.file = event.target.files[0];

    }

  }

  uploadDocument() {

    console.log(this.document);

    alert('Document uploaded successfully.');

  }

  cancel() {
    this.close.emit();
  }

}
