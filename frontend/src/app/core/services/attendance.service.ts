import { Injectable } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';
import { AuthService } from './auth.service';

export interface Attendance {
  id: string;
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
  private parseTime(timeStr: string): Date | null {
    try {
      const today = new Date();
      const [time, period] = timeStr.split(' ');
      let [hours, minutes, seconds] = time.split(':').map(Number);
      
      // Convert to 24-hour format if PM
      if (period === 'PM' && hours !== 12) hours += 12;
      if (period === 'AM' && hours === 12) hours = 0;
      
      return new Date(today.getFullYear(), today.getMonth(), today.getDate(), hours, minutes, seconds);
    } catch (error) {
      console.error('Error parsing time:', error);
      return null;
    }
  }
  private readonly STORAGE_KEY = 'attendance_records';
  private attendanceRecords: Attendance[] = [];
  private employees = [
    // Assuming you have a list of employees, replace this with your actual data
    { id: '1', name: 'John Doe' },
    { id: '2', name: 'Jane Doe' },
  ];

  constructor(private authService: AuthService) {
    this.loadFromStorage();
  }

  private loadFromStorage(): void {
    const storedData = localStorage.getItem(this.STORAGE_KEY);
    if (storedData) {
      this.attendanceRecords = JSON.parse(storedData).map((record: any) => ({
        ...record,
        date: new Date(record.date)
      }));
    }
  }

  private saveToStorage(): void {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.attendanceRecords));
  }

  getAllAttendanceRecords(): Observable<Attendance[]> {
    // Sort records by date in descending order and limit to last 15 days
    const sortedRecords = [...this.attendanceRecords]
      .map(record => ({ ...record, date: new Date(record.date) }))
      .sort((a, b) => b.date.getTime() - a.date.getTime())
      .filter((_, index) => index < 15);
    return of(sortedRecords);
  }

  getUserAttendanceRecords(userId: string): Observable<Attendance[]> {
    const currentUser = this.authService.getCurrentUser();
    const isAdmin = currentUser?.role === 'admin';

    let records = this.attendanceRecords;
    
    // If not admin, only show user's own records
    if (!isAdmin) {
      records = records.filter(record => record.employeeId === userId);
    }

    // Sort by date (newest first) and convert dates
    records = records
      .map(record => ({
        ...record,
        date: new Date(record.date)
      }))
      .sort((a, b) => b.date.getTime() - a.date.getTime());

    return of(records);
  }

  createAttendance(attendance: Attendance): Observable<Attendance> {
    // Ensure we have a proper date object
    attendance.date = new Date(attendance.date);
    
    // Add the record
    this.attendanceRecords.push(attendance);
    this.saveToStorage();
    return of(attendance);
  }

  checkIn(): Observable<Attendance> {
    const currentUser = this.authService.getCurrentUser();
    if (!currentUser) {
      return throwError(() => new Error('User not found'));
    }

    // Check if user already has a check-in for today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const existingRecord = this.attendanceRecords.find(record => {
      const recordDate = new Date(record.date);
      recordDate.setHours(0, 0, 0, 0);
      return record.employeeId === currentUser.id && recordDate.getTime() === today.getTime();
    });

    if (existingRecord?.checkIn) {
      return throwError(() => new Error('Already checked in for today'));
    }

    const currentTime = new Date();
    const isLate = currentTime.getHours() >= 9 && currentTime.getMinutes() > 15;

    const newAttendance: Attendance = {
      id: Date.now().toString(),
      employeeId: currentUser.id,
      employeeName: currentUser.name,
      date: today,
      checkIn: currentTime.toLocaleTimeString(),
      checkOut: '',
      status: isLate ? 'late' : 'present'
    };

    this.attendanceRecords.push(newAttendance);
    this.saveToStorage();
    return of(newAttendance);
  }

  checkOut(id: string): Observable<void> {
    const record = this.attendanceRecords.find(r => r.id === id);
    if (!record) {
      return throwError(() => new Error('Record not found'));
    }

    if (record.checkOut) {
      return throwError(() => new Error('Already checked out'));
    }

    const now = new Date();
    record.checkOut = now.toLocaleTimeString();
    
    // Calculate working hours
    const checkInTime = this.parseTime(record.checkIn);
    const checkOutTime = this.parseTime(record.checkOut);
    
    if (checkInTime && checkOutTime) {
      const diffMs = checkOutTime.getTime() - checkInTime.getTime();
      record.workHours = Math.round((diffMs / (1000 * 60 * 60)) * 100) / 100; // Round to 2 decimals
    }

    this.saveToStorage();
    return of(void 0);
  }

  updateAttendance(id: string, updates: Partial<Attendance>): Observable<Attendance> {
    const index = this.attendanceRecords.findIndex(record => record.id === id);
    if (index === -1) {
      throw new Error('Attendance record not found');
    }

    const updatedRecord = {
      ...this.attendanceRecords[index],
      ...updates
    };

    this.attendanceRecords[index] = updatedRecord;
    this.saveToStorage();
    return of(updatedRecord);
  }
}
