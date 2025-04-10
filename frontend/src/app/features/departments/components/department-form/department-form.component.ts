import { Component, Inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { Department } from '../../services/department.service';

@Component({
  selector: 'app-department-form',
  templateUrl: './department-form.component.html',
  styleUrls: ['./department-form.component.scss']
})
export class DepartmentFormComponent {
  form: FormGroup;
  isEdit: boolean;

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<DepartmentFormComponent>,
    @Inject(MAT_DIALOG_DATA) private data?: Department
  ) {
    this.isEdit = !!data;
    this.form = this.fb.group({
      name: [data?.name || '', [Validators.required]],
      description: [data?.description || '', [Validators.required]],
      head: [data?.head || '', [Validators.required]],
      employeeCount: [data?.employeeCount || 0, [Validators.required, Validators.min(0)]],
      budget: [data?.budget || 0, [Validators.required, Validators.min(0)]],
      location: [data?.location || '', [Validators.required]]
    });
  }

  onSubmit(): void {
    if (this.form.valid) {
      if (this.isEdit) {
        // For edit, only send changed fields
        const changedValues = Object.keys(this.form.controls)
          .filter(key => this.form.get(key)?.dirty)
          .reduce((acc, key) => ({
            ...acc,
            [key]: this.form.get(key)?.value
          }), {});
        
        this.dialogRef.close({
          ...changedValues,
          id: this.data?._id
        });
      } else {
        // For new department, send all values
        this.dialogRef.close({
          ...this.form.value,
          id: this.data?._id
        });
      }
    }
  }

  onCancel(): void {
    this.dialogRef.close();
  }
}
