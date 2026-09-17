import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { LoginHistoryService, LoginHistoryItem } from '../../../services/login-history.service';

@Component({
  selector: 'app-login-history',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule
  ],
  templateUrl: './login-history.html',
  styleUrls: ['./login-history.css']
})
export class LoginHistory implements OnInit {
  private loginHistoryService = inject(LoginHistoryService);

  loginHistory: LoginHistoryItem[] = [];
  isLoading = false;
  isRefreshing = false;

  // Search & Filters
  searchText = '';
  deviceFilter: 'All' | 'Desktop' | 'Mobile' | 'Tablet' = 'All';
  statusFilter: 'All' | 'Online' | 'Offline' = 'All';
  sortOrder: 'newest' | 'oldest' = 'newest';

  // Modals & Details
  selectedSession: LoginHistoryItem | null = null;
  showDetailsModal = false;
  showClearModal = false;
  copiedIp: string | null = null;

  // Feedback Toast
  toastMessage: string | null = null;
  toastType: 'success' | 'error' | 'info' = 'success';
  private toastTimeout: any;

  ngOnInit(): void {
    this.loadHistory();
  }

  /**
   * Load history from API
   */
  loadHistory(showRefreshSpinner = false): void {
    if (showRefreshSpinner) {
      this.isRefreshing = true;
    } else {
      this.isLoading = true;
    }

    this.loginHistoryService.getLoginHistory().subscribe({
      next: (data) => {
        this.loginHistory = data;
        this.isLoading = false;
        this.isRefreshing = false;
      },
      error: (err) => {
        console.error('Failed to load login history:', err);
        this.isLoading = false;
        this.isRefreshing = false;
        this.showToast('Could not fetch server logs. Loaded offline records.', 'error');
      }
    });
  }

  /**
   * Refresh action
   */
  refresh(): void {
    this.loadHistory(true);
    this.showToast('Login history refreshed', 'success');
  }

  /**
   * Filter and sort records
   */
  filteredLoginHistory(): LoginHistoryItem[] {
    let result = this.loginHistory.filter(item => {
      const search = this.searchText.trim().toLowerCase();
      const matchesSearch = !search ||
        (item.userName && item.userName.toLowerCase().includes(search)) ||
        (item.email && item.email.toLowerCase().includes(search)) ||
        (item.ip && item.ip.toLowerCase().includes(search)) ||
        (item.browser && item.browser.toLowerCase().includes(search)) ||
        (item.os && item.os.toLowerCase().includes(search)) ||
        (item.location && item.location.toLowerCase().includes(search)) ||
        (item.city && item.city.toLowerCase().includes(search));

      const matchesDevice = this.deviceFilter === 'All' || item.device === this.deviceFilter;
      const matchesStatus = this.statusFilter === 'All' || item.status === this.statusFilter;

      return matchesSearch && matchesDevice && matchesStatus;
    });

    // Sorting
    result = result.sort((a, b) => {
      const timeA = new Date(a.loginTime).getTime();
      const timeB = new Date(b.loginTime).getTime();
      return this.sortOrder === 'newest' ? timeB - timeA : timeA - timeB;
    });

    return result;
  }

  /**
   * Metrics
   */
  get totalCount(): number {
    return this.loginHistory.length;
  }

  get onlineCount(): number {
    return this.loginHistory.filter(x => x.status === 'Online').length;
  }

  get desktopCount(): number {
    return this.loginHistory.filter(x => x.device === 'Desktop').length;
  }

  get mobileCount(): number {
    return this.loginHistory.filter(x => x.device === 'Mobile' || x.device === 'Tablet').length;
  }

  /**
   * Session Actions
   */
  viewDetails(session: LoginHistoryItem): void {
    this.selectedSession = session;
    this.showDetailsModal = true;
  }

  closeDetails(): void {
    this.showDetailsModal = false;
    this.selectedSession = null;
  }

