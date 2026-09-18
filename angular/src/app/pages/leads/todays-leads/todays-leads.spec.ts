import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TodaysLeads } from './todays-leads';

describe('TodaysLeads', () => {
  let component: TodaysLeads;
  let fixture: ComponentFixture<TodaysLeads>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TodaysLeads],
    }).compileComponents();

    fixture = TestBed.createComponent(TodaysLeads);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
