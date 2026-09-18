import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SalaryStructure } from './salary-structure';

describe('SalaryStructure', () => {
  let component: SalaryStructure;
  let fixture: ComponentFixture<SalaryStructure>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SalaryStructure],
    }).compileComponents();

    fixture = TestBed.createComponent(SalaryStructure);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
