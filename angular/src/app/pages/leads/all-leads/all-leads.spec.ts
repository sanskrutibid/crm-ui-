import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AllLeads } from './all-leads';

describe('AllLeads', () => {
  let component: AllLeads;
  let fixture: ComponentFixture<AllLeads>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AllLeads],
    }).compileComponents();

    fixture = TestBed.createComponent(AllLeads);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
