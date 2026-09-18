import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  type: 'leave' | 'attendance' | 'task' | 'system' | 'info';
  status: 'unread' | 'read';
  createdAt: string;
  recipientId?: string;
  recipientName?: string;
  link?: string;
}

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private STORAGE_KEY = 'crm_notifications';

  private initialNotifications: AppNotification[] = [
    {
      id: 'NOTIF_001',
      title: 'Leave System Ready',
      message: 'Leave management system with real-time API sync and notifications is active.',
      type: 'leave',
      status: 'unread',
      createdAt: new Date().toISOString()
    }
  ];

  private notificationsSubject = new BehaviorSubject<AppNotification[]>(this.loadStoredNotifications());
  public notifications$: Observable<AppNotification[]> = this.notificationsSubject.asObservable();

  private unreadCountSubject = new BehaviorSubject<number>(this.calculateUnreadCount(this.notificationsSubject.value));
  public unreadCount$: Observable<number> = this.unreadCountSubject.asObservable();

  constructor() {}

  private loadStoredNotifications(): AppNotification[] {
    const saved = localStorage.getItem(this.STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed;
        }
      } catch (e) {
        console.error('Failed to parse stored notifications:', e);
      }
    }
    return this.initialNotifications;
  }

  private saveNotifications(notifications: AppNotification[]): void {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(notifications));
    this.notificationsSubject.next(notifications);
    this.unreadCountSubject.next(this.calculateUnreadCount(notifications));
  }

  private calculateUnreadCount(notifications: AppNotification[]): number {
    return notifications.filter(n => n.status === 'unread').length;
  }

  public getNotifications(): AppNotification[] {
    return this.notificationsSubject.value;
  }

  public addNotification(notification: Omit<AppNotification, 'id' | 'createdAt' | 'status'>): AppNotification {
    const newNotif: AppNotification = {
      ...notification,
      id: `NOTIF_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      status: 'unread',
      createdAt: new Date().toISOString()
    };

    const current = this.loadStoredNotifications();
    const updated = [newNotif, ...current];
    this.saveNotifications(updated);
    return newNotif;
  }

  public markAsRead(id: string): void {
    const current = this.loadStoredNotifications();
    const updated = current.map(n => n.id === id ? { ...n, status: 'read' as const } : n);
    this.saveNotifications(updated);
  }

  public markAllAsRead(): void {
    const current = this.loadStoredNotifications();
    const updated = current.map(n => ({ ...n, status: 'read' as const }));
    this.saveNotifications(updated);
  }

  public deleteNotification(id: string): void {
    const current = this.loadStoredNotifications();
    const updated = current.filter(n => n.id !== id);
    this.saveNotifications(updated);
  }

  public clearAll(): void {
    this.saveNotifications([]);
  }
}
