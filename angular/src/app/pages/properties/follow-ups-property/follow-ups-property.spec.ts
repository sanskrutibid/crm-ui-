import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FollowUpsProperty } from './follow-ups-property';

describe('FollowUpsProperty', () => {
  let component: FollowUpsProperty;
  let fixture: ComponentFixture<FollowUpsProperty>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FollowUpsProperty],
    }).compileComponents();

    fixture = TestBed.createComponent(FollowUpsProperty);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
