import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PfEsicTax } from './pf-esic-tax';

describe('PfEsicTax', () => {
  let component: PfEsicTax;
  let fixture: ComponentFixture<PfEsicTax>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PfEsicTax],
    }).compileComponents();

    fixture = TestBed.createComponent(PfEsicTax);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
