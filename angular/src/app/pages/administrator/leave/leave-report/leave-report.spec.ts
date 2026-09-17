import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LeaveReport } from './leave-report';

describe('LeaveReport', () => {
  let component: LeaveReport;
  let fixture: ComponentFixture<LeaveReport>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LeaveReport],
    }).compileComponents();

    fixture = TestBed.createComponent(LeaveReport);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
