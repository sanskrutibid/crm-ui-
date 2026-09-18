import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { MessagesService } from '../messages.service';
import { TemplatesService } from '../../templates/templates.service';

@Component({
  selector: 'app-send-sms',
  standalone: true,
  templateUrl: './send-sms.html',
  styleUrls: ['./send-sms.css'],
  imports: [CommonModule, FormsModule, RouterModule]
})
export class SendSms implements OnInit {
  templates: any[] = [];
  selectedTemplateId: string = '';

  mobiles: string = '';
  message: string = '';
  dltTemplateId: string = '';
  route: string = 'Transactional';

  scheduleDate: string = '';
  scheduleTime: string = '';
  isScheduled: boolean = false;

  isSending: boolean = false;
  statusMessage: string = '';
  statusType: 'success' | 'error' | '' = '';

  constructor(
    private readonly messagesService: MessagesService,
    private readonly templatesService: TemplatesService,
    private readonly router: Router,
    private readonly activatedRoute: ActivatedRoute
  ) { }

  ngOnInit(): void {
    this.loadTemplates();
    this.activatedRoute.queryParams.subscribe((params: any) => {
      if (params['mobiles']) {
        this.mobiles = params['mobiles'];
      }
    });
  }

  loadTemplates(): void {
    this.templatesService.getTemplates({ limit: 100, templateType: 'SMS' }).subscribe({
      next: (res: any) => {
        const payload = res.data || res;
        this.templates = payload.templates || payload || [];
      },
      error: (err) => console.error('Failed to load SMS templates:', err)
    });
  }

  onTemplateChange(): void {
    if (!this.selectedTemplateId) {
      return;
    }
    const template = this.templates.find(t => t.id === this.selectedTemplateId || t._id === this.selectedTemplateId);
    if (template) {
      this.message = template.editorContent || template.fileContent || template.body || template.content || '';
      if (template.templateId || template.dltTemplateId) {
        this.dltTemplateId = template.templateId || template.dltTemplateId;
      }
    }
  }

  get characterCount(): number {
    return this.message ? this.message.length : 0;
  }

  get smsSegments(): number {
    const chars = this.characterCount;
    if (chars === 0) return 0;
    if (chars <= 160) return 1;
    return Math.ceil(chars / 153);
  }

  get mobileList(): string[] {
    if (!this.mobiles) return [];
    return this.mobiles
      .split(/[,;\n]/)
      .map(m => m.trim())
      .filter(m => m.length > 0);
  }

  get mobileCount(): number {
    return this.mobileList.length;
  }

  sendSms(): void {
    this.statusMessage = '';
    this.statusType = '';

    const validMobiles = this.mobileList;
    if (validMobiles.length === 0) {
      this.statusMessage = 'Please enter at least one mobile number.';
      this.statusType = 'error';
      return;
    }

    if (!this.message || !this.message.trim()) {
      this.statusMessage = 'SMS message text is required.';
      this.statusType = 'error';
      return;
    }

    if (this.isScheduled && !this.scheduleDate) {
      this.statusMessage = 'Please select a date for scheduled SMS.';
      this.statusType = 'error';
      return;
    }

    this.isSending = true;
    this.statusMessage = this.isScheduled ? 'Scheduling SMS...' : 'Sending SMS...';

    const payload: any = {
      mobiles: validMobiles.join(', '),
      message: this.message.trim(),
      route: this.route
    };

    if (this.dltTemplateId) payload.dltTemplateId = this.dltTemplateId.trim();

    if (this.isScheduled && this.scheduleDate) {
      payload.scheduleDate = this.scheduleDate;
      if (this.scheduleTime) {
        payload.scheduleTime = this.scheduleTime;
      }
    }

    this.messagesService.scheduleSms(payload).subscribe({
      next: (res) => {
        this.isSending = false;
        this.statusMessage = this.isScheduled 
          ? 'SMS scheduled successfully!' 
          : 'SMS sent successfully!';
        this.statusType = 'success';

        this.resetForm();

        setTimeout(() => {
          this.router.navigate(['/scheduled-sms']);
        }, 1500);
      },
      error: (err) => {
        this.isSending = false;
        const errMsg = err.error?.message || err.message || 'Failed to send SMS';
        this.statusMessage = Array.isArray(errMsg) ? errMsg.join(', ') : errMsg;
        this.statusType = 'error';
      }
    });
  }

  dismissStatus(): void {
    this.statusMessage = '';
    this.statusType = '';
  }

  discardSms(): void {
    this.resetForm();
    this.statusMessage = 'SMS draft cleared.';
    this.statusType = 'success';
    setTimeout(() => {
      if (this.statusMessage === 'SMS draft cleared.') {
        this.dismissStatus();
      }
    }, 2000);
  }

  private resetForm(): void {
    this.mobiles = '';
    this.message = '';
    this.dltTemplateId = '';
    this.route = 'Transactional';
    this.scheduleDate = '';
    this.scheduleTime = '';
    this.isScheduled = false;
    this.selectedTemplateId = '';
  }
}
