import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DeleteLead } from './delete-lead';

describe('DeleteLead', () => {
  let component: DeleteLead;
  let fixture: ComponentFixture<DeleteLead>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DeleteLead],
    }).compileComponents();

    fixture = TestBed.createComponent(DeleteLead);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
