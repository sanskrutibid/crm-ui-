import {
  Component,
  OnInit,
  Inject,
  PLATFORM_ID,
  ChangeDetectorRef,
  inject
} from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { NgApexchartsModule } from 'ng-apexcharts';
import { DashboardService } from './dashboard.service';
import { AuthService } from '../../pages/auth/auth.service';
import { FullCalendarModule } from '@fullcalendar/angular';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [NgApexchartsModule,RouterModule, CommonModule, FormsModule, FullCalendarModule],
  templateUrl: './dashboard.html',
  styleUrls: ['./dashboard.css']
})
export class Dashboard implements OnInit {
  isBrowser: boolean = false;
  public stats: any = {
    contacts: { total: 0, active: 0, inactive: 0 },
    leads: { total: 0, open: 0, closed: 0 },
    opportunities: { total: 0, active: 0, lost: 0 },
    won: { total: 0, closed: 0, lost: 0 },
    properties: { total: 0, open: 0, closed: 0 },
    projects: { total: 0, open: 0, closed: 0 }
  };

  /* ================= BAR CHART ================= */

  public barChartOptions: any = {
    series: [
      {
        name: 'Buying',
        data: []
      },
      {
        name: 'Selling',
        data: []
      }
    ],

    chart: {
      type: 'bar',
      height: 350,
      toolbar: {
        show: false
      }
    },

    colors: ['#81669a', '#f39a43'],

    plotOptions: {
      bar: {
        horizontal: true,
        borderRadius: 2,
        barHeight: '55%'
      }
    },

    dataLabels: {
      enabled: false
    },

    xaxis: {
      categories: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    },

    legend: {
      position: 'bottom'
    },

    grid: {
      borderColor: '#eee'
    }
  };

  /* ================= DONUT ================= */

  public donutChartOptions: any = {
    series: [0, 0, 0, 0],

    chart: {
      type: 'donut',
      height: 320
    },

    labels: [
      'Commercial',
      'Residential',
      'Purchased',
      'Rented'
    ],

    colors: [
      '#eb6a78',
      '#f6a04d',
      '#58b7d9',
      '#7b5b92'
    ],

    legend: {
      position: 'right'
    },

    dataLabels: {
      enabled: false
    },

    stroke: {
      width: 0
    }
  };

  // Sales Pipeline
  pipelineChart: any = {
    series: [{ data: [] }],
    chart: { type: 'bar', height: 320, toolbar: { show: false } },
    plotOptions: { bar: { horizontal: true, borderRadius: 6 } },
    dataLabels: { enabled: true },
    xaxis: { categories: ['New Lead', 'Qualified', 'Site Visit', 'Negotiation', 'Won'] },
    colors: ['#4F46E5']
  };

