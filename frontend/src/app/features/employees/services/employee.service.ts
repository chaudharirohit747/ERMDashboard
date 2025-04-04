import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { map, tap, delay } from 'rxjs/operators';

export interface Employee {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  departmentId: number;
  position: string;
  hireDate: Date;
  salary: number;
}

const STORAGE_KEY = 'employees';

@Injectable({
  providedIn: 'root'
})
export class EmployeeService {
  private employees$ = new BehaviorSubject<Employee[]>(this.loadEmployees());

  constructor() {
    // Initialize with sample data if empty
    if (this.employees$.value.length === 0) {
      this.employees$.next([
        {
          id: 1,
          firstName: 'John',
          lastName: 'Doe',
          email: 'john.doe@example.com',
          phone: '123-456-7890',
          departmentId: 1,
          position: 'Software Engineer',
          hireDate: new Date('2023-01-15'),
          salary: 85000
        }
      ]);
      this.saveEmployees();
    }
  }

  getEmployees(): Observable<Employee[]> {
    return this.employees$.asObservable();
  }

  getEmployeeById(id: number): Observable<Employee | undefined> {
    return this.employees$.pipe(
      map(employees => employees.find(emp => emp.id === id))
    );
  }

  addEmployee(employee: Omit<Employee, 'id'>): Observable<Employee> {
    return of(employee).pipe(
      delay(500), // Simulate API delay
      map(emp => ({
        ...emp,
        id: this.getNextId()
      })),
      tap(newEmp => {
        const currentEmps = this.employees$.value;
        this.employees$.next([...currentEmps, newEmp]);
        this.saveEmployees();
      })
    );
  }

  updateEmployee(id: number, employee: Partial<Employee>): Observable<Employee> {
    return of(employee).pipe(
      delay(500), // Simulate API delay
      map(updates => {
        const currentEmps = this.employees$.value;
        const updatedEmps = currentEmps.map(emp => 
          emp.id === id ? { ...emp, ...updates } : emp
        );
        this.employees$.next(updatedEmps);
        this.saveEmployees();
        return updatedEmps.find(emp => emp.id === id)!;
      })
    );
  }

  deleteEmployee(id: number): Observable<void> {
    return of(void 0).pipe(
      delay(500), // Simulate API delay
      tap(() => {
        const currentEmps = this.employees$.value;
        this.employees$.next(currentEmps.filter(emp => emp.id !== id));
        this.saveEmployees();
      })
    );
  }

  private getNextId(): number {
    const employees = this.employees$.value;
    return employees.length ? Math.max(...employees.map(e => e.id)) + 1 : 1;
  }

  private loadEmployees(): Employee[] {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const employees = JSON.parse(stored);
      // Convert string dates back to Date objects
      return employees.map((emp: any) => ({
        ...emp,
        hireDate: new Date(emp.hireDate)
      }));
    }
    return [];
  }

  private saveEmployees(): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(this.employees$.value));
  }
}
