import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AllCampaign } from './all-campaign';

describe('AllCampaign', () => {
  let component: AllCampaign;
  let fixture: ComponentFixture<AllCampaign>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AllCampaign],
    }).compileComponents();

    fixture = TestBed.createComponent(AllCampaign);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
