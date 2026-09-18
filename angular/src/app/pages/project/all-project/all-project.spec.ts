import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AllProject } from './all-project';

describe('AllProject', () => {
  let component: AllProject;
  let fixture: ComponentFixture<AllProject>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AllProject],
    }).compileComponents();

    fixture = TestBed.createComponent(AllProject);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
