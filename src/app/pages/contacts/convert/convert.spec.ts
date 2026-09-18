import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Convert } from './convert';

describe('Convert', () => {
  let component: Convert;
  let fixture: ComponentFixture<Convert>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Convert],
    }).compileComponents();

    fixture = TestBed.createComponent(Convert);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
