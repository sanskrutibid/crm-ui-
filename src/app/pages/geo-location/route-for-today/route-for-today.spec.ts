import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RouteForToday } from './route-for-today';

describe('RouteForToday', () => {
  let component: RouteForToday;
  let fixture: ComponentFixture<RouteForToday>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RouteForToday],
    }).compileComponents();

    fixture = TestBed.createComponent(RouteForToday);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
