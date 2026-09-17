import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddrentAgreement } from './addrent-agreement';

describe('AddrentAgreement', () => {
  let component: AddrentAgreement;
  let fixture: ComponentFixture<AddrentAgreement>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AddrentAgreement],
    }).compileComponents();

    fixture = TestBed.createComponent(AddrentAgreement);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
