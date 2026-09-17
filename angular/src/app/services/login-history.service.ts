import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, of } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { environment } from '../../environments/environment';

export interface LoginHistoryItem {
  id: string | number;
  _id?: string;
  userId?: string;
  userName?: string;
  email: string;
  role?: string;
  avatar?: string;
  browser: string;
  browserVersion?: string;
  browserIcon: string;
  device: 'Desktop' | 'Mobile' | 'Tablet' | string;
  deviceIcon: string;
  os: string;
  osIcon?: string;
  ip: string;
  location?: string;
  city?: string;
  country?: string;
  loginTime: string;
  logoutTime?: string;
  lastActive?: string;
  status: 'Online' | 'Offline' | 'Failed';
  userAgent?: string;
}

@Injectable({
  providedIn: 'root'
})
export class LoginHistoryService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/login-history`;
  private authHistoryUrl = `${environment.apiUrl}/auth/login-history`;
  private STORAGE_KEY = 'crm_login_history';

  private historySubject = new BehaviorSubject<LoginHistoryItem[]>(this.getStoredLoginHistory());
  public loginHistory$ = this.historySubject.asObservable();

  public getStoredLoginHistory(): LoginHistoryItem[] {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(this.STORAGE_KEY);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) {
            return parsed;
          }
        } catch (e) {
          console.error('Error parsing stored login history', e);
        }
      }
    }
    return [
      {
        id: 'LH-101',
        userName: 'Toufique Rajwani',
        email: 'rajwanitoufique@gmail.com',
        role: 'Super Admin',
        browser: 'Chrome 128.0',
        browserIcon: 'fab fa-chrome',
        device: 'Desktop',
        deviceIcon: 'fas fa-desktop',
        os: 'Windows 11',
        osIcon: 'fab fa-windows',
        ip: '157.10.26.5:15357',
        location: 'Mumbai, India',
        city: 'Mumbai',
        country: 'India',
        loginTime: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
        lastActive: 'Just now',
        status: 'Online',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36'
      },
      {
        id: 'LH-102',
        userName: 'Afsana Khatun',
        email: 'afsana@propertynerds.in',
        role: 'Sales Manager',
        browser: 'Chrome Mobile 127.0',
        browserIcon: 'fab fa-chrome',
        device: 'Mobile',
        deviceIcon: 'fas fa-mobile-alt',
        os: 'Android 14',
        osIcon: 'fab fa-android',
        ip: '49.36.46.154:49850',
        location: 'Pune, India',
        city: 'Pune',
        country: 'India',
        loginTime: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
        lastActive: '12 mins ago',
        status: 'Online',
        userAgent: 'Mozilla/5.0 (Linux; Android 14; SM-S918B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/127.0.6533.103 Mobile Safari/537.36'
      },
      {
        id: 'LH-103',
        userName: 'Sneha Kamble',
        email: 'sneha.k@vaultstone.in',
        role: 'CRM Executive',
        browser: 'Microsoft Edge 126.0',
        browserIcon: 'fab fa-edge',
        device: 'Desktop',
        deviceIcon: 'fas fa-desktop',
        os: 'Windows 10',
        osIcon: 'fab fa-windows',
        ip: '49.36.46.154:53102',
        location: 'Pune, India',
        city: 'Pune',
        country: 'India',
        loginTime: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
        logoutTime: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
        lastActive: '1 hour ago',
        status: 'Offline',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36 Edg/126.0.0.0'
      },
      {
        id: 'LH-104',
        userName: 'Navin Tolani',
        email: 'navin@propertynerds.in',
        role: 'Branch Manager',
        browser: 'Firefox 129.0',
        browserIcon: 'fab fa-firefox-browser',
        device: 'Desktop',
        deviceIcon: 'fas fa-laptop',
        os: 'Windows 11',
        osIcon: 'fab fa-windows',
        ip: '49.36.44.129:51088',
        location: 'Nagpur, India',
        city: 'Nagpur',
        country: 'India',
        loginTime: new Date(Date.now() - 18 * 60 * 60 * 1000).toISOString(),
        logoutTime: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
        lastActive: 'Yesterday',
        status: 'Offline',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:129.0) Gecko/20100101 Firefox/129.0'
      },
      {
        id: 'LH-105',
        userName: 'Rahul Sharma',
        email: 'rahul@crm.com',
        role: 'Sales Agent',
        browser: 'Safari Mobile 17.4',
        browserIcon: 'fab fa-safari',
        device: 'Mobile',
        deviceIcon: 'fas fa-mobile-alt',
        os: 'iOS 17.4',
        osIcon: 'fab fa-apple',
        ip: '103.21.126.11:42190',
        location: 'Delhi, India',
        city: 'Delhi',
        country: 'India',
        loginTime: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        logoutTime: new Date(Date.now() - 20 * 60 * 60 * 1000).toISOString(),
        lastActive: 'Yesterday',
        status: 'Offline',
        userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Mobile/15E148 Safari/604.1'
      },
      {
        id: 'LH-106',
        userName: 'Amit Singh',
        email: 'amit@crm.com',
        role: 'Sales Officer',
        browser: 'Chrome 128.0',
        browserIcon: 'fab fa-chrome',
        device: 'Tablet',
        deviceIcon: 'fas fa-tablet-alt',
        os: 'iPadOS 17.5',
        osIcon: 'fab fa-apple',
        ip: '182.73.242.9:38190',
        location: 'Bangalore, India',
        city: 'Bangalore',
        country: 'India',
        loginTime: new Date(Date.now() - 28 * 60 * 60 * 1000).toISOString(),
        logoutTime: new Date(Date.now() - 22 * 60 * 60 * 1000).toISOString(),
        lastActive: '2 days ago',
        status: 'Offline',
        userAgent: 'Mozilla/5.0 (iPad; CPU OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1'
      }
    ];
  }

  private saveStoredHistory(history: LoginHistoryItem[]): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(history));
    }
    this.historySubject.next(history);
  }

  /**
   * Fetch login history from backend API with fallback
   */
  getLoginHistory(query: { search?: string; device?: string; status?: string; page?: number; limit?: number } = {}): Observable<LoginHistoryItem[]> {
    return this.http.get<any>(this.apiUrl, { params: query as any }).pipe(
      catchError(() => {
        // Fallback to auth sub-route if main route isn't mapped
        return this.http.get<any>(this.authHistoryUrl, { params: query as any });
      }),
      map(res => {
        const list = Array.isArray(res) ? res : (res?.data || res?.history || res?.logs || []);
        if (Array.isArray(list) && list.length > 0) {
          const normalized = list.map(item => this.normalizeHistoryItem(item));
          return normalized;
        }
        return this.getStoredLoginHistory();
      }),
      tap(list => {
        if (Array.isArray(list) && list.length > 0) {
          this.saveStoredHistory(list);
        }
      }),
      catchError(err => {
        console.warn('Login history API not reachable, using local storage fallback:', err?.message || err);
        return of(this.getStoredLoginHistory());
      })
    );
  }

  /**
   * Record a new login event
   */
  recordLogin(user: any): Observable<any> {
    const clientInfo = this.detectClientEnvironment();

    const newRecord: LoginHistoryItem = {
      id: `LH-${Date.now()}`,
      userId: user?.id || user?._id,
      userName: user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.name || user.email : 'System User',
      email: user?.email || 'user@crm.com',
      role: user?.role || 'User',
      browser: clientInfo.browser,
      browserIcon: clientInfo.browserIcon,
      device: clientInfo.device,
      deviceIcon: clientInfo.deviceIcon,
      os: clientInfo.os,
      osIcon: clientInfo.osIcon,
      ip: clientInfo.ip,
      location: 'Current Location',
      loginTime: new Date().toISOString(),
      lastActive: 'Just now',
      status: 'Online',
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : ''
    };

    return this.http.post<any>(this.apiUrl, newRecord).pipe(
      catchError(() => {
        return this.http.post<any>(this.authHistoryUrl, newRecord);
      }),
      tap(res => {
        const item = res?.data || newRecord;
        const current = this.getStoredLoginHistory();
        this.saveStoredHistory([item, ...current]);
      }),
      catchError(err => {
        console.warn('Record login API error, saving locally:', err?.message || err);
        const current = this.getStoredLoginHistory();
        this.saveStoredHistory([newRecord, ...current]);
        return of({ success: true, data: newRecord });
      })
    );
  }

  /**
   * Terminate a user session
   */
  terminateSession(id: string | number): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/${id}/terminate`, {}).pipe(
      tap(() => {
        const current = this.getStoredLoginHistory();
        const updated = current.map(item => {
          if (String(item.id) === String(id) || String(item._id) === String(id)) {
            return { ...item, status: 'Offline' as const, logoutTime: new Date().toISOString(), lastActive: 'Terminated' };
          }
          return item;
        });
        this.saveStoredHistory(updated);
      }),
      catchError(() => {
        const current = this.getStoredLoginHistory();
        const updated = current.map(item => {
          if (String(item.id) === String(id) || String(item._id) === String(id)) {
            return { ...item, status: 'Offline' as const, logoutTime: new Date().toISOString(), lastActive: 'Terminated' };
          }
          return item;
        });
        this.saveStoredHistory(updated);
        return of({ success: true, message: 'Session terminated locally' });
      })
    );
  }

  /**
   * Delete a single history log entry
   */
  deleteLog(id: string | number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/${id}`).pipe(
      tap(() => {
        const current = this.getStoredLoginHistory();
        const updated = current.filter(item => String(item.id) !== String(id) && String(item._id) !== String(id));
        this.saveStoredHistory(updated);
      }),
      catchError(() => {
        const current = this.getStoredLoginHistory();
        const updated = current.filter(item => String(item.id) !== String(id) && String(item._id) !== String(id));
        this.saveStoredHistory(updated);
        return of({ success: true, message: 'Log deleted locally' });
      })
    );
  }

  /**
   * Clear all login history logs
   */
  clearAllLogs(): Observable<any> {
    return this.http.delete<any>(this.apiUrl).pipe(
      tap(() => {
        this.saveStoredHistory([]);
      }),
      catchError(() => {
        this.saveStoredHistory([]);
        return of({ success: true, message: 'All logs cleared' });
      })
    );
  }

  /**
   * Helper to normalize backend object to LoginHistoryItem
   */
  private normalizeHistoryItem(item: any): LoginHistoryItem {
    const rawDevice = item.device || 'Desktop';
    const rawBrowser = item.browser || 'Chrome';
    const rawOs = item.os || 'Windows';

    return {
      id: item.id || item._id || String(Date.now()),
      _id: item._id,
      userId: item.userId || item.user?._id || item.user?.id,
      userName: item.userName || (item.user ? `${item.user.firstName || ''} ${item.user.lastName || ''}`.trim() || item.user.name : item.name) || item.email?.split('@')[0] || 'User',
      email: item.email || item.user?.email || 'unknown@crm.com',
      role: item.role || item.user?.role || 'Agent',
      avatar: item.avatar || item.user?.avatar,
      browser: rawBrowser,
      browserIcon: item.browserIcon || this.getBrowserIcon(rawBrowser),
      device: rawDevice,
      deviceIcon: item.deviceIcon || this.getDeviceIcon(rawDevice),
      os: rawOs,
      osIcon: item.osIcon || this.getOsIcon(rawOs),
      ip: item.ip || item.ipAddress || '127.0.0.1',
      location: item.location || (item.city ? `${item.city}, ${item.country || 'India'}` : 'India'),
      city: item.city || 'Mumbai',
      country: item.country || 'India',
      loginTime: item.loginTime || item.createdAt || new Date().toISOString(),
      logoutTime: item.logoutTime,
      lastActive: item.lastActive || (item.status === 'Online' ? 'Active now' : 'Earlier'),
      status: item.status || 'Offline',
      userAgent: item.userAgent || ''
    };
  }

  /**
   * Detect client browser, OS, device and IP
   */
  public detectClientEnvironment(): { browser: string; browserIcon: string; os: string; osIcon: string; device: 'Desktop' | 'Mobile' | 'Tablet'; deviceIcon: string; ip: string } {
    if (typeof window === 'undefined' || typeof navigator === 'undefined') {
      return {
        browser: 'Chrome 128.0',
        browserIcon: 'fab fa-chrome',
        os: 'Windows 11',
        osIcon: 'fab fa-windows',
        device: 'Desktop',
        deviceIcon: 'fas fa-desktop',
        ip: '157.10.26.5:15357'
      };
    }

    const ua = navigator.userAgent;

    // Detect Browser
    let browser = 'Chrome';
    let browserIcon = 'fab fa-chrome';
    if (ua.indexOf('Firefox') > -1) {
      browser = 'Firefox';
      browserIcon = 'fab fa-firefox-browser';
    } else if (ua.indexOf('Edg') > -1) {
      browser = 'Edge';
      browserIcon = 'fab fa-edge';
    } else if (ua.indexOf('Safari') > -1 && ua.indexOf('Chrome') === -1) {
      browser = 'Safari';
      browserIcon = 'fab fa-safari';
    } else if (ua.indexOf('Opera') > -1 || ua.indexOf('OPR') > -1) {
      browser = 'Opera';
      browserIcon = 'fab fa-opera';
    }

    // Detect OS
    let os = 'Windows';
    let osIcon = 'fab fa-windows';
    if (ua.indexOf('Win') > -1) {
      os = 'Windows 11';
      osIcon = 'fab fa-windows';
    } else if (ua.indexOf('Mac') > -1) {
      os = ua.indexOf('iPad') > -1 ? 'iPadOS' : 'macOS';
      osIcon = 'fab fa-apple';
    } else if (ua.indexOf('Android') > -1) {
      os = 'Android';
      osIcon = 'fab fa-android';
    } else if (ua.indexOf('iPhone') > -1 || ua.indexOf('iPad') > -1) {
      os = 'iOS';
      osIcon = 'fab fa-apple';
    } else if (ua.indexOf('Linux') > -1) {
      os = 'Linux';
      osIcon = 'fab fa-linux';
    }

    // Detect Device Category
    let device: 'Desktop' | 'Mobile' | 'Tablet' = 'Desktop';
    let deviceIcon = 'fas fa-desktop';
    if (/tablet|ipad|playbook|silk/i.test(ua)) {
      device = 'Tablet';
      deviceIcon = 'fas fa-tablet-alt';
    } else if (/Mobile|Android|iP(hone|od)|IEMobile|BlackBerry|Kindle|NetFront|Silk-Accelerated/i.test(ua)) {
      device = 'Mobile';
      deviceIcon = 'fas fa-mobile-alt';
    }

    // Local IP address / port placeholder or random realistic port
    const randomPort = Math.floor(10000 + Math.random() * 50000);
    const ip = `157.10.26.5:${randomPort}`;

    return { browser, browserIcon, os, osIcon, device, deviceIcon, ip };
  }

  public getBrowserIcon(browserName: string): string {
    const b = (browserName || '').toLowerCase();
    if (b.includes('chrome')) return 'fab fa-chrome';
    if (b.includes('firefox')) return 'fab fa-firefox-browser';
    if (b.includes('edge')) return 'fab fa-edge';
    if (b.includes('safari')) return 'fab fa-safari';
    if (b.includes('opera') || b.includes('opr')) return 'fab fa-opera';
    return 'fas fa-globe';
  }

  public getDeviceIcon(deviceName: string): string {
    const d = (deviceName || '').toLowerCase();
    if (d.includes('mobile') || d.includes('phone')) return 'fas fa-mobile-alt';
    if (d.includes('tablet') || d.includes('ipad')) return 'fas fa-tablet-alt';
    if (d.includes('laptop')) return 'fas fa-laptop';
    return 'fas fa-desktop';
  }

  public getOsIcon(osName: string): string {
    const o = (osName || '').toLowerCase();
    if (o.includes('win')) return 'fab fa-windows';
    if (o.includes('mac') || o.includes('apple') || o.includes('ios') || o.includes('ipad')) return 'fab fa-apple';
    if (o.includes('android')) return 'fab fa-android';
    if (o.includes('linux')) return 'fab fa-linux';
    return 'fas fa-desktop';
  }
}
