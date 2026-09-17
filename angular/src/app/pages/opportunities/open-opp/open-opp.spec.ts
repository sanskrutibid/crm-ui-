import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OpenOpp } from './open-opp';

describe('OpenOpp', () => {
  let component: OpenOpp;
  let fixture: ComponentFixture<OpenOpp>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OpenOpp],
    }).compileComponents();

    fixture = TestBed.createComponent(OpenOpp);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
