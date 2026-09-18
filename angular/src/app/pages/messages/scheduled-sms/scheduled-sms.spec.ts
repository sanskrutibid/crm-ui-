import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ScheduledSms } from './scheduled-sms';

describe('ScheduledSms', () => {
  let component: ScheduledSms;
  let fixture: ComponentFixture<ScheduledSms>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ScheduledSms],
    }).compileComponents();

    fixture = TestBed.createComponent(ScheduledSms);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
