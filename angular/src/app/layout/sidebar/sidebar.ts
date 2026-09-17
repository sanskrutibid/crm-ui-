import { Component, HostListener, Input, inject, OnInit } from '@angular/core';
import { RouterModule, RouterLinkActive, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../pages/auth/auth.service';
import { PermissionService } from '../../pages/control-panel/services/permission.service';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule, RouterLink, RouterLinkActive],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.css',
})
export class Sidebar implements OnInit {
  private authService = inject(AuthService);
  public permissionService = inject(PermissionService);
  currentUser$ = this.authService.currentUser$;

  agentName: string = 'Michael';
  agentRole: string = 'Agent';

  // Sidebar ki visible state control karne ke liye
  isSidebarOpen: boolean = false;

  @Input() collapsed = false;

  ngOnInit() {
    if (typeof window !== 'undefined') {
      const storedUser = localStorage.getItem('vaultstone_user');
      console.log('Sidebar: storedUser from localStorage =', storedUser);
      if (storedUser) {
        try {
          const user = JSON.parse(storedUser);
          console.log('Sidebar: parsed user =', user);
          this.agentName = user.firstName || user.name || 'Michael';
          this.agentRole = user.role || 'Agent';
        } catch (e) {
          console.error('Sidebar: error parsing storedUser', e);
          this.agentName = 'Michael';
          this.agentRole = 'Agent';
        }
      }
    }

    this.currentUser$.subscribe(user => {
      console.log('Sidebar: currentUser$ stream update =', user);
      if (user) {
        this.agentName = user.firstName || user.name || 'Michael';
        this.agentRole = user.role || 'Agent';
      }
    });
  }

  // Hamburger aur close actions ke liye helper functions
  toggleSidebar(): void {
    this.isSidebarOpen = !this.isSidebarOpen;
  }

  closeSidebar(): void {
    this.isSidebarOpen = false;
  }

  // Jab user mobile par navigation link click karega tab auto-close ho jayega
  @HostListener('window:resize')
  onResize() {
    if (window.innerWidth > 768) {
      this.isSidebarOpen = false; // Desktop screen sizes par helper clean rakhega
    }
  }
}