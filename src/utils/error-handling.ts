/**
 * Comprehensive error handling utilities
 */

export interface ErrorReport {
  error: Error;
  context?: string;
  component?: string;
  userId?: string;
  timestamp: Date;
  platform?: string;
  userAgent?: string;
  url?: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

/**
 * Enhanced error boundary for catching and reporting errors
 */
export class AppError extends Error {
  public readonly code: string;
  public readonly severity: 'low' | 'medium' | 'high' | 'critical';
  public readonly context?: string;
  public readonly recoverable: boolean;

  constructor(
    message: string,
    code: string = 'UNKNOWN_ERROR',
    severity: 'low' | 'medium' | 'high' | 'critical' = 'medium',
    context?: string,
    recoverable: boolean = true
  ) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.severity = severity;
    this.context = context;
    this.recoverable = recoverable;
    
    // Maintains proper stack trace for where our error was thrown
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, AppError);
    }
  }
}

/**
 * Create specific error types
 */
export const createError = {
  network: (message: string, context?: string) => 
    new AppError(message, 'NETWORK_ERROR', 'high', context, true),
  
  auth: (message: string, context?: string) => 
    new AppError(message, 'AUTH_ERROR', 'high', context, false),
  
  validation: (message: string, context?: string) => 
    new AppError(message, 'VALIDATION_ERROR', 'low', context, true),
  
  media: (message: string, context?: string) => 
    new AppError(message, 'MEDIA_ERROR', 'medium', context, true),
  
  storage: (message: string, context?: string) => 
    new AppError(message, 'STORAGE_ERROR', 'medium', context, true),
  
  permission: (message: string, context?: string) => 
    new AppError(message, 'PERMISSION_ERROR', 'high', context, false),
  
  critical: (message: string, context?: string) => 
    new AppError(message, 'CRITICAL_ERROR', 'critical', context, false)
};

/**
 * Error reporting service
 */
class ErrorReportingService {
  private errors: ErrorReport[] = [];
  private maxErrors = 100; // Keep last 100 errors
  private reportingEndpoint?: string;

  constructor() {
    // Setup global error handlers
    this.setupGlobalHandlers();
  }

  private setupGlobalHandlers() {
    // Catch unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      this.reportError(
        new AppError(
          event.reason?.message || 'Unhandled Promise Rejection',
          'UNHANDLED_PROMISE',
          'high',
          'Global Promise Handler'
        )
      );
    });

    // Catch uncaught errors
    window.addEventListener('error', (event) => {
      this.reportError(
        new AppError(
          event.message,
          'UNCAUGHT_ERROR',
          'critical',
          'Global Error Handler'
        )
      );
    });
  }

  setReportingEndpoint(endpoint: string) {
    this.reportingEndpoint = endpoint;
  }

  reportError(error: Error | AppError, context?: string, component?: string) {
    const errorReport: ErrorReport = {
      error: error instanceof AppError ? error : new AppError(error.message, 'UNKNOWN'),
      context,
      component,
      timestamp: new Date(),
      platform: navigator.platform,
      userAgent: navigator.userAgent,
      url: window.location.href,
      severity: error instanceof AppError ? error.severity : 'medium'
    };

    // Add to local storage for debugging
    this.errors.push(errorReport);
    if (this.errors.length > this.maxErrors) {
      this.errors.shift();
    }

    // Log to console with appropriate level
    this.logError(errorReport);

    // Send to external service in production
    if (process.env.NODE_ENV === 'production' && this.reportingEndpoint) {
      this.sendToService(errorReport);
    }

    // Show user-friendly message for critical errors
    if (errorReport.severity === 'critical') {
      this.showCriticalErrorNotification(errorReport);
    }
  }

  private logError(report: ErrorReport) {
    const { error, context, component, severity } = report;
    const message = `[${severity.toUpperCase()}] ${context ? `${context}: ` : ''}${error.message}`;
    
    switch (severity) {
      case 'critical':
        console.error(message, error);
        break;
      case 'high':
        console.error(message, error);
        break;
      case 'medium':
        console.warn(message, error);
        break;
      case 'low':
        console.info(message, error);
        break;
    }

    if (component) {
      console.info(`Component: ${component}`);
    }
  }

  private async sendToService(report: ErrorReport) {
    if (!this.reportingEndpoint) return;

    try {
      await fetch(this.reportingEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(report)
      });
    } catch {
    }
  }

  private showCriticalErrorNotification(report: ErrorReport) {
    // Create a user-friendly notification
    const notification = document.createElement('div');
    notification.className = 'fixed top-4 right-4 bg-red-500 text-white p-4 rounded-lg shadow-lg z-50 max-w-sm';
    notification.innerHTML = `
      <div class="flex items-start gap-3">
        <div class="flex-shrink-0">
          <svg class="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"/>
          </svg>
        </div>
        <div class="flex-1">
          <h4 class="font-semibold">Something went wrong</h4>
          <p class="text-sm mt-1">We're sorry, but something unexpected happened. The error has been reported.</p>
        </div>
        <button onclick="this.parentElement.parentElement.remove()" class="flex-shrink-0 ml-2">
          <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"/>
          </svg>
        </button>
      </div>
    `;

    document.body.appendChild(notification);

    // Auto-remove after 10 seconds
    setTimeout(() => {
      if (notification.parentElement) {
        notification.remove();
      }
    }, 10000);
  }

  getErrors(): ErrorReport[] {
    return [...this.errors];
  }

  clearErrors() {
    this.errors = [];
  }

  getErrorStats() {
    const stats = {
      total: this.errors.length,
      bySeverity: {} as Record<string, number>,
      byCode: {} as Record<string, number>,
      recent: this.errors.filter(e => 
        Date.now() - e.timestamp.getTime() < 24 * 60 * 60 * 1000 // Last 24 hours
      ).length
    };

    this.errors.forEach(error => {
      stats.bySeverity[error.severity] = (stats.bySeverity[error.severity] || 0) + 1;
      const code = error.error instanceof AppError ? error.error.code : 'UNKNOWN';
      stats.byCode[code] = (stats.byCode[code] || 0) + 1;
    });

    return stats;
  }
}

