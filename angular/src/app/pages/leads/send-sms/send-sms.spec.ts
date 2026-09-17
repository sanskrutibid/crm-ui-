import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SendSms } from './send-sms';

describe('SendSms', () => {
  let component: SendSms;
  let fixture: ComponentFixture<SendSms>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SendSms],
    }).compileComponents();

    fixture = TestBed.createComponent(SendSms);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
