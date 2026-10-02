import { Component, Input, OnChanges, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { OpportunitiesService } from '../opportunities.service';

@Component({
  selector: 'app-matching-properties',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="mp-header">
      <h3>Matching Properties ({{ properties.length }})</h3>

      <select [(ngModel)]="minScore" (ngModelChange)="load()">
        <option [ngValue]="0">All (0%+)</option>
        <option [ngValue]="30">30%+ match</option>
        <option [ngValue]="50">50%+ match</option>
        <option [ngValue]="70">70%+ match</option>
        <option [ngValue]="90">90%+ match</option>
      </select>
    </div>

    <div *ngIf="loading" class="mp-msg">Loading matching properties...</div>
    <div *ngIf="error" class="mp-msg mp-error">{{ error }}</div>
    <div *ngIf="!loading && !error && properties.length === 0" class="mp-msg">
      No matching properties found.
    </div>

    <div class="mp-card" *ngFor="let p of properties">
      <div class="mp-top">
        <strong>{{ p.name || 'Unnamed Property' }}</strong>
        <span class="mp-score" [class.high]="p.matchScore >= 70">
          {{ p.matchScore }}% match
        </span>
      </div>

      <div class="mp-line">{{ p.location || p.locality || p.city }}</div>

      <div class="mp-line">
        {{ p.propertyType || p.type }}
        <span *ngIf="p.bedroom"> | {{ p.bedroom }}</span>
        <span *ngIf="p.sqft || p.area"> | {{ p.sqft || p.area }} sq.ft.</span>
      </div>

      <div class="mp-line">
        {{ p.price || (p.expectedPrice ? '₹' + p.expectedPrice : 'Price on request') }}
      </div>

      <div class="mp-tags">
        <span class="tag ok" *ngFor="let m of p.matchedOn">✓ {{ m }}</span>
        <span class="tag no" *ngFor="let m of p.notMatched">✗ {{ m }}</span>
      </div>
    </div>
  `,
  styles: [`
    .mp-header { display:flex; justify-content:space-between; align-items:center; margin-bottom:12px; }
    .mp-card { border:1px solid #ddd; border-radius:8px; padding:12px; margin-bottom:10px; }
    .mp-top { display:flex; justify-content:space-between; }
    .mp-score { font-weight:600; color:#b26a00; }
    .mp-score.high { color:#1a7f37; }
    .mp-line { font-size:13px; color:#555; margin-top:4px; }
    .mp-tags { margin-top:8px; display:flex; flex-wrap:wrap; gap:6px; }
    .tag { font-size:11px; padding:2px 8px; border-radius:10px; }
    .tag.ok { background:#e6f4ea; color:#1a7f37; }
    .tag.no { background:#fdecea; color:#b3261e; }
    .mp-msg { padding:12px; color:#666; }
    .mp-error { color:#b3261e; }
  `]
})
export class MatchingProperties implements OnChanges {
  @Input() opportunityId = '';

  properties: any[] = [];
  loading = false;
  error = '';
  minScore = 50;

  private opportunitiesService = inject(OpportunitiesService);

  ngOnChanges(): void {
    this.load();
  }

  load(): void {
    if (!this.opportunityId) return;

    this.loading = true;
    this.error = '';

    this.opportunitiesService
      .getMatchingProperties(this.opportunityId, { minScore: this.minScore })
      .subscribe({
        next: (res: any) => {
          const payload = res?.data?.data ?? res?.data ?? res;
          this.properties = payload?.properties || [];
          this.loading = false;
        },
        error: (err) => {
          console.error('Failed to load matching properties:', err);
          this.error = 'Could not load matching properties';
          this.properties = [];
          this.loading = false;
        }
      });
  }
}