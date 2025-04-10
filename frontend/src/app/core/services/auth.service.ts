import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, throwError } from 'rxjs';
import { tap, map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

export interface User {
  _id: string;
  name: string;
  email: string;
  role: 'admin' | 'employee';
  phone?: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = `${environment.apiUrl}/users`;  // http://localhost:3002/api/users
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  currentUser$ = this.currentUserSubject.asObservable();

  constructor(private http: HttpClient) {
    // Try to load user from session storage on init
    const storedUser = sessionStorage.getItem('currentUser');
    if (storedUser) {
      this.currentUserSubject.next(JSON.parse(storedUser));
    }
  }

  private setCurrentUser(user: User | null): void {
    this.currentUserSubject.next(user);
    if (user) {
      sessionStorage.setItem('currentUser', JSON.stringify(user));
    } else {
      sessionStorage.removeItem('currentUser');
    }
  }

  register(userData: { email: string; name: string; password: string }): Observable<User> {
    const user = {
      email: userData.email,
      name: userData.name || this.generateNameFromEmail(userData.email),
      password: userData.password,
      role: 'employee'
    };

    return this.http.post<User>(`${this.apiUrl}/register`, user).pipe(
      tap(user => this.setCurrentUser(user))
    );
  }

  private generateNameFromEmail(email: string): string {
    const name = email.split('@')[0];
    return name.split(/[._-]/).map((word: string) => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  }

  login(email: string, password: string): Observable<User> {
    return this.http.post<{user: User; token: string}>(`${this.apiUrl}/login`, { email, password }).pipe(
      tap(response => {
        // Store the token
        sessionStorage.setItem('token', response.token);
        // Set the current user
        this.setCurrentUser(response.user);
      }),
      // Map to just return the user object
      map(response => response.user)
    );
  }

  logout(): void {
    this.http.post(`${this.apiUrl}/logout`, {}).subscribe(() => {
      this.setCurrentUser(null);
    });
  }

  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }

  getCurrentUserId(): string | null {
    return this.currentUserSubject.value?._id || null;
  }

  isLoggedIn(): boolean {
    return !!this.currentUserSubject.value;
  }

  isAdmin(): boolean {
    return this.currentUserSubject.value?.role === 'admin';
  }

  hasRole(role: string): boolean {
    return this.currentUserSubject.value?.role === role;
  }

  updateUserProfile(userData: Partial<User>): Observable<User> {
    const currentUser = this.getCurrentUser();
    if (!currentUser) {
      return throwError(() => new Error('No user logged in'));
    }

    return this.http.put<User>(`${this.apiUrl}/${currentUser._id}`, userData).pipe(
      tap(user => this.setCurrentUser(user))
    );
  }

  getUsers(): Observable<User[]> {
    return this.http.get<User[]>(this.apiUrl);
  }
}
