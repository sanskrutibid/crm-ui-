import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OpportunityTermsCondition } from './opportunity-terms-condition';

describe('OpportunityTermsCondition', () => {
  let component: OpportunityTermsCondition;
  let fixture: ComponentFixture<OpportunityTermsCondition>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OpportunityTermsCondition],
    }).compileComponents();

    fixture = TestBed.createComponent(OpportunityTermsCondition);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
