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
      data: department ? { ...department } : undefined
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        if (department?._id) {
          // For update, don't send the id in the payload
          const { _id, ...updateData } = result;
          // Only update if there are changes
          if (JSON.stringify(updateData) !== JSON.stringify(department)) {
            this.updateDepartment(department._id, updateData);
          }
        } else {
          this.addDepartment(result);
        }
      }
    });
  }

  addDepartment(department: Department): void {
    // Remove any undefined or null values
    const cleanDepartment = Object.fromEntries(
      Object.entries(department).filter(([_, v]) => v != null)
    ) as Department;

    this.departmentService.addDepartment(cleanDepartment).subscribe({
      next: () => {
        this.loadDepartments();
        this.snackBar.open('Department added successfully', 'Close', { duration: 3000 });
      },
      error: (error) => {
        console.error('Error adding department:', error);
        const errorMessage = error.error?.message || 'Error adding department';
        this.snackBar.open(errorMessage, 'Close', { duration: 3000 });
      }
    });
  }

  updateDepartment(id: string, department: Partial<Department>): void {
    // Remove any undefined or null values
    const cleanDepartment = Object.fromEntries(
      Object.entries(department).filter(([_, v]) => v != null)
    ) as Partial<Department>;

    this.departmentService.updateDepartment(id, cleanDepartment).subscribe({
      next: () => {
        this.loadDepartments();
        this.snackBar.open('Department updated successfully', 'Close', { duration: 3000 });
      },
      error: (error) => {
        console.error('Error updating department:', error);
        const errorMessage = error.error?.message || 'Error updating department';
        this.snackBar.open(errorMessage, 'Close', { duration: 3000 });
      }
    });
  }

  deleteDepartment(department: Department): void {
    if (!department._id) {
      this.snackBar.open('Cannot delete department: Invalid ID', 'Close', { duration: 3000 });
      return;
    }

    if (confirm('Are you sure you want to delete this department?')) {
      this.departmentService.deleteDepartment(department._id).subscribe({
        next: () => {
          this.loadDepartments();
          this.snackBar.open('Department deleted successfully', 'Close', { duration: 3000 });
        },
        error: (error) => {
          console.error('Error deleting department:', error);
          this.snackBar.open(error.error?.message || 'Error deleting department', 'Close', { duration: 3000 });
        }
      });
    }
  }
}
