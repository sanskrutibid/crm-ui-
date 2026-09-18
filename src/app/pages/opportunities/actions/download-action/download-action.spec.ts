import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DownloadAction } from './download-action';

describe('DownloadAction', () => {
  let component: DownloadAction;
  let fixture: ComponentFixture<DownloadAction>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DownloadAction],
    }).compileComponents();

    fixture = TestBed.createComponent(DownloadAction);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
