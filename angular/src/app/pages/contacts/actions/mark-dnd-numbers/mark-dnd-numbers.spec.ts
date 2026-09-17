import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MarkDndNumbers } from './mark-dnd-numbers';

describe('MarkDndNumbers', () => {
  let component: MarkDndNumbers;
  let fixture: ComponentFixture<MarkDndNumbers>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MarkDndNumbers],
    }).compileComponents();

    fixture = TestBed.createComponent(MarkDndNumbers);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
