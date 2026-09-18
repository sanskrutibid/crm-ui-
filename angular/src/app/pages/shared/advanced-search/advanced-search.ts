import { Component, Output, EventEmitter, OnInit, inject } from '@angular/core';
import { AuthService } from '../../auth/auth.service';
import { FormsModule } from '@angular/forms'; 
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';


@Component({
  selector: 'app-advanced-search',
  standalone: true,                  
  imports: [FormsModule, CommonModule],            
  templateUrl: './advanced-search.html',
  styleUrl: './advanced-search.css'
})
export class AdvancedSearch implements OnInit {

  searchType = '';
  private authService = inject(AuthService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  agentsList: any[] = [];
  usersList: string[] = [];

  purposeList: string[] = [
    'Follow-Up Scheduled', 'Meeting Scheduled', 'Site Visit Scheduled', 
    'Site Visit Rescheduled', 'Follow-Up After Site Visit', 'Finalization', 
    'Closure Done', 'Call for Property', 'Call for Retention', 
    'Recalling Clients', 'Call for Feedback', 'Relationship', 
    'Complain', 'Service Request', 'Payment Cancellation', 'Call for Verification'
  ];

  currentStatusList: string[] = [
    'Conversation done', 'Conversation done(via WhatsApp)', 'Phone not reachable', 
    'Phone is ringing', 'Disconnecting call', 'Call me later', 'Reschedule Follow-up'
  ];

  statusList: string[] = [
    'New', 'In Progress', 'On Call', 'Disqualified/Cancelled', 
    'Qualified/Completed', 'Rejected/Out of Business', 'On Hold/Park'
  ];

  reasonsList: string[] = [
    'Inaccurate data', 'Not Interested', 'No Budget', 'No Response', 
    'No Authority', 'Already Committed', 'Disconnecting Call', 'Duplicate Lead', 
    'Business Competitor', 'Never Raised Request', 'Different domain Lead', 
    'Language Problem', 'Junk/Fake Lead', 'Different Requirement', 
    'Plan Postponed', 'Project Issue', 'Different Location', 'Other (reason not listed)'
  ];

  sourceList: string[] = [
    '99acres.com', '99acres.com(free)', 'Abodesindia.com', 'ABP', 'Agent Referral', 
    'Area Group', 'Asklaila.com', 'BANM Exhibition', 'BillBoard Raj Laxmi', 'Blog', 
    'BNI', 'BPT', 'Business Card', 'Canopy', 'Chatru Ambule', 'Classified Portals (Others)', 
    'Click.in', 'Clickindia.com', 'Club Data', 'Cold Calling', 'Commonfloor', 'CommonFloor(Free)', 
    'Credai Bengal Fair', 'CRM', 'Dainik Bhaskar', 'Dev Lade Br', 'Developer/Builder Referral', 
    'Direct Client', 'DNA Infoline', 'Email Marketing', 'Employee', 'Exhibition', 'FaceBook', 
    'Friends & Relatives', 'FTF', 'Google Adwords', 'Google Alert', 'Google Forms', 'Google Search', 
    'Google+', 'Gujarat Samachar', 'Hard Copy Data', 'HDFC Red', 'Homefront', 'Homeonline.com', 
    'Housing.com', 'hraindia', 'Incoming call', 'Indialist.com', 'Indiamart.com', 'Indianmoney.com', 
    'Indiaproperty.com', 'Influencer Marketing', 'Infoline.com', 'Instagram', 'Iproperty.com', 
    'IVR System', 'JIPL Real Estate', 'Justdial.com', 'Knowlarity', 'landkhoj.com', 'Linkedin', 
    'LinkedIn Lead Form', 'Live Chat', 'Loksatta', 'Magazine ads', 'Magicbricks(Free)', 'Magicbricks.com', 
    'Maharashtra Times', 'MailChimp', 'MailerLite', 'Makaan.com', 'MCHI Exhibition', 'Medical Association', 
    'Midday', 'Missed Call Alter', 'Mobile App', 'Mumbai Mirror', 'Mumbai Samachar', 'MyOperator', 
    'NAR India', 'Nav Bharat Times', 'NAVIN', 'NAVIN (Offline)', 'NAVIN (Online)', 'Networking', 
    'Newspaper ads', 'Old Client Referral', 'Olx.in', 'Online Media', 'Others', 'Own Website', 
    'Phian Infotech', 'Poster/Banner/Billboards', 'PRAGATI', 'PRAGATI (Offline)', 'PRAGATI (Online)', 
    'Promotional Activities', 'Property Fair', 'Property Feast', 'Propertywala.com', 'Proxio', 
    'Purchased Data', 'Quickr.com(Free)', 'Quickr.com(Paid)', 'Quora', 'Real Club', 'Real Estate Club', 
    'Real Estate Portals (Others)', 'Realestateindia.com', 'Realty Expo', 'Reca', 'Referral', 
    'Road Show', 'Roofandfloor', 'Sabkaghar.com', 'Sameer gedam (Raisoni)', 'Sanmarg', 'Saree Directory', 
    'Sarv Ivr', 'Self', 'SMS ads', 'SMS Callback', 'Staff Referral', 'Sulekha.com', 'Tawk.to', 
    'Telecalling', 'The Economic Times', 'The Hindu', 'The Telegraph', 'Time Of India', 'Times Classified', 
    'Toll Free No', 'TOUFIQUE', 'TV ads', 'Twitter', 'Unknown', 'V- Serve', 'VCC Panel', 'Vijay Sakharkar Br', 
    'Viva Street', 'Walk-in', 'Walk-in(QRCode)', 'Webindia123.com', 'Whats app', 'Yahoo.com', 'YASH', 'Youtube.com'
  ];

  advSearch: any = {
    customerType: '', contactType: '', city: '', location: '', branch: '', 
    assignTo: '', submittedBy: '', source: '', purpose: '', ratingFrom: null, ratingTo: null,
    currentStatus: '', status: '', reasons: '', permission: '', batchNumber: '', searchMode: 'Regular',
    followupDateFrom: '', followupDateTo: '', createDateFrom: '', createDateTo: '', 
    assignedDateFrom: '', assignedDateTo: '', updateDateFrom: '', updateDateTo: ''
  };

 @Output() searchPerformed = new EventEmitter<any>();
  @Output() closeSearch = new EventEmitter<void>();

  
  constructor() {}

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      this.searchType = params['type'];
    });
    this.loadAgents();
  }

  loadAgents() {
    this.authService.getAgents().subscribe({
      next: (res: any) => {
        this.agentsList = res.data || res || [];
        this.usersList = this.agentsList.map(a => `${a.firstName} ${a.lastName || ''}`.trim());
      },
      error: (err) => {
        console.error('Failed to load agents in advanced search:', err);
      }
    });
  }

  hideAdvancedSearch() {
   
    this.closeSearch.emit();

    if (this.searchType === 'contacts') {
      console.log('Redirecting to All Contacts...');
      this.router.navigate(['/all-contacts']); 
    } else if (this.searchType === 'leads') {
      console.log('Redirecting to All Leads...');
      this.router.navigate(['/all-leads']);
    } else {
      
      this.router.navigate(['/']); 
    }
  }

  clearSearch() {
    this.advSearch = {
      customerType: '', contactType: '', city: '', location: '', branch: '', 
      assignTo: '', submittedBy: '', source: '', purpose: '', ratingFrom: null, ratingTo: null,
      currentStatus: '', status: '', reasons: '', permission: '', batchNumber: '', searchMode: 'Regular',
      followupDateFrom: '', followupDateTo: '', createDateFrom: '', createDateTo: '', 
      assignedDateFrom: '', assignedDateTo: '', updateDateFrom: '', updateDateTo: ''
    };
    console.log('🔄 Leads form cleared');
  }

  onAdvancedSearch(type: string) {
    console.log(`✅ ${type} Search Triggered`, this.advSearch);
    this.searchPerformed.emit({
      type: type,
      filters: { ...this.advSearch }
    });

    const queryParams: any = {};
    for (const key of Object.keys(this.advSearch)) {
      const val = this.advSearch[key];
      if (val !== null && val !== undefined && val !== '') {
        queryParams[key] = val;
      }
    }

    if (type === 'contacts') {
      this.router.navigate(['/all-contacts'], { queryParams });
    } else if (type === 'leads') {
      this.router.navigate(['/all-leads'], { queryParams });
    }
  }
}