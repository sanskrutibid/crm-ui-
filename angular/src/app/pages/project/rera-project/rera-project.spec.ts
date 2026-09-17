import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ReraProject } from './rera-project';

describe('ReraProject', () => {
  let component: ReraProject;
  let fixture: ComponentFixture<ReraProject>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ReraProject],
    }).compileComponents();

    fixture = TestBed.createComponent(ReraProject);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
