import React from 'react';
import { Button } from "@/components/ui/button";
import { Share2 } from 'lucide-react';
import { showSuccess, showError } from '@/utils/toast';
import { Post } from '@/types';

interface ShareButtonProps {
  post: Post;
  size?: 'sm' | 'md' | 'lg';
  showCount?: boolean;
  sharesCount?: number;
  className?: string;
  onShare?: () => void;
}

const ShareButton: React.FC<ShareButtonProps> = ({
  post,
  size = 'md',
  showCount = false,
  sharesCount = 0,
  className = '',
  onShare
}) => {
  const sizeClasses = {
    sm: 'h-6 px-2 text-xs',
    md: 'h-8 px-3 text-sm',
    lg: 'h-10 px-4 text-base'
  };

  const iconSizes = {
    sm: 'h-3 w-3',
    md: 'h-4 w-4',
    lg: 'h-5 w-5'
  };

  const handleShare = async () => {
    try {
      const shareData = {
        title: `Post by ${post.user}`,
        text: post.content || 'Check out this post!',
        url: `${window.location.origin}/post/${post.id}`
      };

      // Check if Web Share API is available
      if (navigator.share && window.isSecureContext) {
        await navigator.share(shareData);
        showSuccess('Post shared successfully!');
      } else {
        // Fallback to clipboard
        const shareText = `${shareData.title}\n\n${shareData.text}\n\n${shareData.url}`;
        
        if (navigator.clipboard && window.isSecureContext) {
          await navigator.clipboard.writeText(shareText);
          showSuccess('Link copied to clipboard!');
        } else {
          // Fallback for older browsers
          const textArea = document.createElement('textarea');
          textArea.value = shareText;
          textArea.style.position = 'fixed';
          textArea.style.opacity = '0';
          document.body.appendChild(textArea);
          textArea.focus();
          textArea.select();
          
          try {
            document.execCommand('copy');
            showSuccess('Link copied to clipboard!');
          } catch (err) {
            showError('Failed to copy link');
          } finally {
            document.body.removeChild(textArea);
          }
        }
      }

      onShare?.();
    } catch (error) {
      if ((error as Error).name !== 'AbortError') {
        showError('Failed to share post');
      }
    }
  };

  return (
    <Button
      variant="ghost"
      className={`${sizeClasses[size]} text-muted-foreground hover:text-foreground ${className}`}
      onClick={handleShare}
    >
      <Share2 className={iconSizes[size]} />
      {showCount && sharesCount > 0 && (
        <span className="ml-1">{sharesCount}</span>
      )}
    </Button>
  );
};

export default ShareButton;
