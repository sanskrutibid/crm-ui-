import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DownloadLeads } from './download-leads';

describe('DownloadLeads', () => {
  let component: DownloadLeads;
  let fixture: ComponentFixture<DownloadLeads>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DownloadLeads],
    }).compileComponents();

    fixture = TestBed.createComponent(DownloadLeads);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
