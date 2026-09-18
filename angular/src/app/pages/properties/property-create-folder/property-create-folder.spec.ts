import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PropertyCreateFolder } from './property-create-folder';

describe('PropertyCreateFolder', () => {
  let component: PropertyCreateFolder;
  let fixture: ComponentFixture<PropertyCreateFolder>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PropertyCreateFolder],
    }).compileComponents();

    fixture = TestBed.createComponent(PropertyCreateFolder);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
