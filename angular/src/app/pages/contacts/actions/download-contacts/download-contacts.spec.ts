import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DownloadContacts } from './download-contacts';

describe('DownloadContacts', () => {
  let component: DownloadContacts;
  let fixture: ComponentFixture<DownloadContacts>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DownloadContacts],
    }).compileComponents();

    fixture = TestBed.createComponent(DownloadContacts);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
