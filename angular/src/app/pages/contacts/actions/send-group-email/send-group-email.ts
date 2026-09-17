import { Component, Output, EventEmitter, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TemplatesService } from '../../../templates/templates.service';
import { ContactsService } from '../../contacts.service';
import { QuillModule } from 'ngx-quill';

@Component({
  selector: 'app-send-group-email',
  standalone: true,
  imports: [CommonModule, FormsModule,QuillModule],
  templateUrl: './send-group-email.html',
  styleUrl: './send-group-email.css',
})

export class SendGroupEmail implements OnInit {
  @Input() filters: any = {};
  @Input() totalRecords: number = 0;
  @Output() closeSms = new EventEmitter<void>();

  templates: any[] = [];
  selectedTemplateId: string = '';

  subject: string = '';
  message: string = '';
  scheduleDate: string = '';
  scheduleTime: string = '';

  isSending: boolean = false;
  statusMessage: string = '';
  statusType: 'success' | 'error' | '' = '';
 
  constructor(
    private readonly templatesService: TemplatesService,
    private readonly contactsService: ContactsService
  ) { }

  ngOnInit() {
    this.loadTemplates();
    this.setDefaultDateTime();
  }

  loadTemplates() {
    this.templatesService.getTemplates({ limit: 100, templateType: 'Email' }).subscribe({
      next: (res: any) => {
        const payload = res.data || res;
        this.templates = payload.templates || payload || [];
      },
      error: (err) => console.error('Failed to load email templates:', err)
    });
  }

  setDefaultDateTime() {
    const today = new Date();
    // YYYY-MM-DD
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    this.scheduleDate = `${yyyy}-${mm}-${dd}`;

    // HH:MM
    const hh = String(today.getHours()).padStart(2, '0');
    const min = String(today.getMinutes()).padStart(2, '0');
    this.scheduleTime = `${hh}:${min}`;
  }

  onTemplateChange() {
    if (!this.selectedTemplateId) return;
    const template = this.templates.find(t => t.id === this.selectedTemplateId);
    if (template) {
      this.subject = template.name;
      this.message = template.editorContent || template.fileContent || '';
    }
  }

  closeEmailForm() {
    this.closeSms.emit();
  }

  sendEmail(event: Event) {
    event.preventDefault();
    if (!this.subject || !this.message) {
      this.statusMessage = 'Subject and Message content are required.';
      this.statusType = 'error';
      return;
    }

    this.isSending = true;
    this.statusMessage = 'Scheduling group email...';
    this.statusType = '';

    // Convert scheduleTime into 12-hour format with AM/PM (e.g. 17:42 -> 05:42pm)
    let formattedTime = this.scheduleTime;
    if (this.scheduleTime) {
      const [hoursStr, minutesStr] = this.scheduleTime.split(':');
      const hours = parseInt(hoursStr, 10);
      const ampm = hours >= 12 ? 'pm' : 'am';
      const hours12 = hours % 12 || 12;
      formattedTime = `${String(hours12).padStart(2, '0')}:${minutesStr}${ampm}`;
    }

    const tempName = this.templates.find(t => t.id === this.selectedTemplateId)?.name || 'Custom Template';

    const payload = {
      template: tempName,
      subject: this.subject,
      message: this.message,
      scheduleDate: this.scheduleDate,
      scheduleTime: formattedTime,
      filters: this.filters
    };

    this.contactsService.sendGroupEmail(payload).subscribe({
      next: (res: any) => {
        this.isSending = false;
        this.statusMessage = `Group email scheduled successfully for ${res.count || this.totalRecords} contacts!`;
        this.statusType = 'success';
        setTimeout(() => {
          this.closeEmailForm();
        }, 1800);
      },
      error: (err) => {
        this.isSending = false;
        const errMsg = err.error?.message || err.message || 'Failed to send group email.';
        this.statusMessage = Array.isArray(errMsg) ? errMsg.join(', ') : errMsg;
        this.statusType = 'error';
      }
    });
  }
}
