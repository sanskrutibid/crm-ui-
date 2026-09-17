import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BacklogProperty } from './backlog-property';

describe('BacklogProperty', () => {
  let component: BacklogProperty;
  let fixture: ComponentFixture<BacklogProperty>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BacklogProperty],
    }).compileComponents();

    fixture = TestBed.createComponent(BacklogProperty);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
