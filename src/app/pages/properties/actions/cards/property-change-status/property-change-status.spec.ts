import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PropertyChangeStatus } from './property-change-status';

describe('PropertyChangeStatus', () => {
  let component: PropertyChangeStatus;
  let fixture: ComponentFixture<PropertyChangeStatus>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PropertyChangeStatus],
    }).compileComponents();

    fixture = TestBed.createComponent(PropertyChangeStatus);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
