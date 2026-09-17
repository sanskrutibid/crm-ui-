import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ExpiringDocuments } from './expiring-documents';

describe('ExpiringDocuments', () => {
  let component: ExpiringDocuments;
  let fixture: ComponentFixture<ExpiringDocuments>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ExpiringDocuments],
    }).compileComponents();

    fixture = TestBed.createComponent(ExpiringDocuments);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
