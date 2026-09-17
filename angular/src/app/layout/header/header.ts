import { Component, EventEmitter, Output, inject, HostListener, ElementRef, ViewChild, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../pages/auth/auth.service';
import { PermissionService } from '../../pages/control-panel/services/permission.service';
import { NotificationService } from '../../services/notification.service';
import { GpsTrackingService } from '../../services/gps-tracking.service';
import { GpsPunchModal } from '../../pages/attendance/gps-punch-modal/gps-punch-modal';
import { GlobalSearchService, SearchResultItem } from '../../services/global-search.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, GpsPunchModal],
  templateUrl: './header.html',
  styleUrls: ['./header.css']
})
export class Header implements OnInit {
  private authService = inject(AuthService);
  public permissionService = inject(PermissionService);
  public notificationService = inject(NotificationService);
  public gpsTrackingService = inject(GpsTrackingService);
  public globalSearchService = inject(GlobalSearchService);
  private elementRef = inject(ElementRef);

  userName = '';
  searchQuery = '';
  isSearchDropdownOpen = false;
  isSearchFocused = false;
  selectedIndex = -1;

  searchResults = {
    navigation: [] as SearchResultItem[],
    leads: [] as SearchResultItem[],
    contacts: [] as SearchResultItem[],
    opportunities: [] as SearchResultItem[],
    properties: [] as SearchResultItem[],
    projects: [] as SearchResultItem[],
    suggestions: [] as string[],
    totalCount: 0
  };

  @ViewChild('searchInput') searchInputRef!: ElementRef<HTMLInputElement>;

  openMenu: string | null = null;
openSubMenu: string | null = null;



// @HostListener('document:click')
// closeMenus() {
//   this.openMenu = null;
//   this.openSubMenu = null;
// }


  @HostListener('document:keydown', ['$event'])
  handleKeyboardShortcut(event: KeyboardEvent) {
    if ((event.ctrlKey || event.metaKey) && event.key === 'k') {
      event.preventDefault();
      this.focusSearchInput();
    } else if (event.key === '/' && document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA') {
      event.preventDefault();
      this.focusSearchInput();
    } else if (event.key === 'Escape' && this.isSearchDropdownOpen) {
      this.closeSearchDropdown();
    }
  }
@HostListener('document:click')
onDocumentClick() {
  this.openMenu = null;
  this.openSubMenu = null;
  this.isMenuOpen = false;
  this.isThemeMenuOpen = false;
}

  focusSearchInput(): void {
    if (this.searchInputRef) {
      this.searchInputRef.nativeElement.focus();
    }
    this.openSearchDropdown();
  }

  openSearchDropdown(): void {
    this.isSearchDropdownOpen = true;
    this.performSearch(this.searchQuery);
  }

  closeSearchDropdown(): void {
    this.isSearchDropdownOpen = false;
    this.selectedIndex = -1;
  }

  onSearchInput(query: string): void {
    this.searchQuery = query;
  }

  performSearch(query: string): void {
    // Dropdown suggestions disabled
  }

  clearSearch(): void {
    this.searchQuery = '';
    if (this.searchInputRef) {
      this.searchInputRef.nativeElement.focus();
    }
  }

  selectResult(item: SearchResultItem): void {
    this.globalSearchService.navigateToResult(item);
  }

  onSearchSubmit(): void {
    if (this.searchQuery.trim()) {
      this.globalSearchService.executeKeywordSearch(this.searchQuery);
    }
  }

  onSuggestionClick(suggestion: string): void {
    const keyword = suggestion.replace('Search in ', '');
    this.searchQuery = keyword;
    this.onSearchSubmit();
  }

  ngOnInit() {
    if (typeof window !== 'undefined') {
      const storedUser = localStorage.getItem('vaultstone_user');
      if (storedUser) {
        try {
          const user = JSON.parse(storedUser);
          if (user.firstName || user.lastName) {
            this.userName = `${user.firstName || ''} ${user.lastName || ''}`.trim();
          } else if (user.name) {
            this.userName = user.name;
          }
        } catch (e) {
          console.error('Header: error parsing storedUser', e);
        }
      }
    }

    this.authService.currentUser$.subscribe(user => {
      if (user) {
        if (user.firstName || user.lastName) {
          this.userName = `${user.firstName || ''} ${user.lastName || ''}`.trim();
        } else if (user.name) {
          this.userName = user.name;
        }
      }
    });
  }

  isSidebarOpen = false;
  isMobileMenuOpen = false;
  isNotificationOpen = false;
  isGpsModalOpen = false;

  openGpsModal(): void {
    this.isGpsModalOpen = true;
  }

