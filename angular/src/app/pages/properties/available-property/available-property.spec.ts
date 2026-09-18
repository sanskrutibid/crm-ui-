import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AvailableProperty } from './available-property';

describe('AvailableProperty', () => {
  let component: AvailableProperty;
  let fixture: ComponentFixture<AvailableProperty>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AvailableProperty],
    }).compileComponents();

    fixture = TestBed.createComponent(AvailableProperty);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
