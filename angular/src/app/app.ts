import { Component, signal, inject, OnInit } from '@angular/core';
import { RouterOutlet, Router } from '@angular/router';
import { NgApexchartsModule } from "ng-apexcharts";
import { Header } from './layout/header/header';
import { AuthService } from './pages/auth/auth.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, NgApexchartsModule, Header],
  templateUrl: './app.html',
  styleUrl: './app.css',
  standalone: true,
})
export class App implements OnInit {
  protected readonly title = signal('crm-web');
  private router = inject(Router);
  private authService = inject(AuthService);


  isMenuOpen: boolean = false;
  isSidebarCollapsed: boolean = false;

  toggleSidebar() {
    this.isSidebarCollapsed = !this.isSidebarCollapsed;
    console.log('Sidebar Status:', this.isSidebarCollapsed);
  }

  isAuthPage(): boolean {
    const url = this.router.url;
    return url.includes('/login') || url.includes('/signup');
  }

  shouldShowSidebarAndHeader(): boolean {
    return this.authService.isAuthenticated() && !this.isAuthPage();
  }
  ngOnInit() {
    if (typeof window !== 'undefined') {
      const savedTheme = localStorage.getItem('theme');

      if (savedTheme) {
        document.body.classList.add(`theme-${savedTheme}`);
      }
    }
  }

  onThemeButtonClick() {
    this.isMenuOpen = !this.isMenuOpen;
  }

  // Theme apply karne wala function
  setTheme(themeName: string) {
    document.documentElement.setAttribute('data-theme', themeName);
    this.isMenuOpen = false; // Theme select hone ke baad menu band ho jaye
  }


}
