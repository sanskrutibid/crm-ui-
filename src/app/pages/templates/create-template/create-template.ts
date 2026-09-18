import { Component , OnInit, ViewEncapsulation} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { TemplatesService } from '../templates.service';

@Component({
  selector: 'app-create-template',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule
  ],
  templateUrl: './create-template.html',
  styleUrls: ['./create-template.css'],
  encapsulation: ViewEncapsulation.None
})
export class CreateTemplate implements OnInit {
  currentStep: number = 1;
  selectedContent: string = 'editor';

  templateData = {
    name: '',
    templateId: '',
    templateType: '',
    content: '',
    htmlUrl: '',
    uploadedFile: null as File | null
  };

  constructor(
    private router: Router,
    private templatesService: TemplatesService
  ) {}

  ngOnInit(): void {}

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

  selectContent(type: string): void {
    this.selectedContent = type;
  }

  onFileChange(event: any): void {
    const file = event.target.files[0];
    if (file) {
      this.templateData.uploadedFile = file;
    }
  }

  submitTemplate(): void {

  const payload: any = {
    name: this.templateData.name,
    templateId: this.templateData.templateId || undefined,
    templateType: this.templateData.templateType,
    layoutType: this.selectedContent === 'upload'
      ? 'file'
      : this.selectedContent,
  };

  if (this.selectedContent === 'editor') {

    payload.editorContent = this.templateData.content || '';
    this.sendCreateRequest(payload);

  } else if (this.selectedContent === 'url') {

    payload.importUrl = this.templateData.htmlUrl || '';
    this.sendCreateRequest(payload);

  } else if (this.selectedContent === 'upload') {

    if (this.templateData.uploadedFile) {

      payload.fileName = this.templateData.uploadedFile.name;

      const reader = new FileReader();

      reader.onload = (e: any) => {
        payload.fileContent = e.target.result;
        this.sendCreateRequest(payload);
      };

      reader.onerror = (err) => {
        console.error('FileReader error:', err);
        this.sendCreateRequest(payload);
      };

      reader.readAsText(this.templateData.uploadedFile);

    } else {

      payload.fileName = '';
      payload.fileContent = '';
      this.sendCreateRequest(payload);

    }

  } else {

    this.sendCreateRequest(payload);

  }
}

  private sendCreateRequest(payload: any): void {
    this.templatesService.createTemplate(payload).subscribe({
      next: () => {
        alert('Template saved and submitted successfully!');
        this.router.navigate(['/all-templates']);
      },
      error: (err) => {
        console.error('Failed to save template:', err);
        const errMsg = err.error?.message || err.message || 'Unknown error';
        alert('Error saving template: ' + (Array.isArray(errMsg) ? errMsg.join(', ') : errMsg));
      }
    });
  }
}
