import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DatabaseBackup } from './database-backup';

describe('DatabaseBackup', () => {
  let component: DatabaseBackup;
  let fixture: ComponentFixture<DatabaseBackup>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DatabaseBackup],
    }).compileComponents();

    fixture = TestBed.createComponent(DatabaseBackup);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
