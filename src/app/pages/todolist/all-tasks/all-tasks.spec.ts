import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AllTasks } from './all-tasks';

describe('AllTasks', () => {
  let component: AllTasks;
  let fixture: ComponentFixture<AllTasks>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AllTasks],
    }).compileComponents();

    fixture = TestBed.createComponent(AllTasks);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
