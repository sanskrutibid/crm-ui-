import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PropertyAttachDocument } from './property-attach-document';

describe('PropertyAttachDocument', () => {
  let component: PropertyAttachDocument;
  let fixture: ComponentFixture<PropertyAttachDocument>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PropertyAttachDocument],
    }).compileComponents();

    fixture = TestBed.createComponent(PropertyAttachDocument);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
