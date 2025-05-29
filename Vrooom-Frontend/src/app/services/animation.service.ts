import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface AnimationConfig {
  enabled: boolean;
  reducedMotion: boolean;
  transitionDuration: number;
  animationType: 'slide' | 'fade' | 'zoom' | 'vertical';
}

@Injectable({
  providedIn: 'root'
})
export class AnimationService {
  private animationConfig = new BehaviorSubject<AnimationConfig>({
    enabled: true,
    reducedMotion: false,
    transitionDuration: 400,
    animationType: 'slide'
  });

  public animationConfig$ = this.animationConfig.asObservable();

  constructor() {
    this.detectReducedMotionPreference();
    this.loadUserPreferences();
  }

  /**
   * Detect if user prefers reduced motion
   */
  private detectReducedMotionPreference(): void {
    if (typeof window !== 'undefined' && window.matchMedia) {
      const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
      
      if (mediaQuery.matches) {
        this.setReducedMotion(true);
      }

      // Listen for changes
      mediaQuery.addEventListener('change', (e) => {
        this.setReducedMotion(e.matches);
      });
    }
  }

  /**
   * Load user animation preferences from localStorage
   */
  private loadUserPreferences(): void {
    if (typeof window !== 'undefined' && window.localStorage) {
      const savedConfig = localStorage.getItem('vrooom-animation-config');
      if (savedConfig) {
        try {
          const config = JSON.parse(savedConfig);
          this.updateConfig(config);
        } catch (error) {
          console.warn('Failed to load animation preferences:', error);
        }
      }
    }
  }

