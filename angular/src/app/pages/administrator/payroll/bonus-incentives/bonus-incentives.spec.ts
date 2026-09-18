import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BonusIncentives } from './bonus-incentives';

describe('BonusIncentives', () => {
  let component: BonusIncentives;
  let fixture: ComponentFixture<BonusIncentives>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BonusIncentives],
    }).compileComponents();

    fixture = TestBed.createComponent(BonusIncentives);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
