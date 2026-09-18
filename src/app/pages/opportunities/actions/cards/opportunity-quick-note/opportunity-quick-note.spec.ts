import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OpportunityQuickNote } from './opportunity-quick-note';

describe('OpportunityQuickNote', () => {
  let component: OpportunityQuickNote;
  let fixture: ComponentFixture<OpportunityQuickNote>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OpportunityQuickNote],
    }).compileComponents();

    fixture = TestBed.createComponent(OpportunityQuickNote);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
