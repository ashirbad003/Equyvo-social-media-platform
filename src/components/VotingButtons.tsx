import React from 'react';
import { Button } from "@/components/ui/button";
import { ArrowUp, ArrowDown, ThumbsUp } from 'lucide-react';

interface VotingButtonsProps {
  thoughtId: string;
  upvotesCount: number;
  downvotesCount: number;
  likesCount: number;
  userVote: 'upvote' | 'downvote' | null;
  userHasLiked: boolean;
  onVote: (thoughtId: string, voteType: 'upvote' | 'downvote') => void;
  onLike: (thoughtId: string) => void;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  disabled?: boolean;
}

const VotingButtons: React.FC<VotingButtonsProps> = ({
  thoughtId,
  upvotesCount,
  downvotesCount,
  likesCount,
  userVote,
  userHasLiked,
  onVote,
  onLike,
  size = 'md',
  className = '',
  disabled = false
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

  const formatCount = (count: number) => {
    if (count >= 1000000) {
      return `${(count / 1000000).toFixed(1)}M`;
    } else if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}K`;
    }
    return count.toString();
  };

  
  return (
    <div className={`flex items-center gap-1 ${className}`}>
      {/* Like Button */}
      <Button
        variant="ghost"
        size="sm"
        disabled={disabled}
        className={`${sizeClasses[size]} ${
          userHasLiked 
            ? 'text-blue-500 hover:text-blue-600 bg-blue-50 dark:bg-blue-950/20' 
            : 'text-muted-foreground hover:text-foreground'
        }`}
        onClick={() => onLike(thoughtId)}
      >
        <ThumbsUp 
          className={`${iconSizes[size]} mr-1 ${userHasLiked ? 'fill-current' : ''}`} 
        />
        <span className="text-xs">{formatCount(likesCount)}</span>
      </Button>

      {/* Upvote Button */}
      <Button
        variant="ghost"
        size="sm"
        disabled={disabled}
        className={`${sizeClasses[size]} ${
          userVote === 'upvote' 
            ? 'text-green-500 hover:text-green-600 bg-green-50 dark:bg-green-950/20' 
            : 'text-muted-foreground hover:text-foreground'
        }`}
        onClick={() => onVote(thoughtId, 'upvote')}
      >
        <ArrowUp 
          className={`${iconSizes[size]} mr-1 ${userVote === 'upvote' ? 'fill-current' : ''}`} 
        />
        <span className="text-xs">{formatCount(upvotesCount)}</span>
      </Button>
      
      {/* Downvote Button */}
      <Button
        variant="ghost"
        size="sm"
        disabled={disabled}
        className={`${sizeClasses[size]} ${
          userVote === 'downvote' 
            ? 'text-red-500 hover:text-red-600 bg-red-50 dark:bg-red-950/20' 
            : 'text-muted-foreground hover:text-foreground'
        }`}
        onClick={() => onVote(thoughtId, 'downvote')}
      >
        <ArrowDown 
          className={`${iconSizes[size]} mr-1 ${userVote === 'downvote' ? 'fill-current' : ''}`} 
        />
        <span className="text-xs">{formatCount(downvotesCount)}</span>
      </Button>

    </div>
  );
};

export default VotingButtons;
