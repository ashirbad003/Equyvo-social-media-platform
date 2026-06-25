export const shareContent = async (title: string, text: string, url?: string) => {
  if (typeof window === 'undefined') {
    return { success: false, error: 'Share functionality not available on server' };
  }

  const shareData = {
    title,
    text,
    url: url || window.location.origin,
  };

  try {
    // Check if Web Share API is supported
    if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
      await navigator.share(shareData);
      return { success: true };
    } else {
      // Fallback: Copy to clipboard
      const shareText = `${title}\n\n${text}\n\n${shareData.url}`;
      await navigator.clipboard.writeText(shareText);
      
      // Show fallback message
      if (navigator.share) {
        return { 
          success: true, 
          fallback: true, 
          message: "Link copied to clipboard!" 
        };
      } else {
        return { 
          success: true, 
          fallback: true, 
          message: "Web Share API not supported. Link copied to clipboard!" 
        };
      }
    }
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Share failed' 
    };
  }
};

export const sharePost = async (post: {
  id: string;
  user: string;
  content: string;
  image?: string;
}) => {
  if (typeof window === 'undefined') {
    return { success: false, error: 'Share functionality not available on server' };
  }

  const title = `Post by ${post.user} on Equyvo`;
  const text = post.content;
  const url = `${window.location.origin}/post/${post.id}`;
  
  return shareContent(title, text, url);
};

export const shareProfile = async (user: {
  id: string;
  username: string;
  bio?: string;
}) => {
  if (typeof window === 'undefined') {
    return { success: false, error: 'Share functionality not available on server' };
  }

  const title = `${user.username} on Equyvo`;
  const text = user.bio || `Check out ${user.username}'s profile on Equyvo!`;
  const url = `${window.location.origin}/profile/${user.id}`;
  
  return shareContent(title, text, url);
};
