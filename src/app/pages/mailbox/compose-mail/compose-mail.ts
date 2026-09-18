import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { QuillModule } from 'ngx-quill';
import { MailboxService } from '../mailbox.service';
import { TemplatesService } from '../../templates/templates.service';

@Component({
  selector: 'app-compose-mail',
  standalone: true,
  templateUrl: './compose-mail.html',
  styleUrls: ['./compose-mail.css'],
  imports: [CommonModule, FormsModule, RouterModule, QuillModule]
})
export class ComposeMail implements OnInit {
  templates: any[] = [];
  selectedTemplateId: string = '';

  to: string = '';
  cc: string = '';
  bcc: string = '';
  subject: string = '';
  body: string = '';
  
  scheduleDate: string = '';
  scheduleTime: string = '';
  isScheduled: boolean = false;

  showCc: boolean = false;
  showBcc: boolean = false;

  isSending: boolean = false;
  statusMessage: string = '';
  statusType: 'success' | 'error' | '' = '';

  quillConfig = {
    toolbar: [
      ['bold', 'italic', 'underline', 'strike'],
      [{ header: [1, 2, 3, false] }],
      [{ list: 'ordered' }, { list: 'bullet' }],
      [{ align: [] }],
      [{ color: [] }, { background: [] }],
      ['link'],
      ['clean']
    ]
  };

  constructor(
    private readonly mailboxService: MailboxService,
    private readonly templatesService: TemplatesService,
    private readonly router: Router,
    private readonly route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.loadTemplates();
    this.route.queryParams.subscribe(params => {
      if (params['to']) {
        this.to = params['to'];
      }
    });
  }

  loadTemplates(): void {
    this.templatesService.getTemplates({ limit: 100, templateType: 'Email' }).subscribe({
      next: (res: any) => {
        const payload = res.data || res;
        this.templates = payload.templates || payload || [];
      },
      error: (err) => console.error('Failed to load email templates:', err)
    });
  }

  onTemplateChange(): void {
    if (!this.selectedTemplateId) {
      return;
    }
    const template = this.templates.find(t => t.id === this.selectedTemplateId || t._id === this.selectedTemplateId);
    if (template) {
      this.subject = template.name || template.subject || '';
      this.body = template.editorContent || template.fileContent || template.body || template.content || '';
    }
  }

  private validateEmail(email: string): boolean {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email.trim());
  }

  sendMail(): void {
    this.statusMessage = '';
    this.statusType = '';

    if (!this.to || !this.to.trim()) {
      this.statusMessage = 'Please enter at least one recipient email address in the "To" field.';
      this.statusType = 'error';
      return;
    }

    const recipientEmails = this.to.split(/[,;]/).map(e => e.trim()).filter(Boolean);
    if (recipientEmails.length === 0) {
      this.statusMessage = 'Please enter a valid recipient email address.';
      this.statusType = 'error';
      return;
    }

    for (const email of recipientEmails) {
      if (!this.validateEmail(email)) {
        this.statusMessage = `"${email}" is not a valid email address.`;
        this.statusType = 'error';
        return;
      }
    }

    if (!this.subject || !this.subject.trim()) {
      this.statusMessage = 'Email Subject is required.';
      this.statusType = 'error';
      return;
    }

    if (!this.body || !this.body.trim()) {
      this.statusMessage = 'Email Body Content is required.';
      this.statusType = 'error';
      return;
    }

    if (this.isScheduled) {
      if (!this.scheduleDate) {
        this.statusMessage = 'Please select a date for scheduled email.';
        this.statusType = 'error';
        return;
      }
    }

    this.isSending = true;
    this.statusMessage = this.isScheduled ? 'Scheduling email...' : 'Sending email...';

    const payload: any = {
      to: recipientEmails.join(', '),
      subject: this.subject.trim(),
      body: this.body
    };

    if (this.showCc && this.cc) {
      const ccEmails = this.cc.split(/[,;]/).map(e => e.trim()).filter(Boolean);
      if (ccEmails.length > 0) payload.cc = ccEmails.join(', ');
    }

    if (this.showBcc && this.bcc) {
      const bccEmails = this.bcc.split(/[,;]/).map(e => e.trim()).filter(Boolean);
      if (bccEmails.length > 0) payload.bcc = bccEmails.join(', ');
    }

    if (this.isScheduled && this.scheduleDate) {
      payload.scheduleDate = this.scheduleDate;
      if (this.scheduleTime) {
        payload.scheduleTime = this.scheduleTime;
      }
    }

    this.mailboxService.scheduleEmail(payload).subscribe({
      next: (res) => {
        this.isSending = false;
        this.statusMessage = this.isScheduled 
          ? 'Email scheduled successfully!' 
          : 'Email sent successfully!';
        this.statusType = 'success';
        
        this.resetForm();

        setTimeout(() => {
          this.router.navigate(['/scheduled-mails']);
        }, 1500);
      },
      error: (err) => {
        this.isSending = false;
        const errMsg = err.error?.message || err.message || 'Failed to send email';
        this.statusMessage = Array.isArray(errMsg) ? errMsg.join(', ') : errMsg;
        this.statusType = 'error';
      }
    });
  }

  toggleCc(): void {
    this.showCc = !this.showCc;
  }

  toggleBcc(): void {
    this.showBcc = !this.showBcc;
  }

  dismissStatus(): void {
    this.statusMessage = '';
    this.statusType = '';
  }

  discardMail(): void {
    this.resetForm();
    this.statusMessage = 'Mail draft discarded.';
    this.statusType = 'success';
    setTimeout(() => {
      if (this.statusMessage === 'Mail draft discarded.') {
        this.dismissStatus();
      }
    }, 2000);
  }

  private resetForm(): void {
    this.to = '';
    this.cc = '';
    this.bcc = '';
    this.subject = '';
    this.body = '';
    this.scheduleDate = '';
    this.scheduleTime = '';
    this.isScheduled = false;
    this.selectedTemplateId = '';
    this.showCc = false;
    this.showBcc = false;
  }
}
