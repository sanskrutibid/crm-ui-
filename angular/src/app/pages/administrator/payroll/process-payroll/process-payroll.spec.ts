import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProcessPayroll } from './process-payroll';

describe('ProcessPayroll', () => {
  let component: ProcessPayroll;
  let fixture: ComponentFixture<ProcessPayroll>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProcessPayroll],
    }).compileComponents();

    fixture = TestBed.createComponent(ProcessPayroll);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
