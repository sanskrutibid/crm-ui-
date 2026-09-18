import { Component, OnInit, ViewChild, ViewEncapsulation, Inject, PLATFORM_ID, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FullCalendarComponent, FullCalendarModule } from '@fullcalendar/angular';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import { LeadsService } from '../leads.service';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-lead-calendar',
  standalone: true,
  imports: [CommonModule, FullCalendarModule],
  templateUrl: './calender.html',
  styleUrl: './calender.css',
  encapsulation: ViewEncapsulation.None
})
export class LeadCalendar implements OnInit {
  
  @ViewChild('calendar') calendarComponent!: FullCalendarComponent;

  
  currentMonthYear: string = 'June 2026';
  activeView: string = 'month';

  private leadsService = inject(LeadsService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private cdr = inject(ChangeDetectorRef);
   private platformId = inject(PLATFORM_ID);

isBrowser = isPlatformBrowser(this.platformId);

  constructor() {}


  calendarOptions: any = {
    plugins: [dayGridPlugin, interactionPlugin],
    initialView: 'dayGridMonth',
    headerToolbar: false, 
    themeSystem: 'standard',
    height: 'auto',
    dayMaxEvents: true,
    events: []
  };

  ngOnInit(): void {
    if (this.isBrowser) {
      this.loadCalendarLeads();
    }
  }

  addLead() {
  this.router.navigate(['/create-leads']);
}

  loadCalendarLeads(): void {
    this.leadsService.getLeads({ limit: 500 }).subscribe({
      next: (res: any) => {
        const payload = res.data || res;
        const leads = payload.leads || payload || [];
        
        const mappedEvents = leads
          .filter((l: any) => l.scheduleDate)
          .map((lead: any) => {
            const contactName = lead.contactId 
              ? `${lead.contactId.firstName} ${lead.contactId.lastName || ''}`.trim() 
              : lead.name || 'Customer';
            const assigneeName = lead.assignedTo?.firstName || 'Admin';
            
            return {
              title: `${lead.scheduleTime || ''} ${contactName} - ${assigneeName}`,
              start: this.parseLeadDate(lead.scheduleDate),
              className: 'fc-event-blue'
            };
          });

        this.calendarOptions = {
          ...this.calendarOptions,
          events: mappedEvents
        };

        setTimeout(() => {
          this.updateTitle();
        }, 150);
      },
      error: (err) => {
        console.error('Failed to load leads for calendar:', err);
      }
    });
  }

  parseLeadDate(dateStr: string): string {
    if (!dateStr) return '';
    // Format 1: "2026-05-26" -> already valid
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
      return dateStr;
    }
    
    // Format 2: "26-May-2026"
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      const day = parts[0].padStart(2, '0');
      const year = parts[2];
      const monthStr = parts[1].toLowerCase();
      
      const months: { [key: string]: string } = {
        jan: '01', feb: '02', mar: '03', apr: '04',
        may: '05', jun: '06', jul: '07', aug: '08',
        sep: '09', oct: '10', nov: '11', dec: '12'
      };
      
      const month = months[monthStr.substring(0, 3)];
      if (month) {
        return `${year}-${month}-${day}`;
      }
    }
    
    // Fallback: try parsing natively
    try {
      const parsed = new Date(dateStr);
      if (!isNaN(parsed.getTime())) {
        return parsed.toISOString().split('T')[0];
      }
    } catch (e) {}

    return dateStr;
  }

  movePrev() {
    if (this.isBrowser && this.calendarComponent) {
      const calendarApi = this.calendarComponent.getApi();
      calendarApi.prev();
      this.updateTitle();
    }
  }

  moveNext() {
    if (this.isBrowser && this.calendarComponent) {
      const calendarApi = this.calendarComponent.getApi();
      calendarApi.next();
      this.updateTitle();
    }
  }

  moveToday() {
    if (this.isBrowser && this.calendarComponent) {
      const calendarApi = this.calendarComponent.getApi();
      calendarApi.today();
      this.updateTitle();
    }
  }

  changeView(viewName: string, mode: string) {
    if (this.isBrowser && this.calendarComponent) {
      this.activeView = mode;
      const calendarApi = this.calendarComponent.getApi();
      calendarApi.changeView(viewName);
      this.updateTitle();
    }
  }

  private updateTitle() {
    if (this.isBrowser && this.calendarComponent) {
      const calendarApi = this.calendarComponent.getApi();
      this.currentMonthYear = calendarApi.view.title;
    }
  }
}