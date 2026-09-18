import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CreateFolderOpp } from './create-folder-opp';

describe('CreateFolderOpp', () => {
  let component: CreateFolderOpp;
  let fixture: ComponentFixture<CreateFolderOpp>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CreateFolderOpp],
    }).compileComponents();

    fixture = TestBed.createComponent(CreateFolderOpp);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
