import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SoldAgreement } from './sold-agreement';

describe('SoldAgreement', () => {
  let component: SoldAgreement;
  let fixture: ComponentFixture<SoldAgreement>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SoldAgreement],
    }).compileComponents();

    fixture = TestBed.createComponent(SoldAgreement);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
