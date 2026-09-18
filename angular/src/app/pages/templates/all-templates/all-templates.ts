import { Component, OnInit , ViewEncapsulation} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { TemplatesService } from '../templates.service';

interface TemplateItem {
  id: string | number;
  name: string;
  templateId: string;
  templateType: string;
  content: string;
  createdDate: Date;
}

@Component({
  selector: 'app-all-templates',
  standalone: true,
  templateUrl: './all-templates.html',
  styleUrls: ['./all-templates.css'],
  imports: [CommonModule, FormsModule],
  encapsulation: ViewEncapsulation.None
})
export class AllTemplates implements OnInit {
  searchQuery: string = '';
  filteredTemplates: TemplateItem[] = [];
  selectedTemplate: TemplateItem | null = null;
  templates: TemplateItem[] = [];

  constructor(
    private router: Router,
    private templatesService: TemplatesService
  ) {}

  ngOnInit(): void {
    this.loadTemplates();
  }

  loadTemplates(): void {
    this.templatesService.getTemplates({ limit: 500 }).subscribe({
      next: (res: any) => {
        const payload = res.data || res;
        const rawTemplates = payload.templates || payload || [];
        this.templates = rawTemplates.map((t: any) => ({
          id: t.id,
          name: t.name,
          templateId: t.templateId || 'N/A',
          templateType: t.templateType,
          content: t.editorContent || t.fileContent || t.importUrl || '',
          createdDate: new Date(t.createdAt)
        }));
        this.filterTemplates();
      },
      error: (err) => {
        console.error('Failed to load templates from backend:', err);
      }
    });
  }

  selectedTypeFilter: string | null = null;

  filterTemplates(): void {
    this.filteredTemplates = this.templates.filter(item => {
      const matchesSearch = item.name.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
                           item.templateId.toLowerCase().includes(this.searchQuery.toLowerCase());
      const matchesType = !this.selectedTypeFilter || item.templateType === this.selectedTypeFilter;
      return matchesSearch && matchesType;
    });
  }

  toggleTypeFilter(type: string): void {
    if (this.selectedTypeFilter === type) {
      this.selectedTypeFilter = null;
    } else {
      this.selectedTypeFilter = type;
    }
    this.filterTemplates();
  }

  getTypeCount(type: string): number {
    return this.templates.filter(t => t.templateType === type).length;
  }

  viewTemplateDetails(template: TemplateItem): void {
    this.selectedTemplate = template;
  }

  closeDetails(): void {
    this.selectedTemplate = null;
  }

  navigateToCreate(): void {
    this.router.navigate(['/create-template']);
  }

  editTemplate(template: TemplateItem): void {
    console.log('Redirecting editor engine layout configuration:', template);
  }

  deleteTemplate(template: TemplateItem): void {
    if(confirm(`Remove template layout "${template.name}"?`)) {
      this.templatesService.deleteTemplate(template.id.toString()).subscribe({
        next: () => {
          alert('Template deleted successfully!');
          this.loadTemplates();
          this.closeDetails();
        },
        error: (err) => {
          console.error('Failed to delete template:', err);
          const errMsg = err.error?.message || err.message || 'Unknown error';
          alert('Error deleting template: ' + (Array.isArray(errMsg) ? errMsg.join(', ') : errMsg));
        }
      });
    }
  }
}