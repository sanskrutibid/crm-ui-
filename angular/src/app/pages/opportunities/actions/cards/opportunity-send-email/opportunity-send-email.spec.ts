import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OpportunitySendEmail } from './opportunity-send-email';

describe('OpportunitySendEmail', () => {
  let component: OpportunitySendEmail;
  let fixture: ComponentFixture<OpportunitySendEmail>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OpportunitySendEmail],
    }).compileComponents();

    fixture = TestBed.createComponent(OpportunitySendEmail);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
