import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OpportunityChangeStatus } from './opportunity-change-status';

describe('OpportunityChangeStatus', () => {
  let component: OpportunityChangeStatus;
  let fixture: ComponentFixture<OpportunityChangeStatus>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OpportunityChangeStatus],
    }).compileComponents();

    fixture = TestBed.createComponent(OpportunityChangeStatus);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
