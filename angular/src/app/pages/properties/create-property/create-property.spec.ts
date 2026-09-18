import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CreateProperty } from './create-property';

describe('CreateProperty', () => {
  let component: CreateProperty;
  let fixture: ComponentFixture<CreateProperty>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CreateProperty],
    }).compileComponents();

    fixture = TestBed.createComponent(CreateProperty);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
