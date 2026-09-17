import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AllOpp } from './all-opp';

describe('AllOpp', () => {
  let component: AllOpp;
  let fixture: ComponentFixture<AllOpp>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AllOpp],
    }).compileComponents();

    fixture = TestBed.createComponent(AllOpp);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
