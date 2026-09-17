import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddHoliday } from './add-holiday';

describe('AddHoliday', () => {
  let component: AddHoliday;
  let fixture: ComponentFixture<AddHoliday>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AddHoliday],
    }).compileComponents();

    fixture = TestBed.createComponent(AddHoliday);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
