"use client";

import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { UserPlus, UserCheck } from 'lucide-react';
import { showSuccess } from '@/utils/toast';

interface FollowButtonProps {
  userId?: string;
  userName?: string;
  size?: 'sm' | 'default' | 'lg';
  variant?: 'default' | 'outline' | 'secondary';
  className?: string;
}

const FollowButton: React.FC<FollowButtonProps> = ({
  userId,
  userName = 'user',
  size = 'sm',
  variant = 'outline',
  className = '',
}) => {
  const [isFollowing, setIsFollowing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleFollow = async () => {
    setIsLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      setIsFollowing(!isFollowing);
      setIsLoading(false);
      
      if (!isFollowing) {
        showSuccess(`Now following ${userName}!`);
      } else {
        showSuccess(`Unfollowed ${userName}`);
      }
    }, 500);
  };

  return (
    <Button
      variant={isFollowing ? 'secondary' : variant}
      size={size}
      onClick={handleFollow}
      disabled={isLoading}
      className={`${className} transition-all duration-200 ${
        isFollowing ? 'bg-green-100 text-green-700 hover:bg-green-200' : ''
      }`}
    >
      {isLoading ? (
        <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full" />
      ) : isFollowing ? (
        <>
          <UserCheck className="h-4 w-4 mr-1" />
          Following
        </>
      ) : (
        <>
          <UserPlus className="h-4 w-4 mr-1" />
          Follow
        </>
      )}
    </Button>
  );
};

export default FollowButton;
