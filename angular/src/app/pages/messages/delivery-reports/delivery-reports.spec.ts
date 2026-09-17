import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DeliveryReports } from './delivery-reports';

describe('DeliveryReports', () => {
  let component: DeliveryReports;
  let fixture: ComponentFixture<DeliveryReports>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DeliveryReports],
    }).compileComponents();

    fixture = TestBed.createComponent(DeliveryReports);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
