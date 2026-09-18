import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LeaveApply } from './leave-apply';

describe('LeaveApply', () => {
  let component: LeaveApply;
  let fixture: ComponentFixture<LeaveApply>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LeaveApply],
    }).compileComponents();

    fixture = TestBed.createComponent(LeaveApply);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
