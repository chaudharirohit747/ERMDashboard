import { Injectable } from '@angular/core';
import { Observable, BehaviorSubject, of } from 'rxjs';
import { map, tap, delay } from 'rxjs/operators';

export interface Department {
  id: number;
  name: string;
  description: string;
  employeeCount: number;
  budget: number;
}

const STORAGE_KEY = 'departments';

@Injectable({
  providedIn: 'root'
})
export class DepartmentService {
  private departments$ = new BehaviorSubject<Department[]>(this.loadDepartments());

  constructor() {
    // Initialize with sample data if empty
    if (this.departments$.value.length === 0) {
      this.departments$.next([
        {
          id: 1,
          name: 'Engineering',
          description: 'Software development and engineering',
          employeeCount: 50,
          budget: 1000000
        },
        {
          id: 2,
          name: 'Marketing',
          description: 'Marketing and advertising',
          employeeCount: 20,
          budget: 500000
        }
      ]);
      this.saveDepartments();
    }
  }

  getDepartments(): Observable<Department[]> {
    return this.departments$.asObservable();
  }

  getDepartmentById(id: number): Observable<Department | undefined> {
    return this.departments$.pipe(
      map(departments => departments.find(dept => dept.id === id))
    );
  }

  addDepartment(department: Omit<Department, 'id'>): Observable<Department> {
    return of(department).pipe(
      delay(500), // Simulate API delay
      map(dept => ({
        ...dept,
        id: this.getNextId()
      })),
      tap(newDept => {
        const currentDepts = this.departments$.value;
        this.departments$.next([...currentDepts, newDept]);
        this.saveDepartments();
      })
    );
  }

  updateDepartment(id: number, department: Partial<Department>): Observable<Department> {
    return of(department).pipe(
      delay(500), // Simulate API delay
      map(updates => {
        const currentDepts = this.departments$.value;
        const updatedDepts = currentDepts.map(dept => 
          dept.id === id ? { ...dept, ...updates } : dept
        );
        this.departments$.next(updatedDepts);
        this.saveDepartments();
        return updatedDepts.find(dept => dept.id === id)!;
      })
    );
  }

  deleteDepartment(id: number): Observable<void> {
    return of(void 0).pipe(
      delay(500), // Simulate API delay
      tap(() => {
        const currentDepts = this.departments$.value;
        this.departments$.next(currentDepts.filter(dept => dept.id !== id));
        this.saveDepartments();
      })
    );
  }

  private getNextId(): number {
    const departments = this.departments$.value;
    return departments.length ? Math.max(...departments.map(d => d.id)) + 1 : 1;
  }

  private loadDepartments(): Department[] {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  }

  private saveDepartments(): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(this.departments$.value));
  }
}
