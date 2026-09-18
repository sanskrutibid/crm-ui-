import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Todayscall } from './todayscall';

describe('Todayscall', () => {
  let component: Todayscall;
  let fixture: ComponentFixture<Todayscall>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Todayscall],
    }).compileComponents();

    fixture = TestBed.createComponent(Todayscall);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
