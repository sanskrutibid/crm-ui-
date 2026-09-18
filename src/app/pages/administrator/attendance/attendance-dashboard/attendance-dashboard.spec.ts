import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AttendanceDashboard } from './attendance-dashboard';

describe('AttendanceDashboard', () => {
  let component: AttendanceDashboard;
  let fixture: ComponentFixture<AttendanceDashboard>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AttendanceDashboard],
    }).compileComponents();

    fixture = TestBed.createComponent(AttendanceDashboard);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
