import { useState, useEffect, useCallback } from 'react';
import { getPlatformOptimizations, getPlatformInfo, getDeviceCapabilities } from '../utils/platform-detection';

/**
 * Hook for platform-specific optimizations
 */
export const usePlatformOptimizations = () => {
  const [platformInfo] = useState(() => getPlatformInfo());
  const [deviceCapabilities] = useState(() => getDeviceCapabilities());
  const [optimizations] = useState(() => getPlatformOptimizations());

  // Debounce function optimized for platform
  const debounce = useCallback((
    func: (...args: any[]) => void,
    wait: number = optimizations.performance.debounceMs
  ) => {
    let timeout: NodeJS.Timeout;
    return function executedFunction(...args: any[]) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }, [optimizations.performance.debounceMs]);

  // Throttle function optimized for platform
  const throttle = useCallback((
    func: (...args: any[]) => void,
    limit: number = optimizations.performance.throttleMs
  ) => {
    let inThrottle: boolean;
    return function executedFunction(...args: any[]) {
      if (!inThrottle) {
        func.apply(this, args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  }, [optimizations.performance.throttleMs]);

  // Optimized scroll handler
  const useOptimizedScroll = useCallback((
    handler: (event: Event) => void,
    element?: HTMLElement | Window
  ) => {
    const throttledHandler = throttle(handler);
    
    // Return a function that sets up the effect
    return () => {
      const target = element || window;
      target.addEventListener('scroll', throttledHandler, { passive: true });
      return () => target.removeEventListener('scroll', throttledHandler);
    };
  }, [throttle]);

  // Optimized resize handler
  const useOptimizedResize = useCallback((
    handler: (event: Event) => void
  ) => {
    const debouncedHandler = debounce(handler);
    
    // Return a function that sets up the effect
    return () => {
      window.addEventListener('resize', debouncedHandler, { passive: true });
      return () => window.removeEventListener('resize', debouncedHandler);
    };
  }, [debounce]);

  // Optimized touch handlers
  const getTouchHandlers = useCallback((onTap?: () => void, onLongPress?: () => void) => {
    if (!deviceCapabilities.isTouchDevice) {
      return {
        onClick: onTap
      };
    }

    let timer: NodeJS.Timeout;
    let isLongPress = false;

    const handleTouchStart = () => {
      isLongPress = false;
      timer = setTimeout(() => {
        isLongPress = true;
        onLongPress?.();
      }, optimizations.touch.longPressDelay);
    };

    const handleTouchEnd = (e: React.TouchEvent) => {
      clearTimeout(timer);
      if (!isLongPress) {
        onTap?.();
      }
    };

    const handleTouchMove = () => {
      clearTimeout(timer);
    };

    return {
      onTouchStart: handleTouchStart,
      onTouchEnd: handleTouchEnd,
      onTouchMove: handleTouchMove
    };
  }, [deviceCapabilities.isTouchDevice, optimizations.touch.longPressDelay]);

  // Video optimization settings
  const getVideoProps = useCallback((overrides: any = {}) => {
    return {
      ...optimizations.video,
      ...overrides,
      // Platform-specific overrides
      ...(platformInfo.isIOS && {
        playsInline: true,
        controls: false, // iOS custom controls work better
      }),
      ...(platformInfo.isAndroid && {
        controls: true, // Android prefers native controls
      })
    };
  }, [optimizations.video, platformInfo]);

  // Image optimization settings
  const getImageProps = useCallback((src: string, overrides: any = {}) => {
    return {
      src,
      loading: 'lazy' as const,
      decoding: 'async' as const,
      ...optimizations.image,
      ...overrides
    };
  }, [optimizations.image]);

  // Animation settings
  const getAnimationProps = useCallback((overrides: any = {}) => {
    return {
      ...optimizations.animation,
      ...overrides,
      // Respect user preferences
      ...(deviceCapabilities.prefersReducedMotion && {
        duration: 0,
        easing: 'linear'
      })
    };
  }, [optimizations.animation, deviceCapabilities.prefersReducedMotion]);

  // Performance monitoring
  const measurePerformance = useCallback((name: string, fn: () => void) => {
    if (process.env.NODE_ENV !== 'production') {
      const start = performance.now();
      const result = fn();
      const end = performance.now();
      return result;
    }
    return fn();
  }, []);

  // Network-aware loading
  const shouldLoadHighQuality = useCallback(() => {
    const connection = deviceCapabilities.connection;
    if (!connection) return !platformInfo.isMobile; // Fallback to platform detection
    
    // Load high quality on fast connections
    return connection.effectiveType === '4g' || connection.downlink > 2;
  }, [deviceCapabilities.connection, platformInfo.isMobile]);

  // Memory management
  const cleanup = useCallback(() => {
    // Force garbage collection hints for mobile
    if (platformInfo.isMobile && 'gc' in window) {
      (window as any).gc();
    }
  }, [platformInfo.isMobile]);

  return {
    // Platform info
    platformInfo,
    deviceCapabilities,
    optimizations,
    
    // Utility functions
    debounce,
    throttle,
    measurePerformance,
    shouldLoadHighQuality,
    cleanup,
    
    // Hooks
    useOptimizedScroll,
    useOptimizedResize,
    getTouchHandlers,
    
    // Component props
    getVideoProps,
    getImageProps,
    getAnimationProps
  };
};

export default usePlatformOptimizations;
