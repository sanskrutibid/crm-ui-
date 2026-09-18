import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TodayFollowups } from './today-followups';

describe('TodayFollowups', () => {
  let component: TodayFollowups;
  let fixture: ComponentFixture<TodayFollowups>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TodayFollowups],
    }).compileComponents();

    fixture = TestBed.createComponent(TodayFollowups);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
