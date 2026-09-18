import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PropertyDownlaodAction } from './property-downlaod-action';

describe('PropertyDownlaodAction', () => {
  let component: PropertyDownlaodAction;
  let fixture: ComponentFixture<PropertyDownlaodAction>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PropertyDownlaodAction],
    }).compileComponents();

    fixture = TestBed.createComponent(PropertyDownlaodAction);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
