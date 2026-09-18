import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AttendanceRequest } from './attendance-request';

describe('AttendanceRequest', () => {
  let component: AttendanceRequest;
  let fixture: ComponentFixture<AttendanceRequest>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AttendanceRequest],
    }).compileComponents();

    fixture = TestBed.createComponent(AttendanceRequest);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
