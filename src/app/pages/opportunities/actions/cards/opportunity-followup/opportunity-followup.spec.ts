import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OpportunityFollowup } from './opportunity-followup';

describe('OpportunityFollowup', () => {
  let component: OpportunityFollowup;
  let fixture: ComponentFixture<OpportunityFollowup>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OpportunityFollowup],
    }).compileComponents();

    fixture = TestBed.createComponent(OpportunityFollowup);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
