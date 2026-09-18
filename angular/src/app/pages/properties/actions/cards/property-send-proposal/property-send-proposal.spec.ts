import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PropertySendProposal } from './property-send-proposal';

describe('PropertySendProposal', () => {
  let component: PropertySendProposal;
  let fixture: ComponentFixture<PropertySendProposal>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PropertySendProposal],
    }).compileComponents();

    fixture = TestBed.createComponent(PropertySendProposal);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
