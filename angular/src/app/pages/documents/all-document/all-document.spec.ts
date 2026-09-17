import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AllDocument } from './all-document';

describe('AllDocument', () => {
  let component: AllDocument;
  let fixture: ComponentFixture<AllDocument>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AllDocument],
    }).compileComponents();

    fixture = TestBed.createComponent(AllDocument);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
