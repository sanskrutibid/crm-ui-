import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OpportunitySiteVisits } from './opportunity-site-visits';

describe('OpportunitySiteVisits', () => {
  let component: OpportunitySiteVisits;
  let fixture: ComponentFixture<OpportunitySiteVisits>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OpportunitySiteVisits],
    }).compileComponents();

    fixture = TestBed.createComponent(OpportunitySiteVisits);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
