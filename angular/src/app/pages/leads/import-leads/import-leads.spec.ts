import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ImportLeads } from './import-leads';

describe('ImportLeads', () => {
  let component: ImportLeads;
  let fixture: ComponentFixture<ImportLeads>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ImportLeads],
    }).compileComponents();

    fixture = TestBed.createComponent(ImportLeads);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
