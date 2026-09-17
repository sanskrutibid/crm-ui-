import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PayrollReport } from './payroll-report';

describe('PayrollReport', () => {
  let component: PayrollReport;
  let fixture: ComponentFixture<PayrollReport>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PayrollReport],
    }).compileComponents();

    fixture = TestBed.createComponent(PayrollReport);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
