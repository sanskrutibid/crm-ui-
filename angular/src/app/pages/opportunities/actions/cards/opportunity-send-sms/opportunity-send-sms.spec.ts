import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OpportunitySendSms } from './opportunity-send-sms';

describe('OpportunitySendSms', () => {
  let component: OpportunitySendSms;
  let fixture: ComponentFixture<OpportunitySendSms>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OpportunitySendSms],
    }).compileComponents();

    fixture = TestBed.createComponent(OpportunitySendSms);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
