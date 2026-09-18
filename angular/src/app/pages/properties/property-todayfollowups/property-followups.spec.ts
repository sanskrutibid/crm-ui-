import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PropertyFollowups } from './property-followups';

describe('PropertyFollowups', () => {
  let component: PropertyFollowups;
  let fixture: ComponentFixture<PropertyFollowups>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PropertyFollowups],
    }).compileComponents();

    fixture = TestBed.createComponent(PropertyFollowups);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
