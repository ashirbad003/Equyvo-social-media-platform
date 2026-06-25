import React, { Component, ErrorInfo, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

// Wrapper component to use hooks
const ErrorBoundaryWithNavigation: React.FC<Props> = ({ children }) => {
  // Try to use navigate, but fall back to window.location if not in Router context
  let navigate: (path: string) => void;
  try {
    const navigateHook = useNavigate();
    navigate = navigateHook;
  } catch {
    // Fallback for when not in Router context
    navigate = (path: string) => {
      window.location.href = path;
    };
  }
  return <ErrorBoundary navigate={navigate}>{children}</ErrorBoundary>;
};

class ErrorBoundary extends Component<Props & { navigate?: any }, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
          <Card className="w-full max-w-lg">
            <CardHeader className="text-center">
              <div className="mx-auto w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mb-4">
                <AlertTriangle className="w-8 h-8 text-destructive" />
              </div>
              <CardTitle className="text-2xl">Something went wrong</CardTitle>
              <p className="text-muted-foreground">
                We're sorry, but something unexpected happened. The error has been logged.
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              {process.env.NODE_ENV === 'development' && this.state.error && (
                <details className="bg-destructive/5 border border-destructive/20 rounded-lg p-3">
                  <summary className="cursor-pointer text-destructive font-mono text-sm font-medium">
                    Error Details (Dev Only)
                  </summary>
                  <pre className="text-destructive/80 text-xs mt-2 whitespace-pre-wrap font-mono">
                    {this.state.error.toString()}
                  </pre>
                </details>
              )}
              
              <div className="flex flex-col sm:flex-row gap-2">
                <Button 
                  onClick={() => window.location.reload()} 
                  className="flex-1"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Reload App
                </Button>
                <Button 
                  onClick={() => this.setState({ hasError: false, error: undefined })} 
                  variant="outline"
                  className="flex-1"
                >
                  Try Again
                </Button>
              </div>
              
              <Button 
                onClick={() => this.props.navigate?.('/')} 
                variant="ghost"
                className="w-full"
              >
                <Home className="w-4 h-4 mr-2" />
                Go Home
              </Button>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundaryWithNavigation;
