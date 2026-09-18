import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ImportOpportunityAction } from './import-opportunity-action';

describe('ImportOpportunityAction', () => {
  let component: ImportOpportunityAction;
  let fixture: ComponentFixture<ImportOpportunityAction>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ImportOpportunityAction],
    }).compileComponents();

    fixture = TestBed.createComponent(ImportOpportunityAction);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
