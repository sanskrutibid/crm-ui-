import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PropertyHistory } from './property-history';

describe('PropertyHistory', () => {
  let component: PropertyHistory;
  let fixture: ComponentFixture<PropertyHistory>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PropertyHistory],
    }).compileComponents();

    fixture = TestBed.createComponent(PropertyHistory);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
