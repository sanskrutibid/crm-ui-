import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PropertyShortlistedProjects } from './property-shortlisted-projects';

describe('PropertyShortlistedProjects', () => {
  let component: PropertyShortlistedProjects;
  let fixture: ComponentFixture<PropertyShortlistedProjects>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PropertyShortlistedProjects],
    }).compileComponents();

    fixture = TestBed.createComponent(PropertyShortlistedProjects);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
