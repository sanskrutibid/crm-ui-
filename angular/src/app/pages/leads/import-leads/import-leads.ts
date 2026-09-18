import { Component, EventEmitter, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LeadsService } from '../leads.service';
import * as XLSX from 'xlsx';

@Component({
  selector: 'app-import-leads',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './import-leads.html',
  styleUrl: './import-leads.css'
})
export class ImportLeads {
  @Output() close = new EventEmitter<void>();

  selectedFile: File | null = null;
  selectedFileName = '';
  isSubmitting = false;

  private leadsService = inject(LeadsService);

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.selectedFile = file;
      this.selectedFileName = file.name;
    }
  }

  downloadSample() {
    console.log('Downloading vaultstone sample leads layout template...');

    const headers = [
      'Customer_Name', 'Customer_Mobile', 'Customer_Email',
      'Lead_Requirement', 'Lead_FollowupNote', 'Lead_ScheduleDate',
      'Lead_ScheduleTime', 'Lead_Keywords', 'Lead_Folder',
      'Lead_Source', 'Lead_Branch', 'Lead_Visibility',
      'Lead_Temperature', 'Lead_Status', 'Lead_Outcome', 'Lead_InterestedIn'
    ];

    const sampleData = [
      {
        'Customer_Name': 'John Doe',
        'Customer_Mobile': '9876543210',
        'Customer_Email': 'john.doe@example.com',
        'Lead_Requirement': 'Rs. 1.38 Crore, 3 Bed, for Sale in Riddhi Siddhi, Pande Layout',
        'Lead_FollowupNote': 'Followup on flat details and pricing terms',
        'Lead_ScheduleDate': '2026-06-19',
        'Lead_ScheduleTime': '12:39pm',
        'Lead_Keywords': 'Dhantoli, 3BHK Flat',
        'Lead_Folder': 'Dhantoli Premium Folder',
        'Lead_Source': 'Campaigns',
        'Lead_Branch': 'Global Team',
        'Lead_Visibility': 'Private',
        'Lead_Temperature': 'Cold',
        'Lead_Status': 'In Progress',
        'Lead_Outcome': 'Said Not Looking Any Property Now',
        'Lead_InterestedIn': 'Rs. 1.38 Crore, 3 Bed, for Sale in Riddhi Siddhi, Pande Layout'
      }
    ];

    const worksheet = XLSX.utils.json_to_sheet(sampleData, { header: headers });
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Leads_Template');

    XLSX.writeFile(workbook, 'vaultstone_Leads_Template.xlsx');
  }

  uploadFile() {
    if (!this.selectedFile) return;

    this.isSubmitting = true;
    console.log('Reading and parsing uploaded Leads Excel sheet...');
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
          alert('Excel sheet is empty. Please add leads data.');
          this.isSubmitting = false;
          return;
        }

        const limit = 2000;
        const processRows = rawRows.slice(0, limit);

        this.leadsService.importLeads(processRows).subscribe({
          next: (res: any) => {
            this.isSubmitting = false;
            alert(`Successfully imported ${res.count || processRows.length} leads!`);
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
}