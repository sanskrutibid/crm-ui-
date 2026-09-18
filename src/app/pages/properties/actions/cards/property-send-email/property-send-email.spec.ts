import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PropertySendEmail } from './property-send-email';

describe('PropertySendEmail', () => {
  let component: PropertySendEmail;
  let fixture: ComponentFixture<PropertySendEmail>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PropertySendEmail],
    }).compileComponents();

    fixture = TestBed.createComponent(PropertySendEmail);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
