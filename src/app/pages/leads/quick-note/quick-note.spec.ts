import { ComponentFixture, TestBed } from '@angular/core/testing';

import { QuickNote } from './quick-note';

describe('QuickNote', () => {
  let component: QuickNote;
  let fixture: ComponentFixture<QuickNote>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [QuickNote],
    }).compileComponents();

    fixture = TestBed.createComponent(QuickNote);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
