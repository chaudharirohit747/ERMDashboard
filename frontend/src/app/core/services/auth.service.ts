import { Injectable } from '@angular/core';
import { Observable, BehaviorSubject, of, throwError } from 'rxjs';
import { map, tap, delay } from 'rxjs/operators';

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'employee';
  phone?: string;
}

const USERS_KEY = 'users';
const CURRENT_USER_KEY = 'current_user';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private currentUserSubject = new BehaviorSubject<User | null>(this.loadCurrentUser());
  currentUser$ = this.currentUserSubject.asObservable();

  private users$ = new BehaviorSubject<User[]>(this.loadUsers());

  constructor() {
    // Initialize with admin user if no users exist
    if (this.users$.value.length === 0) {
      const adminUser: User = {
        id: '1',
        email: 'admin@gmail.com',
        name: 'Admin User',
        role: 'admin'
      };
      this.users$.next([adminUser]);
      this.saveUsers();
    }

    // Ensure current user is loaded
    const currentUser = this.loadCurrentUser();
    if (currentUser) {
      // Update user data from users list to ensure all fields are present
      const updatedUser = this.users$.value.find(u => u.id === currentUser.id);
      if (updatedUser) {
        this.currentUserSubject.next(updatedUser);
        this.saveCurrentUser(updatedUser);
      }
    }
  }

  private loadUsers(): User[] {
    const users = localStorage.getItem(USERS_KEY);
    return users ? JSON.parse(users) : [];
  }

  private saveUsers(): void {
    localStorage.setItem(USERS_KEY, JSON.stringify(this.users$.value));
  }

  private loadCurrentUser(): User | null {
    const user = localStorage.getItem(CURRENT_USER_KEY);
    return user ? JSON.parse(user) : null;
  }

  private saveCurrentUser(user: User | null): void {
    if (user) {
      localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(CURRENT_USER_KEY);
    }
    this.currentUserSubject.next(user);
  }

  register(userData: { email: string; name: string; password: string }): Observable<User> {
    // Check if user already exists
    const existingUser = this.users$.value.find(u => u.email === userData.email);
    if (existingUser) {
      return throwError(() => new Error('User with this email already exists'));
    }

    // Create new user with name from registration
    const newUser: User = {
      id: Date.now().toString(),
      email: userData.email,
      name: userData.name || this.generateNameFromEmail(userData.email), // Fallback to email name if no name provided
      role: 'employee'
    };

    const users = [...this.users$.value, newUser];
    this.users$.next(users);
    this.saveUsers();

    return of(newUser).pipe(
      tap(user => {
        this.currentUserSubject.next(user);
        this.saveCurrentUser(user);
      })
    );
  }

  private generateNameFromEmail(email: string): string {
    const name = email.split('@')[0];
    return name.split(/[._-]/).map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  }

  login(email: string, password: string): Observable<User> {
    return of(this.users$.value).pipe(
      map(users => {
        const user = users.find(u => u.email === email);
        if (!user) {
          throw new Error('User not found');
        }
        // Ensure user has all required fields
        if (!user.name) {
          user.name = this.generateNameFromEmail(user.email);
          // Update user in users list
          const updatedUsers = this.users$.value.map(u => 
            u.id === user.id ? user : u
          );
          this.users$.next(updatedUsers);
          this.saveUsers();
        }
        return user;
      }),
      tap(user => {
        this.currentUserSubject.next(user);
        this.saveCurrentUser(user);
      })
    );
  }

  logout(): void {
    this.currentUserSubject.next(null);
    this.saveCurrentUser(null);
  }

  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }

  getCurrentUserId(): string | null {
    return this.currentUserSubject.value?.id || null;
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

    const updatedUser = { ...currentUser, ...userData };
    const users = this.users$.value.map(u => 
      u.id === updatedUser.id ? updatedUser : u
    );

    this.users$.next(users);
    this.currentUserSubject.next(updatedUser);
    this.saveUsers();
    this.saveCurrentUser(updatedUser);

    return of(updatedUser);
  }

  getUsers(): Observable<User[]> {
    return this.users$.asObservable();
  }
}
