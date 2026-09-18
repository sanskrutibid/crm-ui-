import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AllTemplates } from './all-templates';

describe('AllTemplates', () => {
  let component: AllTemplates;
  let fixture: ComponentFixture<AllTemplates>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AllTemplates],
    }).compileComponents();

    fixture = TestBed.createComponent(AllTemplates);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
