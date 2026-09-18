import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SendGroupSmsAction } from './send-group-sms-action';

describe('SendGroupSmsAction', () => {
  let component: SendGroupSmsAction;
  let fixture: ComponentFixture<SendGroupSmsAction>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SendGroupSmsAction],
    }).compileComponents();

    fixture = TestBed.createComponent(SendGroupSmsAction);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
