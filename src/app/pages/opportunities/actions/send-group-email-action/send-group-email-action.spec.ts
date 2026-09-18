import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SendGroupEmailAction } from './send-group-email-action';

describe('SendGroupEmailAction', () => {
  let component: SendGroupEmailAction;
  let fixture: ComponentFixture<SendGroupEmailAction>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SendGroupEmailAction],
    }).compileComponents();

    fixture = TestBed.createComponent(SendGroupEmailAction);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
