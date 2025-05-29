import { Injectable } from '@angular/core';
import { BehaviorSubject, fromEvent } from 'rxjs';
import { debounceTime } from 'rxjs/operators';

export interface AnimationConfig {
  enabled: boolean;
  reducedMotion: boolean;
  transitionDuration: number;
  animationType: 'slide' | 'fade' | 'zoom' | 'vertical' | 'flip';
  performanceMode: 'smooth' | 'fast' | 'disabled';
  staggerDelay: number;
}

@Injectable({
  providedIn: 'root'
})
export class AnimationService {
  private animationConfig = new BehaviorSubject<AnimationConfig>({
    enabled: true,
    reducedMotion: false,
    transitionDuration: 500,
    animationType: 'slide',
    performanceMode: 'smooth',
    staggerDelay: 100
  });

  public animationConfig$ = this.animationConfig.asObservable();
  private performanceObserver?: PerformanceObserver;

  constructor() {
    this.detectReducedMotionPreference();
    this.loadUserPreferences();
    this.setupPerformanceMonitoring();
    this.listenToSystemChanges();
  }

  /**
   * Detect if user prefers reduced motion and set up listener
   */
  public detectReducedMotionPreference(): void {
    if (typeof window !== 'undefined' && window.matchMedia) {
      const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
      
      this.setReducedMotion(mediaQuery.matches);

      // Listen for changes
      mediaQuery.addEventListener('change', (e) => {
        this.setReducedMotion(e.matches);
        console.log('🎭 Motion preference changed:', e.matches ? 'reduced' : 'normal');
      });
    }
  }

  /**
   * Listen to system changes that might affect animations
   */
  private listenToSystemChanges(): void {
    if (typeof window !== 'undefined') {
      // Listen for low battery
      if ('getBattery' in navigator) {
        (navigator as any).getBattery().then((battery: any) => {
          const updatePerformanceMode = () => {
            if (battery.level < 0.2 && !battery.charging) {
              this.setPerformanceMode('fast');
              console.log('🔋 Low battery detected, switching to fast animations');
            } else if (battery.charging && this.getCurrentConfig().performanceMode === 'fast') {
              this.setPerformanceMode('smooth');
              console.log('🔌 Charging detected, switching back to smooth animations');
            }
          };

          battery.addEventListener('levelchange', updatePerformanceMode);
          battery.addEventListener('chargingchange', updatePerformanceMode);
          updatePerformanceMode();
        });
      }

      // Listen for connection changes
      if ('connection' in navigator) {
        const connection = (navigator as any).connection;
        if (connection) {
          const updateConnectionBasedPerformance = () => {
            if (connection.effectiveType === '2g' || connection.effectiveType === 'slow-2g') {
              this.setPerformanceMode('fast');
              console.log('📶 Slow connection detected, optimizing animations');
            }
          };

          connection.addEventListener('change', updateConnectionBasedPerformance);
          updateConnectionBasedPerformance();
        }
      }

      // Listen for memory pressure (experimental)
      if ('memory' in performance) {
        const memInfo = (performance as any).memory;
        if (memInfo && memInfo.usedJSHeapSize / memInfo.jsHeapSizeLimit > 0.8) {
          this.setPerformanceMode('fast');
          console.log('🧠 High memory usage detected, optimizing animations');
        }
      }
    }
  }

  /**
   * Set up performance monitoring for smooth animations
   */
  private setupPerformanceMonitoring(): void {
    if (typeof window !== 'undefined' && 'PerformanceObserver' in window) {
      try {
        this.performanceObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const longTasks = entries.filter(entry => entry.duration > 50);
          
          if (longTasks.length > 3) {
            // Too many long tasks, reduce animation complexity
            const currentConfig = this.getCurrentConfig();
            if (currentConfig.performanceMode === 'smooth') {
              this.setPerformanceMode('fast');
              console.log('⚡ Performance issues detected, switching to fast animations');
            }
          }
        });

        this.performanceObserver.observe({ entryTypes: ['longtask'] });
      } catch (error) {
        console.warn('Performance monitoring not available:', error);
      }
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
          console.log('🎬 Loaded animation preferences:', config);
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
    this.applyGlobalAnimationStyles(updatedConfig);
    
