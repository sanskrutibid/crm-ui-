import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PropertyShortlistedProperties } from './property-shortlisted-properties';

describe('PropertyShortlistedProperties', () => {
  let component: PropertyShortlistedProperties;
  let fixture: ComponentFixture<PropertyShortlistedProperties>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PropertyShortlistedProperties],
    }).compileComponents();

    fixture = TestBed.createComponent(PropertyShortlistedProperties);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
