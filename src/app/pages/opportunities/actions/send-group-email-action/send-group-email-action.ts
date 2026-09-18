import { Component, EventEmitter, Input, OnInit, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { QuillModule } from 'ngx-quill';
import { ContactsService } from '../../../contacts/contacts.service';
import { TemplatesService } from '../../../templates/templates.service';

@Component({
  selector: 'app-send-group-email-action',
  standalone: true,
  imports: [CommonModule, FormsModule, QuillModule],
  templateUrl: './send-group-email-action.html',
  styleUrl: './send-group-email-action.css',
})
export class SendGroupEmailAction implements OnInit {
  @Input() totalRecords = 0;
  @Input() contactIds: string[] = [];
  @Output() closeSms = new EventEmitter<void>();

  template = '';
  subject = '';
  message = '';
  scheduleDate = '';
  scheduleTime = '';

  templates: any[] = [];
  isSubmitting = false;

  private readonly contactsService = inject(ContactsService);
  private readonly templatesService = inject(TemplatesService);

  ngOnInit() {
    this.setDefaultDateTime();
    this.loadTemplates();
  }

  setDefaultDateTime() {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    this.scheduleDate = `${yyyy}-${mm}-${dd}`;

    const hh = String(today.getHours()).padStart(2, '0');
    const min = String(today.getMinutes()).padStart(2, '0');
    this.scheduleTime = `${hh}:${min}`;
  }

  loadTemplates() {
    this.templatesService.getTemplates({ limit: 100, templateType: 'Email' }).subscribe({
      next: (res: any) => {
        const payload = res.data || res;
        this.templates = payload.templates || payload || [];
      },
      error: (err: any) => {
        console.error('Failed to load Email templates:', err);
      }
    });
  }

  onTemplateChange() {
    const matched = this.templates.find(t => t.name === this.template || t.id === this.template || t._id === this.template);
    if (matched) {
      this.subject = matched.name || '';
      this.message = matched.editorContent || matched.fileContent || matched.body || matched.content || '';
    }
  }

  back() {
    this.closeSms.emit();
  }

  sendEmail() {
    if (!this.subject.trim()) {
      alert('Subject is required.');
      return;
    }

    if (!this.message.trim()) {
      alert('Message content is required.');
      return;
    }

    this.isSubmitting = true;

    // Convert time to 12-hour format with AM/PM for backend consistency
    let formattedTime = this.scheduleTime;
    if (this.scheduleTime) {
      const [hoursStr, minutesStr] = this.scheduleTime.split(':');
      const hours = parseInt(hoursStr, 10);
      const ampm = hours >= 12 ? 'pm' : 'am';
      const hours12 = hours % 12 || 12;
      formattedTime = `${String(hours12).padStart(2, '0')}:${minutesStr}${ampm}`;
    }

    const matchedTemplate = this.templates.find(t => t.name === this.template || t.id === this.template || t._id === this.template);
    const templateName = matchedTemplate?.name || this.template || 'Custom Template';

    const payload = {
      template: templateName,
      subject: this.subject,
      message: this.message,
      scheduleDate: this.scheduleDate,
      scheduleTime: formattedTime,
      contactIds: this.contactIds,
      filters: { id: this.contactIds, _id: this.contactIds }
    };

    this.contactsService.sendGroupEmail(payload).subscribe({
      next: (res: any) => {
        this.isSubmitting = false;
        alert(`Email scheduled successfully for all ${this.totalRecords} contacts!`);
        this.closeSms.emit();
      },
      error: (err: any) => {
        this.isSubmitting = false;
        alert('Failed to schedule Email: ' + (err.error?.message || err.message));
      }
    });
  }
}
