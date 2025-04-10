import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, Subject } from 'rxjs';
import { map, shareReplay, takeUntil, filter } from 'rxjs/operators';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { AuthService, User } from './core/services/auth.service';
import { MatSidenav } from '@angular/material/sidenav';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit, OnDestroy {
  @ViewChild('sidenav') sidenav!: MatSidenav;
  
  isHandset$: Observable<boolean> = this.breakpointObserver.observe(Breakpoints.Handset)
    .pipe(
      map(result => result.matches),
      shareReplay()
    );

  title = 'ERM Dashboard';
  currentUser$: Observable<User | null>;
  private destroy$ = new Subject<void>();

  constructor(
    private breakpointObserver: BreakpointObserver,
    private authService: AuthService,
    private router: Router
  ) {
    this.currentUser$ = this.authService.currentUser$;
  }

  ngOnInit(): void {
    // Handle auth state changes
    this.authService.currentUser$
      .pipe(
        takeUntil(this.destroy$)
      )
      .subscribe((user: User | null) => {
        const currentUrl = this.router.url;

        // Only handle navigation if we're on the root path or need to redirect to login
        if (currentUrl === '/' || (!user && !currentUrl.startsWith('/auth'))) {
          if (!user) {
            // Only navigate to login if we're not already on an auth page
            if (!currentUrl.startsWith('/auth')) {
              this.router.navigate(['/auth/login']);
            }
          } else {
            // Navigate to appropriate dashboard only if we're on the root path
            if (currentUrl === '/') {
              if (user.role === 'admin') {
                // this.router.navigate(['/employees']);
                this.router.navigate(['/dashboard']);
              } else {
                this.router.navigate(['/dashboard']);
              }
            }
          }
        }
      });
  }

  isLoggedIn(): boolean {
    return this.authService.isLoggedIn();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/auth/login']);
  }
}
