import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MyOpportunities } from './my-opportunities';

describe('MyOpportunities', () => {
  let component: MyOpportunities;
  let fixture: ComponentFixture<MyOpportunities>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MyOpportunities],
    }).compileComponents();

    fixture = TestBed.createComponent(MyOpportunities);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
