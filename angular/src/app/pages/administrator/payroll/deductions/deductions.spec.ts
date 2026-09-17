import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Deductions } from './deductions';

describe('Deductions', () => {
  let component: Deductions;
  let fixture: ComponentFixture<Deductions>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Deductions],
    }).compileComponents();

    fixture = TestBed.createComponent(Deductions);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