    console.log('🎭 Animation config updated:', updatedConfig);
  }

  /**
   * Set reduced motion preference
   */
  setReducedMotion(enabled: boolean): void {
    this.updateConfig({ 
      reducedMotion: enabled,
      transitionDuration: enabled ? 150 : 500,
      performanceMode: enabled ? 'fast' : 'smooth'
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
  setAnimationType(type: 'slide' | 'fade' | 'zoom' | 'vertical' | 'flip'): void {
    this.updateConfig({ animationType: type });
  }

  /**
   * Set performance mode
   */
  setPerformanceMode(mode: 'smooth' | 'fast' | 'disabled'): void {
    const duration = mode === 'smooth' ? 500 : mode === 'fast' ? 250 : 0;
    this.updateConfig({ 
      performanceMode: mode,
      transitionDuration: duration,
      enabled: mode !== 'disabled'
    });
  }

  /**
   * Set transition duration
   */
  setTransitionDuration(duration: number): void {
    this.updateConfig({ 
      transitionDuration: Math.max(0, Math.min(1000, duration)) 
    });
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
    return config.enabled && !config.reducedMotion && config.performanceMode !== 'disabled';
  }

  /**
   * Get animation duration based on current settings
   */
  getAnimationDuration(multiplier: number = 1): number {
    const config = this.getCurrentConfig();
    if (config.reducedMotion || config.performanceMode === 'disabled') {
      return 0;
    }
    
    const baseDuration = config.performanceMode === 'fast' ? 250 : config.transitionDuration;
    return Math.round(baseDuration * multiplier);
  }

  /**
   * Get stagger delay for list animations
   */
  getStaggerDelay(index: number, customDelay?: number): number {
    const config = this.getCurrentConfig();
    if (!this.shouldAnimate()) return 0;
    
    const delay = customDelay || config.staggerDelay;
    const performanceMultiplier = config.performanceMode === 'fast' ? 0.5 : 1;
    
    return Math.round(index * delay * performanceMultiplier);
  }

  /**
   * Apply global CSS variables for consistent animation timing
   */
  private applyGlobalAnimationStyles(config: AnimationConfig): void {
    if (typeof document !== 'undefined') {
      const root = document.documentElement;
      
      const duration = this.getAnimationDuration();
      const fastDuration = Math.round(duration * 0.5);
      const slowDuration = Math.round(duration * 1.5);
      
      root.style.setProperty('--animation-duration', `${duration}ms`);
      root.style.setProperty('--animation-duration-fast', `${fastDuration}ms`);
      root.style.setProperty('--animation-duration-slow', `${slowDuration}ms`);
      root.style.setProperty('--stagger-delay', `${config.staggerDelay}ms`);
      
      // Performance-based easing
      const easing = config.performanceMode === 'fast' 
        ? 'cubic-bezier(0.25, 0.46, 0.45, 0.94)' // Faster easing
        : 'cubic-bezier(0.35, 0, 0.25, 1)'; // Smoother easing
        
      root.style.setProperty('--animation-easing', easing);
      
      // Add performance class to body
      document.body.classList.remove('performance-smooth', 'performance-fast', 'performance-disabled');
      document.body.classList.add(`performance-${config.performanceMode}`);
      
      if (config.reducedMotion) {
        document.body.classList.add('reduced-motion');
      } else {
        document.body.classList.remove('reduced-motion');
      }
    }
  }

  /**
   * Get appropriate easing function based on performance mode
   */
  getEasingFunction(type: 'ease-in' | 'ease-out' | 'ease-in-out' | 'bounce' = 'ease-out'): string {
    const config = this.getCurrentConfig();
    
    const easingFunctions = {
      fast: {
        'ease-in': 'cubic-bezier(0.4, 0, 1, 1)',
        'ease-out': 'cubic-bezier(0, 0, 0.2, 1)',
        'ease-in-out': 'cubic-bezier(0.4, 0, 0.2, 1)',
        'bounce': 'cubic-bezier(0.25, 0.46, 0.45, 0.94)'
      },
      smooth: {
        'ease-in': 'cubic-bezier(0.4, 0, 1, 1)',
        'ease-out': 'cubic-bezier(0, 0, 0.2, 1)',
        'ease-in-out': 'cubic-bezier(0.4, 0, 0.2, 1)',
        'bounce': 'cubic-bezier(0.68, -0.55, 0.265, 1.55)'
      }
    };
    
    const mode = config.performanceMode === 'disabled' ? 'fast' : config.performanceMode;
    return easingFunctions[mode][type];
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
   * Create a smooth transition between pages
   */
  createPageTransition(
    enteringElement: HTMLElement,
    leavingElement?: HTMLElement,
    animationType?: string
  ): Promise<void> {
    return new Promise((resolve) => {
      if (!this.shouldAnimate()) {
        resolve();
        return;
      }

      const config = this.getCurrentConfig();
      const duration = this.getAnimationDuration();
      const type = animationType || config.animationType;

      const animations: Animation[] = [];

      // Animate leaving element
      if (leavingElement) {
        const leaveKeyframes = this.getLeaveKeyframes(type);
        const leaveAnimation = this.animateElement(leavingElement, leaveKeyframes, { 
          duration: duration * 0.6 
        });
        
        if (leaveAnimation) {
          animations.push(leaveAnimation);
        }
      }

      // Animate entering element
      setTimeout(() => {
        const enterKeyframes = this.getEnterKeyframes(type);
        const enterAnimation = this.animateElement(enteringElement, enterKeyframes, { 
          duration 
        });
        
        if (enterAnimation) {
          animations.push(enterAnimation);
          enterAnimation.addEventListener('finish', () => resolve());
        } else {
          resolve();
        }
      }, leavingElement ? duration * 0.3 : 0);

      // Fallback resolve
      setTimeout(resolve, duration * 2);
    });
  }

  /**
   * Get enter keyframes based on animation type
   */
  private getEnterKeyframes(type: string): Keyframe[] {
    const keyframes = {
      slide: [
        { opacity: 0, transform: 'translateX(100%) translateZ(0)' },
        { opacity: 1, transform: 'translateX(0) translateZ(0)' }
      ],
      fade: [
        { opacity: 0, transform: 'scale(0.95) translateZ(0)' },
        { opacity: 1, transform: 'scale(1) translateZ(0)' }
      ],
      zoom: [
        { opacity: 0, transform: 'scale(0.8) translateZ(0)' },
        { opacity: 1, transform: 'scale(1) translateZ(0)' }
      ],
      vertical: [
        { opacity: 0, transform: 'translateY(50px) translateZ(0)' },
        { opacity: 1, transform: 'translateY(0) translateZ(0)' }
      ],
      flip: [
        { opacity: 0, transform: 'rotateY(180deg) translateZ(0)' },
        { opacity: 1, transform: 'rotateY(0deg) translateZ(0)' }
      ]
    };

    return keyframes[type as keyof typeof keyframes] || keyframes.slide;
  }

  /**
   * Get leave keyframes based on animation type
   */
  private getLeaveKeyframes(type: string): Keyframe[] {
    const keyframes = {
      slide: [
        { opacity: 1, transform: 'translateX(0) translateZ(0)' },
        { opacity: 0, transform: 'translateX(-30%) translateZ(0)' }
      ],
      fade: [
        { opacity: 1, transform: 'scale(1) translateZ(0)' },
        { opacity: 0, transform: 'scale(1.05) translateZ(0)' }
      ],
      zoom: [
        { opacity: 1, transform: 'scale(1) translateZ(0)' },
        { opacity: 0, transform: 'scale(1.2) translateZ(0)' }
      ],
      vertical: [
        { opacity: 1, transform: 'translateY(0) translateZ(0)' },
        { opacity: 0, transform: 'translateY(-50px) translateZ(0)' }
      ],
      flip: [
        { opacity: 1, transform: 'rotateY(0deg) translateZ(0)' },
        { opacity: 0, transform: 'rotateY(-180deg) translateZ(0)' }
      ]
    };

    return keyframes[type as keyof typeof keyframes] || keyframes.slide;
  }

  /**
   * Cleanup method
   */
  destroy(): void {
    if (this.performanceObserver) {
      this.performanceObserver.disconnect();
    }
  }
}