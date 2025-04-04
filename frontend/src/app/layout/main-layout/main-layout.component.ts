import { Component, OnInit, ViewChild } from '@angular/core';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { Observable } from 'rxjs';
import { map, shareReplay } from 'rxjs/operators';
import { MatSidenav } from '@angular/material/sidenav';
import { AuthService, User } from '@core/services/auth.service';
import { Router } from '@angular/router';

interface MenuItem {
  label: string;
  route: string;
  icon: string;
}

@Component({
  selector: 'app-main-layout',
  templateUrl: './main-layout.component.html',
  styleUrls: ['./main-layout.component.scss']
})
export class MainLayoutComponent implements OnInit {
  @ViewChild('drawer') drawer!: MatSidenav;

  isHandset$: Observable<boolean> = this.breakpointObserver.observe(Breakpoints.Handset)
    .pipe(
      map(result => result.matches),
      shareReplay()
    );

  currentUser$: Observable<User | null>;
  menuItems: MenuItem[] = [
    { label: 'Dashboard', route: '/dashboard', icon: 'dashboard' },
    { label: 'Employees', route: '/employees', icon: 'people' },
    { label: 'Departments', route: '/departments', icon: 'business' },
    { label: 'Attendance', route: '/attendance', icon: 'schedule' },
    { label: 'Leave', route: '/leave', icon: 'event_busy' },
    { label: 'Reports', route: '/reports', icon: 'assessment' },
    { label: 'Settings', route: '/settings', icon: 'settings' }
  ];

  constructor(
    private breakpointObserver: BreakpointObserver,
    private authService: AuthService,
    private router: Router
  ) {
    this.currentUser$ = this.authService.currentUser$;
  }

  ngOnInit(): void {
    if (!this.isLoggedIn()) {
      this.router.navigate(['/auth/login']);
    }
  }

  isLoggedIn(): boolean {
    return this.authService.isLoggedIn();
  }

  isAdmin(): boolean {
    return this.authService.isAdmin();
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/auth/login']);
  }

  toggleSidenav(): void {
    this.drawer.toggle();
  }

  get userName(): string {
    const user = this.authService.getCurrentUser();
    return user ? user.name : 'Guest';
  }

  getCurrentPageTitle(): string {
    const currentRoute = this.router.url;
    const currentMenuItem = this.menuItems.find(item => currentRoute.startsWith(item.route));
    return currentMenuItem?.label || 'Dashboard';
  }
}
