import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PropertySendSms } from './property-send-sms';

describe('PropertySendSms', () => {
  let component: PropertySendSms;
  let fixture: ComponentFixture<PropertySendSms>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PropertySendSms],
    }).compileComponents();

    fixture = TestBed.createComponent(PropertySendSms);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