  closeGpsModal(): void {
    this.isGpsModalOpen = false;
  }

  toggleNotifications(): void {
    this.isNotificationOpen = !this.isNotificationOpen;
  }

  markAllRead(): void {
    this.notificationService.markAllAsRead();
  }

  clearAllNotifs(): void {
    this.notificationService.clearAll();
  }

  onHamburgerClick() {
    this.isSidebarOpen = true;
  }

  closeSidebar() {
    this.isSidebarOpen = false;
  }

  toggleMobileMenu(event: Event) {
    event.stopPropagation();
    this.isMobileMenuOpen = !this.isMobileMenuOpen;
  }

  @Output() toggleSidebar = new EventEmitter<void>();

  onToggleSidebar() {
    console.log('Header Clicked');
    this.toggleSidebar.emit();
  }

  onLogout() {
    this.authService.logout();
  }

  isThemeMenuOpen: boolean = false;

  onThemeButtonClick() {
    this.isThemeMenuOpen = !this.isThemeMenuOpen;
  }

  changeWebsiteTheme(themeName: string) {
    document.body.classList.remove(
      'theme-red',
      'theme-blue',
      'theme-green'
    );
    document.body.classList.add(`theme-${themeName}`);
    localStorage.setItem('theme', themeName);
    this.isThemeMenuOpen = false;
  }

  isDashboardOpen = false;

  toggleDashboardMenu(): void {
    this.isDashboardOpen = !this.isDashboardOpen;
  }

  menuItems = [
    {
      title: 'Dashboard',
      icon: 'fas fa-chart-bar',
      open: false,
      children: [
        { title: 'To do list', route: '/todo-list' }
      ]
    },
    {
      title: 'Data Management',
      isHeading: true
    },
    {
      title: 'Contacts',
      icon: 'fas fa-users',
      route: '/contacts'
    },
    {
      title: 'Prospects',
      icon: 'fas fa-user-plus',
      route: '/prospects',
      badge: 'New'
    },
    {
      title: 'Leads',
      icon: 'fas fa-bullseye',
      route: '/leads'
    },
    {
      title: 'Opportunities',
      icon: 'fas fa-briefcase',
      route: '/opportunities'
    },
    {
      title: 'Properties',
      icon: 'fas fa-home',
      open: false,
      children: [
        { title: 'All Properties', route: '/properties' },
        { title: 'Add Property', route: '/properties/add' }
      ]
    },
    {
      title: 'Projects',
      icon: 'fas fa-building',
      route: '/projects'
    },
    {
      title: 'Site Visits',
      icon: 'fas fa-map-marker-alt',
      route: '/site-visits',
      badge: 'New'
    },
    {
      title: 'Marketing & Campaign',
      isHeading: true
    },
    {
      title: 'Templates',
      icon: 'fas fa-file-alt',
      route: '/templates'
    },
    {
      title: 'Campaigns',
      icon: 'fas fa-bullhorn',
      route: '/campaigns'
    },
    {
      title: 'Office Operations',
      isHeading: true
    },
    {
      title: 'Agreements',
      icon: 'fas fa-file-signature',
      route: '/agreements'
    },
    {
      title: 'Documents',
      icon: 'fas fa-folder',
      route: '/documents'
    },
    {
      title: 'Reports',
      icon: 'fas fa-chart-line',
      route: '/reports'
    },
    {
      title: 'Attendance & Tracking',
      icon: 'fas fa-user-clock',
      route: '/attendance'
    },
    {
      title: 'Communication',
      isHeading: true
    },
    {
      title: 'Mailbox',
      icon: 'fas fa-envelope',
      route: '/mailbox'
    },
    {
      title: 'Messages',
      icon: 'fas fa-comments',
      route: '/messages'
    },
    {
      title: 'Control Panel',
      isHeading: true
    },
    {
      title: 'API Configurations',
      icon: 'fas fa-cogs',
      route: '/api-config'
    }
  ];

  toggleMenu(item: any) {
    item.open = !item.open;
  }

isMenuOpen = false;
mobileMenuOpen = false;


toggleMenu1() {
  this.isMenuOpen = !this.isMenuOpen;
  console.log(this.isMenuOpen);
}
logout() {
  console.log('Logout');
}

toggleDropdown(menu: string) {
  console.log('Clicked:', menu);

  if (this.openMenu === menu) {
    this.openMenu = null;
  } else {
    this.openMenu = menu;
  }

  console.log('Open Menu =', this.openMenu);
}

toggleSubMenu(menu: string) {
  this.openSubMenu =
    this.openSubMenu === menu ? null : menu;
}
}