  terminateSession(session: LoginHistoryItem, event?: Event): void {
    if (event) {
      event.stopPropagation();
    }
    const targetId = session.id || session._id;
    if (!targetId) return;

    this.loginHistoryService.terminateSession(targetId).subscribe({
      next: () => {
        session.status = 'Offline';
        session.lastActive = 'Terminated';
        this.showToast(`Session for ${session.userName || session.email} terminated.`, 'success');
        if (this.selectedSession && this.selectedSession.id === session.id) {
          this.selectedSession.status = 'Offline';
        }
      },
      error: (err) => {
        console.error('Error terminating session:', err);
        this.showToast('Failed to terminate session.', 'error');
      }
    });
  }

  deleteLog(session: LoginHistoryItem, event?: Event): void {
    if (event) {
      event.stopPropagation();
    }
    const targetId = session.id || session._id;
    if (!targetId) return;

    this.loginHistoryService.deleteLog(targetId).subscribe({
      next: () => {
        this.loginHistory = this.loginHistory.filter(x => x.id !== session.id && x._id !== session._id);
        this.showToast('Log entry removed.', 'success');
        if (this.showDetailsModal && this.selectedSession?.id === session.id) {
          this.closeDetails();
        }
      },
      error: (err) => {
        console.error('Error deleting log:', err);
        this.showToast('Failed to delete log entry.', 'error');
      }
    });
  }

  confirmClearLogs(): void {
    this.showClearModal = true;
  }

  executeClearLogs(): void {
    this.loginHistoryService.clearAllLogs().subscribe({
      next: () => {
        this.loginHistory = [];
        this.showClearModal = false;
        this.showToast('All login history logs cleared.', 'success');
      },
      error: (err) => {
        console.error('Error clearing logs:', err);
        this.showClearModal = false;
        this.showToast('Failed to clear logs.', 'error');
      }
    });
  }

  /**
   * Export to CSV
   */
  exportToCsv(): void {
    const list = this.filteredLoginHistory();
    if (list.length === 0) {
      this.showToast('No records to export.', 'info');
      return;
    }

    const headers = ['User Name', 'Email', 'Role', 'IP Address', 'Location', 'Device', 'OS', 'Browser', 'Login Time', 'Status'];
    const rows = list.map(item => [
      `"${item.userName || ''}"`,
      `"${item.email || ''}"`,
      `"${item.role || ''}"`,
      `"${item.ip || ''}"`,
      `"${item.location || item.city || ''}"`,
      `"${item.device || ''}"`,
      `"${item.os || ''}"`,
      `"${item.browser || ''}"`,
      `"${new Date(item.loginTime).toLocaleString()}"`,
      `"${item.status || ''}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `login_history_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    this.showToast('Login history exported as CSV.', 'success');
  }

  /**
   * Copy IP to clipboard
   */
  copyToClipboard(text: string, event?: Event): void {
    if (event) {
      event.stopPropagation();
    }
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
      this.copiedIp = text;
      setTimeout(() => {
        if (this.copiedIp === text) {
          this.copiedIp = null;
        }
      }, 2000);
      this.showToast(`Copied ${text} to clipboard!`, 'info');
    }
  }

  /**
   * UI Toast Helper
   */
  showToast(message: string, type: 'success' | 'error' | 'info' = 'success'): void {
    this.toastMessage = message;
    this.toastType = type;
    if (this.toastTimeout) {
      clearTimeout(this.toastTimeout);
    }
    this.toastTimeout = setTimeout(() => {
      this.toastMessage = null;
    }, 3500);
  }

  getAvatarColor(text: string): string {
    const colors = ['#0f7a55', '#2563eb', '#7c3aed', '#db2777', '#d97706', '#0891b2', '#4f46e5'];
    let hash = 0;
    for (let i = 0; i < (text || '').length; i++) {
      hash = text.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash % colors.length);
    return colors[index];
  }
}