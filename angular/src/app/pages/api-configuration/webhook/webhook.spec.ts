import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Webhook } from './webhook';

describe('Webhook', () => {
  let component: Webhook;
  let fixture: ComponentFixture<Webhook>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Webhook],
    }).compileComponents();

    fixture = TestBed.createComponent(Webhook);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
