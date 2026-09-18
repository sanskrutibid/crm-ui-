import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, of } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';

export interface SalaryStructureData {
  id?: string;
  employeeId: string;
  employeeName: string;
  department: string;
  designation: string;
  salaryType: string;
  effectiveDate: string;
  basicSalary: number;
  hra: number;
  da: number;
  conveyance: number;
  medical: number;
  specialAllowance: number;
  bonus: number;
  otherAllowance: number;
  pf: number;
  esic: number;
  professionalTax: number;
  tds: number;
  loan: number;
  advanceSalary: number;
  otherDeduction: number;
  grossSalary: number;
  totalDeduction: number;
  netSalary: number;
  remarks?: string;
  updatedAt?: string;
}

export interface ProcessedPayrollData {
  id: string;
  employeeId: string;
  employeeName: string;
  department: string;
  month: string;
  year: number;
  gross: number;
  deduction: number;
  net: number;
  status: 'Processed' | 'Pending';
  processedDate?: string;
  salaryBreakdown?: Partial<SalaryStructureData>;
}

@Injectable({
  providedIn: 'root'
})
export class PayrollService {
  private apiUrl = `${environment.apiUrl}/payroll`;

  private salaryStructuresSubject = new BehaviorSubject<SalaryStructureData[]>(this.getStoredStructures());
  public salaryStructures$ = this.salaryStructuresSubject.asObservable();

  private processedPayrollsSubject = new BehaviorSubject<ProcessedPayrollData[]>(this.getStoredPayrolls());
  public processedPayrolls$ = this.processedPayrollsSubject.asObservable();

  constructor(private http: HttpClient) {}

  // -------------------------------------------------------------
  // Standard Indian Payroll Auto-Calculation Formulas
  // -------------------------------------------------------------
  public calculateStandardSalary(basicSalary: number): Partial<SalaryStructureData> {
    const basic = Number(basicSalary) || 0;

    if (basic <= 0) {
      return {
        basicSalary: 0,
        hra: 0,
        da: 0,
        conveyance: 0,
        medical: 0,
        specialAllowance: 0,
        bonus: 0,
        otherAllowance: 0,
        pf: 0,
        esic: 0,
        professionalTax: 0,
        tds: 0,
        grossSalary: 0,
        totalDeduction: 0,
        netSalary: 0
      };
    }

    // 1. Earnings Formulas
    const hra = Math.round(basic * 0.50); // 50% of Basic
    const da = Math.round(basic * 0.10);  // 10% of Basic
    const conveyance = 1600;              // Standard Conveyance ₹1600/mo
    const medical = 1250;                 // Standard Medical Allowance ₹1250/mo
    const bonus = Math.round(basic * 0.0833); // 8.33% Statutory Bonus
    const specialAllowance = Math.round(basic * 0.15); // Special Allowance ~15%
    const otherAllowance = 0;

    const grossSalary = basic + hra + da + conveyance + medical + bonus + specialAllowance + otherAllowance;

    // 2. Deductions Formulas
    // Provident Fund (PF): 12% of (Basic + DA), capped at 1800 if basic > 15000
    const basicPlusDa = basic + da;
    let pf = 0;
    if (basicPlusDa > 0) {
      pf = basicPlusDa > 15000 ? 1800 : Math.round(basicPlusDa * 0.12);
    }

    // ESIC: 0.75% of Gross Salary if Gross <= 21,000 per month
    const esic = grossSalary <= 21000 ? Math.round(grossSalary * 0.0075) : 0;

    // Professional Tax (PT) Slabs
    let professionalTax = 0;
    if (grossSalary > 10000) {
      professionalTax = 200;
    } else if (grossSalary > 7500) {
      professionalTax = 175;
    }

    // TDS (Tax Deducted at Source) Estimation (New Tax Regime)
    const annualGross = grossSalary * 12;
    const taxableIncome = Math.max(0, annualGross - 75000); // Std deduction 75,000
    let annualTax = 0;

    if (taxableIncome > 700000) {
      if (taxableIncome <= 300000) {
        annualTax = 0;
      } else if (taxableIncome <= 700000) {
        annualTax = (taxableIncome - 300000) * 0.05;
      } else if (taxableIncome <= 1000000) {
        annualTax = 20000 + (taxableIncome - 700000) * 0.10;
      } else if (taxableIncome <= 1200000) {
        annualTax = 50000 + (taxableIncome - 1000000) * 0.15;
      } else if (taxableIncome <= 1500000) {
        annualTax = 80000 + (taxableIncome - 1200000) * 0.20;
      } else {
        annualTax = 140000 + (taxableIncome - 1500000) * 0.30;
      }
      annualTax = annualTax * 1.04; // 4% Health & Education Cess
    }
    const tds = Math.round(annualTax / 12);

    const totalDeduction = pf + esic + professionalTax + tds;
    const netSalary = Math.max(0, grossSalary - totalDeduction);

    return {
      basicSalary: basic,
      hra,
      da,
      conveyance,
      medical,
      specialAllowance,
      bonus,
      otherAllowance,
      pf,
      esic,
      professionalTax,
      tds,
      grossSalary,
      totalDeduction,
      netSalary
    };
  }

