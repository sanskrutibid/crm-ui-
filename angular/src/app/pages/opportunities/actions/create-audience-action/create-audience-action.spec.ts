import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CreateAudienceAction } from './create-audience-action';

describe('CreateAudienceAction', () => {
  let component: CreateAudienceAction;
  let fixture: ComponentFixture<CreateAudienceAction>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CreateAudienceAction],
    }).compileComponents();

    fixture = TestBed.createComponent(CreateAudienceAction);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
