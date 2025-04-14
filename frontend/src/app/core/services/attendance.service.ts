import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { AuthService } from './auth.service';

export interface Attendance {
  _id?: string;
  employeeId: string;
  employeeName: string;
  date: Date;
  checkIn: string;
  checkOut: string;
  status: 'present' | 'absent' | 'late' | 'half-day';
  notes?: string;
  workHours?: number;
}

@Injectable({
  providedIn: 'root'
})
export class AttendanceService {
  private apiUrl = `${environment.apiUrl}/attendance`;

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {}

  getAllAttendance(): Observable<Attendance[]> {
    return this.http.get<Attendance[]>(this.apiUrl);
  }

  getAttendanceById(id: string): Observable<Attendance> {
    if (!id) {
      return throwError(() => new Error('ID is required'));
    }
    return this.http.get<Attendance>(`${this.apiUrl}/${id}`);
  }

  createAttendance(attendance: Attendance): Observable<Attendance> {
    if (!attendance) {
      return throwError(() => new Error('Attendance data is required'));
    }
    return this.http.post<Attendance>(this.apiUrl, attendance);
  }

  updateAttendance(id: string, attendance: Attendance): Observable<Attendance> {
    if (!id || !attendance) {
      return throwError(() => new Error('ID and attendance data are required'));
    }
    return this.http.put<Attendance>(`${this.apiUrl}/${id}`, attendance);
  }

  deleteAttendance(id: string): Observable<void> {
    if (!id) {
      return throwError(() => new Error('ID is required'));
    }
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  checkIn(): Observable<Attendance> {
    const currentUser = this.authService.getCurrentUser();
    if (!currentUser?._id) {
      return throwError(() => new Error('User not authenticated'));
    }
    
    const attendance: Attendance = {
      employeeId: currentUser._id,
      employeeName: currentUser.name || 'Unknown',
      date: new Date(),
      checkIn: new Date().toLocaleTimeString(),
      checkOut: '',
      status: 'present'
    };
    
    return this.createAttendance(attendance);
  }

  checkOut(id: string): Observable<Attendance> {
    if (!id) {
      return throwError(() => new Error('ID is required'));
    }

    const checkOutTime = new Date().toLocaleTimeString();
    console.log('Checking out at:', checkOutTime);

    const updatedAttendance: Partial<Attendance> = {
      checkOut: checkOutTime
    };

    return this.http.put<Attendance>(`${this.apiUrl}/${id}`, updatedAttendance);
  }

  private parseTime(timeStr: string): Date | null {
    try {
      console.log('Parsing time string:', timeStr);
      const [time, period] = timeStr.split(' ');
      const [hours, minutes, seconds] = time.split(':').map(Number);
      
      const date = new Date();
      let hrs = hours;
      
      // Convert to 24-hour format
      if (period === 'PM' && hours !== 12) hrs += 12;
      if (period === 'AM' && hours === 12) hrs = 0;
      
      date.setHours(hrs, minutes, seconds);
      console.log('Parsed date:', date);
      return date;
    } catch (error) {
      console.error('Error parsing time:', error);
      return null;
    }
  }
}
