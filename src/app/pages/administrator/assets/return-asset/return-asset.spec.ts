import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ReturnAsset } from './return-asset';

describe('ReturnAsset', () => {
  let component: ReturnAsset;
  let fixture: ComponentFixture<ReturnAsset>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ReturnAsset],
    }).compileComponents();

    fixture = TestBed.createComponent(ReturnAsset);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