  // -------------------------------------------------------------
  // Salary Structure API & Persistence
  // -------------------------------------------------------------
  public getStoredStructures(): SalaryStructureData[] {
    const saved = localStorage.getItem('crm_salary_structures');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed;
        }
      } catch (e) {
        console.error('Error parsing stored salary structures', e);
      }
    }
    return [];
  }

  private saveStoredStructures(structures: SalaryStructureData[]): void {
    localStorage.setItem('crm_salary_structures', JSON.stringify(structures));
    this.salaryStructuresSubject.next(structures);
  }

  public getSalaryStructures(): Observable<SalaryStructureData[]> {
    return this.http.get<any>(`${this.apiUrl}/salary-structure`).pipe(
      tap((res) => {
        const data = Array.isArray(res) ? res : (res?.data || []);
        this.saveStoredStructures(data);
      }),
      catchError(() => {
        return of(this.getStoredStructures());
      })
    );
  }

  public getSalaryStructureByEmployee(employeeId: string): SalaryStructureData | undefined {
    const structures = this.getStoredStructures();
    return structures.find(s => s.employeeId === employeeId);
  }

  public saveSalaryStructure(data: SalaryStructureData): Observable<SalaryStructureData> {
    return this.http.post<any>(`${this.apiUrl}/salary-structure`, data).pipe(
      tap((res) => {
        const savedDoc = res.data || data;
        const current = this.getStoredStructures();
        const index = current.findIndex(s => s.employeeId === savedDoc.employeeId);
        if (index !== -1) {
          current[index] = savedDoc;
        } else {
          current.push(savedDoc);
        }
        this.saveStoredStructures(current);
      }),
      catchError(() => {
        const current = this.getStoredStructures();
        const index = current.findIndex(s => s.employeeId === data.employeeId);
        const record: SalaryStructureData = {
          ...data,
          id: data.id || `SAL_${data.employeeId}`,
          updatedAt: new Date().toISOString()
        };
        if (index !== -1) {
          current[index] = record;
        } else {
          current.push(record);
        }
        this.saveStoredStructures(current);
        return of(record);
      })
    );
  }

  public deleteSalaryStructure(employeeId: string): Observable<boolean> {
    return this.http.delete<any>(`${this.apiUrl}/salary-structure/employee/${employeeId}`).pipe(
      tap(() => {
        const current = this.getStoredStructures();
        const updated = current.filter(s => s.employeeId !== employeeId);
        this.saveStoredStructures(updated);
      }),
      catchError(() => {
        const current = this.getStoredStructures();
        const updated = current.filter(s => s.employeeId !== employeeId);
        this.saveStoredStructures(updated);
        return of(true);
      })
    );
  }

  // -------------------------------------------------------------
  // Processed Payroll API & Management
  // -------------------------------------------------------------
  public getStoredPayrolls(): ProcessedPayrollData[] {
    const saved = localStorage.getItem('crm_processed_payrolls');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed;
        }
      } catch (e) {
        console.error('Error parsing stored processed payrolls', e);
      }
    }
    return [];
  }

  private saveStoredPayrolls(payrolls: ProcessedPayrollData[]): void {
    localStorage.setItem('crm_processed_payrolls', JSON.stringify(payrolls));
    this.processedPayrollsSubject.next(payrolls);
  }

  public getProcessedPayrolls(month?: string, year?: number): Observable<ProcessedPayrollData[]> {
    return this.http.get<any>(`${this.apiUrl}/processed`, { params: { month: month || '', year: year || '' } }).pipe(
      tap((res) => {
        const data = Array.isArray(res) ? res : (res?.data || []);
        if (Array.isArray(data)) {
          this.saveStoredPayrolls(data);
        }
      }),
      catchError(() => {
        let list = this.getStoredPayrolls();
        if (month && month !== 'All') {
          list = list.filter(p => p.month === month);
        }
        if (year) {
          list = list.filter(p => p.year === Number(year));
        }
        return of(list);
      })
    );
  }

  public saveProcessedPayrolls(payrolls: ProcessedPayrollData[]): Observable<boolean> {
    return this.http.post<any>(`${this.apiUrl}/processed`, payrolls).pipe(
      tap((res) => {
        const savedData = Array.isArray(res) ? res : (res?.data || payrolls);
        const current = this.getStoredPayrolls();
        savedData.forEach((newItem: ProcessedPayrollData) => {
          const idx = current.findIndex(p => p.employeeId === newItem.employeeId && p.month === newItem.month && p.year === newItem.year);
          if (idx !== -1) {
            current[idx] = newItem;
          } else {
            current.push(newItem);
          }
        });
        this.saveStoredPayrolls(current);
      }),
      catchError(() => {
        const current = this.getStoredPayrolls();
        payrolls.forEach(newItem => {
          const idx = current.findIndex(p => p.employeeId === newItem.employeeId && p.month === newItem.month && p.year === newItem.year);
          if (idx !== -1) {
            current[idx] = newItem;
          } else {
            current.push(newItem);
          }
        });
        this.saveStoredPayrolls(current);
        return of(true);
      })
    );
  }
}
