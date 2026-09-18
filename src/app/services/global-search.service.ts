import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, of, forkJoin } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { LeadsService } from '../pages/leads/leads.service';
import { ContactsService } from '../pages/contacts/contacts.service';
import { OpportunitiesService } from '../pages/opportunities/opportunities.service';
import { PropertiesService } from '../pages/properties/properties.service';
import { ProjectsService } from '../pages/project/projects.service';

export interface SearchResultItem {
  id?: string;
  title: string;
  subtitle?: string;
  category: 'Navigation' | 'Leads' | 'Contacts' | 'Opportunities' | 'Properties' | 'Projects' | 'Tasks' | 'Agreements' | 'Documents';
  icon: string;
  route: string;
  queryParams?: any;
  badge?: string;
  badgeClass?: string;
  tags?: string[];
}

@Injectable({
  providedIn: 'root'
})
export class GlobalSearchService {
  private router = inject(Router);
  private leadsService = inject(LeadsService);
  private contactsService = inject(ContactsService);
  private oppsService = inject(OpportunitiesService);
  private propertiesService = inject(PropertiesService);
  private projectsService = inject(ProjectsService);

  // Navigation index for system pages & features
  private readonly navigationIndex: SearchResultItem[] = [
    { title: 'Dashboard', subtitle: 'System overview & statistics', category: 'Navigation', icon: 'fas fa-chart-bar', route: '/dashboard', tags: ['home', 'overview', 'stats', 'analytics', 'dashboard'] },
    { title: 'To Do List', subtitle: 'View open tasks and pending items', category: 'Navigation', icon: 'fas fa-tasks', route: '/todo-list', tags: ['tasks', 'todo', 'open tasks', 'reminder'] },
    { title: 'All Contacts', subtitle: 'Manage all customer contacts & clients', category: 'Navigation', icon: 'fas fa-users', route: '/all-contacts', tags: ['contacts', 'clients', 'customers', 'phonebook', 'all contacts'] },
    { title: 'Create Contact', subtitle: 'Add new contact profile', category: 'Navigation', icon: 'fas fa-user-plus', route: '/create-contact', tags: ['add contact', 'new contact', 'create contact'] },
    { title: 'Advanced Search', subtitle: 'Filter records with detailed options', category: 'Navigation', icon: 'fas fa-search-plus', route: '/advanced-search', tags: ['search', 'filter', 'advanced'] },
    
    { title: 'All Leads', subtitle: 'Complete leads pipeline & management', category: 'Navigation', icon: 'fas fa-bullseye', route: '/all-leads', tags: ['leads', 'all leads', 'pipeline', 'prospects', 'inquiry'] },
    { title: 'My Leads', subtitle: 'Leads assigned to you', category: 'Navigation', icon: 'fas fa-user-check', route: '/my-leads', tags: ['my leads', 'assigned leads'] },
    { title: 'Today\'s Followups', subtitle: 'Leads scheduled for followup today', category: 'Navigation', icon: 'fas fa-calendar-day', route: '/leadtodays-followups', badge: 'Today', badgeClass: 'badge-primary', tags: ['followup', 'today followup', 'lead followup'] },
    { title: 'Open Leads', subtitle: 'Active leads requiring attention', category: 'Navigation', icon: 'fas fa-folder-open', route: '/open-leads', tags: ['open leads', 'active leads'] },
    { title: 'Create Lead', subtitle: 'Add a new lead to system', category: 'Navigation', icon: 'fas fa-plus-circle', route: '/create-leads', tags: ['create lead', 'new lead', 'add lead'] },
    { title: 'Lead Backlog', subtitle: 'Overdue & backlog leads', category: 'Navigation', icon: 'fas fa-history', route: '/lead-backlog', tags: ['backlog', 'overdue'] },
    { title: 'Lead Calendar', subtitle: 'Schedule & calendar view of leads', category: 'Navigation', icon: 'fas fa-calendar-alt', route: '/lead-calendar', tags: ['calendar', 'schedule'] },

    { title: 'All Opportunities', subtitle: 'Deals and sales pipeline', category: 'Navigation', icon: 'fas fa-briefcase', route: '/all-opp', tags: ['opportunities', 'deals', 'sales', 'pipeline'] },
    { title: 'My Opportunities', subtitle: 'Deals assigned to your profile', category: 'Navigation', icon: 'fas fa-user-tie', route: '/my-opportunities', tags: ['my opportunities', 'my deals'] },
    { title: 'Create Opportunity', subtitle: 'Create a new business opportunity', category: 'Navigation', icon: 'fas fa-plus-square', route: '/create-opportunities', tags: ['create opportunity', 'new deal'] },

    { title: 'All Properties', subtitle: 'Browse real estate property directory', category: 'Navigation', icon: 'fas fa-building', route: '/all-properties', tags: ['properties', 'real estate', 'flats', 'villas', 'plots', 'lands'] },
    { title: 'Available Properties', subtitle: 'Properties available for sale/rent', category: 'Navigation', icon: 'fas fa-check-circle', route: '/available-properties', tags: ['available property', 'for sale', 'for rent'] },
    { title: 'Create Property', subtitle: 'Add new property listing', category: 'Navigation', icon: 'fas fa-plus-circle', route: '/create-property', tags: ['add property', 'create property'] },
    { title: 'Property Followups', subtitle: 'Followups for property clients', category: 'Navigation', icon: 'fas fa-clock', route: '/followups-properties', tags: ['property followup'] },

    { title: 'All Projects', subtitle: 'Real estate township & construction projects', category: 'Navigation', icon: 'fas fa-city', route: '/all-projects', tags: ['projects', 'township', 'builder projects'] },
    { title: 'RERA Projects', subtitle: 'Registered RERA certified projects', category: 'Navigation', icon: 'fas fa-certificate', route: '/rera-projects', badge: 'RERA', badgeClass: 'badge-success', tags: ['rera', 'rera project'] },
    { title: 'Create Project', subtitle: 'Add new real estate project', category: 'Navigation', icon: 'fas fa-plus-circle', route: '/create-project', tags: ['add project', 'create project'] },

    { title: 'Site Visits', subtitle: 'Track & schedule client site visits', category: 'Navigation', icon: 'fas fa-map-marked-alt', route: '/all-visits', tags: ['site visits', 'visit', 'location visit'] },
    { title: 'Schedule Visit', subtitle: 'Book client site visit', category: 'Navigation', icon: 'fas fa-calendar-plus', route: '/create-visit', tags: ['book visit', 'new site visit'] },

    { title: 'Marketing Campaigns', subtitle: 'Email, SMS & Social campaigns', category: 'Navigation', icon: 'fas fa-bullhorn', route: '/all-campaigns', tags: ['campaigns', 'marketing', 'sms', 'email'] },
    { title: 'SMS/Email Templates', subtitle: 'Predefined communication templates', category: 'Navigation', icon: 'fas fa-file-code', route: '/all-templates', tags: ['templates', 'sms templates', 'email templates'] },

    { title: 'Agreements', subtitle: 'Sale & rent agreements', category: 'Navigation', icon: 'fas fa-file-signature', route: '/sold-agreement', tags: ['agreements', 'sold agreement', 'rent agreement', 'contract'] },
    { title: 'Documents', subtitle: 'Legal & client document repository', category: 'Navigation', icon: 'fas fa-folder', route: '/all-documents', tags: ['documents', 'legal docs', 'files'] },
    { title: 'Reports & Analytics', subtitle: 'Sales & performance reports', category: 'Navigation', icon: 'fas fa-chart-line', route: '/reports', tags: ['reports', 'analytics', 'performance'] },

    { title: 'Attendance & Tracking', subtitle: 'Employee GPS punching & time logs', category: 'Navigation', icon: 'fas fa-user-clock', route: '/attendance', tags: ['attendance', 'gps', 'punching', 'leave', 'payroll'] },
    { title: 'Mailbox', subtitle: 'Send & receive email communications', category: 'Navigation', icon: 'fas fa-envelope', route: '/mailbox', tags: ['mailbox', 'mail', 'inbox', 'compose'] },
    { title: 'Messages', subtitle: 'SMS & WhatsApp messages', category: 'Navigation', icon: 'fas fa-comments', route: '/messages', tags: ['messages', 'sms', 'whatsapp'] },
    { title: 'API & Control Panel', subtitle: 'Integrations, webhook & lead routing', category: 'Navigation', icon: 'fas fa-cogs', route: '/api-config', tags: ['api', 'webhook', 'routing', 'settings', 'roles'] }
  ];



