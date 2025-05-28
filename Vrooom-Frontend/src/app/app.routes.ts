import { Routes } from '@angular/router';
import { VehiclesComponent } from './pages/vehicles/vehicles.component';
import { LandingComponent } from './pages/landing/landing.component';
import { AboutUsComponent } from './pages/about-us/about-us.component';
import { LoginComponent } from './pages/login/login.component';
import { authGuard } from './guards/auth.guard';
import { adminGuard } from './guards/admin.guard';
import { SignupComponent } from './pages/signup/signup.component';
import { VehicleDetailsComponent } from './pages/vehicle-details/vehicle-details.component';
import { SearchComponent } from './components/search/search.component';
import { ProfileComponent } from './components/profile/profile.component';
import { AddVehicleComponent } from './components/add-vehicle/add-vehicle.component';
import { MyVehiclesComponent } from './pages/my-vehicles/my-vehicles.component';
import { SupportComponent } from './components/support/support.component';
import { AdminSupportComponent } from './components/admin-support/admin-support.component';
import { AdminPanelComponent } from './pages/admin-panel/admin-panel.component';
import { BookingsComponent } from './pages/bookings/bookings.component';

export const routes: Routes = [
  {
    path: '',
    canActivate: [authGuard],
    children: [
      { path: 'landing', component: LandingComponent },
      { path: 'about', component: AboutUsComponent },
      { path: 'vehicles', component: VehiclesComponent },
      { path: 'vehicle/:id', component: VehicleDetailsComponent },
      { path: 'add-vehicle', component: AddVehicleComponent },
      { path: 'my-vehicles', component: MyVehiclesComponent },
      { path: 'search', component: SearchComponent },
      { path: 'profile', component: ProfileComponent },
      { path: 'support', component: SupportComponent },
      { path: 'bookings', component: BookingsComponent },
      { path: 'admin/support', component: AdminSupportComponent },
      { path: 'admin-support', component: AdminSupportComponent, canActivate: [adminGuard] },
      { path: 'admin', component: AdminPanelComponent, canActivate: [adminGuard] },
    ],
  },
  { path: 'signup', component: SignupComponent },
  { path: 'login', component: LoginComponent },
  {
    path: '',
    redirectTo: 'landing',
    pathMatch: 'full',
  },
  { path: '**', redirectTo: 'landing' },
];