import { Routes } from '@angular/router';
import { VehiclesComponent } from './pages/vehicles/vehicles.component';
import { LandingComponent } from './pages/landing/landing.component';
import { AboutUsComponent } from './pages/about-us/about-us.component';
import { LoginComponent } from './pages/login/login.component';
import { authGuard } from './guards/auth.guard';
import { SignupComponent } from './pages/signup/signup.component';
import { VehicleDetailsComponent } from './pages/vehicle-details/vehicle-details.component';
import { SearchComponent } from './components/search/search.component';
import { ProfileComponent } from './components/profile/profile.component';

export const routes: Routes = [
  {
    path: '',
    canActivate: [authGuard],
    children: [
      { path: 'landing', component: LandingComponent },
      { path: 'about', component: AboutUsComponent },
      { path: 'vehicles', component: VehiclesComponent },
      { path: 'vehicle/:id', component: VehicleDetailsComponent },
      { path: 'search', component: SearchComponent },
      { path: 'profile', component: ProfileComponent },
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