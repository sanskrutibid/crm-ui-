import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AllProperty } from './all-property';

describe('AllProperty', () => {
  let component: AllProperty;
  let fixture: ComponentFixture<AllProperty>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AllProperty],
    }).compileComponents();

    fixture = TestBed.createComponent(AllProperty);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
