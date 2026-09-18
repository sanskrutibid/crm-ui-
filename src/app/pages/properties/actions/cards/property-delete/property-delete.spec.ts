import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PropertyDelete } from './property-delete';

describe('PropertyDelete', () => {
  let component: PropertyDelete;
  let fixture: ComponentFixture<PropertyDelete>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PropertyDelete],
    }).compileComponents();

    fixture = TestBed.createComponent(PropertyDelete);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
