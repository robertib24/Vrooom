import { Component, inject, Signal, OnInit } from '@angular/core';
import { Router, RouterModule, RouterOutlet } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';
import { MatMenuModule } from '@angular/material/menu';
import { MatBadgeModule } from '@angular/material/badge';
import { MatTooltipModule } from '@angular/material/tooltip';
import { toSignal } from '@angular/core/rxjs-interop';
import { AuthService } from './services/auth.service';
import { CommonModule } from '@angular/common';
import { TokenService } from './services/token.service';
import { UserService } from './services/user.service';
import { SupportService } from './services/support.service';
import { animate, style, transition, trigger } from '@angular/animations';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    MatSidenavModule,
    MatListModule,
    MatMenuModule,
    MatBadgeModule,
    MatTooltipModule
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
  animations: [
    trigger('fadeSlideInOut', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(-10px)' }),
        animate('0.3s ease-in-out', style({ opacity: 1, transform: 'translateY(0)' })),
      ]),
      transition(':leave', [
        animate('0.3s ease-in-out', style({ opacity: 0, transform: 'translateY(-10px)' })),
      ]),
    ]),
    trigger('fadeIn', [
      transition(':enter', [
        style({ opacity: 0 }),
        animate('0.5s ease-in-out', style({ opacity: 1 })),
      ]),
    ]),
  ],
})
export class AppComponent implements OnInit {
  title = 'Vrooom - Car Rental';
  isSidenavOpen = false;
  userProfileImage = '';
  username = '';
  userRole = '';
  supportTicketsCount = 0;
  navLinks = [];

  private authService = inject(AuthService);
  private tokenService = inject(TokenService);
  private router = inject(Router);
  private userService = inject(UserService);
  private supportService = inject(SupportService);

  public readonly isAuthenticated: Signal<boolean> = toSignal(
    this.authService.isAuthenticated$,
    { initialValue: false },
  );

  ngOnInit() {
    this.setupNavigation();
    this.loadUserDetails();
  }

  private setupNavigation() {
    if (this.isAuthenticated()) {
      const userRole = this.tokenService.getRole();
      this.userRole = userRole;

      if (userRole === 'Admin') {
        this.navLinks = [
          { path: '/dashboard', icon: 'dashboard', label: 'Dashboard' },
          { path: '/vehicles', icon: 'directions_car', label: 'Vehicles' },
          { path: '/users', icon: 'people', label: 'Users' },
          { path: '/bookings', icon: 'book_online', label: 'Bookings' },
          { path: '/admin/support', icon: 'support_agent', label: 'Support' },
          { path: '/reports', icon: 'analytics', label: 'Reports' },
        ];
      } else if (userRole === 'Proprietar') {
        this.navLinks = [
          { path: '/dashboard', icon: 'dashboard', label: 'Dashboard' },
          { path: '/vehicles', icon: 'directions_car', label: 'Browse Vehicles' },
          { path: '/my-vehicles', icon: 'local_taxi', label: 'My Vehicles' },
          { path: '/add-vehicle', icon: 'add_circle', label: 'Add Vehicle' },
          { path: '/bookings', icon: 'book_online', label: 'Bookings' },
          { path: '/support', icon: 'help', label: 'Support' },
        ];
      } else {
        this.navLinks = [
          { path: '/dashboard', icon: 'dashboard', label: 'Dashboard' },
          { path: '/vehicles', icon: 'directions_car', label: 'Browse Vehicles' },
          { path: '/my-bookings', icon: 'book_online', label: 'My Bookings' },
          { path: '/favorites', icon: 'favorite', label: 'Favorites' },
          { path: '/support', icon: 'help', label: 'Support' },
        ];
      }
    }
  }

  private loadUserDetails() {
    if (this.isAuthenticated()) {
      const username = this.tokenService.getUsername();
      if (username) {
        this.username = username;
        
        this.userService.getUserProfile(username).subscribe({
          next: (userData) => {
            this.userProfileImage = userData.linkPozaProfil || 'assets/images/default-profile.jpg';
          },
          error: (error) => console.error('Error loading user profile:', error)
        });

        // Load pending support tickets count
        if (this.userRole === 'Admin') {
          this.supportService.getAllSupportTickets().subscribe({
            next: (tickets) => {
              this.supportTicketsCount = tickets.length;
            },
            error: (error) => console.error('Error loading support tickets:', error)
          });
        } else {
          const userId = Number(this.tokenService.getUserId());
          if (userId) {
            this.supportService.getUserSupportTickets(userId).subscribe({
              next: (tickets) => {
                this.supportTicketsCount = tickets.length;
              },
              error: (error) => console.error('Error loading support tickets:', error)
            });
          }
        }
      }
    }
  }

  toggleSidenav() {
    this.isSidenavOpen = !this.isSidenavOpen;
  }

  signout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  navigateTo(path: string) {
    this.router.navigate([path]);
    if (window.innerWidth < 960) {
      this.isSidenavOpen = false;
    }
  }
}