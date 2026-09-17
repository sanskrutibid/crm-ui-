import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { LeadsService } from '../../leads/leads.service';
import { ContactsService } from '../../contacts/contacts.service';
import { OpportunitiesService } from '../../opportunities/opportunities.service';
import { PropertiesService } from '../../properties/properties.service';
import { ProjectsService } from '../../project/projects.service';

@Component({
  selector: 'app-search-result',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './search-result.html',
  styleUrl: './search-result.css'
})
export class SearchResultComponent implements OnInit {
  searchQuery: string = '';
  isLoading: boolean = false;

  contactsCount: number = 0;
  leadsCount: number = 0;
  opportunitiesCount: number = 0;
  propertiesCount: number = 0;
  projectsCount: number = 0;

  contactsList: any[] = [];
  leadsList: any[] = [];
  opportunitiesList: any[] = [];
  propertiesList: any[] = [];
  projectsList: any[] = [];

  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private leadsService = inject(LeadsService);
  private contactsService = inject(ContactsService);
  private oppsService = inject(OpportunitiesService);
  private propertiesService = inject(PropertiesService);
  private projectsService = inject(ProjectsService);

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      this.searchQuery = params['query'] || '';
      if (this.searchQuery) {
        this.performGlobalSearch();
      } else {
        this.resetCounts();
      }
    });
  }

  resetCounts(): void {
    this.contactsCount = 0;
    this.leadsCount = 0;
    this.opportunitiesCount = 0;
    this.propertiesCount = 0;
    this.projectsCount = 0;

    this.contactsList = [];
    this.leadsList = [];
    this.opportunitiesList = [];
    this.propertiesList = [];
    this.projectsList = [];
  }

  performGlobalSearch(): void {
    this.isLoading = true;
    const query = this.searchQuery;

    // Fetch lists up to 10 records for display
    const contacts$ = this.contactsService.getContacts({ search: query, limit: 10 }).pipe(
      catchError(err => {
        console.error('Error fetching contacts:', err);
        return of({ contacts: [], total: 0 });
      })
    );

    const leads$ = this.leadsService.getLeads({ search: query, limit: 10 }).pipe(
      catchError(err => {
        console.error('Error fetching leads:', err);
        return of({ data: { leads: [], total: 0 } });
      })
    );

    const opps$ = this.oppsService.getOpportunities({ search: query, limit: 10 }).pipe(
      catchError(err => {
        console.error('Error fetching opportunities:', err);
        return of({ opportunities: [], total: 0 });
      })
    );

    const properties$ = this.propertiesService.getProperties({ search: query, limit: 10 }).pipe(
      catchError(err => {
        console.error('Error fetching properties:', err);
        return of({ properties: [], total: 0 });
      })
    );

    const projects$ = this.projectsService.getProjects({ search: query, limit: 10 }).pipe(
      catchError(err => {
        console.error('Error fetching projects:', err);
        return of({ projects: [], total: 0 });
      })
    );

    forkJoin({
      contacts: contacts$,
      leads: leads$,
      opps: opps$,
      properties: properties$,
      projects: projects$
    }).subscribe({
      next: (res: any) => {
        // Contacts payload & list
        const contactPayload = res.contacts?.data || res.contacts;
        this.contactsCount = contactPayload?.total || contactPayload?.contacts?.length || 0;
        const contactsArr = contactPayload?.contacts || (Array.isArray(contactPayload) ? contactPayload : []);
        this.contactsList = contactsArr.map((c: any) => ({
          id: c.id || c._id,
          name: `${c.salutation ? c.salutation + ' ' : ''}${c.firstName} ${c.lastName || ''}`.trim() || 'Unknown',
          phone: c.mobile || c.mobileNo || '—',
          email: c.email || '—',
          createdAt: c.createdAt,
          assignedTo: c.assignedTo?.firstName || 'Administrator',
          source: c.source || c.customerType || '—'
        }));

        // Leads payload & list
        const leadPayload = res.leads?.data || res.leads;
        this.leadsCount = leadPayload?.total || leadPayload?.leads?.length || 0;
        const leadsArr = leadPayload?.leads || leadPayload || [];
        const finalLeads = Array.isArray(leadsArr) ? leadsArr : (leadPayload?.data?.leads || []);
        this.leadsList = finalLeads.map((l: any) => ({
          id: l.id || l._id,
          name: l.name || 'Unknown Lead',
          phone: l.phone || '—',
          createdAt: l.createdAt,
          assignedTo: l.assignedToName || 'Administrator',
          temperature: l.temperature || 'Cold'
        }));

        // Opportunities payload & list
        const oppPayload = res.opps?.data || res.opps;
        this.opportunitiesCount = oppPayload?.total || oppPayload?.opportunities?.length || 0;
        const oppsArr = oppPayload?.opportunities || (Array.isArray(oppPayload) ? oppPayload : []);
        this.opportunitiesList = oppsArr.map((o: any) => {
          const contact = o.contactId || {};
          return {
            id: o.id || o._id,
            name: `${contact.salutation ? contact.salutation + ' ' : ''}${contact.firstName} ${contact.lastName || ''}`.trim() || o.name || 'Unknown Customer',
            phone: contact.mobile || '—',
            createdDate: o.createdAt ? new Date(o.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—',
            location: `${o.locality || contact.locality || ''}, ${o.city || contact.city || ''}`.trim().replace(/^,|,$/g, '') || '—',
            budget: `${o.minBudget || 0} - ${o.maxBudget || 0} ${o.budgetUnit || ''}`.trim(),
            area: `${o.minArea || 0} - ${o.maxArea || 0} ${o.areaUnit || ''}`.trim(),
            followUpDate: `${o.scheduleDate || ''} ${o.scheduleTime || ''}`.trim() || '—',
            assignedTo: o.assignedTo?.firstName || 'Administrator',
            stage: o.schedulePurpose || o.status || 'In Progress',
            requirements: o.description || o.purposePref || o.purposePrefDetail || '—',
            interestedIn: `${o.lookingFor || 'Property'} for ${o.purpose || 'Buy'}`
          };
        });

        // Properties payload & list
        const propertyPayload = res.properties?.data || res.properties;
        this.propertiesCount = propertyPayload?.total || propertyPayload?.properties?.length || 0;
        const propsArr = propertyPayload?.properties || (Array.isArray(propertyPayload) ? propertyPayload : []);
        this.propertiesList = propsArr.map((p: any) => {
          const owner = p.ownerLandlord || {};
          const ownerName = owner.firstName
            ? `${owner.firstName} ${owner.lastName || ''}`.trim()
            : (typeof p.ownerLandlord === 'string' ? p.ownerLandlord : 'Unknown');
          const formattedPrice = p.expectedPrice 
            ? `₹${(p.expectedPrice / 10000000).toFixed(2)} Cr` 
            : (p.price || '—');
          return {
            id: p.id || p._id,
            title: p.name || p.buildingTowerProject || 'Unnamed Property',
            ownerName: ownerName,
            location: p.address || p.location || '—',
            price: formattedPrice,
            area: p.area || (p.sqft ? `${p.sqft} sqft` : ''),
            assignedTo: p.assignedTo || '—',
            publishStatus: p.publishStatus || 'Draft',
            sourceType: p.sourceType || '—'
          };
        });

        // Projects payload & list
        const projectPayload = res.projects?.data || res.projects;
        this.projectsCount = projectPayload?.total || projectPayload?.projects?.length || 0;
        const projectsArr = projectPayload?.projects || (Array.isArray(projectPayload) ? projectPayload : []);
        this.projectsList = projectsArr.map((p: any) => ({
          id: p.id || p._id,
          projectName: p.projectName || 'Unnamed Project',
          developerName: p.developerName || 'Unknown Developer',
          launchDate: p.launchDate || '—',
          locality: p.locality || '—',
          reraNumber: p.reraNumber || '—',
          projectArea: p.projectArea ? `${p.projectArea} ${p.areaUnit || ''}` : '—',
          totalRoom: p.totalRoom || '—',
          status: p.status || 'Available'
        }));

        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error in forkJoin search:', err);
        this.isLoading = false;
      }
    });
  }

  viewDetails(module: string): void {
    if (!this.searchQuery) return;
    
    switch (module) {
      case 'contact':
        this.router.navigate(['/all-contacts'], { queryParams: { search: this.searchQuery } });
        break;
      case 'lead':
        this.router.navigate(['/all-leads'], { queryParams: { search: this.searchQuery } });
        break;
      case 'opportunity':
        this.router.navigate(['/all-opp'], { queryParams: { search: this.searchQuery } });
        break;
      case 'property':
        this.router.navigate(['/all-properties'], { queryParams: { search: this.searchQuery } });
        break;
      case 'project':
        this.router.navigate(['/all-projects'], { queryParams: { search: this.searchQuery } });
        break;
    }
  }

  selectRecord(module: string, record: any): void {
    switch (module) {
      case 'contact':
        this.router.navigate(['/all-contacts'], { queryParams: { returnTo: record.id } });
        break;
      case 'lead':
        this.router.navigate(['/all-leads'], { queryParams: { returnTo: record.id } });
        break;
      case 'opportunity':
        this.router.navigate(['/all-opp'], { queryParams: { search: record.name } });
        break;
      case 'property':
        this.router.navigate(['/all-properties'], { queryParams: { search: record.title } });
        break;
      case 'project':
        this.router.navigate(['/all-projects'], { queryParams: { search: record.projectName } });
        break;
    }
  }

  goBack(): void {
    this.router.navigate(['/dashboard']);
  }
}
