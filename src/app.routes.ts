import { Routes } from '@angular/router';
import { LoginComponent } from './components/login.component';
import { DriverDashboardComponent } from './components/driver-dashboard.component';
import { MechanicDashboardComponent } from './components/mechanic-dashboard.component';
import { AdminDashboardComponent } from './components/admin-dashboard.component';

export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { path: 'driver', component: DriverDashboardComponent },
  { path: 'mechanic', component: MechanicDashboardComponent },
  { path: 'admin', component: AdminDashboardComponent },
];