import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RemoveDuplicate } from './remove-duplicate';

describe('RemoveDuplicate', () => {
  let component: RemoveDuplicate;
  let fixture: ComponentFixture<RemoveDuplicate>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RemoveDuplicate],
    }).compileComponents();

    fixture = TestBed.createComponent(RemoveDuplicate);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
