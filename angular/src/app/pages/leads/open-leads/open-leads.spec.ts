import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OpenLeads } from './open-leads';

describe('OpenLeads', () => {
  let component: OpenLeads;
  let fixture: ComponentFixture<OpenLeads>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OpenLeads],
    }).compileComponents();

    fixture = TestBed.createComponent(OpenLeads);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
