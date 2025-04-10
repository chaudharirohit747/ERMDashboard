import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { environment } from '@env/environment';

export interface Employee {
  _id?: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  departmentId: string;
  department?: string;  // For display purposes
  position: string;
  hireDate: Date;
  salary: number;
}

interface DepartmentPopulated {
  _id: string;
  name: string;
}

interface EmployeeResponse extends Omit<Employee, 'department' | 'departmentId'> {
  departmentId: string | DepartmentPopulated;
}

const API_URL = `${environment.apiUrl}/employees`;

@Injectable({
  providedIn: 'root'
})
export class EmployeeService {
  private employees$ = new BehaviorSubject<Employee[]>([]);

  constructor(private http: HttpClient) {
    // Load employees on initialization
    this.loadEmployees();
  }

  getEmployees(): Observable<Employee[]> {
    return this.http.get<EmployeeResponse[]>(API_URL).pipe(
      map(employees => employees.map(emp => ({
        ...emp,
        department: this.getDepartmentName(emp.departmentId),
        departmentId: this.getDepartmentId(emp.departmentId)
      }))),
      tap(employees => this.employees$.next(employees))
    );
  }

  private getDepartmentName(departmentId: string | DepartmentPopulated): string {
    if (typeof departmentId === 'string') return 'N/A';
    return departmentId.name || 'N/A';
  }

  private getDepartmentId(departmentId: string | DepartmentPopulated): string {
    if (typeof departmentId === 'string') return departmentId;
    return departmentId._id;
  }

  getEmployeeById(id: string): Observable<Employee | undefined> {
    return this.http.get<Employee>(`${API_URL}/${id}`);
  }

  addEmployee(employee: Omit<Employee, '_id'>): Observable<Employee> {
    return this.http.post<Employee>(API_URL, employee).pipe(
      tap(newEmp => {
        const currentEmps = this.employees$.value;
        this.employees$.next([...currentEmps, newEmp]);
      })
    );
  }

  updateEmployee(id: string, employee: Partial<Employee>): Observable<Employee> {
    return this.http.put<Employee>(`${API_URL}/${id}`, employee).pipe(
      tap(updatedEmp => {
        const currentEmps = this.employees$.value;
        const updatedEmps = currentEmps.map(emp => 
          emp._id === id ? updatedEmp : emp
        );
        this.employees$.next(updatedEmps);
      })
    );
  }

  deleteEmployee(id: string): Observable<void> {
    return this.http.delete<void>(`${API_URL}/${id}`).pipe(
      tap(() => {
        const currentEmps = this.employees$.value;
        this.employees$.next(currentEmps.filter(emp => emp._id !== id));
      })
    );
  }

  private loadEmployees(): void {
    this.http.get<EmployeeResponse[]>(API_URL).subscribe(
      employees => {
        // Convert string dates back to Date objects
        const processedEmployees = employees.map(emp => ({
          ...emp,
          hireDate: new Date(emp.hireDate),
          department: this.getDepartmentName(emp.departmentId),
          departmentId: this.getDepartmentId(emp.departmentId)
        }));
        this.employees$.next(processedEmployees);
      }
    );
  }
}
