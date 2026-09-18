import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ImportContacts } from './import-contacts';

describe('ImportContacts', () => {
  let component: ImportContacts;
  let fixture: ComponentFixture<ImportContacts>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ImportContacts],
    }).compileComponents();

    fixture = TestBed.createComponent(ImportContacts);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
