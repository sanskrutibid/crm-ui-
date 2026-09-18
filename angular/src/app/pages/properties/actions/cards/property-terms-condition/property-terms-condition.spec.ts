import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PropertyTermsCondition } from './property-terms-condition';

describe('PropertyTermsCondition', () => {
  let component: PropertyTermsCondition;
  let fixture: ComponentFixture<PropertyTermsCondition>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PropertyTermsCondition],
    }).compileComponents();

    fixture = TestBed.createComponent(PropertyTermsCondition);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
