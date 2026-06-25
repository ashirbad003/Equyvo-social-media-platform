import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import { ThemeProvider } from './components/theme-provider';
import { ChatThemeProvider } from './contexts/ChatThemeContext';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import { Toaster } from './components/ui/sonner';
import SplashScreen from './components/SplashScreen';
import ErrorBoundary from './components/ErrorBoundary'; 
import { NetworkProvider } from './contexts/NetworkContext';
import { AudioProvider } from './contexts/AudioContext';
import { checkAuthStatus, signOutUser, getStoredUser, clearStoredUser, User } from './lib/auth';
import { Button } from './components/ui/button';
import HomePage from './pages/HomePage';
import AuthPage from './pages/AuthPage';
import CreatePage from './pages/CreatePage';
import DiscoverPage from './pages/DiscoverPage';
import ProfilePage from './pages/ProfilePage';
import SettingsPage from './pages/SettingsPage';
import SearchPage from './pages/SearchPage';
import MomentsPage from './pages/MomentsPage';
import ThoughtsPage from './pages/ThoughtsPage';
import NotFound from './pages/NotFound';
import type { User as AppUser } from './lib/auth';
import { useIsMobile } from './hooks/use-mobile';
import { useIsTablet } from './hooks/use-tablet';

const AppContent = () => {
  const [user, setUser] = useState<AppUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const location = useLocation();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const isTablet = useIsTablet();

  // Set sidebar initial state based on device
  useEffect(() => {
    if (isTablet) {
      setIsSidebarOpen(false); // Closed by default on tablet
    } else {
      setIsSidebarOpen(true); // Open by default on desktop
    }
  }, [isTablet]);

  // Scroll to top when route changes
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const authStatus = await checkAuthStatus();
        if (authStatus.isAuthenticated && authStatus.user) {
          setUser(authStatus.user);
          setIsLoading(false);
        } else {
          const storedUser = getStoredUser();
          if (storedUser) {
            setUser(storedUser);
          }
          setIsLoading(false);
        }
      } catch {
        setIsLoading(false);
      }
    };
    checkAuth();
  }, []);
  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const isAuthPage = location.pathname === '/auth';
  const shouldShowNavbar = (user && !isAuthPage) || (!user && !isAuthPage && import.meta.env.DEV);
  const handleSignOut = async () => {
    try {
      const result = await signOutUser();
      if (result.success) {
        clearStoredUser();
        setUser(null);
        window.location.href = '/auth';
      }
    } catch {
      // Sign out failed silently
    }
  };
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">Loading Equyvo...</p>
        </div>
      </div>
    );
  }
  if (!import.meta.env.VITE_AWS_USER_POOL_ID || !import.meta.env.VITE_AWS_APP_CLIENT_ID) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4 max-w-md mx-auto p-6">
          <div className="text-blue-500 text-6xl mb-4">🔧</div>
          <h1 className="text-2xl font-bold text-foreground">AWS Cognito Setup</h1>
          <p className="text-muted-foreground">
            Equyvo uses AWS Cognito for authentication. The app is running with mock data for development.
          </p>
          <div className="bg-muted p-4 rounded-lg text-left">
            <code className="text-sm">
              VITE_AWS_USER_POOL_ID=your_user_pool_id<br/>
              VITE_AWS_APP_CLIENT_ID=your_app_client_id
            </code>
          </div>
          <p className="text-sm text-muted-foreground">
            Configure AWS Cognito in your .env file for full functionality.
          </p>
          <Button 
            onClick={() => window.location.href = '/app/home'}
            className="mt-4"
          >
            Continue with Mock Data
          </Button>
        </div>
      </div>
    );
  }
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {/* Sidebar - Desktop Only */}
      {shouldShowNavbar && <Sidebar isOpen={isSidebarOpen} onToggle={toggleSidebar} />}
      
      {/* Main Content Area */}
      <div className={`flex-1 flex flex-col transition-all duration-300 ease-in-out ${
        isSidebarOpen && !isMobile ? 'lg:ml-64' : 'lg:ml-0'
      }`}>
        {shouldShowNavbar && <Navbar user={user} onSignOut={handleSignOut} />}
        <main className={`flex-1 overflow-y-auto ${
          shouldShowNavbar 
            ? (location.pathname === '/moments' || location.pathname === '/app/moments' 
                ? 'w-full pt-14 pb-16 md:pt-0 md:pb-0' 
                : 'w-full pt-14 pb-16 md:pt-0 md:pb-0') 
            : 'w-full'
        }`}>
        <Routes>
          {}
          <Route path="/" element={<HomePage />} />
          <Route path="/auth" element={<AuthPage />} />
          {}
          <Route path="/app/home" element={<HomePage />} />
          <Route path="/app/discover" element={<DiscoverPage />} />
          <Route path="/app/create" element={<CreatePage />} />
          <Route path="/app/moments" element={<MomentsPage />} />
          <Route path="/app/thoughts" element={<ThoughtsPage />} />
          <Route path="/app/profile" element={<ProfilePage />} />
          <Route path="/app/settings" element={<SettingsPage />} />
          <Route path="/app/search" element={<SearchPage />} />
          {}
          <Route path="/discover" element={<DiscoverPage />} />
          <Route path="/create" element={<CreatePage />} />
          <Route path="/moments" element={<MomentsPage />} />
          <Route path="/thoughts" element={<ThoughtsPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/profile/:userId" element={<ProfilePage />} />
          <Route path="/profile/@:username" element={<ProfilePage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/search" element={<SearchPage />} />
          {}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      <Toaster />
    </div>
  </div>
  );
};
const App = () => {
  const [showApp, setShowApp] = useState(false);
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setShowApp(true);
    }, 1500); // Shorter duration to match splash screen
    return () => clearTimeout(timer);
  }, []);
  if (!showApp) {
    return <SplashScreen onFinish={() => setShowApp(true)} />;
  }
  return (
    <ThemeProvider defaultTheme="dark">
      <ChatThemeProvider>
        <AudioProvider>
          <NetworkProvider>
            <Router>
              <ErrorBoundary>
                <AppContent />
              </ErrorBoundary>
            </Router>
          </NetworkProvider>
        </AudioProvider>
      </ChatThemeProvider>
    </ThemeProvider>
  );
};
export default App;