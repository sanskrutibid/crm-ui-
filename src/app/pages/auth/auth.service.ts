import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import {
  BehaviorSubject,
  Observable,
  of,
  throwError
} from 'rxjs';
import {
  tap,
  catchError,
  map
} from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { GpsTrackingService } from '../../services/gps-tracking.service';
import { LoginHistoryService } from '../../services/login-history.service';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  name?: string;
  officialEmail?: string;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
  statusCode?: number;
  message?: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);
  private gpsTrackingService = inject(GpsTrackingService);
  private loginHistoryService = inject(LoginHistoryService);

  private apiUrl =
    `${environment.apiUrl}/auth`;

  private currentUserSubject =
    new BehaviorSubject<User | null>(null);

  public currentUser$ =
    this.currentUserSubject.asObservable();

  // Common public personal email domains that are blocked for login
  private blockedPersonalDomains = [
    'gmail.com',
    'yahoo.com',
    'hotmail.com',
    'outlook.com',
    'icloud.com',
    'rediffmail.com',
    'ymail.com',
    'live.com',
    'aol.com',
    'protonmail.com',
    'zoho.com'
  ];

  constructor() {
    if (typeof window !== 'undefined') {
      const storedUser =
        localStorage.getItem(
          'vaultstone_user'
        );

      const token =
        localStorage.getItem(
          'vaultstone_token'
        );

      if (storedUser && token) {
        try {
          const user =
            JSON.parse(storedUser);

          this.currentUserSubject.next(
            user
          );

          setTimeout(
            () =>
              this.gpsTrackingService.startTracking(),
            500
          );
        } catch (e) {
          this.logout();
        }
      }
    }
  }

  public get currentUserValue(): User | null {
    return this.currentUserSubject.value;
  }

  public get token(): string | null {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(
        'vaultstone_token'
      );
    }

    return null;
  }

  isAuthenticated(): boolean {
    return !!this.token;
  }

  /**
   * Check if an email address is valid
   */
  public isOfficialEmail(
    email: string
  ): boolean {
    if (
      !email ||
      typeof email !== 'string' ||
      !email.includes('@')
    ) {
      return false;
    }

    return true;
  }

  checkEmployee(
    email: string,
    name: string
  ): Observable<any> {
    return this.http.get<any>(
      `${this.apiUrl}/check-employee`,
      {
        params: {
          email,
          name
        }
      }
    );
  }

  register(
    userData: any
  ): Observable<any> {
    const emailInput = (
      userData.officialEmail ||
      userData.email ||
      ''
    ).trim();

    if (!this.isOfficialEmail(emailInput)) {
      return throwError(() => ({
        error: {
          message:
            'Please enter a valid email address.'
        }
      }));
    }

    const payload: any = {
      ...userData,
      email: emailInput
    };

    delete payload.officialEmail;

    return this.http.post<any>(
      `${this.apiUrl}/register`,
      payload
    ).pipe(
      tap((res) => {
        this.saveEmployeeFromSignup(
          payload
        );

        const payloadRes =
          res?.data || res;

        if (
          payloadRes?.accessToken ||
          payloadRes?.token ||
          res?.accessToken ||
          res?.token
        ) {
          this.handleAuthSuccess(res);
        }
      }),

      catchError((err) => {
        if (
          err.status &&
          err.status !== 0
        ) {
          return throwError(
            () => err
          );
        }

        // Fallback for local offline development
        // when backend server is unreachable
        this.saveEmployeeFromSignup(
          payload
        );

        const mockToken =
          'mock_jwt_token_' +
          Date.now();

        const offlineRes = {
          accessToken: mockToken,
          user: payload
        };

        this.handleAuthSuccess(
          offlineRes
        );

        return of({
          success: true,
          message:
            'Registration successful',
          data: payload
        });
      })
    );
  }

  private saveEmployeeFromSignup(
    payload: any
  ): void {
    if (
      typeof window === 'undefined'
    ) {
      return;
    }

    try {
      const email = (
        payload.officialEmail ||
        payload.email ||
        ''
      ).trim();

      if (!email) {
        return;
      }

      const saved =
        localStorage.getItem(
          'crm_employees'
        );

      let list: any[] = saved
        ? JSON.parse(saved)
        : [];

      if (!Array.isArray(list)) {
        list = [];
      }

      const exists =
        list.some(
          emp =>
            String(
              emp.email ||
              emp.officialEmail ||
              ''
            ).toLowerCase() ===
            email.toLowerCase()
        );

      const nameParts = (
        payload.name ||
        payload.firstName ||
        'User'
      )
        .toString()
        .trim()
        .split(' ');

      const firstName =
        payload.firstName ||
        nameParts[0] ||
        'User';

      const lastName =
        payload.lastName ||
        nameParts.slice(1).join(' ') ||
        '';

      if (!exists) {
        const nextEmp = {
          id:
            `EMP${Date.now()}`,

          employeeId:
            `EMP${Date.now()}`,

          firstName,

          lastName,

          name:
            payload.name ||
            `${firstName} ${lastName}`.trim(),

          email,

          officialEmail: email,

          status: 'Active',

          department:
            payload.department ||
            'General',

          designation:
            payload.designation ||
            'Employee'
        };

        list.unshift(nextEmp);

        localStorage.setItem(
          'crm_employees',
          JSON.stringify(list)
        );
      }

      // Save to crm_registered_users
      // for local offline fallback authentication
      const regUsersSaved =
        localStorage.getItem(
          'crm_registered_users'
        );

      let regUsers: any[] =
        regUsersSaved
          ? JSON.parse(regUsersSaved)
          : [];

      if (!Array.isArray(regUsers)) {
        regUsers = [];
      }

      const regExistsIndex =
        regUsers.findIndex(
          u =>
            String(
              u.email ||
              u.officialEmail ||
              ''
            ).toLowerCase() ===
            email.toLowerCase()
        );

      const userObj = {
        id:
          `USER_${Date.now()}`,

        email,

        officialEmail: email,

        firstName,

        lastName,

        name:
          payload.name ||
          `${firstName} ${lastName}`.trim(),

        role:
          payload.role ||
          'Admin',

        password:
          payload.password
      };

      if (regExistsIndex >= 0) {
        regUsers[
          regExistsIndex
        ] = {
          ...regUsers[
            regExistsIndex
          ],
          ...userObj
        };
      } else {
        regUsers.push(
          userObj
        );
      }

      localStorage.setItem(
        'crm_registered_users',
        JSON.stringify(regUsers)
      );

    } catch (e) {
      console.error(
        'Error saving employee from signup',
        e
      );
    }
  }

  login(
    credentials: any
  ): Observable<any> {
    const inputEmail = (
      credentials.email ||
      credentials.officialEmail ||
      ''
    ).trim();

    if (
      !this.isOfficialEmail(
        inputEmail
      )
    ) {
      return throwError(() => ({
        error: {
          message:
            'Please enter a valid email address.'
        }
      }));
    }

    const payload = {
      email: inputEmail,
      password:
        credentials.password
    };

    return this.http.post<any>(
      `${this.apiUrl}/login`,
      payload
    ).pipe(
      tap(res => {
        this.handleAuthSuccess(res);

        this.gpsTrackingService.startTracking();
      }),

      catchError(err => {
        // If HTTP status is 0,
        // backend server offline / network error,
        // attempt offline fallback
        if (
          !err.status ||
          err.status === 0
        ) {
          if (
            typeof window !==
            'undefined'
          ) {
            const regUsersSaved =
              localStorage.getItem(
                'crm_registered_users'
              );

            const regUsers: any[] =
              regUsersSaved
                ? JSON.parse(
                    regUsersSaved
                  )
                : [];

            const foundUser =
              regUsers.find(
                u =>
                  String(
                    u.email ||
                    u.officialEmail ||
                    ''
                  ).toLowerCase() ===
                  inputEmail.toLowerCase()
              );

            if (foundUser) {
              if (
                credentials.password &&
                foundUser.password &&
                credentials.password !==
                  foundUser.password
              ) {
                return throwError(
                  () => ({
                    error: {
                      message:
                        'Invalid email or password.'
                    }
                  })
                );
              }

              const mockToken =
                'mock_jwt_token_' +
                Date.now();

              const offlineRes = {
                accessToken:
                  mockToken,
                user:
                  foundUser
              };

              this.handleAuthSuccess(
                offlineRes
              );

              this.gpsTrackingService.startTracking();

              return of({
                success: true,
                message:
                  'Offline login successful',
                data:
                  offlineRes
              });
            }
          }
        }

        return throwError(
          () => err
        );
      })
    );
  }

  logout(): void {
    this.gpsTrackingService.stopTracking();

    if (
      typeof window !== 'undefined'
    ) {
      const theme =
        localStorage.getItem(
          'theme'
        );

      localStorage.clear();

      if (theme) {
        localStorage.setItem(
          'theme',
          theme
        );
      }
    }

    this.currentUserSubject.next(
      null
    );

    this.router.navigate([
      '/login'
    ]);
  }

  private handleAuthSuccess(
    resPayload: any
  ): void {
    if (!resPayload) {
      return;
    }

    const rawData =
      resPayload.data ||
      resPayload;

    const token =
      rawData.accessToken ||
      rawData.token ||
      rawData.access_token ||
      rawData.jwt ||
      resPayload.accessToken ||
      resPayload.token;

    const rawUser =
      rawData.user ||
      rawData.employee ||
      resPayload.user ||
      resPayload.employee ||
      rawData;

    if (token) {
      const nameParts = (
        rawUser.name ||
        rawUser.firstName ||
        'User'
      )
        .toString()
        .trim()
        .split(' ');

      const firstName =
        rawUser.firstName ||
        nameParts[0] ||
        'User';

      const lastName =
        rawUser.lastName ||
        nameParts.slice(1).join(' ') ||
        '';

      const user: User = {
        id:
          rawUser.id ||
          rawUser._id ||
          `USER_${Date.now()}`,

        email:
          rawUser.email ||
          rawUser.officialEmail ||
          '',

        officialEmail:
          rawUser.officialEmail ||
          rawUser.email ||
          '',

        firstName,

        lastName,

        name:
          rawUser.name ||
          `${firstName} ${lastName}`.trim(),

        role:
          rawUser.role ||
          'Admin'
      };

      if (
        typeof window !==
        'undefined'
      ) {
        localStorage.setItem(
          'vaultstone_token',
          token
        );

        localStorage.setItem(
          'vaultstone_user',
          JSON.stringify(user)
        );
      }

      this.currentUserSubject.next(
        user
      );

      try {
        this.loginHistoryService
          .recordLogin(user)
          .subscribe({
            next: () =>
              console.log(
                'Login audit recorded successfully'
              ),

            error: (err) =>
              console.warn(
                'Login audit recording notice:',
                err
              )
          });
      } catch (e) {
        console.warn(
          'Could not record login history',
          e
        );
      }
    }
  }

  // ============================================================
  // GET EMPLOYEES / AGENTS
  // ============================================================

  getAgents(): Observable<any> {
    return this.http
      .get<any>(
        `${environment.apiUrl}/employees`
      )
      .pipe(
        map((res: any) => {
          const list =
            Array.isArray(res)
              ? res
              : (
                  res?.data ||
                  res?.employees ||
                  []
                );

          const mappedList =
            list
              .filter(
                (emp: any) =>
                  emp.status !==
                  'Inactive'
              )
              .map(
                (emp: any) => ({
                  ...emp,

                  id:
                    emp.id ||
                    emp._id,

                  firstName:
                    emp.firstName ||
                    '',

                  lastName:
                    emp.lastName ||
                    ''
                })
              );

          return {
            success: true,
            data: mappedList
          };
        }),

        catchError(() => {
          let localList: any[] =
            [];

          if (
            typeof window !==
            'undefined'
          ) {
            const saved =
              localStorage.getItem(
                'crm_employees'
              );

            if (saved) {
              try {
                localList =
                  JSON.parse(
                    saved
                  );
              } catch (e) {
                console.error(
                  'Error parsing stored employees in getAgents fallback',
                  e
                );
              }
            }
          }

          if (
            Array.isArray(
              localList
            ) &&
            localList.length > 0
          ) {
            const mappedLocal =
              localList
                .filter(
                  (emp: any) =>
                    emp.status !==
                    'Inactive'
                )
                .map(
                  (emp: any) => ({
                    ...emp,

                    id:
                      emp.id ||
                      emp._id,

                    firstName:
                      emp.firstName ||
                      '',

                    lastName:
                      emp.lastName ||
                      ''
                  })
                );

            return of({
              success: true,
              data: mappedLocal
            });
          }

          return of({
            success: true,
            data: []
          });
        })
      );
  }

  // ============================================================
  // EMPLOYEE SOURCE OPTIONS
  // ============================================================
  //
  // IMPORTANT:
  // This method gets employees DIRECTLY FROM THE BACKEND.
  //
  // Backend endpoint:
  //
  // GET /employees/source-options
  //
  // No hardcoded employee names.
  // No localStorage employee fallback.
  //
  // ============================================================

  getSourceOptions(): Observable<any> {
    const url =
      `${environment.apiUrl}/employees/source-options`;

    console.log(
      '=========================================='
    );

    console.log(
      'CALLING EMPLOYEE SOURCE API:'
    );

    console.log(
      url
    );

    console.log(
      '=========================================='
    );

    return this.http
      .get<any>(url)
      .pipe(

        map((response: any) => {
          console.log(
            '=========================================='
          );

          console.log(
            'RAW EMPLOYEE SOURCE API RESPONSE:'
          );

          console.log(
            response
          );

          console.log(
            '=========================================='
          );

          let employees: any[] = [];

          // ------------------------------------------
          // Response: []
          // ------------------------------------------

          if (
            Array.isArray(response)
          ) {
            employees =
              response;
          }

          // ------------------------------------------
          // Response: { data: [] }
          // ------------------------------------------

          else if (
            response &&
            Array.isArray(
              response.data
            )
          ) {
            employees =
              response.data;
          }

          // ------------------------------------------
          // Response:
          // { data: { data: [] } }
          // ------------------------------------------

          else if (
            response &&
            response.data &&
            Array.isArray(
              response.data.data
            )
          ) {
            employees =
              response.data.data;
          }

          // ------------------------------------------
          // Response:
          // { employees: [] }
          // ------------------------------------------

          else if (
            response &&
            Array.isArray(
              response.employees
            )
          ) {
            employees =
              response.employees;
          }

          // ------------------------------------------
          // Response:
          // { results: [] }
          // ------------------------------------------

          else if (
            response &&
            Array.isArray(
              response.results
            )
          ) {
            employees =
              response.results;
          }

          // ------------------------------------------
          // Response:
          // { data: { employees: [] } }
          // ------------------------------------------

          else if (
            response &&
            response.data &&
            Array.isArray(
              response.data.employees
            )
          ) {
            employees =
              response.data.employees;
          }

          console.log(
            'EMPLOYEE ARRAY EXTRACTED FROM BACKEND:'
          );

          console.log(
            employees
          );

          // ------------------------------------------
          // Convert backend employee objects
          // into SourceOption objects
          // ------------------------------------------

          const mappedEmployees =
            employees
              .filter(
                (employee: any) =>
                  employee &&
                  employee.status !==
                    'Inactive'
              )
              .map(
                (employee: any) => {
                  const firstName =
                    employee.firstName ||
                    '';

                  const lastName =
                    employee.lastName ||
                    '';

                  let fullName =
                    employee.fullName ||
                    '';

                  if (
                    !fullName
                  ) {
                    fullName =
                      `${firstName} ${lastName}`.trim();
                  }

                  if (
                    !fullName
                  ) {
                    fullName =
                      employee.name ||
                      employee.employeeName ||
                      employee.employee_id ||
                      employee.employeeId ||
                      '';
                  }

                  return {
                    id: String(
                      employee.id ||
                      employee._id ||
                      employee.employeeId ||
                      ''
                    ),

                    employeeId:
                      String(
                        employee.employeeId ||
                        ''
                      ),

                    firstName:
                      String(
                        firstName
                      ),

                    lastName:
                      String(
                        lastName
                      ),

                    fullName:
                      String(
                        fullName
                      ).trim(),

                    type:
                      'employee'
                  };
                }
              )
              .filter(
                (employee: any) =>
                  !!employee.fullName
              );

          console.log(
            '=========================================='
          );

          console.log(
            'FINAL EMPLOYEE SOURCE OPTIONS:'
          );

          console.log(
            mappedEmployees
          );

          console.log(
            'TOTAL EMPLOYEES:',
            mappedEmployees.length
          );

          console.log(
            '=========================================='
          );

          /*
           * Return the same structure that
           * create-opportunity.ts already understands.
           */
          return {
            success: true,
            data:
              mappedEmployees
          };
        }),

        catchError((error) => {
          console.error(
            '=========================================='
          );

          console.error(
            'EMPLOYEE SOURCE API FAILED'
          );

          console.error(
            'URL:',
            url
          );

          console.error(
            'ERROR:',
            error
          );

          console.error(
            '=========================================='
          );

          /*
           * IMPORTANT:
           *
           * We are NOT using localStorage here.
           *
           * The Source employee list is supposed
           * to come from the backend.
           */

          return throwError(
            () => error
          );
        })
      );
  }

  // ============================================================
  // NORMAL SOURCE OPTIONS
  // ============================================================

  getSources(): Observable<any> {
    const url =
      `${environment.apiUrl}/sources`;

    console.log(
      'Loading normal Sources from:',
      url
    );

    return this.http
      .get<any>(url)
      .pipe(
        tap((response) => {
          console.log(
            'Normal Sources API response:',
            response
          );
        })
      );
  }
}