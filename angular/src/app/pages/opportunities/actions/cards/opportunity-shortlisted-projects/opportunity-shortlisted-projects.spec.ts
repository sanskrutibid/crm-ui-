import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OpportunityShortlistedProjects } from './opportunity-shortlisted-projects';

describe('OpportunityShortlistedProjects', () => {
  let component: OpportunityShortlistedProjects;
  let fixture: ComponentFixture<OpportunityShortlistedProjects>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OpportunityShortlistedProjects],
    }).compileComponents();

    fixture = TestBed.createComponent(OpportunityShortlistedProjects);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
