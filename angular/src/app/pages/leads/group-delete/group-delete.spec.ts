import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GroupDelete } from './group-delete';

describe('GroupDelete', () => {
  let component: GroupDelete;
  let fixture: ComponentFixture<GroupDelete>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GroupDelete],
    }).compileComponents();

    fixture = TestBed.createComponent(GroupDelete);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
