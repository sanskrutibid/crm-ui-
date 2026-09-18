import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OpportunityTransfer } from './opportunity-transfer';

describe('OpportunityTransfer', () => {
  let component: OpportunityTransfer;
  let fixture: ComponentFixture<OpportunityTransfer>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OpportunityTransfer],
    }).compileComponents();

    fixture = TestBed.createComponent(OpportunityTransfer);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
