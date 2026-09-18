import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AdministratorDashboard } from './administrator-dashboard';
import { EmployeesService } from '../employees/employees.service';
import { of } from 'rxjs';

describe('AdministratorDashboard', () => {
  let component: AdministratorDashboard;
  let fixture: ComponentFixture<AdministratorDashboard>;
  let mockEmployeesService: any;

  beforeEach(async () => {
    mockEmployeesService = {
      getEmployees: () => of({ data: [] })
    };

    await TestBed.configureTestingModule({
      imports: [AdministratorDashboard],
      providers: [
        { provide: EmployeesService, useValue: mockEmployeesService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(AdministratorDashboard);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

