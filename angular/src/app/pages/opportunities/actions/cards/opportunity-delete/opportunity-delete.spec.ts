import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OpportunityDelete } from './opportunity-delete';

describe('OpportunityDelete', () => {
  let component: OpportunityDelete;
  let fixture: ComponentFixture<OpportunityDelete>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OpportunityDelete],
    }).compileComponents();

    fixture = TestBed.createComponent(OpportunityDelete);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
