import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CreateLeads } from './create-leads';

describe('CreateLeads', () => {
  let component: CreateLeads;
  let fixture: ComponentFixture<CreateLeads>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CreateLeads],
    }).compileComponents();

    fixture = TestBed.createComponent(CreateLeads);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
