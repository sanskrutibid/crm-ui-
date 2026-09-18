import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PropertySiteVisit } from './property-site-visit';

describe('PropertySiteVisit', () => {
  let component: PropertySiteVisit;
  let fixture: ComponentFixture<PropertySiteVisit>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PropertySiteVisit],
    }).compileComponents();

    fixture = TestBed.createComponent(PropertySiteVisit);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
