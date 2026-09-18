import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddCampaign } from './add-campaign';

describe('AddCampaign', () => {
  let component: AddCampaign;
  let fixture: ComponentFixture<AddCampaign>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AddCampaign],
    }).compileComponents();

    fixture = TestBed.createComponent(AddCampaign);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
