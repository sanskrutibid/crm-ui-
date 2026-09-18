import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TimeLines } from './time-lines';

describe('TimeLines', () => {
  let component: TimeLines;
  let fixture: ComponentFixture<TimeLines>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TimeLines],
    }).compileComponents();

    fixture = TestBed.createComponent(TimeLines);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
