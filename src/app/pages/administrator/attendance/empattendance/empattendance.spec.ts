import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Empattendance } from './empattendance';

describe('Empattendance', () => {
  let component: Empattendance;
  let fixture: ComponentFixture<Empattendance>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Empattendance],
    }).compileComponents();

    fixture = TestBed.createComponent(Empattendance);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
