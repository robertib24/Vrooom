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
  // Authentication routes (special zoom/rotate animation)
  { 
    path: 'login', 
    component: LoginComponent,
    data: { 
      animation: 'auth-page',
      title: 'Login - Vrooom',
      description: 'Sign in to your Vrooom account'
    }
  },
  { 
    path: 'signup', 
    component: SignupComponent,
    data: { 
      animation: 'auth-page',
      title: 'Sign Up - Vrooom',
      description: 'Create your Vrooom account'
    }
  },

  // Protected routes with various animations
  {
    path: '',
    canActivate: [authGuard],
    children: [
      // Main content pages (enhanced slide animation)
      { 
        path: 'landing', 
        component: LandingComponent,
        data: { 
          animation: 'main-page',
          title: 'Welcome to Vrooom',
          description: 'Your premier car rental platform'
        }
      },
      { 
        path: 'vehicles', 
        component: VehiclesComponent,
        data: { 
          animation: 'main-page',
          title: 'Browse Cars - Vrooom',
          description: 'Find the perfect car for your next trip'
        }
      },
      { 
        path: 'vehicle/:id', 
        component: VehicleDetailsComponent,
        data: { 
          animation: 'zoom',
          title: 'Vehicle Details - Vrooom',
          description: 'Detailed information about your selected vehicle'
        }
      },

      // User management pages (vertical slide)
      { 
        path: 'profile', 
        component: ProfileComponent,
        data: { 
          animation: 'vertical',
          title: 'My Profile - Vrooom',
          description: 'Manage your account settings and preferences'
        }
      },
      { 
        path: 'my-vehicles', 
        component: MyVehiclesComponent,
        data: { 
          animation: 'vertical',
          title: 'My Vehicles - Vrooom',
          description: 'Manage your listed vehicles'
        }
      },
      { 
        path: 'bookings', 
        component: BookingsComponent,
        data: { 
          animation: 'vertical',
          title: 'My Bookings - Vrooom',
          description: 'View and manage your rental bookings'
        }
      },

      // Action pages (slide animation)
      { 
        path: 'add-vehicle', 
        component: AddVehicleComponent,
        data: { 
          animation: 'slide',
          title: 'List Your Vehicle - Vrooom',
          description: 'Share your car and earn money'
        }
      },
      { 
        path: 'search', 
        component: SearchComponent,
        data: { 
          animation: 'slide',
          title: 'AI Search - Vrooom',
          description: 'Find cars using intelligent search'
        }
      },

      // Support pages (fade animation for calm interaction)
      { 
        path: 'support', 
        component: SupportComponent,
        data: { 
          animation: 'fade',
          title: 'Support Center - Vrooom',
          description: 'Get help and support for your Vrooom experience'
        }
      },

      // Admin routes (special slide up animation)
      { 
        path: 'admin', 
        component: AdminPanelComponent, 
        canActivate: [adminGuard],
        data: { 
          animation: 'admin-page',
          title: 'Admin Panel - Vrooom',
          description: 'Administrative dashboard and controls'
        }
      },
      { 
        path: 'admin-support', 
        component: AdminSupportComponent, 
        canActivate: [adminGuard],
        data: { 
          animation: 'admin-page',
          title: 'Admin Support - Vrooom',
          description: 'Manage customer support tickets'
        }
      },
      // Legacy admin support route (for backwards compatibility)
      { 
        path: 'admin/support', 
        component: AdminSupportComponent,
        data: { 
          animation: 'admin-page',
          title: 'Admin Support - Vrooom',
          description: 'Manage customer support tickets'
        }
      },

      // Info pages (gentle fade animation)
      { 
        path: 'about', 
        component: AboutUsComponent,
        data: { 
          animation: 'fade',
          title: 'About Us - Vrooom',
          description: 'Learn more about Vrooom and our mission'
        }
      },
    ],
  },

  // Redirects and fallbacks
  {
    path: '',
    redirectTo: 'landing',
    pathMatch: 'full',
  },
  { 
    path: '**', 
    redirectTo: 'landing',
    data: { 
      animation: 'fade',
      title: 'Page Not Found - Vrooom',
      description: 'The page you are looking for does not exist'
    }
  },
];

