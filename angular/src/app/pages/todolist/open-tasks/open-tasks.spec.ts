import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OpenTasks } from './open-tasks';

describe('OpenTasks', () => {
  let component: OpenTasks;
  let fixture: ComponentFixture<OpenTasks>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OpenTasks],
    }).compileComponents();

    fixture = TestBed.createComponent(OpenTasks);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
