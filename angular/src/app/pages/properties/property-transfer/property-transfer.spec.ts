import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PropertyTransfer } from './property-transfer';

describe('PropertyTransfer', () => {
  let component: PropertyTransfer;
  let fixture: ComponentFixture<PropertyTransfer>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PropertyTransfer],
    }).compileComponents();

    fixture = TestBed.createComponent(PropertyTransfer);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
