import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
  FormsModule
} from '@angular/forms';
import { RouterModule } from '@angular/router';
import { SourcesService, SourceItem } from '../../../services/sources.service';

@Component({
  selector: 'app-sources',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule
  ],
  templateUrl: './sources.html',
  styleUrls: ['./sources.css']
})
export class Sources implements OnInit {
  private fb = inject(FormBuilder);
  private sourcesService = inject(SourcesService);

  // Form & UI States
  sourceForm!: FormGroup;
  editForm!: FormGroup;
  showCreateForm = false;
  showEditModal = false;
  sourceToEdit: SourceItem | null = null;
  selectedSource: SourceItem | null = null;

  // Data & Filters
  sources: SourceItem[] = [];
  searchText = '';
  statusFilter = 'All'; // 'All' | 'Active' | 'Inactive'
  sortOrder = 'id-asc'; // 'id-asc' | 'id-desc' | 'name-asc' | 'name-desc'

  // Loading States
  isLoading = false;
  isSaving = false;
  isUpdating = false;
  isDeleting = false;
  isRefreshing = false;

  // Modals & Feedback
  showDeleteModal = false;
  sourceToDelete: SourceItem | null = null;
  toastMessage: string | null = null;
  toastType: 'success' | 'error' | 'info' = 'success';
  private toastTimeout: any;

  constructor() {
    this.initForms();
  }

  ngOnInit(): void {
    this.loadSources();
  }

