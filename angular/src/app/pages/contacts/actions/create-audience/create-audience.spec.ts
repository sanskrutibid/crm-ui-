import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CreateAudience } from './create-audience';

describe('CreateAudience', () => {
  let component: CreateAudience;
  let fixture: ComponentFixture<CreateAudience>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CreateAudience],
    }).compileComponents();

    fixture = TestBed.createComponent(CreateAudience);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
