import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RentAgreement } from './rent-agreement';

describe('RentAgreement', () => {
  let component: RentAgreement;
  let fixture: ComponentFixture<RentAgreement>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RentAgreement],
    }).compileComponents();

    fixture = TestBed.createComponent(RentAgreement);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
