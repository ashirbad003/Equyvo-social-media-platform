interface NetworkConnection {
  effectiveType?: string;
  downlink?: number;
  rtt?: number;
  saveData?: boolean;
}

interface NavigatorWithConnection extends Navigator {
  connection?: NetworkConnection;
  mozConnection?: NetworkConnection;
  webkitConnection?: NetworkConnection;
  msMaxTouchPoints?: number;
}

declare global {
  interface Window {
    webkitAudioContext?: typeof AudioContext;
  }
}

/**
 * Platform detection utilities for cross-platform compatibility
 */

export interface PlatformInfo {
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  isIOS: boolean;
  isAndroid: boolean;
  isSafari: boolean;
  isChrome: boolean;
  isFirefox: boolean;
  isEdge: boolean;
  isWeb: boolean;
  isNative: boolean;
  platform: string;
  userAgent: string;
}

/**
 * Get comprehensive platform information
 */
export const getPlatformInfo = (): PlatformInfo => {
  const userAgent = typeof navigator !== 'undefined' ? navigator.userAgent : '';
  const platform = typeof navigator !== 'undefined' ? navigator.platform : '';

  // Mobile detection
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
  
  // Tablet detection (more specific than mobile)
  const isTablet = /iPad|Android(?!.*Mobile)|Tablet/i.test(userAgent);
  
  // Desktop detection
  const isDesktop = !isMobile && !isTablet;
  
  // OS detection
  const isIOS = /iPhone|iPad|iPod/i.test(userAgent);
  const isAndroid = /Android/i.test(userAgent);
  
  // Browser detection
  const isSafari = /Safari/i.test(userAgent) && !/Chrome/i.test(userAgent);
  const isChrome = /Chrome/i.test(userAgent) && !/Edge/i.test(userAgent);
  const isFirefox = /Firefox/i.test(userAgent);
  const isEdge = /Edge/i.test(userAgent);
  
  // Web vs Native detection
  const isWeb = typeof window !== 'undefined' && typeof document !== 'undefined';
  const isNative = !isWeb;

  return {
    isMobile,
    isTablet,
    isDesktop,
    isIOS,
    isAndroid,
    isSafari,
    isChrome,
    isFirefox,
    isEdge,
    isWeb,
    isNative,
    platform,
    userAgent
  };
};

/**
 * Check if device supports touch events
 */
export const isTouchDevice = (): boolean => {
  if (typeof window === 'undefined') return false;
  
  return (
    'ontouchstart' in window ||
    navigator.maxTouchPoints > 0 ||
    (navigator as NavigatorWithConnection).msMaxTouchPoints > 0
  );
};

/**
 * Get device pixel ratio for high-DPI displays
 */
export const getDevicePixelRatio = (): number => {
  if (typeof window === 'undefined') return 1;
  
  return window.devicePixelRatio || 1;
};

/**
 * Check if device supports specific features
 */
export const getDeviceCapabilities = () => {
  const platform = getPlatformInfo();
  
  return {
    supportsWebGL: (() => {
      try {
        const canvas = document.createElement('canvas');
        return !!(window.WebGLRenderingContext && 
          (canvas.getContext('webgl') || canvas.getContext('experimental-webgl')));
      } catch (e) {
        return false;
      }
    })(),
    
    supportsWebAudio: typeof AudioContext !== 'undefined' || typeof (window as Window).webkitAudioContext !== 'undefined',
    
    supportsFullscreen: !!(
      document.fullscreenEnabled || 
      (document as Document & { webkitFullscreenEnabled?: boolean }).webkitFullscreenEnabled || 
      (document as Document & { mozFullScreenEnabled?: boolean }).mozFullScreenEnabled ||
      (document as Document & { msFullscreenEnabled?: boolean }).msFullscreenEnabled
    ),
    
    supportsWebP: (() => {
      try {
        const canvas = document.createElement('canvas');
        return canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0;
      } catch (e) {
        return false;
      }
    })(),
    
    supportsPictureInPicture: 'pictureInPictureEnabled' in document,
    
    supportsGeolocation: 'geolocation' in navigator,
    
    supportsCamera: !!(
      navigator.mediaDevices && 
      navigator.mediaDevices.getUserMedia
    ),
    
    supportsVibration: 'vibrate' in navigator,
    
    maxTouchPoints: navigator.maxTouchPoints || 0,
    
    isTouchDevice: isTouchDevice(),
    
    devicePixelRatio: getDevicePixelRatio(),
    // Platform-specific optimizations
    prefersReducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    
    prefersDarkMode: window.matchMedia('(prefers-color-scheme: dark)').matches,
    
    // Connection info if available
    connection: (navigator as NavigatorWithConnection).connection || (navigator as NavigatorWithConnection).mozConnection || (navigator as NavigatorWithConnection).webkitConnection,
    
    // Battery API if available
    battery: 'getBattery' in navigator,
    
    ...platform
  };
};