// Animation route configuration helper
export const ANIMATION_CONFIG = {
  // Route patterns and their default animations
  patterns: {
    'auth': ['login', 'signup', 'reset-password', 'confirm-email'],
    'admin': ['admin', 'admin-support', 'admin-panel'],
    'main': ['landing', 'vehicles', 'search'],
    'profile': ['profile', 'my-vehicles', 'bookings'],
    'detail': ['vehicle/:id', 'user/:id'],
    'support': ['support', 'help', 'contact'],
    'info': ['about', 'terms', 'privacy']
  },
  
  // Animation types mapped to route categories
  animations: {
    'auth': 'auth-page',      // Zoom + rotate for login/signup
    'admin': 'admin-page',    // Slide up from bottom for admin
    'main': 'main-page',      // Enhanced slide for main content
    'profile': 'vertical',    // Vertical slide for user pages
    'detail': 'zoom',         // Zoom for detail views
    'support': 'fade',        // Gentle fade for support
    'info': 'fade'           // Gentle fade for info pages
  },
  
  // Performance-based animation overrides
  reduced: {
    'auth-page': 'fade',
    'admin-page': 'fade', 
    'main-page': 'slide',
    'vertical': 'fade',
    'zoom': 'fade',
    'slide': 'fade',
    'fade': 'none'
  }
};

// Helper function to get animation for a route
export function getRouteAnimation(routePath: string, reducedMotion: boolean = false): string {
  // Check for exact matches first
  for (const [category, patterns] of Object.entries(ANIMATION_CONFIG.patterns)) {
    if (patterns.some(pattern => routePath.includes(pattern))) {
      const animation = ANIMATION_CONFIG.animations[category as keyof typeof ANIMATION_CONFIG.animations];
      
      // Return reduced motion version if needed
      if (reducedMotion) {
        return ANIMATION_CONFIG.reduced[animation as keyof typeof ANIMATION_CONFIG.reduced] || 'fade';
      }
      
      return animation;
    }
  }
  
  // Default animation
  return reducedMotion ? 'fade' : 'slide';
}

// Route metadata for SEO and analytics
export const ROUTE_METADATA = {
  'landing': {
    title: 'Vrooom - Premium Car Rental Platform',
    description: 'Discover the perfect car for every journey. Premium vehicles, trusted owners, seamless booking.',
    keywords: 'car rental, vehicle sharing, premium cars, car hire',
    category: 'main'
  },
  'vehicles': {
    title: 'Browse Cars - Find Your Perfect Vehicle | Vrooom',
    description: 'Explore our extensive collection of premium vehicles. From economy to luxury, find the perfect car for your needs.',
    keywords: 'browse cars, vehicle search, car rental options, luxury cars',
    category: 'main'
  },
  'login': {
    title: 'Sign In to Your Account | Vrooom',
    description: 'Access your Vrooom account to manage bookings, list vehicles, and more.',
    keywords: 'login, sign in, account access',
    category: 'auth'
  },
  'signup': {
    title: 'Join Vrooom - Create Your Account',
    description: 'Join thousands of users who trust Vrooom for their car rental needs. Sign up in minutes.',
    keywords: 'sign up, register, create account, join vrooom',
    category: 'auth'
  },
  'admin': {
    title: 'Admin Dashboard | Vrooom',
    description: 'Administrative panel for managing the Vrooom platform.',
    keywords: 'admin, dashboard, management',
    category: 'admin'
  },
  'support': {
    title: 'Help & Support Center | Vrooom',
    description: 'Get help with your Vrooom experience. Find answers or contact our support team.',
    keywords: 'help, support, customer service, faq',
    category: 'support'
  }
};

// Route transition duration mapping (in milliseconds)
export const ROUTE_TRANSITION_DURATIONS = {
  'auth-page': 600,      // Longer for impressive auth transitions
  'admin-page': 500,     // Standard for admin
  'main-page': 550,      // Slightly longer for main content
  'vertical': 400,       // Quick for user pages
  'zoom': 350,          // Fast zoom for detail views
  'slide': 500,         // Standard slide
  'fade': 300,          // Quick fade
  'flip': 600,          // Longer for complex flip
  'none': 0             // No animation
};