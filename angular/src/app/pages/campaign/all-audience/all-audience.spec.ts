import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AllAudience } from './all-audience';

describe('AllAudience', () => {
  let component: AllAudience;
  let fixture: ComponentFixture<AllAudience>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AllAudience],
    }).compileComponents();

    fixture = TestBed.createComponent(AllAudience);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
