import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LiveLocation } from './live-location';

describe('LiveLocation', () => {
  let component: LiveLocation;
  let fixture: ComponentFixture<LiveLocation>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LiveLocation],
    }).compileComponents();

    fixture = TestBed.createComponent(LiveLocation);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
