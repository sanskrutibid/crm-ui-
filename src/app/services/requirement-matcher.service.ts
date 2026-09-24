import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class RequirementMatcherService {

  /**
   * Helper to parse price/budget string or number into numeric Rupees value.
   * e.g. "50 L", "50 Lacs", "60 Lakhs", "1.5 Cr", "5000000", 5500000
   */
  parsePrice(val: any): number | null {
    if (val === undefined || val === null || val === '') return null;
    if (typeof val === 'number') return val > 0 ? val : null;

    const str = String(val).trim().toLowerCase().replace(/,/g, '');
    if (!str) return null;

    // Direct numeric check
    const rawNum = parseFloat(str);
    if (isNaN(rawNum)) return null;

    if (str.includes('cr') || str.includes('crore')) {
      return rawNum * 10000000;
    }
    if (str.includes('l') || str.includes('lac') || str.includes('lakh')) {
      return rawNum * 100000;
    }
    if (str.includes('k') || str.includes('thousand')) {
      return rawNum * 1000;
    }

    // If number is small e.g. "50" or "60", assume Lakhs if < 1000
    if (rawNum < 1000) {
      return rawNum * 100000;
    }

    return rawNum;
  }

  /**
   * Extract budget range from opportunity
   */
  parseOpportunityBudget(opp: any): { min: number | null; max: number | null } {
    let min = this.parsePrice(opp.budgetMin || opp.minBudget);
    let max = this.parsePrice(opp.budgetMax || opp.maxBudget);

    if (min === null && max === null && opp.budget) {
      const bStr = String(opp.budget).toLowerCase();
      // Look for range e.g. "50 L - 60 L" or "5000000 - 6000000"
      const parts = bStr.split(/[-to]/i);
      if (parts.length === 2) {
        min = this.parsePrice(parts[0]);
        max = this.parsePrice(parts[1]);
      } else {
        const single = this.parsePrice(bStr);
        if (single) {
          min = single * 0.8;
          max = single * 1.2;
        }
      }
    }

    return { min, max };
  }

  /**
   * Location matching: case-insensitive check
   */
  matchesLocation(loc1: string = '', loc2: string = ''): boolean {
    const s1 = String(loc1 || '').trim().toLowerCase();
    const s2 = String(loc2 || '').trim().toLowerCase();

    if (!s1 || !s2) return true; // If one is unspecified, don't filter out

    if (s1.includes(s2) || s2.includes(s1)) return true;

    // Check individual significant words
    const words1 = s1.split(/[\s,]+/).filter(w => w.length > 2);
    const words2 = s2.split(/[\s,]+/).filter(w => w.length > 2);

    return words1.some(w => s2.includes(w)) || words2.some(w => s1.includes(w));
  }

  /**
   * Bedroom / BHK matching
   */
  matchesBedroom(bhk1: any = '', bhk2: any = ''): boolean {
    const s1 = String(bhk1 || '').trim();
    const s2 = String(bhk2 || '').trim();

    if (!s1 || !s2 || s1 === '—' || s2 === '—') return true;

    const d1 = s1.match(/\d+/);
    const d2 = s2.match(/\d+/);

    if (d1 && d2) {
      return d1[0] === d2[0];
    }

    return true;
  }

  /**
   * Furnishing matching
   */
  matchesFurnishing(f1: any = '', f2: any = ''): boolean {
    const s1 = String(f1 || '').trim().toLowerCase();
    const s2 = String(f2 || '').trim().toLowerCase();

    if (!s1 || !s2 || s1 === '—' || s2 === '—') return true;

    return s1.includes(s2) || s2.includes(s1);
  }

  /**
   * Price vs Budget matching
   */
  matchesPrice(price: number | null, budgetMin: number | null, budgetMax: number | null): boolean {
    if (price === null) return true;
    if (budgetMin !== null && price < budgetMin * 0.85) return false;
    if (budgetMax !== null && price > budgetMax * 1.15) return false;
    return true;
  }

  /**
   * Main Matcher: Property <-> Opportunities
   */
  matchPropertyWithOpportunities(property: any, opportunities: any[]): any[] {
    if (!property || !Array.isArray(opportunities)) return [];

    const propLoc = `${property.locality || ''} ${property.city || ''} ${property.address || ''}`;
    const propBhk = property.bedroom || property.bedrooms || property.bhk || '';
    const propFurnish = property.furnishing || property.furnishType || '';
    const propPrice = this.parsePrice(property.expectedPrice || property.price || property.rent || property.budget);

    return opportunities.filter(opp => {
      const oppLoc = `${opp.locality || ''} ${opp.city || ''} ${opp.location || ''}`;
      if (!this.matchesLocation(propLoc, oppLoc)) return false;

      const oppBhk = opp.bedroom || opp.bhk || opp.lookingFor || '';
      if (!this.matchesBedroom(propBhk, oppBhk)) return false;

      const oppFurnish = opp.furnishing || '';
      if (!this.matchesFurnishing(propFurnish, oppFurnish)) return false;

      const { min: bMin, max: bMax } = this.parseOpportunityBudget(opp);
      if (!this.matchesPrice(propPrice, bMin, bMax)) return false;

      return true;
    });
  }

  /**
   * Main Matcher: Project <-> Opportunities
   */
  matchProjectWithOpportunities(project: any, opportunities: any[]): any[] {
    if (!project || !Array.isArray(opportunities)) return [];

    const projLoc = `${project.locality || ''} ${project.city || ''} ${project.address || ''} ${project.projectName || ''}`;
    const projBhk = project.configurations || project.bhk || '';
    const projMinPrice = this.parsePrice(project.minPrice || project.startingPrice || project.price);
    const projMaxPrice = this.parsePrice(project.maxPrice || project.expectedPrice || project.price);

    return opportunities.filter(opp => {
      const oppLoc = `${opp.locality || ''} ${opp.city || ''} ${opp.location || ''}`;
      if (!this.matchesLocation(projLoc, oppLoc)) return false;

      const oppBhk = opp.bedroom || opp.bhk || '';
      if (projBhk && oppBhk) {
        if (!this.matchesBedroom(projBhk, oppBhk)) return false;
      }

      const { min: bMin, max: bMax } = this.parseOpportunityBudget(opp);
      // Check overlap of price ranges
      if (projMinPrice !== null || projMaxPrice !== null) {
        const pMin = projMinPrice || projMaxPrice || 0;
        const pMax = projMaxPrice || projMinPrice || Infinity;

        if (bMin !== null && pMax < bMin * 0.85) return false;
        if (bMax !== null && pMin > bMax * 1.15) return false;
      }

      return true;
    });
  }

  /**
   * Main Matcher: Opportunity <-> Inventory (Properties & Projects)
   */
  matchOpportunityWithInventory(opportunity: any, properties: any[], projects: any[]): { properties: any[]; projects: any[] } {
    if (!opportunity) return { properties: [], projects: [] };

    const matchedProperties = (properties || []).filter(prop => {
      const propLoc = `${prop.locality || ''} ${prop.city || ''} ${prop.address || ''}`;
      const oppLoc = `${opportunity.locality || ''} ${opportunity.city || ''} ${opportunity.location || ''}`;
      if (!this.matchesLocation(oppLoc, propLoc)) return false;

      const propBhk = prop.bedroom || prop.bedrooms || prop.bhk || '';
      const oppBhk = opportunity.bedroom || opportunity.bhk || '';
      if (!this.matchesBedroom(oppBhk, propBhk)) return false;

      const propFurnish = prop.furnishing || prop.furnishType || '';
      const oppFurnish = opportunity.furnishing || '';
      if (!this.matchesFurnishing(oppFurnish, propFurnish)) return false;

      const propPrice = this.parsePrice(prop.expectedPrice || prop.price || prop.rent || prop.budget);
      const { min: bMin, max: bMax } = this.parseOpportunityBudget(opportunity);
      if (!this.matchesPrice(propPrice, bMin, bMax)) return false;

      return true;
    });

    const matchedProjects = (projects || []).filter(proj => {
      const projLoc = `${proj.locality || ''} ${proj.city || ''} ${proj.address || ''} ${proj.projectName || ''}`;
      const oppLoc = `${opportunity.locality || ''} ${opportunity.city || ''} ${opportunity.location || ''}`;
      if (!this.matchesLocation(oppLoc, projLoc)) return false;

      const projBhk = proj.configurations || proj.bhk || '';
      const oppBhk = opportunity.bedroom || opportunity.bhk || '';
      if (projBhk && oppBhk) {
        if (!this.matchesBedroom(oppBhk, projBhk)) return false;
      }

      const projMinPrice = this.parsePrice(proj.minPrice || proj.startingPrice || proj.price);
      const projMaxPrice = this.parsePrice(proj.maxPrice || proj.expectedPrice || proj.price);
      const { min: bMin, max: bMax } = this.parseOpportunityBudget(opportunity);

      if (projMinPrice !== null || projMaxPrice !== null) {
        const pMin = projMinPrice || projMaxPrice || 0;
        const pMax = projMaxPrice || projMinPrice || Infinity;

        if (bMin !== null && pMax < bMin * 0.85) return false;
        if (bMax !== null && pMin > bMax * 1.15) return false;
      }

      return true;
    });

    return { properties: matchedProperties, projects: matchedProjects };
  }
}
