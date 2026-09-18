import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
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
  imports: [CommonModule, FormsModule],
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

  get parsedKeywords(): string[] {
    if (!this.searchQuery) return [];
    return Array.from(
      new Set(
        this.searchQuery
          .split(',')
          .map(k => k.trim())
          .filter(k => k.length > 0)
      )
    );
  }

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

  onSearch(): void {
    const q = (this.searchQuery || '').trim();
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { query: q || null },
      queryParamsHandling: 'merge'
    });
  }

  removeKeyword(keywordToRemove: string): void {
    const current = this.parsedKeywords;
    const remaining = current.filter(k => k.toLowerCase() !== keywordToRemove.toLowerCase());
    this.searchQuery = remaining.join(', ');
    this.onSearch();
  }

  clearSearch(): void {
    this.searchQuery = '';
    this.onSearch();
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
    const keywords = this.parsedKeywords;
    if (keywords.length === 0) {
      this.resetCounts();
      return;
    }

    this.isLoading = true;

    // Fetch in parallel for each keyword across all 5 services
    const contactsObservables = keywords.map(kw =>
      this.contactsService.getContacts({ search: kw, limit: 30 }).pipe(
        catchError(err => {
          console.error(`Error fetching contacts for "${kw}":`, err);
          return of({ contacts: [], total: 0 });
        })
      )
    );

    const leadsObservables = keywords.map(kw =>
      this.leadsService.getLeads({ search: kw, limit: 30 }).pipe(
        catchError(err => {
          console.error(`Error fetching leads for "${kw}":`, err);
          return of({ data: { leads: [], total: 0 } });
        })
      )
    );

    const oppsObservables = keywords.map(kw =>
      this.oppsService.getOpportunities({ search: kw, limit: 30 }).pipe(
        catchError(err => {
          console.error(`Error fetching opportunities for "${kw}":`, err);
          return of({ opportunities: [], total: 0 });
        })
      )
    );

    const propertiesObservables = keywords.map(kw =>
      this.propertiesService.getProperties({ search: kw, limit: 30 }).pipe(
        catchError(err => {
          console.error(`Error fetching properties for "${kw}":`, err);
          return of({ properties: [], total: 0 });
        })
      )
    );

    const projectsObservables = keywords.map(kw =>
      this.projectsService.getProjects({ search: kw, limit: 30 }).pipe(
        catchError(err => {
          console.error(`Error fetching projects for "${kw}":`, err);
          return of({ projects: [], total: 0 });
        })
      )
    );

    forkJoin({
      contactsRes: forkJoin(contactsObservables),
      leadsRes: forkJoin(leadsObservables),
      oppsRes: forkJoin(oppsObservables),
      propertiesRes: forkJoin(propertiesObservables),
      projectsRes: forkJoin(projectsObservables)
    }).subscribe({
      next: (combinedRes: any) => {
        // 1. Process Contacts
        const contactsMap = new Map<string, any>();
        combinedRes.contactsRes.forEach((res: any) => {
          const payload = res?.data || res;
          const arr = payload?.contacts || (Array.isArray(payload) ? payload : []);
          arr.forEach((c: any) => {
            const id = c.id || c._id;
            if (id && !contactsMap.has(id)) {
              contactsMap.set(id, c);
            }
          });
        });

        const scoredContacts = Array.from(contactsMap.values()).map((c: any) => {
          const text = this.extractSearchableText(c);
          const score = this.calculateMatchScore(text, keywords);
          return {
            id: c.id || c._id,
            name: `${c.salutation ? c.salutation + ' ' : ''}${c.firstName} ${c.lastName || ''}`.trim() || 'Unknown',
            phone: c.mobile || c.mobileNo || '—',
            email: c.email || '—',
            createdAt: c.createdAt,
            assignedTo: c.assignedTo?.firstName || 'Administrator',
            source: c.source || c.customerType || '—',
            score
          };
        }).filter(item => item.score > 0)
          .sort((a, b) => b.score - a.score);

        this.contactsList = scoredContacts.slice(0, 12);
        this.contactsCount = scoredContacts.length;

        // 2. Process Leads
        const leadsMap = new Map<string, any>();
        combinedRes.leadsRes.forEach((res: any) => {
          const payload = res?.data || res;
          const arr = payload?.leads || (Array.isArray(payload) ? payload : []);
          arr.forEach((l: any) => {
            const id = l.id || l._id;
            if (id && !leadsMap.has(id)) {
              leadsMap.set(id, l);
            }
          });
        });

        const scoredLeads = Array.from(leadsMap.values()).map((l: any) => {
          const text = this.extractSearchableText(l);
          const score = this.calculateMatchScore(text, keywords);
          return {
            id: l.id || l._id,
            name: l.name || `${l.firstName || ''} ${l.lastName || ''}`.trim() || 'Unknown Lead',
            phone: l.phone || l.mobile || '—',
            createdAt: l.createdAt,
            assignedTo: l.assignedToName || l.assignedTo?.firstName || 'Administrator',
            temperature: l.temperature || 'Cold',
            score
          };
        }).filter(item => item.score > 0)
          .sort((a, b) => b.score - a.score);

        this.leadsList = scoredLeads.slice(0, 12);
        this.leadsCount = scoredLeads.length;

        // 3. Process Opportunities
        const oppsMap = new Map<string, any>();
        combinedRes.oppsRes.forEach((res: any) => {
          const payload = res?.data || res;
          const arr = payload?.opportunities || (Array.isArray(payload) ? payload : []);
          arr.forEach((o: any) => {
            const id = o.id || o._id;
            if (id && !oppsMap.has(id)) {
              oppsMap.set(id, o);
            }
          });
        });

        const scoredOpps = Array.from(oppsMap.values()).map((o: any) => {
          const contact = o.contactId || {};
          const text = this.extractSearchableText(o);
          const score = this.calculateMatchScore(text, keywords);
          return {
            id: o.id || o._id,
            name: `${contact.salutation ? contact.salutation + ' ' : ''}${contact.firstName || ''} ${contact.lastName || ''}`.trim() || o.name || 'Unknown Customer',
            phone: contact.mobile || contact.phone || '—',
            createdDate: o.createdAt ? new Date(o.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—',
            location: `${o.locality || contact.locality || ''}, ${o.city || contact.city || ''}`.trim().replace(/^,|,$/g, '') || '—',
            budget: `${o.minBudget || 0} - ${o.maxBudget || 0} ${o.budgetUnit || ''}`.trim(),
            area: `${o.minArea || 0} - ${o.maxArea || 0} ${o.areaUnit || ''}`.trim(),
            followUpDate: `${o.scheduleDate || ''} ${o.scheduleTime || ''}`.trim() || '—',
            assignedTo: o.assignedTo?.firstName || 'Administrator',
            stage: o.schedulePurpose || o.status || 'In Progress',
            requirements: o.description || o.purposePref || o.purposePrefDetail || '—',
            interestedIn: `${o.lookingFor || 'Property'} for ${o.purpose || 'Buy'}`,
            score
          };
        }).filter(item => item.score > 0)
          .sort((a, b) => b.score - a.score);

        this.opportunitiesList = scoredOpps.slice(0, 12);
        this.opportunitiesCount = scoredOpps.length;

        // 4. Process Properties
        const propsMap = new Map<string, any>();
        combinedRes.propertiesRes.forEach((res: any) => {
          const payload = res?.data || res;
          const arr = payload?.properties || (Array.isArray(payload) ? payload : []);
          arr.forEach((p: any) => {
            const id = p.id || p._id;
            if (id && !propsMap.has(id)) {
              propsMap.set(id, p);
            }
          });
        });

        const scoredProps = Array.from(propsMap.values()).map((p: any) => {
          const owner = p.ownerLandlord || {};
          const ownerName = owner.firstName
            ? `${owner.firstName} ${owner.lastName || ''}`.trim()
            : (typeof p.ownerLandlord === 'string' ? p.ownerLandlord : 'Unknown');
          const formattedPrice = p.expectedPrice 
            ? `₹${(p.expectedPrice / 10000000).toFixed(2)} Cr` 
            : (p.price || '—');

          const text = this.extractSearchableText(p);
          const score = this.calculateMatchScore(text, keywords);

          return {
            id: p.id || p._id,
            title: p.name || p.buildingTowerProject || p.propertyType || 'Unnamed Property',
            ownerName: ownerName,
            location: p.address || `${p.locality || ''}, ${p.city || ''}`.trim().replace(/^,|,$/g, '') || p.location || '—',
            price: formattedPrice,
            area: p.area || (p.sqft ? `${p.sqft} sqft` : ''),
            assignedTo: p.assignedTo || '—',
            publishStatus: p.publishStatus || 'Available',
            sourceType: p.sourceType || p.source || '—',
            score
          };
        }).filter(item => item.score > 0)
          .sort((a, b) => b.score - a.score);

        this.propertiesList = scoredProps.slice(0, 12);
        this.propertiesCount = scoredProps.length;

        // 5. Process Projects
        const projectsMap = new Map<string, any>();
        combinedRes.projectsRes.forEach((res: any) => {
          const payload = res?.data || res;
          const arr = payload?.projects || (Array.isArray(payload) ? payload : []);
          arr.forEach((p: any) => {
            const id = p.id || p._id;
            if (id && !projectsMap.has(id)) {
              projectsMap.set(id, p);
            }
          });
        });

        const scoredProjects = Array.from(projectsMap.values()).map((p: any) => {
          const text = this.extractSearchableText(p);
          const score = this.calculateMatchScore(text, keywords);
          return {
            id: p.id || p._id,
            projectName: p.projectName || p.name || 'Unnamed Project',
            developerName: p.developerName || 'Unknown Developer',
            launchDate: p.launchDate || '—',
            locality: p.locality || p.city || '—',
            reraNumber: p.reraNumber || '—',
            projectArea: p.projectArea ? `${p.projectArea} ${p.areaUnit || ''}` : '—',
            totalRoom: p.totalRoom || '—',
            status: p.status || 'Available',
            score
          };
        }).filter(item => item.score > 0)
          .sort((a, b) => b.score - a.score);

        this.projectsList = scoredProjects.slice(0, 12);
        this.projectsCount = scoredProjects.length;

        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error in multi-keyword global search forkJoin:', err);
        this.isLoading = false;
      }
    });
  }

  private extractSearchableText(obj: any): string {
    const values: string[] = [];
    const walk = (item: any, depth = 0) => {
      if (!item || depth > 2) return;
      if (typeof item === 'string' || typeof item === 'number') {
        values.push(String(item).toLowerCase());
        return;
      }
      if (Array.isArray(item)) {
        item.forEach(v => walk(v, depth + 1));
        return;
      }
      if (typeof item === 'object') {
        Object.keys(item).forEach(k => {
          if (!['__v', 'password', 'token', 'salt', 'hash'].includes(k)) {
            walk(item[k], depth + 1);
          }
        });
      }
    };
    walk(obj);
    return values.join(' ');
  }

  private calculateMatchScore(text: string, keywords: string[]): number {
    let score = 0;
    for (const kw of keywords) {
      const cleanKw = kw.toLowerCase().trim();
      if (cleanKw && text.includes(cleanKw)) {
        score++;
      }
    }
    return score;
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
