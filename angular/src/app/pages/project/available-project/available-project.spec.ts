import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AvailableProject } from './available-project';

describe('AvailableProject', () => {
  let component: AvailableProject;
  let fixture: ComponentFixture<AvailableProject>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AvailableProject],
    }).compileComponents();

    fixture = TestBed.createComponent(AvailableProject);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
