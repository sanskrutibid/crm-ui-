import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PropertyGroupDeleteAction } from './property-group-delete-action';

describe('PropertyGroupDeleteAction', () => {
  let component: PropertyGroupDeleteAction;
  let fixture: ComponentFixture<PropertyGroupDeleteAction>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PropertyGroupDeleteAction],
    }).compileComponents();

    fixture = TestBed.createComponent(PropertyGroupDeleteAction);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
