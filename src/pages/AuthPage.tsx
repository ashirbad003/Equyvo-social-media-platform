import React from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { signUpWithEmail, signInWithEmail, checkAuthStatus, resendConfirmation, storeCurrentUser } from '@/lib/auth';
import { showSuccess, showError } from '@/utils/toast';
import { Checkbox } from "@/components/ui/checkbox";

const ensureDarkTheme = () => {
  const root = window.document.documentElement;
  if (!root.classList.contains('dark')) {
    root.classList.add('dark');
    localStorage.setItem('theme', 'dark');
  }
};

const AuthPage = () => {
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [isSigningUp, setIsSigningUp] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);
  const [bypassEmail, setBypassEmail] = React.useState(false);

  React.useEffect(() => {
    ensureDarkTheme();
    
    // Check if user is already authenticated
    const checkAuth = async () => {
      try {
        const authStatus = await checkAuthStatus();
        if (authStatus.isAuthenticated && authStatus.user) {
          window.location.href = '/app/home';
        }
      } catch {
        // Auth check failed silently
      }
    };
    
    checkAuth();
  }, []);

  const handleResendConfirmation = async () => {
    if (!email) {
      showError("Please enter your email address first.");
      return;
    }

    setIsLoading(true);
    
    try {
      const result = await resendConfirmation(email);
      if (result.success) {
        showSuccess("Confirmation email resent! Please check your inbox.");
      } else {
        if (result.error?.includes('rate limit')) {
          showError("Too many attempts. Please wait a few minutes before trying again.");
        } else {
          showError(result.error || "Failed to resend confirmation email.");
        }
      }
    } catch (error: any) {
      showError(error.message || "An unexpected error occurred.");
    }
    
    setIsLoading(false);
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (isSigningUp) {
        const result = await signUpWithEmail(email, password);
        
        if (result.success) {
          if (result.userConfirmed) {
            // User is automatically signed in
            const signInResult = await signInWithEmail(email, password);
            if (signInResult.success && signInResult.user) {
              storeCurrentUser(signInResult.user);
            }
            window.location.href = '/app/home';
          } else {
            if (bypassEmail) {
              // Try to sign in immediately (for development)
              const signInResult = await signInWithEmail(email, password);
              if (signInResult.success) {
                if (signInResult.user) {
                  storeCurrentUser(signInResult.user);
                }
                window.location.href = '/app/home';
              } else {
                showError(signInResult.error || "Failed to sign in.");
              }
            } else {
              showSuccess("Account created! Please check your email for confirmation.");
            }
          }
        } else {
          if (result.error?.includes('rate limit')) {
            showError("Too many signup attempts. Please wait a few minutes.");
          } else {
            showError(result.error || "Failed to create account.");
          }
        }
      } else {
        const result = await signInWithEmail(email, password);
        
        if (result.success) {
          if (result.user) {
            storeCurrentUser(result.user);
          }
          window.location.href = '/app/home';
        } else {
          if (result.error?.includes('not confirmed') || result.error?.includes('confirmed')) {
            showError("Please check your email and confirm your account.");
          } else {
            showError(result.error || "Failed to sign in.");
          }
        }
      }
    } catch (error: any) {
      showError("An unexpected error occurred.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-background relative overflow-hidden">
      {/* Background Gradients */}
      <div className="absolute top-[-20%] left-[-20%] w-[50%] h-[50%] bg-blue-600/20 blur-[100px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-20%] w-[50%] h-[50%] bg-purple-600/20 blur-[100px] rounded-full pointer-events-none" />

      <Card className="w-full max-w-md p-6 border-white/10 bg-black/40 backdrop-blur-xl shadow-2xl relative z-10">
        <CardHeader className="text-center pb-2">
          <div className="w-24 h-24 mx-auto mb-6 rounded-2xl overflow-hidden shadow-lg ring-2 ring-white/10">
            <img src="/Equyvo_logo.png" alt="Equyvo Logo" className="w-full h-full object-cover" />
          </div>
          <CardTitle className="text-4xl font-black tracking-tight mb-2 bg-clip-text text-transparent bg-gradient-to-r from-pink-400 via-purple-500 to-cyan-400 leading-[2.5] py-3" style={{ fontFamily: "'Pacifico', cursive", overflow: 'visible' }}>
            equyvo
          </CardTitle>
          <CardDescription className="text-lg">
            {isSigningUp ? "Join the conversation" : "Welcome back"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <form onSubmit={handleAuth} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="hello@equyvo.app"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-white/5 border-white/10 focus:border-blue-500/50 transition-all h-12"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="bg-white/5 border-white/10 focus:border-blue-500/50 transition-all h-12"
              />
            </div>

            {isSigningUp && (
              <div className="flex items-center space-x-2 py-2">
                <Checkbox
                  id="bypass-email"
                  checked={bypassEmail}
                  onCheckedChange={(checked) => setBypassEmail(checked as boolean)}
                  className="border-white/20 data-[state=checked]:bg-blue-500 data-[state=checked]:border-blue-500"
                />
                <Label htmlFor="bypass-email" className="text-xs text-muted-foreground font-normal">
                  Bypass confirmation (Dev Mode)
                </Label>
              </div>
            )}

            <Button type="submit" className="w-full h-12 text-lg font-bold bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg hover:shadow-blue-500/25" disabled={isLoading}>
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Processing...
                </div>
              ) : (isSigningUp ? "Create Account" : "Sign In")}
            </Button>
          </form>

          <div className="text-center space-y-4">
            <p className="text-sm text-muted-foreground">
              {isSigningUp ? "Already have an account?" : "New to Equyvo?"}{" "}
              <button onClick={() => setIsSigningUp(!isSigningUp)} className="text-blue-400 hover:text-blue-300 font-semibold hover:underline transition-colors ml-1">
                {isSigningUp ? "Sign In" : "Sign Up"}
              </button>
            </p>

            {!isSigningUp && (
              <button
                onClick={handleResendConfirmation}
                className="text-xs text-muted-foreground hover:text-white transition-colors"
                disabled={isLoading || !email}
              >
                Resend confirmation email
              </button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AuthPage;