import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { VehiclesService } from '../../services/vehicles.service';
import { TokenService } from '../../services/token.service';
import { AuthService } from '../../services/auth.service';
import { interval, Subscription } from 'rxjs';
import { trigger, state, style, transition, animate, query, stagger } from '@angular/animations';

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule, 
    MatButtonModule, 
    MatIconModule, 
    MatCardModule
  ],
  templateUrl: './landing.component.html',
  styleUrl: './landing.component.scss',
  animations: [
    trigger('fadeInUp', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(50px)' }),
        animate('800ms cubic-bezier(0.25, 0.8, 0.25, 1)', style({ opacity: 1, transform: 'translateY(0)' }))
      ])
    ]),
    trigger('staggerAnimation', [
      transition('* => *', [
        query(':enter', [
          style({ opacity: 0, transform: 'translateY(40px)' }),
          stagger(150, [
            animate('700ms cubic-bezier(0.25, 0.8, 0.25, 1)', style({ opacity: 1, transform: 'translateY(0)' }))
          ])
        ], { optional: true })
      ])
    ]),
    trigger('heroAnimation', [
      transition(':enter', [
        style({ opacity: 0, transform: 'scale(0.95)' }),
        animate('1000ms cubic-bezier(0.25, 0.8, 0.25, 1)', 
          style({ opacity: 1, transform: 'scale(1)' }))
      ])
    ]),
    trigger('slideInLeft', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateX(-60px)' }),
        animate('800ms cubic-bezier(0.25, 0.8, 0.25, 1)', style({ opacity: 1, transform: 'translateX(0)' }))
      ])
    ]),
    trigger('slideInRight', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateX(60px)' }),
        animate('800ms cubic-bezier(0.25, 0.8, 0.25, 1)', style({ opacity: 1, transform: 'translateX(0)' }))
      ])
    ]),
    trigger('smoothSlide', [
      state('active', style({ opacity: 1, transform: 'scale(1)' })),
      state('inactive', style({ opacity: 0, transform: 'scale(1.05)' })),
      transition('inactive => active', [
        animate('1200ms cubic-bezier(0.25, 0.8, 0.25, 1)')
      ]),
      transition('active => inactive', [
        animate('800ms cubic-bezier(0.25, 0.8, 0.25, 1)')
      ])
    ])
  ]
})
export class LandingComponent implements OnInit, OnDestroy {
  private vehiclesService = inject(VehiclesService);
  private tokenService = inject(TokenService);
  private authService = inject(AuthService);
  private router = inject(Router);

  currentUser: any = null;
  featuredVehicles: any[] = [];
  stats = {
    totalVehicles: 0,
    happyCustomers: 1250,
    citiesCovered: 15
  };

  // Hero carousel with better images
  heroSlides = [
    {
      title: 'Premium Rentals',
      subtitle: 'Experience luxury and comfort with our premium fleet of vehicles',
      image: 'https://images.unsplash.com/photo-1547744152-14d985cb937f?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
      cta: 'Browse Vehicles'
    },
    {
      title: 'AI-Powered Search',
      subtitle: 'Find your perfect car using natural language - just describe what you need',
      image: 'https://images.unsplash.com/photo-1698695067900-2bcfca3d2071?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
      cta: 'Try AI Search'
    },
    {
      title: 'Book in Seconds',
      subtitle: 'Quick and easy booking process with instant confirmation and support',
      image: 'https://images.unsplash.com/photo-1555215695-3004980ad54e?q=80&w=2070&auto=format&fit=crop',
      cta: 'Start Booking'
    }
  ];


  currentSlideIndex = 0;
  private slideSubscription?: Subscription;
  private transitionInProgress = false;

  // Features data
  features = [
    {
      icon: 'verified',
      title: 'Verified Vehicles',
      description: 'All vehicles are thoroughly inspected and verified for your safety',
      color: '#4caf50'
    },
    {
      icon: 'psychology',
      title: 'AI-Powered Search',
      description: 'Find your perfect car using natural language descriptions',
      color: '#2196f3'
    },
    {
      icon: 'support_agent',
      title: '24/7 Support',
      description: 'Round-the-clock customer support for all your needs',
      color: '#ff9800'
    },
    {
      icon: 'security',
      title: 'Secure Payments',
      description: 'Your payments are protected with bank-level security',
      color: '#9c27b0'
    },
    {
      icon: 'flash_on',
      title: 'Instant Booking',
      description: 'Book your vehicle instantly with real-time availability',
      color: '#f44336'
    },
    {
      icon: 'star',
      title: 'Top Rated',
      description: '5-star rated service with thousands of satisfied customers',
      color: '#ffd700'
    }
  ];

  ngOnInit() {
    this.loadUserData();
    this.loadFeaturedVehicles();
    this.loadStats();
    this.startHeroCarousel();
  }

  ngOnDestroy() {
    if (this.slideSubscription) {
      this.slideSubscription.unsubscribe();
    }
  }

  loadUserData() {
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

  loadFeaturedVehicles() {
    this.vehiclesService.getVehicles().subscribe({
      next: (vehicles) => {
        // Get 3 random featured vehicles
        this.featuredVehicles = vehicles
          .sort(() => 0.5 - Math.random())
          .slice(0, 3);
      },
      error: (error) => {
        console.error('Error loading featured vehicles:', error);
      }
    });
  }

  loadStats() {
    this.vehiclesService.getVehicles().subscribe({
      next: (vehicles) => {
        this.stats.totalVehicles = vehicles.length;
      },
      error: (error) => {
        console.error('Error loading stats:', error);
      }
    });
  }

  startHeroCarousel() {
    this.slideSubscription = interval(6000).subscribe(() => {
      this.nextSlide();
    });
  }

  nextSlide() {
    if (this.transitionInProgress) return;
    
    this.transitionInProgress = true;
    this.currentSlideIndex = (this.currentSlideIndex + 1) % this.heroSlides.length;
    
    setTimeout(() => {
      this.transitionInProgress = false;
    }, 1200);
  }

  prevSlide() {
    if (this.transitionInProgress) return;
    
    this.transitionInProgress = true;
    this.currentSlideIndex = this.currentSlideIndex === 0 
      ? this.heroSlides.length - 1 
      : this.currentSlideIndex - 1;
    
    setTimeout(() => {
      this.transitionInProgress = false;
    }, 1200);
  }

  goToSlide(index: number) {
    if (this.transitionInProgress || index === this.currentSlideIndex) return;
    
    this.transitionInProgress = true;
    this.currentSlideIndex = index;
    
    setTimeout(() => {
      this.transitionInProgress = false;
    }, 1200);
  }

  navigateTo(route: string) {
    this.router.navigate([route]);
  }

  getVehicleImageUrl(vehicleId: number): string {
    return this.vehiclesService.getVehicleImageUrl(vehicleId);
  }

  onHeroAction(slide: any) {
    switch (slide.cta) {
      case 'Browse Premium Cars':
        this.router.navigate(['/vehicles']);
        break;
      case 'Try AI Search':
        this.router.navigate(['/search']);
        break;
      case 'Start Booking':
        this.router.navigate(['/vehicles']);
        break;
    }
  }

  onImageError(event: any) {
    event.target.src = 'https://via.placeholder.com/300x200?text=No+Image';
  }

  trackBySlideIndex(index: number, slide: any): number {
    return index;
  }

  trackByFeatureTitle(index: number, feature: any): string {
    return feature.title;
  }

  trackByVehicleId(index: number, vehicle: any): number {
    return vehicle.id;
  }
}