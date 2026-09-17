import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OpportunityHistory } from './opportunity-history';

describe('OpportunityHistory', () => {
  let component: OpportunityHistory;
  let fixture: ComponentFixture<OpportunityHistory>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OpportunityHistory],
    }).compileComponents();

    fixture = TestBed.createComponent(OpportunityHistory);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
