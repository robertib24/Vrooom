import { Component, inject, Signal, OnInit } from '@angular/core';
import { Router, RouterModule, NavigationEnd } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatMenuModule } from '@angular/material/menu';
import { MatBadgeModule } from '@angular/material/badge';
import { MatDividerModule } from '@angular/material/divider';
import { toSignal } from '@angular/core/rxjs-interop';
import { AuthService } from './services/auth.service';
import { AdminService } from './services/admin.service';
import { TokenService } from './services/token.service';
import { CommonModule } from '@angular/common';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-root',
  imports: [
    CommonModule,
    RouterModule,
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    MatBadgeModule,
    MatDividerModule,
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent implements OnInit {
  title = 'Vrooom';

  private authService = inject(AuthService);
  private tokenService = inject(TokenService);
  private adminService = inject(AdminService);
  private router = inject(Router);

  public readonly isAuthenticated: Signal<any | undefined> = toSignal(
    this.authService.isAuthenticated,
    { initialValue: false },
  );

  currentUser: any = null;
  currentRoute = '';

  ngOnInit() {
    this.loadUserData();
    
    // Track route changes
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: NavigationEnd) => {
      this.currentRoute = event.url;
    });
  }

  loadUserData() {
    if (this.isAuthenticated()) {
      const username = this.tokenService.getUsername();
      if (username) {
        this.authService.getUserProfile(username).subscribe({
          next: (user) => {
            this.currentUser = user;
          },
          error: (error) => {
            console.error('Error loading user data:', error);
          }
        });
      }
    }
  }

  isAdmin(): boolean {
  return this.adminService.isAdmin();
  }
  
  navigateToAdminSupport() {
  this.router.navigate(['/admin-support']);
  }

  signout() {
    this.authService.logout();
    this.currentUser = null;
    this.router.navigate(['/login']);
  }

  navigateToProfile() {
    this.router.navigate(['/profile']);
  }

  navigateToMyVehicles() {
    this.router.navigate(['/my-vehicles']);
  }

  navigateToBookings() {
    this.router.navigate(['/bookings']);
  }

  navigateToSupport() {
    this.router.navigate(['/support']);
  }
  
  isActiveRoute(route: string): boolean {
    return this.currentRoute === route || this.currentRoute.startsWith(route + '/');
  }
}