  /**
   * Save user animation preferences to localStorage
   */
  private saveUserPreferences(config: AnimationConfig): void {
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        localStorage.setItem('vrooom-animation-config', JSON.stringify(config));
      } catch (error) {
        console.warn('Failed to save animation preferences:', error);
      }
    }
  }

  /**
   * Update animation configuration
   */
  updateConfig(newConfig: Partial<AnimationConfig>): void {
    const currentConfig = this.animationConfig.value;
    const updatedConfig = { ...currentConfig, ...newConfig };
    
    this.animationConfig.next(updatedConfig);
    this.saveUserPreferences(updatedConfig);
    
    // Apply global CSS variables for animation durations
    this.applyGlobalAnimationStyles(updatedConfig);
  }

  /**
   * Set reduced motion preference
   */
  setReducedMotion(enabled: boolean): void {
    this.updateConfig({ 
      reducedMotion: enabled,
      transitionDuration: enabled ? 150 : 400
    });
  }

  /**
   * Enable or disable animations globally
   */
  setAnimationsEnabled(enabled: boolean): void {
    this.updateConfig({ enabled });
  }

  /**
   * Set animation type
   */
  setAnimationType(type: 'slide' | 'fade' | 'zoom' | 'vertical'): void {
    this.updateConfig({ animationType: type });
  }

  /**
   * Set transition duration
   */
  setTransitionDuration(duration: number): void {
    this.updateConfig({ transitionDuration: Math.max(0, Math.min(1000, duration)) });
  }

  /**
   * Get current animation configuration
   */
  getCurrentConfig(): AnimationConfig {
    return this.animationConfig.value;
  }

  /**
   * Check if animations should be enabled
   */
  shouldAnimate(): boolean {
    const config = this.getCurrentConfig();
    return config.enabled && !config.reducedMotion;
  }

  /**
   * Get animation duration based on current settings
   */
  getAnimationDuration(): number {
    const config = this.getCurrentConfig();
    return config.reducedMotion ? 150 : config.transitionDuration;
  }

  /**
   * Apply global CSS variables for consistent animation timing
   */
  private applyGlobalAnimationStyles(config: AnimationConfig): void {
    if (typeof document !== 'undefined') {
      const root = document.documentElement;
      
      root.style.setProperty('--animation-duration', `${config.transitionDuration}ms`);
      root.style.setProperty('--animation-duration-fast', `${config.transitionDuration / 2}ms`);
      root.style.setProperty('--animation-duration-slow', `${config.transitionDuration * 1.5}ms`);
      
      // Disable animations completely if reduced motion is preferred
      if (config.reducedMotion || !config.enabled) {
        root.style.setProperty('--animation-duration', '0ms');
        root.style.setProperty('--animation-duration-fast', '0ms');
        root.style.setProperty('--animation-duration-slow', '0ms');
      }
    }
  }

  /**
   * Create a delay based on index for staggered animations
   */
  getStaggerDelay(index: number, baseDelay: number = 100): number {
    const config = this.getCurrentConfig();
    if (config.reducedMotion || !config.enabled) {
      return 0;
    }
    return index * baseDelay;
  }

  /**
   * Get appropriate easing function
   */
  getEasingFunction(type: 'ease-in' | 'ease-out' | 'ease-in-out' | 'bounce' = 'ease-out'): string {
    const easingFunctions = {
      'ease-in': 'cubic-bezier(0.4, 0, 1, 1)',
      'ease-out': 'cubic-bezier(0, 0, 0.2, 1)',
      'ease-in-out': 'cubic-bezier(0.4, 0, 0.2, 1)',
      'bounce': 'cubic-bezier(0.68, -0.55, 0.265, 1.55)'
    };
    
    return easingFunctions[type];
  }

  /**
   * Animate element with JavaScript (for dynamic animations)
   */
  animateElement(
    element: HTMLElement,
    keyframes: Keyframe[],
    options: KeyframeAnimationOptions = {}
  ): Animation | null {
    if (!this.shouldAnimate()) {
      return null;
    }

    const defaultOptions: KeyframeAnimationOptions = {
      duration: this.getAnimationDuration(),
      easing: this.getEasingFunction(),
      fill: 'both'
    };

    const finalOptions = { ...defaultOptions, ...options };
    
    try {
      return element.animate(keyframes, finalOptions);
    } catch (error) {
      console.warn('Animation failed:', error);
      return null;
    }
  }

  /**
   * Staggered animation for multiple elements
   */
  staggerElements(
    elements: HTMLElement[],
    keyframes: Keyframe[],
    options: KeyframeAnimationOptions = {},
    staggerDelay: number = 100
  ): Animation[] {
    if (!this.shouldAnimate()) {
      return [];
    }

    const animations: Animation[] = [];
    
    elements.forEach((element, index) => {
      const delay = this.getStaggerDelay(index, staggerDelay);
      const elementOptions = {
        ...options,
        delay
      };
      
      const animation = this.animateElement(element, keyframes, elementOptions);
      if (animation) {
        animations.push(animation);
      }
    });

    return animations;
  }

  /**
   * Page transition animation
   */
  pageTransition(
    enteringElement: HTMLElement,
    leavingElement?: HTMLElement
  ): Promise<void> {
    return new Promise((resolve) => {
      if (!this.shouldAnimate()) {
        resolve();
        return;
      }

      const config = this.getCurrentConfig();
      const duration = this.getAnimationDuration();

      const animations: Animation[] = [];

      // Animate leaving element
      if (leavingElement) {
        const leaveAnimation = this.animateElement(leavingElement, [
          { opacity: 1, transform: 'translateX(0)' },
          { opacity: 0, transform: 'translateX(-100px)' }
        ], { duration: duration / 2 });
        
        if (leaveAnimation) {
          animations.push(leaveAnimation);
        }
      }

      // Animate entering element
      setTimeout(() => {
        const enterKeyframes = this.getEnterKeyframes(config.animationType);
        const enterAnimation = this.animateElement(enteringElement, enterKeyframes, { 
          duration 
        });
        
        if (enterAnimation) {
          animations.push(enterAnimation);
          enterAnimation.addEventListener('finish', () => resolve());
        } else {
          resolve();
        }
      }, leavingElement ? duration / 2 : 0);

      // Fallback resolve
      setTimeout(resolve, duration * 2);
    });
  }

  /**
   * Get enter keyframes based on animation type
   */
  private getEnterKeyframes(type: string): Keyframe[] {
    switch (type) {
      case 'slide':
        return [
          { opacity: 0, transform: 'translateX(100%)' },
          { opacity: 1, transform: 'translateX(0)' }
        ];
      case 'fade':
        return [
          { opacity: 0, transform: 'scale(0.95)' },
          { opacity: 1, transform: 'scale(1)' }
        ];
      case 'zoom':
        return [
          { opacity: 0, transform: 'scale(0.8)' },
          { opacity: 1, transform: 'scale(1)' }
        ];
      case 'vertical':
        return [
          { opacity: 0, transform: 'translateY(50px)' },
          { opacity: 1, transform: 'translateY(0)' }
        ];
      default:
        return [
          { opacity: 0 },
          { opacity: 1 }
        ];
    }
  }
}