import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PropertyQuickNote } from './property-quick-note';

describe('PropertyQuickNote', () => {
  let component: PropertyQuickNote;
  let fixture: ComponentFixture<PropertyQuickNote>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PropertyQuickNote],
    }).compileComponents();

    fixture = TestBed.createComponent(PropertyQuickNote);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