  private initForms(): void {
    this.sourceForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
      isActive: [true, [Validators.required]]
    });

    this.editForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
      isActive: [true, [Validators.required]]
    });
  }

  /**
   * Load all sources from backend DB API
   */
  loadSources(itemToScroll?: SourceItem | null): void {
    this.isLoading = true;
    this.sourcesService.getSources().subscribe({
      next: (list) => {
        this.sources = list || [];
        this.isLoading = false;
        this.isRefreshing = false;

        if (itemToScroll) {
          const found = this.sources.find(s => s.name.toLowerCase() === itemToScroll.name.toLowerCase());
          if (found) {
            this.selectedSource = found;
          } else if (this.sources.length > 0) {
            this.selectedSource = this.sources[this.sources.length - 1];
          }
          this.scrollToBottom();
        } else if (!this.selectedSource && this.sources.length > 0) {
          this.selectedSource = this.sources[0];
        }
      },
      error: (err: any) => {
        this.isLoading = false;
        this.isRefreshing = false;
        console.error('Error loading sources from DB:', err);
        const errMsg = err?.error?.message || err?.message || 'Failed to load sources from database.';
        this.showToast(errMsg, 'error');
      }
    });
  }

  refreshSources(): void {
    this.isRefreshing = true;
    this.loadSources();
  }

  private scrollToBottom(): void {
    setTimeout(() => {
      const sourceCards = document.querySelectorAll('.source-card');
      if (sourceCards && sourceCards.length > 0) {
        const lastCard = sourceCards[sourceCards.length - 1];
        lastCard.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    }, 100);
  }

  /**
   * Get 1-based sequential display index for a source item
   */
  getSourceIndex(source: SourceItem | null | undefined): number {
    if (!source) return 1;
    if (source.displayId && typeof source.displayId === 'number') {
      return source.displayId;
    }
    const index = this.sources.findIndex(s => 
      (s._id !== undefined && source._id !== undefined && String(s._id) === String(source._id)) ||
      (s.id !== undefined && source.id !== undefined && String(s.id) === String(source.id)) ||
      (s.name && source.name && s.name.toLowerCase() === source.name.toLowerCase())
    );
    if (index !== -1) return index + 1;
    return this.sources.length + 1;
  }

  /**
   * Helper icon picker based on source name
   */
  getSourceIcon(name: string = ''): string {
    const combined = name.toLowerCase();
    if (combined.includes('magicbrick') || combined.includes('99acres') || combined.includes('housing') || combined.includes('portal') || combined.includes('nobroker')) {
      return 'fas fa-building';
    }
    if (combined.includes('facebook') || combined.includes('meta')) {
      return 'fab fa-facebook-f';
    }
    if (combined.includes('instagram') || combined.includes('insta')) {
      return 'fab fa-instagram';
    }
    if (combined.includes('google') || combined.includes('adword') || combined.includes('ppc')) {
      return 'fab fa-google';
    }
    if (combined.includes('social') || combined.includes('linkedin') || combined.includes('youtube')) {
      return 'fas fa-share-alt';
    }
    if (combined.includes('referral') || combined.includes('partner') || combined.includes('broker') || combined.includes('agent')) {
      return 'fas fa-user-friends';
    }
    if (combined.includes('walk') || combined.includes('direct') || combined.includes('visit')) {
      return 'fas fa-walking';
    }
    if (combined.includes('web') || combined.includes('site') || combined.includes('landing') || combined.includes('seo')) {
      return 'fas fa-globe';
    }
    if (combined.includes('call') || combined.includes('tele') || combined.includes('phone') || combined.includes('sms')) {
      return 'fas fa-phone-alt';
    }
    if (combined.includes('print') || combined.includes('hoarding') || combined.includes('newspaper') || combined.includes('pamphlet')) {
      return 'fas fa-newspaper';
    }
    if (combined.includes('ad') || combined.includes('campaign')) {
      return 'fas fa-bullhorn';
    }
    return 'fas fa-layer-group';
  }

  /**
   * Filter and sort sources
   */
  filteredSources(): SourceItem[] {
    let result = [...this.sources];

    // Status Filter
    if (this.statusFilter !== 'All') {
      const wantActive = this.statusFilter === 'Active';
      result = result.filter(s => (s.isActive !== false) === wantActive);
    }

    // Search Query (ID, Name)
    if (this.searchText) {
      const query = this.searchText.toLowerCase().trim();
      result = result.filter(source => {
        const displayId = String(this.getSourceIndex(source));
        const rawId = String(source._id || source.id || source.sourceId || '').toLowerCase();
        const nameStr = (source.name || '').toLowerCase();
        return nameStr.includes(query) ||
               displayId === query ||
               displayId === query.replace('#', '') ||
               rawId.includes(query);
      });
    }

    // Sort order
    result.sort((a, b) => {
      const idA = this.getSourceIndex(a);
      const idB = this.getSourceIndex(b);
      const nameA = (a.name || '').toLowerCase();
      const nameB = (b.name || '').toLowerCase();

      switch (this.sortOrder) {
        case 'id-asc':
          return idA - idB;
        case 'id-desc':
          return idB - idA;
        case 'name-asc':
          return nameA.localeCompare(nameB);
        case 'name-desc':
          return nameB.localeCompare(nameA);
        default:
          return idA - idB;
      }
    });

    return result;
  }

  selectSource(source: SourceItem): void {
    this.selectedSource = (this.selectedSource?._id === source._id || this.selectedSource?.id === source.id) ? null : source;
  }

  clearSearch(): void {
    this.searchText = '';
    this.statusFilter = 'All';
  }

  /**
   * Open Add Source Form
   */
  openCreateSource(): void {
    this.showCreateForm = true;
    this.sourceForm.reset({
      name: '',
      isActive: true
    });
  }

  /**
   * Cancel / Close Form
   */
  cancelSource(): void {
    this.showCreateForm = false;
    this.sourceForm.reset();
  }

  /**
   * Save Source (Create via API POST)
   */
  saveSource(): void {
    if (this.sourceForm.invalid) {
      this.sourceForm.markAllAsTouched();
      this.showToast('Please enter a valid source name (min 2 characters).', 'error');
      return;
    }

    const formVal = this.sourceForm.value;
    const sourceName = formVal.name?.trim();
    const isActiveBool = formVal.isActive === true || formVal.isActive === 'true' || formVal.isActive === 'Active';

    // Check duplicate name
    const isDuplicate = this.sources.some(s => s.name?.toLowerCase() === sourceName?.toLowerCase());
    if (isDuplicate) {
      this.showToast(`Source "${sourceName}" already exists!`, 'error');
      return;
    }

    this.isSaving = true;

    this.sourcesService.createSource({
      name: sourceName,
      isActive: isActiveBool
    }).subscribe({
      next: (res: any) => {
        this.isSaving = false;
        this.showToast(`Source "${sourceName}" added successfully to Database!`, 'success');
        this.showCreateForm = false;
        const createdSource = res?.data || res?.source || res || { name: sourceName, isActive: isActiveBool };
        this.loadSources(createdSource);
      },
      error: (err: any) => {
        this.isSaving = false;
        console.error('Error creating source:', err);
        const errMsg = Array.isArray(err?.error?.message) 
          ? err.error.message.join(', ') 
          : (err?.error?.message || err?.message || 'Failed to create source.');
        this.showToast(errMsg, 'error');
      }
    });
  }

  /**
   * Open Edit Modal
   */
  openEditSource(source: SourceItem, event?: Event): void {
    if (event) {
      event.stopPropagation();
    }
    this.sourceToEdit = source;
    this.editForm.patchValue({
      name: source.name,
      isActive: source.isActive !== false
    });
    this.showEditModal = true;
  }

  closeEditModal(): void {
    this.showEditModal = false;
    this.sourceToEdit = null;
    this.editForm.reset();
  }

  /**
   * Update Source
   */
  updateSource(): void {
    if (!this.sourceToEdit) return;
    if (this.editForm.invalid) {
      this.editForm.markAllAsTouched();
      this.showToast('Please enter a valid source name.', 'error');
      return;
    }

    const targetId = this.sourceToEdit._id || this.sourceToEdit.id;
    if (!targetId) return;

    const formVal = this.editForm.value;
    const sourceName = formVal.name?.trim();
    const isActiveBool = formVal.isActive === true || formVal.isActive === 'true' || formVal.isActive === 'Active';

    // Check duplicate name (excluding itself)
    const isDuplicate = this.sources.some(s => 
      (String(s._id) !== String(targetId) && String(s.id) !== String(targetId)) &&
      s.name?.toLowerCase() === sourceName?.toLowerCase()
    );
    if (isDuplicate) {
      this.showToast(`Source "${sourceName}" already exists!`, 'error');
      return;
    }

    this.isUpdating = true;
    this.sourcesService.updateSource(targetId, {
      name: sourceName,
      isActive: isActiveBool
    }).subscribe({
      next: () => {
        this.isUpdating = false;
        this.showToast(`Source updated successfully!`, 'success');
        this.closeEditModal();
        this.loadSources();
      },
      error: (err: any) => {
        this.isUpdating = false;
        console.error('Error updating source:', err);
        const errMsg = Array.isArray(err?.error?.message) 
          ? err.error.message.join(', ') 
          : (err?.error?.message || err?.message || 'Failed to update source');
        this.showToast(errMsg, 'error');
      }
    });
  }

  /**
   * Toggle Active / Inactive Status
   */
  toggleStatus(source: SourceItem, event?: Event): void {
    if (event) {
      event.stopPropagation();
    }
    const targetId = source._id || source.id;
    if (!targetId) return;

    const currentActive = source.isActive !== false;
    this.sourcesService.toggleStatus(targetId, currentActive).subscribe({
      next: () => {
        source.isActive = !currentActive;
        source.status = source.isActive ? 'Active' : 'Inactive';
        this.showToast(`Source "${source.name}" marked as ${source.isActive ? 'Active' : 'Inactive'}`, 'success');
      },
      error: (err: any) => {
        console.error('Error toggling source status:', err);
        this.showToast('Failed to update status', 'error');
      }
    });
  }

  /**
   * Trigger Delete Confirmation Dialog
   */
  promptDelete(source: SourceItem, event?: Event): void {
    if (event) {
      event.stopPropagation();
    }
    this.sourceToDelete = source;
    this.showDeleteModal = true;
  }

  closeDeleteModal(): void {
    this.showDeleteModal = false;
    this.sourceToDelete = null;
  }

  /**
   * Perform deletion
   */
  executeDelete(): void {
    if (!this.sourceToDelete) return;
    const targetId = this.sourceToDelete._id || this.sourceToDelete.id;
    if (!targetId) return;

    this.isDeleting = true;
    this.sourcesService.deleteSource(targetId).subscribe({
      next: () => {
        this.isDeleting = false;
        this.showToast(`Source "${this.sourceToDelete?.name}" deleted successfully`, 'success');
        this.showDeleteModal = false;
        if (this.selectedSource?._id === targetId || this.selectedSource?.id === targetId) {
          this.selectedSource = null;
        }
        this.sourceToDelete = null;
        this.loadSources();
      },
      error: (err: any) => {
        this.isDeleting = false;
        console.error('Error deleting source:', err);
        const errMsg = err?.error?.message || err?.message || 'Failed to delete source';
        this.showToast(errMsg, 'error');
        this.showDeleteModal = false;
      }
    });
  }

  /**
   * Export list as CSV
   */
  exportToCsv(): void {
    const list = this.filteredSources();
    if (list.length === 0) {
      this.showToast('No sources to export', 'info');
      return;
    }

    const headers = ['ID', 'Source Name', 'Status', 'Created Date'];
    const rows = list.map(s => [
      `"${this.getSourceIndex(s)}"`,
      `"${(s.name || '').replace(/"/g, '""')}"`,
      `"${s.isActive !== false ? 'Active' : 'Inactive'}"`,
      `"${s.createdAt ? new Date(s.createdAt).toLocaleDateString() : ''}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `sources_export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    this.showToast('Sources exported to CSV successfully!', 'success');
  }

  // Getters for Stats
  get totalCount(): number {
    return this.sources.length;
  }

  get activeCount(): number {
    return this.sources.filter(s => s.isActive !== false).length;
  }

  get inactiveCount(): number {
    return this.sources.filter(s => s.isActive === false).length;
  }

  get latestSource(): SourceItem | null {
    if (this.sources.length === 0) return null;
    return this.sources[this.sources.length - 1];
  }

  get nextAutoId(): number {
    return this.sources.length + 1;
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
}