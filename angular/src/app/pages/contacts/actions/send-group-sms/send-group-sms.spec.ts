import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SendGroupSms } from './send-group-sms';

describe('SendGroupSms', () => {
  let component: SendGroupSms;
  let fixture: ComponentFixture<SendGroupSms>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SendGroupSms],
    }).compileComponents();

    fixture = TestBed.createComponent(SendGroupSms);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
