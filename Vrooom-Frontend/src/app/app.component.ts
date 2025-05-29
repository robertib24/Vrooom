import { Component, inject, Signal, OnInit, OnDestroy } from '@angular/core';
import { Router, RouterModule, NavigationEnd, RouterOutlet } from '@angular/router';
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
import { AnimationService } from './services/animation.service';
import { CommonModule } from '@angular/common';
import { filter, takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';
import { slideInAnimation, fadeAnimation } from './animations/route-animations';

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
  animations: [slideInAnimation, fadeAnimation]
})
export class AppComponent implements OnInit, OnDestroy {
  title = 'Vrooom';
  
  private destroy$ = new Subject<void>();
  private authService = inject(AuthService);
  private tokenService = inject(TokenService);
  private adminService = inject(AdminService);
  private router = inject(Router);
  private animationService = inject(AnimationService);

  public readonly isAuthenticated: Signal<boolean> = toSignal(
    this.authService.isAuthenticated,
    { initialValue: false }
  );

  currentUser: any = null;
  currentRoute = '';
  loadingUser = false;

  ngOnInit() {
    // Initialize animation service
    this.animationService.detectReducedMotionPreference();
    
    // Track route changes
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd),
      takeUntil(this.destroy$)
    ).subscribe((event: NavigationEnd) => {
      this.currentRoute = event.url;
    });

    // Watch authentication state changes
    this.authService.isAuthenticated
      .pipe(takeUntil(this.destroy$))
      .subscribe(isAuth => {
        if (isAuth) {
          this.loadUserData();
        } else {
          this.currentUser = null;
        }
      });

    // Initial load if already authenticated
    if (this.isAuthenticated()) {
      this.loadUserData();
    }
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // Animation trigger function for router outlet
  prepareRoute(outlet: RouterOutlet) {
    const routeData = outlet?.activatedRouteData;
    const animationType = routeData?.['animation'] || 'default';
    
    // Respect user's reduced motion preference
    if (!this.animationService.shouldAnimate()) {
      return 'no-animation';
    }
    
    return animationType;
  }

  // Get animation trigger based on route
  getRouteAnimation(outlet: RouterOutlet) {
    if (!outlet?.isActivated) return '';
    
    const routeData = outlet.activatedRouteData;
    const currentRoute = this.currentRoute;
    
    // Different animations for different route types
    if (currentRoute.includes('login') || currentRoute.includes('signup')) {
      return 'auth-page';
    } else if (currentRoute.includes('admin')) {
      return 'admin-page';  
    } else if (currentRoute.includes('vehicle') || currentRoute.includes('search')) {
      return 'main-page';
    }
    
    return routeData?.['animation'] || 'default';
  }

  loadUserData() {
    if (this.loadingUser) return;
    
    try {
      const username = this.tokenService.getUsername();
      if (!username) {
        console.warn('No username found in token');
        return;
      }

      this.loadingUser = true;
      
      this.authService.getUserProfile(username)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (user) => {
            this.currentUser = user;
            this.loadingUser = false;
            console.log('✅ User data loaded:', user);
          },
          error: (error) => {
            console.error('❌ Error loading user data:', error);
            this.loadingUser = false;
            this.currentUser = {
              username: username,
              nume: '',
              prenume: '',
              puncteFidelitate: 0,
              linkPozaProfil: ''
            };
          }
        });
    } catch (error) {
      console.error('Error in loadUserData:', error);
      this.loadingUser = false;
    }
  }

  isAdmin(): boolean {
    try {
      return this.adminService.isAdmin();
    } catch (error) {
      console.error('Error checking admin status:', error);
      return false;
    }
  }
  
  navigateToAdminSupport() {
    this.router.navigate(['/admin-support']);
  }

  signout() {
    try {
      this.authService.logout();
      this.currentUser = null;
    } catch (error) {
      console.error('Error during signout:', error);
      this.currentUser = null;
      this.router.navigate(['/login']);
    }
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

  getCurrentUserName(): string {
    if (!this.currentUser) return '';
    return `${this.currentUser.prenume || ''} ${this.currentUser.nume || ''}`.trim() || 
           this.currentUser.username || 'User';
  }

  getCurrentUserAvatar(): string {
    return this.currentUser?.linkPozaProfil || 'assets/default-avatar.png';
  }

  getCurrentUserPoints(): number {
    return this.currentUser?.puncteFidelitate || 0;
  }
}