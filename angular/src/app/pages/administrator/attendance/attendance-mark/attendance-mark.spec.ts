import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AttendanceMark } from './attendance-mark';

describe('AttendanceMark', () => {
  let component: AttendanceMark;
  let fixture: ComponentFixture<AttendanceMark>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AttendanceMark],
    }).compileComponents();

    fixture = TestBed.createComponent(AttendanceMark);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
