import React from 'react';
import { Button } from "@/components/ui/button";
import { ThumbsUp } from 'lucide-react';

interface LikeButtonProps {
  isLiked: boolean;
  likesCount: number;
  onLike: () => void;
  size?: 'sm' | 'md' | 'lg';
  showCount?: boolean;
  className?: string;
}

const LikeButton: React.FC<LikeButtonProps> = ({
  isLiked,
  likesCount,
  onLike,
  size = 'md',
  showCount = true,
  className = ''
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

  return (
    <Button
      variant="ghost"
      className={`${sizeClasses[size]} ${isLiked ? 'text-blue-500 hover:text-blue-600' : 'text-muted-foreground hover:text-foreground'} ${className}`}
      onClick={onLike}
    >
      <ThumbsUp 
        className={`${iconSizes[size]} mr-1 ${isLiked ? 'fill-current' : ''}`} 
      />
      {showCount && likesCount}
    </Button>
  );
};

export default LikeButton;
