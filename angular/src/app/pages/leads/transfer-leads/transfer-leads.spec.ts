import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TransferLeads } from './transfer-leads';

describe('TransferLeads', () => {
  let component: TransferLeads;
  let fixture: ComponentFixture<TransferLeads>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TransferLeads],
    }).compileComponents();

    fixture = TestBed.createComponent(TransferLeads);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
