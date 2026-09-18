import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SendProposal } from './send-proposal';

describe('SendProposal', () => {
  let component: SendProposal;
  let fixture: ComponentFixture<SendProposal>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SendProposal],
    }).compileComponents();

    fixture = TestBed.createComponent(SendProposal);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
