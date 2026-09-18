import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UploadDocument } from './upload-document';

describe('UploadDocument', () => {
  let component: UploadDocument;
  let fixture: ComponentFixture<UploadDocument>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UploadDocument],
    }).compileComponents();

    fixture = TestBed.createComponent(UploadDocument);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
