import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Compass, PlusCircle, Video, MessageSquare, User, Settings, Globe, Camera, Menu, X } from 'lucide-react';
import { useIsMobile } from "@/hooks/use-mobile";
import { useIsTablet } from "@/hooks/use-tablet";
import { Button } from "@/components/ui/button";

const navItems = [
  { name: 'Home', icon: Home, path: '/app/home' },
  { name: 'Discover', icon: Globe, path: '/app/discover' },
  { name: 'Create', icon: PlusCircle, path: '/app/create' },
  { name: 'Moments', icon: Camera, path: '/app/moments' },
  { name: 'Thoughts', icon: MessageSquare, path: '/app/thoughts' },
  { name: 'Profile', icon: User, path: '/app/profile' },
  { name: 'Settings', icon: Settings, path: '/app/settings' },
];

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
}

const Sidebar = ({ isOpen, onToggle }: SidebarProps) => {
  const isMobile = useIsMobile();
  const isTablet = useIsTablet();
  const [currentPath, setCurrentPath] = useState('/');

  useEffect(() => {
    setCurrentPath(window.location.pathname);
  }, []);

  // Don't render sidebar on mobile
  if (isMobile) {
    return null;
  }

  return (
    <>
      {/* Tablet Hamburger Button */}
      {isTablet && (
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggle}
          className="fixed left-4 top-24 z-50 h-10 w-10 bg-background/95 backdrop-blur-xl border border-border/50 shadow-lg"
        >
          <Menu className="h-5 w-5" />
        </Button>
      )}

      {/* Sidebar */}
      <div className={`fixed left-0 top-0 h-full w-64 bg-background/95 backdrop-blur-xl border-r border-border/50 z-40 flex flex-col transition-transform duration-300 ease-in-out ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        {/* Navigation Items */}
        <nav className="flex-1 p-4 space-y-2 pt-6">
          {navItems.map((item) => {
            const isActive = currentPath === item.path;
            return (
              <Link
                key={item.name}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                  isActive
                    ? 'bg-primary/10 text-primary border-r-2 border-primary'
                    : 'text-muted-foreground hover:text-foreground hover:bg-accent/20'
                }`}
                onClick={() => {
                  // Auto-close sidebar on tablet after navigation
                  if (isTablet) {
                    onToggle();
                  }
                }}
              >
                <item.icon className="h-5 w-5" />
                <span className="font-medium">{item.name}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Overlay for when sidebar is open */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/20 z-30 lg:hidden"
          onClick={onToggle}
        />
      )}
    </>
  );
};

export default Sidebar;
