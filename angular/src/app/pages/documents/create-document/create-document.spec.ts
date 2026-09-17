import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CreateDocument } from './create-document';

describe('CreateDocument', () => {
  let component: CreateDocument;
  let fixture: ComponentFixture<CreateDocument>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CreateDocument],
    }).compileComponents();

    fixture = TestBed.createComponent(CreateDocument);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
