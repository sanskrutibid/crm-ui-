import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GroupTransfer } from './group-transfer';

describe('GroupTransfer', () => {
  let component: GroupTransfer;
  let fixture: ComponentFixture<GroupTransfer>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GroupTransfer],
    }).compileComponents();

    fixture = TestBed.createComponent(GroupTransfer);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
