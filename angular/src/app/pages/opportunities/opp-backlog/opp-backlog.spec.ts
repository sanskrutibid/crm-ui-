import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OppBacklog } from './opp-backlog';

describe('OppBacklog', () => {
  let component: OppBacklog;
  let fixture: ComponentFixture<OppBacklog>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OppBacklog],
    }).compileComponents();

    fixture = TestBed.createComponent(OppBacklog);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
