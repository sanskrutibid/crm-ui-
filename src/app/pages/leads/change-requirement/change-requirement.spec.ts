import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ChangeRequirement } from './change-requirement';

describe('ChangeRequirement', () => {
  let component: ChangeRequirement;
  let fixture: ComponentFixture<ChangeRequirement>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ChangeRequirement],
    }).compileComponents();

    fixture = TestBed.createComponent(ChangeRequirement);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
