import { useNavigate, type NavigateFunction } from 'react-router-dom';

// Bot profile mapping
const botProfileMapping: { [key: string]: string } = {
  'Nature Channel': 'p1',
  'Bot Channel': 'bot-channel', 
  'Tech Reviews': 'tech-reviews',
  'Live Gaming Stream': 'gaming-stream'
};

// User interface for type safety
interface User {
  id?: string;
  userId?: string;
  uid?: string;
  user_id?: string;
  username?: string;
  handle?: string;
  name?: string;
}

/**
 * Navigation utility for profile pages
 */
export const navigateToProfile = (navigate: NavigateFunction, userId?: string, username?: string) => {
  // If we have a specific user ID, navigate to their profile
  if (userId) {
    // Check if this is a bot name that needs to be mapped to an ID
    const mappedId = botProfileMapping[userId];
    if (mappedId) {
      navigate(`/profile/${mappedId}`);
    } else {
      navigate(`/profile/${userId}`);
    }
    return;
  }
  
  // If we have a username, navigate to their profile by username
  if (username) {
    // Check if this is a bot name that needs to be mapped
    const mappedId = botProfileMapping[username];
    if (mappedId) {
      navigate(`/profile/${mappedId}`);
    } else {
      navigate(`/profile/@${username.replace('@', '')}`);
    }
    return;
  }
  
  // Default to current user's profile
  navigate('/profile');
};

/**
 * Generate profile URL for a user
 */
export const getProfileUrl = (userId?: string, username?: string) => {
  if (userId) {
    // Check if this is a bot name that needs to be mapped to an ID
    const mappedId = botProfileMapping[userId];
    if (mappedId) {
      return `/profile/${mappedId}`;
    }
    return `/profile/${userId}`;
  }
  
  if (username) {
    // Check if this is a bot name that needs to be mapped
    const mappedId = botProfileMapping[username];
    if (mappedId) {
      return `/profile/${mappedId}`;
    }
    return `/profile/@${username.replace('@', '')}`;
  }
  
  return '/profile';
};

/**
 * Extract user identifier from user object
 */
export const getUserId = (user: User) => {
  return user?.id || user?.userId || user?.uid || user?.user_id;
};

/**
 * Extract username from user object
 */
export const getUsername = (user: User) => {
  return user?.username || user?.handle || user?.name?.toLowerCase().replace(/\s+/g, '-');
};
