import { Component, OnInit, HostListener, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import * as XLSX from 'xlsx';

export interface Report {
  id: string;
  name: string;
  description?: string;
  permission?: string;
  type: string;
  validity: string;
  nextRun: string;
  createdDate?: string;
  createdAt?: string;
}

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './reports.html',
  styleUrls: ['./reports.css']
})
export class Reports implements OnInit {
  searchText: string = '';
  selectedReport: Report | null = null;
  isAddingReport: boolean = false;
  isEditingReport: boolean = false;
  isProcessing: boolean = false;
  
  reportPreviewData: { headers: string[]; rows: string[][]; reportName: string } | null = null;
  isPreviewLoading: boolean = false;

  newReport = {
    name: '',
    description: '',
    permission: '',
    type: 'Adhoc Report',
    validity: 'Active'
  };

  reports: Report[] = [];
  usersList: any[] = [];
  filteredUsers: any[] = [];
  selectedUserIds: string[] = [];
  dropdownOpen: boolean = false;
  userSearchQuery: string = '';

  constructor(
    private http: HttpClient,
    private elementRef: ElementRef
  ) {}

  ngOnInit(): void {
    this.loadReports();
    this.loadUsers();
  }

  @HostListener('document:click', ['$event'])
  onClickOutside(event: Event) {
    if (!this.elementRef.nativeElement.contains(event.target)) {
      this.dropdownOpen = false;
    }
  }

  loadReports(): void {
    this.http.get<any>(`${environment.apiUrl}/reports?limit=999`).subscribe({
      next: (res) => {
        if (res && res.data) {
          this.reports = res.data.reports || [];
        } else {
          this.reports = res || [];
        }
        // If we have a selected report, refresh its details from the list
        if (this.selectedReport) {
          const updated = this.reports.find(r => r.id === this.selectedReport?.id);
          if (updated) {
            this.selectedReport = updated;
          }
        }
      },
      error: (err) => {
        console.error('Failed to load reports:', err);
      }
    });
  }

  loadUsers(): void {
    this.http.get<any>(`${environment.apiUrl}/users`).subscribe({
      next: (userRes) => {
        const users = userRes && userRes.data ? userRes.data : (userRes || []);
        
        // Fetch employees to display Employee names instead of User/Admin system names
        this.http.get<any>(`${environment.apiUrl}/employees`).subscribe({
          next: (empRes) => {
            const employees = empRes && empRes.data ? empRes.data : (empRes || []);
            
            const list: any[] = [];
            for (const emp of employees) {
              const empEmails = [
                (emp.officialEmail || '').toLowerCase().trim(),
                (emp.personalEmail || '').toLowerCase().trim()
              ].filter(Boolean);
              
              // Find the corresponding system User ID by matching email
              const matchedUser = users.find((u: any) => 
                u.email && empEmails.includes(u.email.toLowerCase().trim())
              );
              
              if (matchedUser) {
                list.push({
                  id: matchedUser.id || matchedUser._id, // User ID (saved to backend permission string)
                  firstName: emp.firstName,
                  lastName: emp.lastName || '',
                  email: emp.officialEmail || emp.personalEmail || emp.email || ''
                });
              } else {
                // Fallback using employee ID if they don't have a login account
                list.push({
                  id: emp.id || emp._id,
                  firstName: emp.firstName,
                  lastName: emp.lastName || '',
                  email: emp.officialEmail || emp.personalEmail || emp.email || ''
                });
              }
            }
            
            this.usersList = list;
            this.filteredUsers = [...this.usersList];
          },
          error: (err) => {
            console.error('Failed to load employees for dropdown, falling back to raw users:', err);
            this.usersList = users;
            this.filteredUsers = [...this.usersList];
          }
        });
      },
      error: (err) => {
        console.error('Failed to load users:', err);
      }
    });
  }

  getFilteredReports(): Report[] {
    if (!this.searchText) {
      return this.reports;
    }
    const query = this.searchText.toLowerCase();
    return this.reports.filter(r => 
      r.name.toLowerCase().includes(query) || 
      (r.description && r.description.toLowerCase().includes(query))
    );
  }

  selectReport(report: Report): void {
    this.isAddingReport = false;
    this.isEditingReport = false;
    this.selectedReport = report;
    this.loadReportData(report.id);
  }

  loadReportData(reportId: string): void {
    this.isPreviewLoading = true;
    this.reportPreviewData = null;
    this.http.get<any>(`${environment.apiUrl}/reports/${reportId}/data`).subscribe({
      next: (res) => {
        this.isPreviewLoading = false;
        if (res && res.data) {
          this.reportPreviewData = res.data;
        } else {
          this.reportPreviewData = res;
        }
      },
      error: (err) => {
        this.isPreviewLoading = false;
        console.error('Failed to load report preview data:', err);
      }
    });
  }

  openAddReportForm(): void {
    this.selectedReport = null;
    this.isAddingReport = true;
    this.isEditingReport = false;
    this.resetForm();
  }

  openEditReportForm(report: Report): void {
    this.isAddingReport = false;
    this.isEditingReport = true;
    this.newReport = {
      name: report.name,
      description: report.description || '',
      permission: report.permission || '',
      type: report.type,
      validity: report.validity || 'Active'
    };
    
    this.selectedUserIds = report.permission 
      ? report.permission.split(',').map(u => u.trim()).filter(Boolean)
      : [];
    
    this.userSearchQuery = '';
    this.filterUsers();
  }

  closeViews(): void {
    this.selectedReport = null;
    this.isAddingReport = false;
    this.isEditingReport = false;
  }

