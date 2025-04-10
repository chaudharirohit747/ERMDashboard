import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, BehaviorSubject, throwError } from 'rxjs';
import { map, tap, catchError } from 'rxjs/operators';
import { environment } from '@env/environment';

export interface Department {
  _id?: string;
  name: string;
  description: string;
  head: string;
  employeeCount: number;
  budget: number;
  location: string;
}

const API_URL = `${environment.apiUrl}/departments`;

@Injectable({
  providedIn: 'root'
})
export class DepartmentService {
  private departments$ = new BehaviorSubject<Department[]>([]);

  constructor(private http: HttpClient) {
    this.loadDepartments();
  }

  private handleError(error: HttpErrorResponse) {
    let errorMessage = 'An error occurred';
    if (error.error instanceof ErrorEvent) {
      // Client-side error
      errorMessage = error.error.message;
    } else {
      // Server-side error
      errorMessage = error.error?.message || `Error Code: ${error.status}\nMessage: ${error.message}`;
    }
    return throwError(() => new Error(errorMessage));
  }

  getDepartments(): Observable<Department[]> {
    return this.http.get<Department[]>(API_URL).pipe(
      tap(departments => this.departments$.next(departments)),
      catchError(this.handleError)
    );
  }

  getDepartmentById(id: string): Observable<Department> {
    return this.http.get<Department>(`${API_URL}/${id}`).pipe(
      catchError(this.handleError)
    );
  }

  addDepartment(department: Omit<Department, 'id'>): Observable<Department> {
    return this.http.post<Department>(API_URL, department).pipe(
      tap(newDept => {
        const currentDepts = this.departments$.value;
        this.departments$.next([...currentDepts, newDept]);
      }),
      catchError(this.handleError)
    );
  }

  updateDepartment(_id: string, department: Partial<Department>): Observable<Department> {
    // Don't send the id in the payload
    const { _id: _, ...updateData } = department;
    return this.http.put<Department>(`${API_URL}/${_id}`, updateData).pipe(
      tap(updatedDept => {
        const currentDepts = this.departments$.value;
        const updatedDepts = currentDepts.map(dept => 
          dept._id === _id ? { ...dept, ...updatedDept } : dept
        );
        this.departments$.next(updatedDepts);
      }),
      catchError(this.handleError)
    );
  }

  deleteDepartment(_id: string): Observable<void> {
    return this.http.delete<void>(`${API_URL}/${_id}`).pipe(
      tap(() => {
        const currentDepts = this.departments$.value;
        this.departments$.next(currentDepts.filter(dept => dept._id !== _id));
      }),
      catchError(this.handleError)
    );
  }

  private loadDepartments(): void {
    this.getDepartments().subscribe({
      next: departments => this.departments$.next(departments),
      error: error => console.error('Error loading departments:', error)
    });
  }
}
