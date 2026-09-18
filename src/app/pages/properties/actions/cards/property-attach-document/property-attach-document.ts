import { CommonModule } from '@angular/common';
import { Component, Output, EventEmitter, Input } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-property-attach-document',
  standalone: true,
  imports: [CommonModule,FormsModule],
  templateUrl: './property-attach-document.html',
  styleUrl: './property-attach-document.css',
})
export class PropertyAttachDocument {

  @Input() propertyId!: string;

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