/**
 * Platform-specific optimizations
 */
export const getPlatformOptimizations = () => {
  const capabilities = getDeviceCapabilities();
  
  return {
    // Video optimizations
    video: {
      autoplay: !capabilities.isIOS || capabilities.isSafari, // iOS Safari blocks autoplay
      muted: capabilities.isMobile, // Mobile devices often require muted autoplay
      playsInline: capabilities.isMobile, // Mobile devices prefer inline playback
      controls: capabilities.isDesktop, // Desktop shows controls by default
      preload: capabilities.isMobile ? 'metadata' : 'auto', // Mobile uses less bandwidth
      quality: capabilities.isMobile ? 'medium' : 'high' // Lower quality for mobile
    },
    
    // Image optimizations
    image: {
      format: capabilities.supportsWebP ? 'webp' : 'jpeg', // Use WebP if supported
      quality: capabilities.isMobile ? 0.8 : 0.9, // Lower quality for mobile
      lazy: true, // Always lazy load images
      responsive: true // Always use responsive images
    },
    
    // Animation optimizations
    animation: {
      reduced: capabilities.prefersReducedMotion,
      duration: capabilities.isMobile ? 200 : 300, // Shorter animations on mobile
      easing: capabilities.isMobile ? 'ease-out' : 'ease-in-out'
    },
    
    // Touch optimizations
    touch: {
      enabled: capabilities.isTouchDevice,
      tapDelay: capabilities.isIOS ? 300 : 0, // iOS has 300ms tap delay
      longPressDelay: 500,
      swipeThreshold: 50,
      pinchZoom: capabilities.isMobile
    },
    
    // Performance optimizations
    performance: {
      virtualScrolling: capabilities.isMobile,
      debounceMs: capabilities.isMobile ? 300 : 150, // Longer debounce on mobile
      throttleMs: capabilities.isMobile ? 100 : 16, // 60fps on desktop, 10fps on mobile
      batchSize: capabilities.isMobile ? 10 : 50, // Smaller batches on mobile
      maxConcurrentRequests: capabilities.isMobile ? 2 : 6
    }
  };
};

/**
 * Get platform-specific CSS classes
 */
export const getPlatformClasses = () => {
  const platform = getPlatformInfo();
  const capabilities = getDeviceCapabilities();
  
  const classes = [];
  
  // Platform classes
  if (platform.isMobile) classes.push('platform-mobile');
  if (platform.isTablet) classes.push('platform-tablet');
  if (platform.isDesktop) classes.push('platform-desktop');
  if (platform.isIOS) classes.push('platform-ios');
  if (platform.isAndroid) classes.push('platform-android');
  if (platform.isWeb) classes.push('platform-web');
  if (platform.isNative) classes.push('platform-native');
  
  // Browser classes
  if (platform.isSafari) classes.push('browser-safari');
  if (platform.isChrome) classes.push('browser-chrome');
  if (platform.isFirefox) classes.push('browser-firefox');
  if (platform.isEdge) classes.push('browser-edge');
  
  // Capability classes
  if (capabilities.isTouchDevice) classes.push('touch-enabled');
  if (capabilities.supportsWebGL) classes.push('webgl-enabled');
  if (capabilities.supportsWebAudio) classes.push('webaudio-enabled');
  if (capabilities.supportsFullscreen) classes.push('fullscreen-enabled');
  if (capabilities.supportsPictureInPicture) classes.push('pip-enabled');
  if (capabilities.prefersReducedMotion) classes.push('reduced-motion');
  if (capabilities.prefersDarkMode) classes.push('dark-mode-preferred');
  
  // DPI classes
  if (capabilities.devicePixelRatio > 1) {
    classes.push('high-dpi');
    if (capabilities.devicePixelRatio > 2) classes.push('ultra-high-dpi');
  }
  
  return classes.join(' ');
};

/**
 * Apply platform classes to document element
 */
export const applyPlatformClasses = () => {
  if (typeof document === 'undefined') return;
  
  const classes = getPlatformClasses();
  document.documentElement.className = document.documentElement.className
    .split(' ')
    .filter(cls => !cls.startsWith('platform-') && !cls.startsWith('browser-') && !cls.startsWith('touch-') && !cls.includes('-enabled') && !cls.includes('dpi'))
    .concat(classes.split(' '))
    .join(' ')
    .trim();
};

export default {
  getPlatformInfo,
  isTouchDevice,
  getDevicePixelRatio,
  getDeviceCapabilities,
  getPlatformOptimizations,
  getPlatformClasses,
  applyPlatformClasses
};
