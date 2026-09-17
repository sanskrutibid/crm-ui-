import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PropertySendGroupEmailAction } from './property-send-group-email-action';

describe('PropertySendGroupEmailAction', () => {
  let component: PropertySendGroupEmailAction;
  let fixture: ComponentFixture<PropertySendGroupEmailAction>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PropertySendGroupEmailAction],
    }).compileComponents();

    fixture = TestBed.createComponent(PropertySendGroupEmailAction);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
