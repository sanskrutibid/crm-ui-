import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CreateContacts } from './create-contacts';

describe('CreateContacts', () => {
  let component: CreateContacts;
  let fixture: ComponentFixture<CreateContacts>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CreateContacts],
    }).compileComponents();

    fixture = TestBed.createComponent(CreateContacts);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
