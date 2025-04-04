import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AttendanceListComponent } from './components/attendance-list/attendance-list.component';
import { AttendanceFormComponent } from './components/attendance-form/attendance-form.component';
import { AuthGuard } from '@app/core/guards/auth.guard';

const routes: Routes = [
  {
    path: '',
    component: AttendanceListComponent,
    canActivate: [AuthGuard]
  },
  {
    path: 'form',
    component: AttendanceFormComponent,
    canActivate: [AuthGuard]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class AttendanceRoutingModule { }
