import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AttendanceMonthly } from './attendance-monthly';

describe('AttendanceMonthly', () => {
  let component: AttendanceMonthly;
  let fixture: ComponentFixture<AttendanceMonthly>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AttendanceMonthly],
    }).compileComponents();

    fixture = TestBed.createComponent(AttendanceMonthly);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
