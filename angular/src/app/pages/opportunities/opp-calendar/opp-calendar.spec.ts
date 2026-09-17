import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OppCalendar } from './opp-calendar';

describe('OppCalendar', () => {
  let component: OppCalendar;
  let fixture: ComponentFixture<OppCalendar>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OppCalendar],
    }).compileComponents();

    fixture = TestBed.createComponent(OppCalendar);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
