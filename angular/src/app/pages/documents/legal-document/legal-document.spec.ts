import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LegalDocument } from './legal-document';

describe('LegalDocument', () => {
  let component: LegalDocument;
  let fixture: ComponentFixture<LegalDocument>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LegalDocument],
    }).compileComponents();

    fixture = TestBed.createComponent(LegalDocument);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
