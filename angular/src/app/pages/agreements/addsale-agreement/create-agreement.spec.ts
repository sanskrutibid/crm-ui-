import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CreateAgreement } from './create-agreement';

describe('CreateAgreement', () => {
  let component: CreateAgreement;
  let fixture: ComponentFixture<CreateAgreement>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CreateAgreement],
    }).compileComponents();

    fixture = TestBed.createComponent(CreateAgreement);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
