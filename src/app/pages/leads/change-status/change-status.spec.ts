import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ChangeStatus } from './change-status';

describe('ChangeStatus', () => {
  let component: ChangeStatus;
  let fixture: ComponentFixture<ChangeStatus>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ChangeStatus],
    }).compileComponents();

    fixture = TestBed.createComponent(ChangeStatus);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
