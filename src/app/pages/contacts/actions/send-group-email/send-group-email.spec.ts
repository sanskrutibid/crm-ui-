import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SendGroupEmail } from './send-group-email';

describe('SendGroupEmail', () => {
  let component: SendGroupEmail;
  let fixture: ComponentFixture<SendGroupEmail>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SendGroupEmail],
    }).compileComponents();

    fixture = TestBed.createComponent(SendGroupEmail);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
