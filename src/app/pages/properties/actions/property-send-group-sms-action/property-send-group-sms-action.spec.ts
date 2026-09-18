import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PropertySendGroupSmsAction } from './property-send-group-sms-action';

describe('PropertySendGroupSmsAction', () => {
  let component: PropertySendGroupSmsAction;
  let fixture: ComponentFixture<PropertySendGroupSmsAction>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PropertySendGroupSmsAction],
    }).compileComponents();

    fixture = TestBed.createComponent(PropertySendGroupSmsAction);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
