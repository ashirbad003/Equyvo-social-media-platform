import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Copy, Share2, Flag, EyeOff, Edit } from 'lucide-react';
import { showSuccess, showError } from '@/utils/toast';
import DeleteButton from '@/components/ui/DeleteButton';

interface StandardPostMenuProps {
  postId: string;
  postUserId?: string;
  currentUserId?: string;
  isProfilePage?: boolean;
  onReport?: (postId: string) => void;
  onDelete?: (postId: string) => void;
  onEdit?: (postId: string) => void;
  onShare?: (postId: string) => void;
  onHide?: (postId: string) => void;
  onCopyLink?: (postId: string) => void;
  className?: string;
}

const StandardPostMenu: React.FC<StandardPostMenuProps> = ({
  postId,
  postUserId,
  currentUserId,
  isProfilePage = false,
  onReport,
  onDelete,
  onEdit,
  onShare,
  onHide,
  onCopyLink,
  className = ''
}) => {
  const [isSharing, setIsSharing] = useState(false);

  const isOwnPost = currentUserId && postUserId && currentUserId === postUserId;

  const handleCopyLink = async () => {
    try {
      const shareUrl = `${window.location.origin}/posts/${postId}`;
      await navigator.clipboard.writeText(shareUrl);
      showSuccess('🔗 Link copied to clipboard!');
      onCopyLink?.(postId);
    } catch (error) {
      showError('Failed to copy link');
    }
  };

  const handleShare = async () => {
    if (isSharing) return;
    
    setIsSharing(true);
    try {
      const shareUrl = `${window.location.origin}/posts/${postId}`;
      
      if (navigator.share) {
        await navigator.share({
          title: 'Check out this post!',
          text: 'Amazing content on Equyvo',
          url: shareUrl
        });
      } else {
        await navigator.clipboard.writeText(shareUrl);
        showSuccess('🔗 Link copied to clipboard!');
      }
      onShare?.(postId);
    } catch (error) {
      showError('Failed to share post');
    } finally {
      setIsSharing(false);
    }
  };

  const handleReport = () => {
    onReport?.(postId);
  };

  const handleHide = () => {
    onHide?.(postId);
  };

  const handleEdit = () => {
    onEdit?.(postId);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={`h-8 w-8 text-muted-foreground hover:text-foreground ${className}`}
        >
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        {/* Standard menu options for non-profile pages */}
        {!isProfilePage ? (
          <>
            <DropdownMenuItem onClick={handleCopyLink}>
              <Copy className="h-4 w-4 mr-2" />
              Copy Link
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleShare} disabled={isSharing}>
              <Share2 className="h-4 w-4 mr-2" />
              {isSharing ? 'Sharing...' : 'Share'}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleReport}>
              <Flag className="h-4 w-4 mr-2" />
              Report
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleHide} className="text-red-600 focus:text-red-600">
              <EyeOff className="h-4 w-4 mr-2" />
              Hide
            </DropdownMenuItem>
          </>
        ) : (
          /* Profile page menu - only Edit/Delete with hide option */
          <>
            {isOwnPost && onEdit && (
              <DropdownMenuItem onClick={handleEdit}>
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </DropdownMenuItem>
            )}
            {isOwnPost && (
              <>
                {onEdit && <DropdownMenuSeparator />}
                <div className="p-1">
                  <DeleteButton
                    onDelete={() => onDelete?.(postId)}
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start h-8 px-2 text-sm"
                    confirmationTitle="Delete this post?"
                    confirmationDescription="This action cannot be undone. This will permanently delete your post and remove it from your profile."
                    confirmButtonText="Delete Post"
                    showIcon={true}
                  />
                </div>
              </>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleHide} className="text-red-600 focus:text-red-600">
              <EyeOff className="h-4 w-4 mr-2" />
              Hide from public
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default StandardPostMenu;
