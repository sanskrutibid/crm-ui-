import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Allpropects } from './allpropects';

describe('Allpropects', () => {
  let component: Allpropects;
  let fixture: ComponentFixture<Allpropects>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Allpropects],
    }).compileComponents();

    fixture = TestBed.createComponent(Allpropects);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