// Global error reporting instance
export const errorReporter = new ErrorReportingService();

/**
 * Utility functions for common error scenarios
 */
export const handleAsyncError = async <T>(
  asyncFn: () => Promise<T>,
  context?: string,
  fallback?: T
): Promise<T | undefined> => {
  try {
    return await asyncFn();
  } catch (error) {
    errorReporter.reportError(
      error instanceof Error ? error : new Error(String(error)),
      context
    );
    return fallback;
  }
};

export const safeExecute = <T>(
  fn: () => T,
  context?: string,
  fallback?: T
): T | undefined => {
  try {
    return fn();
  } catch (error) {
    errorReporter.reportError(
      error instanceof Error ? error : new Error(String(error)),
      context
    );
    return fallback;
  }
};

/**
 * Retry utility for flaky operations
 */
export const retry = async <T>(
  fn: () => Promise<T>,
  maxAttempts: number = 3,
  delay: number = 1000,
  context?: string
): Promise<T> => {
  let lastError: Error;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      
      if (attempt === maxAttempts) {
        errorReporter.reportError(
          createError.network(
            `Failed after ${maxAttempts} attempts: ${lastError.message}`,
            context
          )
        );
        throw lastError;
      }

      // Exponential backoff
      const backoffDelay = delay * Math.pow(2, attempt - 1);
      await new Promise(resolve => setTimeout(resolve, backoffDelay));
    }
  }

  throw lastError!;
};

/**
 * Circuit breaker for preventing cascading failures
 */
export class CircuitBreaker {
  private failures = 0;
  private lastFailureTime = 0;
  private state: 'CLOSED' | 'OPEN' | 'HALF_OPEN' = 'CLOSED';

  constructor(
    private threshold: number = 5,
    private timeout: number = 60000, // 1 minute
    private context?: string
  ) {}

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === 'OPEN') {
      if (Date.now() - this.lastFailureTime > this.timeout) {
        this.state = 'HALF_OPEN';
      } else {
        throw createError.network(
          'Circuit breaker is OPEN',
          this.context
        );
      }
    }

    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private onSuccess() {
    this.failures = 0;
    this.state = 'CLOSED';
  }

  private onFailure() {
    this.failures++;
    this.lastFailureTime = Date.now();

    if (this.failures >= this.threshold) {
      this.state = 'OPEN';
      errorReporter.reportError(
        createError.network(
          `Circuit breaker opened after ${this.failures} failures`,
          this.context
        )
      );
    }
  }

  getState() {
    return this.state;
  }

  reset() {
    this.failures = 0;
    this.state = 'CLOSED';
  }
}

export default {
  AppError,
  createError,
  errorReporter,
  handleAsyncError,
  safeExecute,
  retry,
  CircuitBreaker
};
