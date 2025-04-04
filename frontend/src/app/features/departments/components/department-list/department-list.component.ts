import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { DepartmentService, Department } from '../../services/department.service';
import { DepartmentFormComponent } from '../department-form/department-form.component';

@Component({
  selector: 'app-department-list',
  templateUrl: './department-list.component.html',
  styleUrls: ['./department-list.component.scss']
})
export class DepartmentListComponent implements OnInit {
  departments: Department[] = [];
  displayedColumns: string[] = ['name', 'head', 'employeeCount', 'budget', 'location', 'actions'];
  isLoading = true;

  constructor(
    private departmentService: DepartmentService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.loadDepartments();
  }

  loadDepartments(): void {
    this.isLoading = true;
    this.departmentService.getDepartments().subscribe({
      next: (departments) => {
        this.departments = departments;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading departments:', error);
        this.snackBar.open('Error loading departments', 'Close', { duration: 3000 });
        this.isLoading = false;
      }
    });
  }

  openDepartmentForm(department?: Department): void {
    const dialogRef = this.dialog.open(DepartmentFormComponent, {
      width: '500px',
      data: department
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        if (department?.id) {
          this.updateDepartment(department.id, result);
        } else {
          this.addDepartment(result);
        }
      }
    });
  }

  addDepartment(department: Department): void {
    this.departmentService.addDepartment(department).subscribe({
      next: () => {
        this.loadDepartments();
        this.snackBar.open('Department added successfully', 'Close', { duration: 3000 });
      },
      error: (error) => {
        console.error('Error adding department:', error);
        this.snackBar.open('Error adding department', 'Close', { duration: 3000 });
      }
    });
  }

  updateDepartment(id: number, department: Department): void {
    this.departmentService.updateDepartment(id, department).subscribe({
      next: () => {
        this.loadDepartments();
        this.snackBar.open('Department updated successfully', 'Close', { duration: 3000 });
      },
      error: (error) => {
        console.error('Error updating department:', error);
        this.snackBar.open('Error updating department', 'Close', { duration: 3000 });
      }
    });
  }

  deleteDepartment(id: number): void {
    if (confirm('Are you sure you want to delete this department?')) {
      this.departmentService.deleteDepartment(id).subscribe({
        next: () => {
          this.loadDepartments();
          this.snackBar.open('Department deleted successfully', 'Close', { duration: 3000 });
        },
        error: (error) => {
          console.error('Error deleting department:', error);
          this.snackBar.open('Error deleting department', 'Close', { duration: 3000 });
        }
      });
    }
  }
}
