import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Bookmark } from 'lucide-react';
import { showSuccess } from '@/utils/toast';

interface SaveButtonProps {
  postId: string;
  className?: string;
  content?: any; // Full content data to store when saving
  iconClassName?: string; // Additional class for icon styling
}

const SaveButton: React.FC<SaveButtonProps> = ({ postId, className = "", content, iconClassName = "" }) => {
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('savedPosts');
      if (saved) {
        const savedPosts = new Set(JSON.parse(saved));
        setIsSaved(savedPosts.has(postId));
      }
    }

    // Listen for save/unsave events to update button state
    const handleContentSaved = (event: CustomEvent) => {
      if (event.detail.postId === postId) {
        setIsSaved(true);
      }
    };

    const handleContentUnsaved = (event: CustomEvent) => {
      if (event.detail.postId === postId) {
        setIsSaved(false);
      }
    };

    window.addEventListener('contentSaved', handleContentSaved as EventListener);
    window.addEventListener('contentUnsaved', handleContentUnsaved as EventListener);
    
    return () => {
      window.removeEventListener('contentSaved', handleContentSaved as EventListener);
      window.removeEventListener('contentUnsaved', handleContentUnsaved as EventListener);
    };
  }, [postId]);

  const handleSave = () => {
    if (typeof window === 'undefined') return;

    const saved = localStorage.getItem('savedPosts');
    const savedPosts = saved ? new Set(JSON.parse(saved)) : new Set();
    
    // Get saved content data
    const savedContentData = localStorage.getItem('savedContentData');
    const savedContent = savedContentData ? JSON.parse(savedContentData) : {};
    
    if (savedPosts.has(postId)) {
      savedPosts.delete(postId);
      delete savedContent[postId];
      showSuccess('Removed from saved');
      
      // Dispatch event to notify profile page
      window.dispatchEvent(new CustomEvent('contentUnsaved', { 
        detail: { postId, content } 
      }));
    } else {
      savedPosts.add(postId);
      // Store full content data when saving
      if (content) {
        savedContent[postId] = {
          ...content,
          savedAt: new Date().toISOString()
        };
      }
      showSuccess('Saved to collection');
      
      // Dispatch event to notify profile page
      window.dispatchEvent(new CustomEvent('contentSaved', { 
        detail: { postId, content } 
      }));
    }
    
    localStorage.setItem('savedPosts', JSON.stringify(Array.from(savedPosts)));
    localStorage.setItem('savedContentData', JSON.stringify(savedContent));
    setIsSaved(!isSaved);
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      className={`flex items-center gap-1 ${isSaved ? 'text-blue-500' : ''} ${className}`}
      onClick={handleSave}
    >
      <Bookmark className={`h-4 w-4 ${isSaved ? 'fill-current' : ''} ${iconClassName}`} />
    </Button>
  );
};

export default SaveButton;
