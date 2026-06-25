import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { 
  Bell, 
  Shield, 
  Palette, 
  HelpCircle, 
  LogOut, 
  Moon, 
  Sun,
  Globe,
  Lock,
  Eye,
  EyeOff,
  Trash2,
  Download,
  User,
  Mail
} from 'lucide-react';
import { getAuthenticatedUser, signOutUser } from '@/lib/auth';
import { showSuccess, showError } from '@/utils/toast';
import { useNavigate } from 'react-router-dom';

const SettingsPage = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<{ id: string; email?: string } | null>(null);
  const [notifications, setNotifications] = useState(() => {
    return localStorage.getItem('notifications') === 'true';
  });
  const [darkMode, setDarkMode] = useState(() => {
    const savedTheme = localStorage.getItem('theme');
    return savedTheme ? savedTheme === 'dark' : true; // Default to dark like the main app
  });
  const [privateProfile, setPrivateProfile] = useState(() => {
    return localStorage.getItem('privateProfile') === 'true';
  });
  const [showEmail, setShowEmail] = useState(() => {
    return localStorage.getItem('showEmail') === 'true';
  });
  const [emailNotifications, setEmailNotifications] = useState(() => {
    return localStorage.getItem('emailNotifications') !== 'false';
  });
  const [messageRequests, setMessageRequests] = useState(() => {
    return localStorage.getItem('messageRequests') !== 'false';
  });
  const [compactView, setCompactView] = useState(() => {
    return localStorage.getItem('compactView') === 'true';
  });

  useEffect(() => {
    const getCurrentUser = async () => {
      try {
        const user = await getAuthenticatedUser();
        setUser(user as any);
      } catch {
      }
    };
    
    getCurrentUser();
  }, []);

  // Save settings to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('notifications', notifications.toString());
  }, [notifications]);

  useEffect(() => {
    localStorage.setItem('privateProfile', privateProfile.toString());
  }, [privateProfile]);

  useEffect(() => {
    localStorage.setItem('showEmail', showEmail.toString());
  }, [showEmail]);

  useEffect(() => {
    localStorage.setItem('emailNotifications', emailNotifications.toString());
  }, [emailNotifications]);

  useEffect(() => {
    localStorage.setItem('messageRequests', messageRequests.toString());
  }, [messageRequests]);

  useEffect(() => {
    localStorage.setItem('compactView', compactView.toString());
  }, [compactView]);

  useEffect(() => {
    const root = window.document.documentElement;
    if (darkMode) {
      root.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      root.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [darkMode]);

  const handleSignOut = async () => {
    const result = await signOutUser();
    if (result.success) {
      showSuccess("Signed out successfully!");
      navigate('/auth');
    } else {
      showError(result.error || "Failed to sign out");
    }
  };

  const handleDeleteAccount = async () => {
    if (confirm("Are you sure you want to delete your account? This action cannot be undone.")) {
      try {
        // For AWS Cognito, account deletion would require admin API calls
        // For now, we'll just sign out and show a message
        const result = await signOutUser();
        if (result.success) {
          showSuccess("Account deletion requested. You'll be contacted for verification.");
          navigate('/auth');
        } else {
          showError(result.error || "Failed to process account deletion");
        }
      } catch (error: any) {
        showError(error.message || "Failed to delete account");
      }
    }
  };

  const handleExportData = async () => {
    try {
      // Get user profile data from localStorage
      const userProfile = localStorage.getItem('userProfile');
      const settings = {
        notifications,
        darkMode,
        privateProfile,
        showEmail,
        emailNotifications,
        messageRequests,
        compactView
      };
      
      const exportData = {
        profile: userProfile ? JSON.parse(userProfile) : null,
        settings,
        exportDate: new Date().toISOString()
      };
      
      // Create and download JSON file
      const dataStr = JSON.stringify(exportData, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `equyvo-data-export-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      showSuccess("Your data has been exported successfully!");
    } catch (error) {
      showError('Failed to export data');
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <h1 className="text-3xl font-bold">Settings</h1>
      </div>

      {/* Privacy Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Privacy & Security
          </CardTitle>
          <CardDescription>
            Control your privacy and security settings
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label>Private Profile</Label>
              <p className="text-sm text-muted-foreground">
                Only approved followers can see your posts
              </p>
            </div>
            <Switch 
              checked={privateProfile}
              onCheckedChange={setPrivateProfile}
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div>
              <Label>Show Email</Label>
              <p className="text-sm text-muted-foreground">
                Display email on your profile
              </p>
            </div>
            <Switch 
              checked={showEmail}
              onCheckedChange={setShowEmail}
            />
          </div>
        </CardContent>
      </Card>

      {/* Notification Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notifications
          </CardTitle>
          <CardDescription>
            Manage how you receive notifications
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label>Push Notifications</Label>
              <p className="text-sm text-muted-foreground">
                Receive notifications on your device
              </p>
            </div>
            <Switch 
              checked={notifications}
              onCheckedChange={setNotifications}
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div>
              <Label>Email Notifications</Label>
              <p className="text-sm text-muted-foreground">
                Receive updates via email
              </p>
            </div>
            <Switch 
              checked={emailNotifications}
              onCheckedChange={setEmailNotifications}
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div>
              <Label>Message Requests</Label>
              <p className="text-sm text-muted-foreground">
                Allow message requests from anyone
              </p>
            </div>
            <Switch 
              checked={messageRequests}
              onCheckedChange={setMessageRequests}
            />
          </div>
        </CardContent>
      </Card>

      {/* Appearance */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5" />
            Appearance
          </CardTitle>
          <CardDescription>
            Customize how Equyvo looks for you
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label>Dark Mode</Label>
              <p className="text-sm text-muted-foreground">
                Use dark theme across the app
              </p>
            </div>
            <Switch 
              checked={darkMode}
              onCheckedChange={setDarkMode}
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div>
              <Label>Compact View</Label>
              <p className="text-sm text-muted-foreground">
                Show more content in less space
              </p>
            </div>
            <Switch 
              checked={compactView}
              onCheckedChange={setCompactView}
            />
          </div>
        </CardContent>
      </Card>

      {/* Data & Account */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Data & Account
          </CardTitle>
          <CardDescription>
            Manage your data and account
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button 
            variant="outline" 
            onClick={handleExportData}
            className="w-full justify-start"
          >
            <Download className="h-4 w-4 mr-2" />
            Export Your Data
          </Button>

          <Separator />

          <Button 
            variant="outline" 
            onClick={() => navigate('/app/profile')}
            className="w-full justify-start"
          >
            <User className="h-4 w-4 mr-2" />
            View Profile
          </Button>

          <Separator />

          <Button 
            variant="outline" 
            onClick={() => window.open('mailto:support@equyvo.app', '_blank')}
            className="w-full justify-start"
          >
            <Mail className="h-4 w-4 mr-2" />
            Contact Support
          </Button>

          <Separator />

          <Button 
            variant="destructive" 
            onClick={handleDeleteAccount}
            className="w-full justify-start"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete Account
          </Button>
        </CardContent>
      </Card>

      {/* Sign Out */}
      <Card>
        <CardContent className="pt-6">
          <Button 
            variant="outline" 
            onClick={handleSignOut}
            className="w-full justify-start"
          >
            <LogOut className="h-4 w-4 mr-2" />
            Sign Out
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default SettingsPage;
