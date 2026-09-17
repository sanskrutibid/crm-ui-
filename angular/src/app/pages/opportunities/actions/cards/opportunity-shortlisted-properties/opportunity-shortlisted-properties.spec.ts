import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OpportunityShortlistedProperties } from './opportunity-shortlisted-properties';

describe('OpportunityShortlistedProperties', () => {
  let component: OpportunityShortlistedProperties;
  let fixture: ComponentFixture<OpportunityShortlistedProperties>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OpportunityShortlistedProperties],
    }).compileComponents();

    fixture = TestBed.createComponent(OpportunityShortlistedProperties);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
