import { trigger, transition, style, query, animateChild, group, animate, state } from '@angular/animations';

// Main slide animation with improved performance and smoothness
export const slideInAnimation = trigger('routeAnimations', [
  // Default transition
  transition('* => *', [
    style({ position: 'relative' }),
    query(':enter, :leave', [
      style({
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        transform: 'translateZ(0)', // Force hardware acceleration
        backfaceVisibility: 'hidden', // Prevent flickering
        perspective: '1000px'
      })
    ], { optional: true }),
    query(':enter', [
      style({ 
        transform: 'translateX(100%) translateZ(0)',
        opacity: 0,
        filter: 'blur(2px)'
      })
    ], { optional: true }),
    query(':leave', animateChild(), { optional: true }),
    group([
      query(':leave', [
        animate('500ms cubic-bezier(0.35, 0, 0.25, 1)', 
          style({ 
            transform: 'translateX(-30%) translateZ(0)',
            opacity: 0,
            filter: 'blur(2px)',
            scale: '0.95'
          })
        )
      ], { optional: true }),
      query(':enter', [
        animate('500ms cubic-bezier(0.35, 0, 0.25, 1)', 
          style({ 
            transform: 'translateX(0) translateZ(0)',
            opacity: 1,
            filter: 'blur(0px)',
            scale: '1'
          })
        )
      ], { optional: true })
    ]),
    query(':enter', animateChild(), { optional: true })
  ]),

  // Special transitions for specific routes
  // Auth pages (login/signup) - zoom and rotate effect
  transition('* => auth-page', [
    style({ position: 'relative' }),
    query(':enter, :leave', [
      style({
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        transform: 'translateZ(0)',
        backfaceVisibility: 'hidden'
      })
    ], { optional: true }),
    query(':enter', [
      style({ 
        transform: 'scale(0.8) rotateY(90deg) translateZ(0)',
        opacity: 0,
        filter: 'blur(4px)'
      })
    ], { optional: true }),
    group([
      query(':leave', [
        animate('400ms cubic-bezier(0.68, -0.55, 0.265, 1.55)', 
          style({ 
            transform: 'scale(1.2) rotateY(-90deg) translateZ(0)',
            opacity: 0,
            filter: 'blur(4px)'
          })
        )
      ], { optional: true }),
      query(':enter', [
        animate('400ms cubic-bezier(0.68, -0.55, 0.265, 1.55)', 
          style({ 
            transform: 'scale(1) rotateY(0deg) translateZ(0)',
            opacity: 1,
            filter: 'blur(0px)'
          })
        )
      ], { optional: true })
    ])
  ]),

  // Admin pages - slide up from bottom
  transition('* => admin-page', [
    style({ position: 'relative' }),
    query(':enter, :leave', [
      style({
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        transform: 'translateZ(0)',
        backfaceVisibility: 'hidden'
      })
    ], { optional: true }),
    query(':enter', [
      style({ 
        transform: 'translateY(100%) translateZ(0)',
        opacity: 0,
        filter: 'blur(3px)'
      })
    ], { optional: true }),
    group([
      query(':leave', [
        animate('450ms cubic-bezier(0.25, 0.46, 0.45, 0.94)', 
          style({ 
            transform: 'translateY(-50%) translateZ(0)',
            opacity: 0,
            filter: 'blur(3px)',
            scale: '0.9'
          })
        )
      ], { optional: true }),
      query(':enter', [
        animate('450ms cubic-bezier(0.25, 0.46, 0.45, 0.94)', 
          style({ 
            transform: 'translateY(0) translateZ(0)',
            opacity: 1,
            filter: 'blur(0px)',
            scale: '1'
          })
        )
      ], { optional: true })
    ])
  ]),

  // Main content pages - enhanced slide with parallax effect
  transition('* => main-page', [
    style({ position: 'relative' }),
    query(':enter, :leave', [
      style({
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        transform: 'translateZ(0)',
        backfaceVisibility: 'hidden'
      })
    ], { optional: true }),
    query(':enter', [
      style({ 
        transform: 'translateX(100%) scale(0.95) translateZ(0)',
        opacity: 0,
        filter: 'blur(1px)'
      })
    ], { optional: true }),
    group([
      query(':leave', [
        animate('550ms cubic-bezier(0.23, 1, 0.32, 1)', 
          style({ 
            transform: 'translateX(-20%) scale(1.05) translateZ(0)',
            opacity: 0,
            filter: 'blur(1px)'
          })
        )
      ], { optional: true }),
      query(':enter', [
        animate('550ms cubic-bezier(0.23, 1, 0.32, 1)', 
          style({ 
            transform: 'translateX(0) scale(1) translateZ(0)',
            opacity: 1,
            filter: 'blur(0px)'
          })
        )
      ], { optional: true })
    ])
  ])
]);

