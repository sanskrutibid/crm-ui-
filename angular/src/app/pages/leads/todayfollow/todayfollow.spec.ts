import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Todayfollow } from './todayfollow';

describe('Todayfollow', () => {
  let component: Todayfollow;
  let fixture: ComponentFixture<Todayfollow>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Todayfollow],
    }).compileComponents();

    fixture = TestBed.createComponent(Todayfollow);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
