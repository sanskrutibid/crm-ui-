import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LeadBacklog } from './lead-backlog';

describe('LeadBacklog', () => {
  let component: LeadBacklog;
  let fixture: ComponentFixture<LeadBacklog>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LeadBacklog],
    }).compileComponents();

    fixture = TestBed.createComponent(LeadBacklog);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
