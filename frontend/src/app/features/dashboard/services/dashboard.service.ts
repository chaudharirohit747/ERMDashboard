import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

export interface DashboardStats {
  totalEmployees: number;
  totalDepartments: number;
  newHires: number;
  pendingLeaves: number;
}

export interface ChartData {
  labels: string[];
  data: number[];
}

export interface Activity {
  type: string;
  message: string;
  time: string;
}

@Injectable({
  providedIn: 'root'
})
export class DashboardService {
  private apiUrl = `${environment.apiUrl}/dashboard`;

  constructor(private http: HttpClient) { }

  getDashboardStats(): Observable<DashboardStats> {
    return this.http.get<DashboardStats>(`${this.apiUrl}/stats`);
  }

  getEmployeeGrowth(): Observable<ChartData> {
    return this.http.get<ChartData>(`${this.apiUrl}/employee-growth`);
  }

  getDepartmentDistribution(): Observable<ChartData> {
    return this.http.get<ChartData>(`${this.apiUrl}/department-distribution`);
  }

  getRecentActivities(): Observable<Activity[]> {
    return this.http.get<Activity[]>(`${this.apiUrl}/recent-activities`);
  }
}