  // Revenue Chart
  revenueChart: any = {
    series: [{ name: 'Revenue', data: [] }],
    chart: { type: 'area', height: 320, toolbar: { show: false } },
    stroke: { curve: 'smooth', width: 3 },
    fill: { type: 'gradient', gradient: { shadeIntensity: 1, opacityFrom: 0.5, opacityTo: 0.05 } },
    dataLabels: { enabled: false },
    xaxis: { categories: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul'] },
    colors: ['#00C853']
  };

  // Lead Source
  leadChart: any = {
    series: [],
    chart: { type: 'donut', height: 320 },
    labels: ['Facebook', 'Website', 'Google', 'Referral', 'Walk-in'],
    legend: { position: 'bottom' },
    colors: ['#4F46E5', '#00C853', '#FF9800', '#F44336', '#00BCD4']
  };

  propertyStatus: any[] = [];
  projectPerformance: any[] = [];
  followUps: any[] = [];
  recentActivities: any[] = [];
  upcomingMeetings: any[] = [];
  topEmployees: any[] = [];
  topProjects: any[] = [];
  recentCustomers: any[] = [];
  pendingApprovals: any[] = [];
  notifications: any[] = [];

  performanceChart: any = {
    series: [
      { name: 'Target', data: [] },
      { name: 'Achieved', data: [] }
    ],
    chart: { type: 'bar', height: 330, toolbar: { show: false } },
    plotOptions: { bar: { columnWidth: '45%', borderRadius: 6 } },
    dataLabels: { enabled: false },
    colors: ['#4F46E5', '#00C853'],
    xaxis: { categories: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'] }
  };

  calendarOptions: any = {
    plugins: [dayGridPlugin, interactionPlugin],
    initialView: 'dayGridMonth',
    height: 330,
    headerToolbar: { left: 'prev,next today', center: 'title', right: '' },
    events: []
  };

  private dashboardService = inject(DashboardService);
  private cdr = inject(ChangeDetectorRef);
  private platformId = inject(PLATFORM_ID);

  private authService = inject(AuthService);

  currentUser$ = this.authService.currentUser$;



  ngOnInit(): void {
    this.isBrowser = isPlatformBrowser(this.platformId);
    if (this.isBrowser) {
      this.loadStats();
      this.loadActivities();
    }

    this.currentUser$.subscribe(user => {
      console.log('Dashboard User:', user);
    });
  }

  loadActivities(): void {
    this.dashboardService.getActivities(6).subscribe({
      next: (res: any) => {
        const payload = res.data || res;
        const list = payload.activities || (Array.isArray(payload) ? payload : []);
        this.recentActivities = list.map((act: any) => ({
          activity: act.type === 'LEAD' ? 'Lead Action' : (act.type === 'TASK' ? 'Task Action' : 'System'),
          user: act.performedBy ? `${act.performedBy.firstName} ${act.performedBy.lastName || ''}`.trim() : 'System',
          time: new Date(act.timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
        }));
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error loading activities:', err);
      }
    });
  }

  loadStats(): void {
    this.dashboardService.getStats().subscribe({
      next: (res: any) => {
        const payload = res.data || res;
        this.stats = payload;

        if (payload.yearlyGraph) {
          this.barChartOptions = {
            ...this.barChartOptions,
            series: [
              {
                name: 'Buying',
                data: payload.yearlyGraph.buying
              },
              {
                name: 'Selling',
                data: payload.yearlyGraph.selling
              }
            ],
            xaxis: {
              ...this.barChartOptions.xaxis,
              categories: payload.yearlyGraph.categories
            }
          };
        }

        if (payload.propertiesBreakdown) {
          this.donutChartOptions = {
            ...this.donutChartOptions,
            series: payload.propertiesBreakdown
          };
        }

        if (payload.leadSources) {
          this.leadChart = {
            ...this.leadChart,
            series: payload.leadSources.series,
            labels: payload.leadSources.labels
          };
        }

        if (payload.pipeline) {
          this.pipelineChart = {
            ...this.pipelineChart,
            series: [{ data: payload.pipeline.series }]
          };
        }

        if (payload.monthlyRevenue) {
          this.revenueChart = {
            ...this.revenueChart,
            series: [{ name: 'Revenue', data: payload.monthlyRevenue.series }]
          };
        }

        if (payload.performanceChart) {
          this.performanceChart = {
            ...this.performanceChart,
            series: payload.performanceChart.series
          };
        }

        if (payload.propertyStatus) {
          this.propertyStatus = payload.propertyStatus;
        }

        if (payload.projectPerformance) {
          this.projectPerformance = payload.projectPerformance;
        }

        if (payload.topProjects) {
          this.topProjects = payload.topProjects;
        }

        if (payload.topEmployees) {
          this.topEmployees = payload.topEmployees;
        }

        if (payload.followUps) {
          this.followUps = payload.followUps;
        }

        if (payload.upcomingMeetings) {
          this.upcomingMeetings = payload.upcomingMeetings;
        }

        if (payload.recentCustomers) {
          this.recentCustomers = payload.recentCustomers;
        }

        if (payload.pendingApprovals) {
          this.pendingApprovals = payload.pendingApprovals;
        }

        if (payload.notifications) {
          this.notifications = payload.notifications;
        }

        if (payload.calendarEvents) {
          this.calendarOptions = {
            ...this.calendarOptions,
            events: payload.calendarEvents
          };
        }

        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error loading dashboard stats:', err);
      }
    });
  }

  pipelineFilter = 'month';
revenueFilter = 'month';
leadFilter = 'month';

changePipelineFilter() {

  if (this.pipelineFilter === 'day') {

    this.pipelineChart.series = [{
      data: [15,12,8,5,2]
    }];

    this.pipelineChart.xaxis.categories = [
      '9 AM',
      '11 AM',
      '1 PM',
      '3 PM',
      '5 PM'
    ];

  }

  if (this.pipelineFilter === 'month') {

    this.pipelineChart.series = [{
      data: [120,90,65,40,25]
    }];

    this.pipelineChart.xaxis.categories = [
      'Lead',
      'Qualified',
      'Visit',
      'Negotiation',
      'Won'
    ];

  }

  if (this.pipelineFilter === 'year') {

    this.pipelineChart.series = [{
      data: [1200,850,620,420,250]
    }];

    this.pipelineChart.xaxis.categories = [
      '2022',
      '2023',
      '2024',
      '2025',
      '2026'
    ];

  }

  this.pipelineChart = { ...this.pipelineChart };

}

changeRevenueFilter() {

  if (this.revenueFilter === 'day') {

    this.revenueChart.series = [{
      name: 'Revenue',
      data: [2,4,5,3,6,8]
    }];

    this.revenueChart.xaxis.categories = [
      'Mon',
      'Tue',
      'Wed',
      'Thu',
      'Fri',
      'Sat'
    ];

  }

  if (this.revenueFilter === 'month') {

    this.revenueChart.series = [{
      name: 'Revenue',
      data: [12,18,15,28,34,42]
    }];

    this.revenueChart.xaxis.categories = [
      'Jan',
      'Feb',
      'Mar',
      'Apr',
      'May',
      'Jun'
    ];

  }

  if (this.revenueFilter === 'year') {

    this.revenueChart.series = [{
      name: 'Revenue',
      data: [120,180,240,310,420]
    }];

    this.revenueChart.xaxis.categories = [
      '2022',
      '2023',
      '2024',
      '2025',
      '2026'
    ];

  }

  this.revenueChart = { ...this.revenueChart };

}
changeLeadFilter() {

  if (this.leadFilter === 'day') {

    this.leadChart.series = [12,18,25,20,25];

  }

  if (this.leadFilter === 'month') {

    this.leadChart.series = [35,25,20,12,8];

  }

  if (this.leadFilter === 'year') {

    this.leadChart.series = [250,180,120,90,60];

  }

  this.leadChart = { ...this.leadChart };

}


}