import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AllVisits } from './all-visits';

describe('AllVisits', () => {
  let component: AllVisits;
  let fixture: ComponentFixture<AllVisits>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AllVisits],
    }).compileComponents();

    fixture = TestBed.createComponent(AllVisits);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