  resetForm(): void {
    this.newReport = {
      name: '',
      description: '',
      permission: '',
      type: 'Adhoc Report',
      validity: 'Active'
    };
    this.selectedUserIds = [];
    this.userSearchQuery = '';
    this.filterUsers();
  }

  // Multiselect Dropdown actions
  toggleDropdown(event: Event): void {
    event.stopPropagation();
    this.dropdownOpen = !this.dropdownOpen;
  }

  getSelectedUsersText(): string {
    if (this.selectedUserIds.length === 0) {
      return 'Select Users';
    }
    const names = this.selectedUserIds.map(id => {
      const user = this.usersList.find(u => u.id === id || u._id === id);
      return user ? `${user.firstName} ${user.lastName || ''}`.trim() : id;
    });
    return names.join(', ');
  }

  filterUsers(): void {
    if (!this.userSearchQuery) {
      this.filteredUsers = [...this.usersList];
      return;
    }
    const query = this.userSearchQuery.toLowerCase();
    this.filteredUsers = this.usersList.filter(u => {
      const fullName = `${u.firstName || ''} ${u.lastName || ''}`.toLowerCase();
      const email = (u.email || '').toLowerCase();
      return fullName.includes(query) || email.includes(query);
    });
  }

  isUserSelected(userId: string): boolean {
    return this.selectedUserIds.includes(userId);
  }

  toggleUserSelection(userId: string): void {
    const index = this.selectedUserIds.indexOf(userId);
    if (index > -1) {
      this.selectedUserIds.splice(index, 1);
    } else {
      this.selectedUserIds.push(userId);
    }
    this.newReport.permission = this.selectedUserIds.join(',');
  }

  selectAllUsers(): void {
    this.filteredUsers.forEach(u => {
      const id = u.id || u._id;
      if (!this.selectedUserIds.includes(id)) {
        this.selectedUserIds.push(id);
      }
    });
    this.newReport.permission = this.selectedUserIds.join(',');
  }

  clearAllUsers(): void {
    this.selectedUserIds = [];
    this.newReport.permission = '';
  }

  saveReport(): void {
    if (!this.newReport.name) {
      alert('Report Name is required!');
      return;
    }

    this.newReport.permission = this.selectedUserIds.join(',');

    if (this.isEditingReport && this.selectedReport) {
      this.http.patch<any>(`${environment.apiUrl}/reports/${this.selectedReport.id}`, this.newReport).subscribe({
        next: (res) => {
          alert('Report updated successfully!');
          this.loadReports();
          this.isEditingReport = false;
        },
        error: (err) => {
          alert('Failed to update report: ' + (err.error?.message || err.message));
        }
      });
    } else {
      this.http.post<any>(`${environment.apiUrl}/reports`, this.newReport).subscribe({
        next: (res) => {
          alert('Report created successfully!');
          this.loadReports();
          this.isAddingReport = false;
          if (res && res.data) {
            this.selectReport(res.data);
          }
        },
        error: (err) => {
          alert('Failed to create report: ' + (err.error?.message || err.message));
        }
      });
    }
  }

  deleteReport(report: Report, event: Event): void {
    event.stopPropagation();
    if (!confirm(`Are you sure you want to delete report "${report.name}"?`)) {
      return;
    }

    this.http.delete<any>(`${environment.apiUrl}/reports/${report.id}`).subscribe({
      next: () => {
        alert('Report configuration deleted successfully!');
        if (this.selectedReport?.id === report.id) {
          this.selectedReport = null;
        }
        this.loadReports();
      },
      error: (err) => {
        alert('Failed to delete report: ' + (err.error?.message || err.message));
      }
    });
  }

  downloadReport(report: Report): void {
    if (!this.reportPreviewData) {
      alert('Report data is still loading. Please try again in a moment.');
      return;
    }

    try {
      // Build Sheet data with headers and rows
      const sheetData = [
        this.reportPreviewData.headers,
        ...this.reportPreviewData.rows
      ];
      
      const ws = XLSX.utils.aoa_to_sheet(sheetData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Report Data');
      
      // Auto-fit column widths for better Excel readability
      const maxColWidths = this.reportPreviewData.headers.map((h, i) => {
        let maxLen = h.length;
        this.reportPreviewData!.rows.forEach(row => {
          const val = row[i] ? String(row[i]) : '';
          if (val.length > maxLen) {
            maxLen = val.length;
          }
        });
        return { wch: Math.min(maxLen + 3, 50) }; // limit max width to 50
      });
      ws['!cols'] = maxColWidths;

      const baseName = report.name.toLowerCase().replace(/[^a-z0-9]+/g, '_');
      const dateStr = new Date().toISOString().slice(0, 10);
      const fileName = `${baseName}_${dateStr}.xlsx`;
      
      XLSX.writeFile(wb, fileName);
    } catch (e: any) {
      alert('Error generating Excel file: ' + e.message);
    }
  }

  uploadToGoogleDrive(report: Report): void {
    if (this.isProcessing) return;
    this.isProcessing = true;
    alert('Exporting report data and uploading to Google Drive. Please wait...');

    this.http.post<any>(`${environment.apiUrl}/reports/${report.id}/google-drive`, {}).subscribe({
      next: (res) => {
        this.isProcessing = false;
        if (res && res.message) {
          alert(res.message);
          if (res.webViewLink) {
            window.open(res.webViewLink, '_blank');
          }
        } else {
          alert('Report successfully saved to Google Drive!');
        }
      },
      error: (err) => {
        this.isProcessing = false;
        alert('Google Drive export failed: ' + (err.error?.message || err.message));
      }
    });
  }
}