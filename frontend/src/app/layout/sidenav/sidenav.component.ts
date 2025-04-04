import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '@app/core/services/auth.service';

interface MenuItem {
  label: string;
  route: string;
  icon: string;
  adminOnly?: boolean;
}

@Component({
  selector: 'app-sidenav',
  templateUrl: './sidenav.component.html',
  styleUrls: ['./sidenav.component.scss']
})
export class SidenavComponent implements OnInit {
  menuItems: MenuItem[] = [
    { label: 'Dashboard', route: '/dashboard', icon: 'dashboard' },
    { label: 'Employees', route: '/employees', icon: 'people', adminOnly: true },
    { label: 'Attendance', route: '/attendance', icon: 'event_available' },
    { label: 'Leave Management', route: '/leave-management', icon: 'event_busy' },
    { label: 'Departments', route: '/departments', icon: 'business', adminOnly: true },
    { label: 'Settings', route: '/settings', icon: 'settings', adminOnly: true }
  ];

  filteredMenuItems: MenuItem[] = [];

  isAdmin = false;

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.isAdmin = this.authService.isAdmin();
    this.filterMenuItems();
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  private filterMenuItems(): void {
    this.filteredMenuItems = this.menuItems.filter(item => !item.adminOnly || this.isAdmin);
  }
}