// Alternative fade animation for subtle transitions or reduced motion
export const fadeAnimation = trigger('fadeAnimation', [
  transition('* <=> *', [
    query(':enter, :leave', [
      style({
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        transform: 'translateZ(0)',
        backfaceVisibility: 'hidden'
      })
    ], { optional: true }),
    query(':enter', [
      style({ 
        opacity: 0,
        transform: 'scale(0.98) translateZ(0)',
        filter: 'blur(1px)'
      })
    ], { optional: true }),
    group([
      query(':leave', [
        animate('300ms ease-out', 
          style({ 
            opacity: 0,
            transform: 'scale(1.02) translateZ(0)',
            filter: 'blur(1px)'
          })
        )
      ], { optional: true }),
      query(':enter', [
        animate('300ms ease-in', 
          style({ 
            opacity: 1,
            transform: 'scale(1) translateZ(0)',
            filter: 'blur(0px)'
          })
        )
      ], { optional: true })
    ])
  ])
]);

// Zoom animation for special pages like modals or detail views
export const zoomAnimation = trigger('zoomAnimation', [
  transition('* => *', [
    query(':enter, :leave', [
      style({
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        transform: 'translateZ(0)',
        backfaceVisibility: 'hidden',
        transformOrigin: 'center center'
      })
    ], { optional: true }),
    query(':enter', [
      style({ 
        opacity: 0,
        transform: 'scale(0.3) rotate(10deg) translateZ(0)',
        filter: 'blur(8px)'
      })
    ], { optional: true }),
    group([
      query(':leave', [
        animate('350ms cubic-bezier(0.68, -0.55, 0.265, 1.55)', 
          style({ 
            opacity: 0,
            transform: 'scale(3) rotate(-10deg) translateZ(0)',
            filter: 'blur(8px)'
          })
        )
      ], { optional: true }),
      query(':enter', [
        animate('350ms cubic-bezier(0.68, -0.55, 0.265, 1.55)', 
          style({ 
            opacity: 1,
            transform: 'scale(1) rotate(0deg) translateZ(0)',
            filter: 'blur(0px)'
          })
        )
      ], { optional: true })
    ])
  ])
]);

// Vertical slide animation for specific routes like settings or profile
export const verticalSlideAnimation = trigger('verticalSlideAnimation', [
  transition('* => *', [
    query(':enter, :leave', [
      style({
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        transform: 'translateZ(0)',
        backfaceVisibility: 'hidden'
      })
    ], { optional: true }),
    query(':enter', [
      style({ 
        transform: 'translateY(100%) translateZ(0)',
        opacity: 0,
        filter: 'blur(2px)'
      })
    ], { optional: true }),
    group([
      query(':leave', [
        animate('400ms ease-in', 
          style({ 
            transform: 'translateY(-100%) translateZ(0)',
            opacity: 0,
            filter: 'blur(2px)'
          })
        )
      ], { optional: true }),
      query(':enter', [
        animate('400ms ease-out', 
          style({ 
            transform: 'translateY(0%) translateZ(0)',
            opacity: 1,
            filter: 'blur(0px)'
          })
        )
      ], { optional: true })
    ])
  ])
]);

// Flip animation for card-like transitions
export const flipAnimation = trigger('flipAnimation', [
  transition('* => *', [
    query(':enter, :leave', [
      style({
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        transform: 'translateZ(0)',
        backfaceVisibility: 'hidden',
        transformStyle: 'preserve-3d'
      })
    ], { optional: true }),
    query(':enter', [
      style({ 
        transform: 'rotateY(180deg) translateZ(0)',
        opacity: 0
      })
    ], { optional: true }),
    group([
      query(':leave', [
        animate('600ms cubic-bezier(0.4, 0.0, 0.2, 1)', 
          style({ 
            transform: 'rotateY(-180deg) translateZ(0)',
            opacity: 0
          })
        )
      ], { optional: true }),
      query(':enter', [
        animate('600ms cubic-bezier(0.4, 0.0, 0.2, 1)', 
          style({ 
            transform: 'rotateY(0deg) translateZ(0)',
            opacity: 1
          })
        )
      ], { optional: true })
    ])
  ])
]);

// No animation trigger for accessibility
export const noAnimation = trigger('noAnimation', [
  transition('* => *', [])
]);

// Route-specific animation configuration helper
export function getRouteAnimation(outlet: any): string {
  if (!outlet?.activatedRouteData) return 'default';
  
  const animation = outlet.activatedRouteData['animation'];
  const path = outlet.activatedRoute?.snapshot?.routeConfig?.path;
  
  // Auto-detect animation type based on route
  if (path?.includes('login') || path?.includes('signup')) {
    return 'auth-page';
  } else if (path?.includes('admin')) {
    return 'admin-page';
  } else if (path?.includes('vehicle') || path?.includes('search') || path?.includes('profile')) {
    return 'main-page';
  }
  
  return animation || 'default';
}

// Stagger animation helper for lists
export function createStaggerAnimation(itemCount: number, baseDelay: number = 100) {
  const staggerSteps = [];
  
  for (let i = 0; i < itemCount; i++) {
    staggerSteps.push(
      style({
        transform: 'translateY(20px)',
        opacity: 0
      })
    );
  }
  
  return trigger('staggerAnimation', [
    transition('* => *', [
      query('.stagger-item', staggerSteps, { optional: true }),
      query('.stagger-item', [
        animate(`${baseDelay}ms {{delay}}ms cubic-bezier(0.35, 0, 0.25, 1)`,
          style({
            transform: 'translateY(0)',
            opacity: 1
          })
        )
      ], { optional: true })
    ])
  ]);
}