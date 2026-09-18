import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LeadRouting } from './lead-routing';

describe('LeadRouting', () => {
  let component: LeadRouting;
  let fixture: ComponentFixture<LeadRouting>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LeadRouting],
    }).compileComponents();

    fixture = TestBed.createComponent(LeadRouting);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
