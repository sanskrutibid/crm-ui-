import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PropertyPublish } from './property-publish';

describe('PropertyPublish', () => {
  let component: PropertyPublish;
  let fixture: ComponentFixture<PropertyPublish>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PropertyPublish],
    }).compileComponents();

    fixture = TestBed.createComponent(PropertyPublish);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
