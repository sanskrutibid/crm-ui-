import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MyProperty } from './my-property';

describe('MyProperty', () => {
  let component: MyProperty;
  let fixture: ComponentFixture<MyProperty>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MyProperty],
    }).compileComponents();

    fixture = TestBed.createComponent(MyProperty);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
