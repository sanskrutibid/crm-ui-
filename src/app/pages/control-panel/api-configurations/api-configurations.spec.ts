import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ApiConfigurations } from './api-configurations';

describe('ApiConfigurations', () => {
  let component: ApiConfigurations;
  let fixture: ComponentFixture<ApiConfigurations>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ApiConfigurations],
    }).compileComponents();

    fixture = TestBed.createComponent(ApiConfigurations);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
