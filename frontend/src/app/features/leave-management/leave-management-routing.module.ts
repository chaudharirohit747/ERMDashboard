import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LeaveListComponent } from './components/leave-list/leave-list.component';
import { LeaveCalendarComponent } from './components/leave-calendar/leave-calendar.component';

const routes: Routes = [
  {
    path: '',
    component: LeaveListComponent
  },
  {
    path: 'calendar',
    component: LeaveCalendarComponent
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class LeaveManagementRoutingModule { }
