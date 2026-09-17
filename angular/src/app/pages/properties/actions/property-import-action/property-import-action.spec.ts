import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PropertyImportAction } from './property-import-action';

describe('PropertyImportAction', () => {
  let component: PropertyImportAction;
  let fixture: ComponentFixture<PropertyImportAction>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PropertyImportAction],
    }).compileComponents();

    fixture = TestBed.createComponent(PropertyImportAction);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
