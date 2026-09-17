import { Component, OnInit, ViewChild, ViewEncapsulation, Inject, PLATFORM_ID, inject } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FullCalendarComponent, FullCalendarModule } from '@fullcalendar/angular';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import { OpportunitiesService } from '../opportunities.service';

@Component({
  selector: 'app-opportunity-calendar',
  standalone: true,
  imports: [CommonModule, FullCalendarModule],
  templateUrl: './opp-calendar.html',
  styleUrl: './opp-calendar.css',
  encapsulation: ViewEncapsulation.None
})
export class OppCalendar implements OnInit {
  
  @ViewChild('calendar') calendarComponent!: FullCalendarComponent;

  isBrowser: boolean = false;
  currentMonthYear: string = 'June 2026';
  activeView: string = 'month';

  private opportunitiesService = inject(OpportunitiesService);

  constructor(@Inject(PLATFORM_ID) private platformId: Object) {
    this.isBrowser = isPlatformBrowser(this.platformId);
  }

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
      this.loadCalendarOpportunities();
    }
  }

  loadCalendarOpportunities(): void {
    this.opportunitiesService.getOpportunities({ viewType: 'calendar', limit: 500 }).subscribe({
      next: (res: any) => {
        const payload = res.data || res;
        const opportunities = payload.opportunities || payload || [];
        
        const mappedEvents = opportunities
          .filter((o: any) => o.scheduleDate && o.contactId)
          .map((opp: any) => {
            const contactName = opp.contactId 
              ? `${opp.contactId.firstName} ${opp.contactId.lastName || ''}`.trim() 
              : opp.name || 'Customer';
            const assigneeName = opp.assignedTo?.firstName || 'Admin';
            
            return {
              title: `${opp.scheduleTime || ''} ${contactName} - ${assigneeName}`,
              start: this.parseOpportunityDate(opp.scheduleDate),
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
        console.error('Failed to load opportunities for calendar:', err);
      }
    });
  }

  parseOpportunityDate(dateStr: string): string {
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