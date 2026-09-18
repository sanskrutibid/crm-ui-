import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GroupDeleteAction } from './group-delete-action';

describe('GroupDeleteAction', () => {
  let component: GroupDeleteAction;
  let fixture: ComponentFixture<GroupDeleteAction>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GroupDeleteAction],
    }).compileComponents();

    fixture = TestBed.createComponent(GroupDeleteAction);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