  /**
   * Main Search method returning matching items across navigation and entities
   */
  search(query: string): Observable<{
    navigation: SearchResultItem[];
    leads: SearchResultItem[];
    contacts: SearchResultItem[];
    opportunities: SearchResultItem[];
    properties: SearchResultItem[];
    projects: SearchResultItem[];
    suggestions: string[];
    totalCount: number;
  }> {
    const q = query.trim().toLowerCase();
    if (!q) {
      return of({
        navigation: this.navigationIndex.slice(0, 6),
        leads: [],
        contacts: [],
        opportunities: [],
        properties: [],
        projects: [],
        suggestions: ['Leads', 'Contacts', 'Today Followups', 'Properties', 'Opportunities', 'Projects'],
        totalCount: 6
      });
    }

    // 1. Navigation Search
    const matchedNav = this.navigationIndex.filter(item => {
      const titleMatch = item.title.toLowerCase().includes(q);
      const subtitleMatch = item.subtitle?.toLowerCase().includes(q);
      const tagMatch = item.tags?.some(tag => tag.toLowerCase().includes(q));
      return titleMatch || subtitleMatch || tagMatch;
    });

    // 2. Clear all static mock entities as requested by the user.
    // Full dynamic entity searches are performed on the search results page.
    const matchedLeads: SearchResultItem[] = [];
    const matchedContacts: SearchResultItem[] = [];
    const matchedOpps: SearchResultItem[] = [];
    const matchedProps: SearchResultItem[] = [];
    const matchedProj: SearchResultItem[] = [];

    // 3. Keyword suggestions
    const suggestions: string[] = [];
    if ('lead'.includes(q) || 'prospect'.includes(q)) suggestions.push('Search in Leads');
    if ('contact'.includes(q) || 'client'.includes(q)) suggestions.push('Search in Contacts');
    if ('opp'.includes(q) || 'deal'.includes(q)) suggestions.push('Search in Opportunities');
    if ('prop'.includes(q) || 'flat'.includes(q) || 'villa'.includes(q)) suggestions.push('Search in Properties');
    if ('proj'.includes(q) || 'building'.includes(q)) suggestions.push('Search in Projects');

    const totalCount = matchedNav.length;

    return of({
      navigation: matchedNav.slice(0, 5),
      leads: matchedLeads,
      contacts: matchedContacts,
      opportunities: matchedOpps,
      properties: matchedProps,
      projects: matchedProj,
      suggestions,
      totalCount
    });
  }

  /**
   * Execute direct search action or view all results
   */
  navigateToResult(item: SearchResultItem): void {
    if (item.queryParams) {
      this.router.navigate([item.route], { queryParams: item.queryParams });
    } else {
      this.router.navigate([item.route]);
    }
  }

  /**
   * Perform global keyword search navigation based on keyword type
   */
  executeKeywordSearch(query: string): void {
    const q = query.trim();
    if (!q) return;

    // Redirect to the newly created search-result component with query param
    this.router.navigate(['/search-result'], { queryParams: { query: q } });
  }
}
