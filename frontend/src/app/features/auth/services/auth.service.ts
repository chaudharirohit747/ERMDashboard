import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { tap } from 'rxjs/operators';

export interface User {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly TOKEN_KEY = 'auth_token';
  private readonly USER_KEY = 'user';
  private isAuthenticated = false;

  constructor() {
    this.isAuthenticated = !!localStorage.getItem(this.TOKEN_KEY);
  }

  login(email: string, password: string): Observable<User> {
    // Mock login - replace with actual API call
    const mockUser: User = {
      id: 1,
      email: email,
      firstName: 'John',
      lastName: 'Doe',
      role: 'admin'
    };
    const mockToken = 'mock-jwt-token';

    return of(mockUser).pipe(
      tap(() => {
        localStorage.setItem(this.TOKEN_KEY, mockToken);
        localStorage.setItem(this.USER_KEY, JSON.stringify(mockUser));
        this.isAuthenticated = true;
      })
    );
  }

  logout(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
    this.isAuthenticated = false;
  }

  isLoggedIn(): boolean {
    return this.isAuthenticated;
  }

  getUser(): User | null {
    const userStr = localStorage.getItem(this.USER_KEY);
    return userStr ? JSON.parse(userStr) : null;
  }

  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }
}
