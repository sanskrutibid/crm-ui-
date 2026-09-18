import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OpportunityAttachDocument } from './opportunity-attach-document';

describe('OpportunityAttachDocument', () => {
  let component: OpportunityAttachDocument;
  let fixture: ComponentFixture<OpportunityAttachDocument>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OpportunityAttachDocument],
    }).compileComponents();

    fixture = TestBed.createComponent(OpportunityAttachDocument);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
