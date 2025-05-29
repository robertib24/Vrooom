import { trigger, transition, style, query, animateChild, group, animate } from '@angular/animations';

export const slideInAnimation = trigger('routeAnimations', [
  // Slide from right to left (forward navigation)
  transition('* => *', [
    style({ position: 'relative' }),
    query(':enter, :leave', [
      style({
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%'
      })
    ], { optional: true }),
    query(':enter', [
      style({ 
        transform: 'translateX(100%)',
        opacity: 0,
        filter: 'blur(4px)'
      })
    ], { optional: true }),
    query(':leave', animateChild(), { optional: true }),
    group([
      query(':leave', [
        animate('400ms cubic-bezier(0.25, 0.8, 0.25, 1)', 
          style({ 
            transform: 'translateX(-100%)',
            opacity: 0,
            filter: 'blur(4px)'
          })
        )
      ], { optional: true }),
      query(':enter', [
        animate('400ms cubic-bezier(0.25, 0.8, 0.25, 1)', 
          style({ 
            transform: 'translateX(0%)',
            opacity: 1,
            filter: 'blur(0px)'
          })
        )
      ], { optional: true })
    ]),
    query(':enter', animateChild(), { optional: true })
  ])
]);

// Alternative fade animation for subtle transitions
export const fadeAnimation = trigger('fadeAnimation', [
  transition('* <=> *', [
    query(':enter, :leave', [
      style({
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%'
      })
    ], { optional: true }),
    query(':enter', [
      style({ 
        opacity: 0,
        transform: 'scale(0.98)'
      })
    ], { optional: true }),
    group([
      query(':leave', [
        animate('300ms ease-out', 
          style({ 
            opacity: 0,
            transform: 'scale(1.02)'
          })
        )
      ], { optional: true }),
      query(':enter', [
        animate('300ms ease-in', 
          style({ 
            opacity: 1,
            transform: 'scale(1)'
          })
        )
      ], { optional: true })
    ])
  ])
]);

// Zoom animation for special pages like login/signup
export const zoomAnimation = trigger('zoomAnimation', [
  transition('* => *', [
    query(':enter, :leave', [
      style({
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%'
      })
    ], { optional: true }),
    query(':enter', [
      style({ 
        opacity: 0,
        transform: 'scale(0.8) rotateY(90deg)',
        filter: 'blur(8px)'
      })
    ], { optional: true }),
    group([
      query(':leave', [
        animate('350ms cubic-bezier(0.68, -0.55, 0.265, 1.55)', 
          style({ 
            opacity: 0,
            transform: 'scale(1.2) rotateY(-90deg)',
            filter: 'blur(8px)'
          })
        )
      ], { optional: true }),
      query(':enter', [
        animate('350ms cubic-bezier(0.68, -0.55, 0.265, 1.55)', 
          style({ 
            opacity: 1,
            transform: 'scale(1) rotateY(0deg)',
            filter: 'blur(0px)'
          })
        )
      ], { optional: true })
    ])
  ])
]);

// Vertical slide animation for specific routes
export const verticalSlideAnimation = trigger('verticalSlideAnimation', [
  transition('* => *', [
    query(':enter, :leave', [
      style({
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%'
      })
    ], { optional: true }),
    query(':enter', [
      style({ 
        transform: 'translateY(100%)',
        opacity: 0
      })
    ], { optional: true }),
    group([
      query(':leave', [
        animate('400ms ease-in', 
          style({ 
            transform: 'translateY(-100%)',
            opacity: 0
          })
        )
      ], { optional: true }),
      query(':enter', [
        animate('400ms ease-out', 
          style({ 
            transform: 'translateY(0%)',
            opacity: 1
          })
        )
      ], { optional: true })
    ])
  ])
]);

// Route-specific animation configuration
export function getRouteAnimation(outlet: any) {
  const currentRoute = outlet.activatedRouteData?.['animation'];
  return currentRoute || 'default';
}