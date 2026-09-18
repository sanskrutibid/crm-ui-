import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AttendanceCalendar } from './attendance-calendar';

describe('AttendanceCalendar', () => {
  let component: AttendanceCalendar;
  let fixture: ComponentFixture<AttendanceCalendar>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AttendanceCalendar],
    }).compileComponents();

    fixture = TestBed.createComponent(AttendanceCalendar);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
