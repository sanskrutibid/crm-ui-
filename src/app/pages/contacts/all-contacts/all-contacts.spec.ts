import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AllContacts } from './all-contacts';

describe('AllContacts', () => {
  let component: AllContacts;
  let fixture: ComponentFixture<AllContacts>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AllContacts],
    }).compileComponents();

    fixture = TestBed.createComponent(AllContacts);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
