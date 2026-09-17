import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ActiveSessions } from './active-sessions';

describe('ActiveSessions', () => {
  let component: ActiveSessions;
  let fixture: ComponentFixture<ActiveSessions>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ActiveSessions],
    }).compileComponents();

    fixture = TestBed.createComponent(ActiveSessions);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
