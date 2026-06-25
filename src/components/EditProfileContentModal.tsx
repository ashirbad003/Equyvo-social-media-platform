import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { X, Upload, Image, FileVideo, Trash2 } from 'lucide-react';
import { showSuccess, showError } from '@/utils/toast';

interface EditProfileContentModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentContent: {
    id: string;
    content: string;
    type: 'post' | 'thought' | 'moment';
    image?: string;
    video?: string;
  };
  onSave: (content: any) => void;
}

const EditProfileContentModal: React.FC<EditProfileContentModalProps> = ({
  isOpen,
  onClose,
  currentContent,
  onSave,
}) => {
  const [content, setContent] = useState(currentContent.content);
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [mediaPreview, setMediaPreview] = useState(currentContent.image || currentContent.video || '');
  const [isLoading, setIsLoading] = useState(false);

  const handleMediaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const maxSize = currentContent.type === 'moment' ? 50 * 1024 * 1024 : 300 * 1024 * 1024;
      
      if (file.size > maxSize) {
        showError(`File size must be less than ${maxSize / (1024 * 1024)}MB`);
        return;
      }
      
      const allowedTypes = currentContent.type === 'moment' 
        ? ['image/', 'video/'] 
        : ['video/'];
      
      const isAllowedType = allowedTypes.some(type => file.type.startsWith(type));
      
      if (!isAllowedType) {
        showError(currentContent.type === 'moment' 
          ? 'Please select an image or video file' 
          : 'Please select a video file'
        );
        return;
      }
      
      setMediaFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setMediaPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    if (!content.trim()) {
      showError('Content is required');
      return;
    }

    setIsLoading(true);
    
    try {
      const updatedContent = {
        ...currentContent,
        content,
        image: mediaPreview && (mediaPreview.includes('image') || mediaFile?.type.startsWith('image/')) ? mediaPreview : undefined,
        video: mediaPreview && (mediaPreview.includes('video') || mediaFile?.type.startsWith('video/')) ? mediaPreview : undefined,
      };

      await onSave(updatedContent);
      showSuccess('Content updated successfully!');
      onClose();
    } catch (error) {
      showError('Failed to update content');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveMedia = () => {
    setMediaFile(null);
    setMediaPreview('');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle>Edit {currentContent.type.charAt(0).toUpperCase() + currentContent.type.slice(1)}</CardTitle>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Content */}
          <div>
            <Label htmlFor="content">Content</Label>
            <Textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={`What's on your mind?`}
              className="mt-1"
              rows={4}
              maxLength={500}
            />
            <p className="text-xs text-muted-foreground mt-1">
              {content.length}/500 characters
            </p>
          </div>

          {/* Media Upload */}
          <div>
            <Label>Media</Label>
            <div className="mt-2">
              {mediaPreview ? (
                <div className="relative">
                  {mediaPreview.includes('video') || mediaFile?.type.startsWith('video/') ? (
                    <div className="bg-black rounded-lg overflow-hidden">
                      <video
                        src={mediaPreview}
                        className="w-full max-h-64 object-contain"
                        controls
                      />
                    </div>
                  ) : (
                    <img
                      src={mediaPreview}
                      alt="Media preview"
                      className="w-full max-h-64 object-cover rounded-lg"
                    />
                  )}
                  <Button
                    variant="destructive"
                    size="sm"
                    className="absolute top-2 right-2"
                    onClick={handleRemoveMedia}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div
                  className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center cursor-pointer hover:border-muted-foreground/50 transition-colors"
                  onClick={() => document.getElementById('media-upload')?.click()}
                >
                  <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-lg font-semibold mb-2">
                    Add {currentContent.type === 'moment' ? 'Photo or Video' : 'Video'}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {currentContent.type === 'moment' 
                      ? 'Share your favorite moments (up to 50MB)'
                      : 'Upload a short video (up to 5 minutes)'
                    }
                  </p>
                  <input
                    id="media-upload"
                    type="file"
                    accept={currentContent.type === 'moment' ? 'image/*,video/*' : 'video/*'}
                    onChange={handleMediaChange}
                    className="hidden"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 pt-4">
            <Button variant="outline" onClick={onClose} className="flex-1" disabled={isLoading}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={isLoading} className="flex-1">
              {isLoading ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default EditProfileContentModal;
