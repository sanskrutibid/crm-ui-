import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-active-sessions',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule
  ],
  templateUrl: './active-sessions.html',
  styleUrls: ['./active-sessions.css']
})
export class ActiveSessions {

  searchText = '';

  deviceFilter = 'All';

  sessions = [

    {
      id: 1,
      user: 'Administrator',
      role: 'Super Admin',
      device: 'Desktop',
      deviceIcon: 'fas fa-desktop',
      ip: '157.10.26.5',
      loginTime: '24 Jul 2026 3:01 PM',
      lastActivity: '2 sec ago',
      status: 'Online'
    },

    {
      id: 2,
      user: 'Afsana Khatun',
      role: 'Sales Manager',
      device: 'Mobile',
      deviceIcon: 'fas fa-mobile-alt',
      ip: '49.36.46.154',
      loginTime: '24 Jul 2026 10:37 AM',
      lastActivity: '1 min ago',
      status: 'Online'
    },

    {
      id: 3,
      user: 'Sneha Kamble',
      role: 'Executive',
      device: 'Desktop',
      deviceIcon: 'fas fa-desktop',
      ip: '49.36.46.154',
      loginTime: '23 Jul 2026 11:55 AM',
      lastActivity: '5 min ago',
      status: 'Idle'
    },

    {
      id: 4,
      user: 'Navin Tolani',
      role: 'Manager',
      device: 'Tablet',
      deviceIcon: 'fas fa-tablet-alt',
      ip: '49.36.44.129',
      loginTime: '23 Jul 2026 10:58 AM',
      lastActivity: '1 hour ago',
      status: 'Offline'
    }

  ];

  // =============================

  get desktopCount() {
    return this.sessions.filter(x => x.device === 'Desktop').length;
  }

  get mobileCount() {
    return this.sessions.filter(x => x.device === 'Mobile').length;
  }

  get onlineCount() {
    return this.sessions.filter(x => x.status === 'Online').length;
  }

  // =============================

  filteredSessions() {

    return this.sessions.filter(session => {

      const searchMatch =
        session.user.toLowerCase().includes(this.searchText.toLowerCase());

      const deviceMatch =
        this.deviceFilter === 'All' ||
        session.device === this.deviceFilter;

      return searchMatch && deviceMatch;

    });

  }

  // =============================

  signOut(session: any) {

    if (confirm(`Sign out ${session.user}?`)) {

      this.sessions = this.sessions.filter(
        x => x.id !== session.id
      );

    }

  }

  // =============================

  refreshSessions() {

    alert('Session list refreshed.');

  }

}