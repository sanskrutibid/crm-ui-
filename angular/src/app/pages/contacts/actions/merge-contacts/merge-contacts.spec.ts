import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MergeContacts } from './merge-contacts';

describe('MergeContacts', () => {
  let component: MergeContacts;
  let fixture: ComponentFixture<MergeContacts>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MergeContacts],
    }).compileComponents();

    fixture = TestBed.createComponent(MergeContacts);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
