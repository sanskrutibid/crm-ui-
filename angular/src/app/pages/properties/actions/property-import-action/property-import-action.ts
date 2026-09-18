import { Component, EventEmitter, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import * as XLSX from 'xlsx';
import { PropertiesService } from '../../properties.service';

@Component({
  selector: 'app-property-import-action',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './property-import-action.html',
  styleUrl: './property-import-action.css',
})
export class PropertyImportAction {
  
  @Output() close = new EventEmitter<void>();

  selectedFile: File | null = null;
  selectedFileName = '';
  isSubmitting = false;

  private readonly propertiesService = inject(PropertiesService);

  back() {
    this.close.emit();
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.selectedFile = file;
      this.selectedFileName = file.name;
    }
  }

  uploadFile() {
    if (!this.selectedFile) {
      alert('Please choose an Excel file first.');
      return;
    }

    this.isSubmitting = true;
    console.log('Reading and parsing uploaded Properties Excel sheet...');
    const fileReader = new FileReader();

    fileReader.onload = (e: any) => {
      try {
        const arrayBuffer = e.target.result;
        const data = new Uint8Array(arrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });

        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];

        const rawRows: any[] = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

        if (rawRows.length === 0) {
          alert('Excel sheet is empty. Please add properties data.');
          this.isSubmitting = false;
          return;
        }

        const limit = 2000;
        const processRows = rawRows.slice(0, limit);

        this.propertiesService.importProperties(processRows).subscribe({
          next: (res: any) => {
            this.isSubmitting = false;
            alert(`Successfully imported ${res.count || processRows.length} properties!`);
            this.closeImportForm();
            window.location.reload();
          },
          error: (err: any) => {
            this.isSubmitting = false;
            console.error('Spreadsheet bulk import failed:', err);
            alert('Import failed: ' + (err.error?.message || err.message || 'Server error occurred'));
          }
        });

      } catch (err) {
        this.isSubmitting = false;
        console.error('Excel file reading/parsing error:', err);
        alert('Failed to process Excel file. Please double-check formatting.');
      }
    };

    fileReader.readAsArrayBuffer(this.selectedFile);
  }

  closeImportForm() {
    this.selectedFile = null;
    this.selectedFileName = '';
    this.close.emit();
  }

  downloadTemplate() {
    const link = document.createElement('a');
    link.href = 'assets/Property-Import-Template.xlsx';
    link.download = 'Property-Import-Template.xlsx';
    link.click();
  }
}