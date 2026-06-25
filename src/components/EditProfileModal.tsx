"use client";

import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { X, Upload, Camera, Loader2 } from 'lucide-react';
import { showSuccess, showError } from '@/utils/toast';
import { uploadToCloudinary, isCloudinaryConfigured, getAvatarUrl } from '@/lib/cloudinary';

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentProfile: {
    name: string;
    username: string;
    bio: string;
    avatar: string;
  };
  onSave: (profile: any) => void;
}

const EditProfileModal: React.FC<EditProfileModalProps> = ({
  isOpen,
  onClose,
  currentProfile,
  onSave,
}) => {
  const [name, setName] = useState(currentProfile.name);
  const [username, setUsername] = useState(currentProfile.username);
  const [bio, setBio] = useState(currentProfile.bio);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState(currentProfile.avatar);
  const [isUploading, setIsUploading] = useState(false);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        showError('Avatar file size must be less than 5MB');
        return;
      }
      if (!file.type.startsWith('image/')) {
        showError('Please select an image file');
        return;
      }
      setAvatarFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    if (!name.trim()) {
      showError('Name is required');
      return;
    }
    if (!username.trim()) {
      showError('Username is required');
      return;
    }
    if (username.length < 3) {
      showError('Username must be at least 3 characters');
      return;
    }

    let avatarUrl = avatarPreview;
    if (avatarFile && isCloudinaryConfigured()) {
      setIsUploading(true);
      try {
        const result = await uploadToCloudinary(avatarFile, { folder: 'equyvo/avatars' });
        avatarUrl = getAvatarUrl(result.publicId);
      } catch {
        showError('Failed to upload avatar. Using local preview.');
      }
      setIsUploading(false);
    }

    const updatedProfile = {
      name,
      username,
      bio,
      avatar: avatarUrl,
    };

    onSave(updatedProfile);
    showSuccess('Profile updated successfully!');
    onClose();
  };

  const handleRemoveAvatar = () => {
    setAvatarFile(null);
    setAvatarPreview('');
  };

  if (!isOpen) return null;

  const modal = (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <Card className="w-full max-w-md max-h-[90vh] overflow-y-auto">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle>Edit Profile</CardTitle>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Avatar Upload */}
          <div className="flex flex-col items-center space-y-2">
            <div className="relative">
              <Avatar className="h-20 w-20">
                <AvatarImage src={avatarPreview} />
                <AvatarFallback className="text-lg">
                  {name.substring(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <Button
                variant="outline"
                size="sm"
                className="absolute -bottom-2 -right-2 rounded-full h-8 w-8 p-0"
                onClick={() => document.getElementById('avatar-upload')?.click()}
              >
                <Camera className="h-4 w-4" />
              </Button>
            </div>
            <input
              id="avatar-upload"
              type="file"
              accept="image/*"
              onChange={handleAvatarChange}
              className="hidden"
            />
            <p className="text-xs text-muted-foreground">
              Click camera to change photo
            </p>
          </div>

          {/* Name */}
          <div>
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your name"
              className="mt-1"
            />
          </div>

          {/* Username */}
          <div>
            <Label htmlFor="username">Username</Label>
            <Input
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value.replace(/\s/g, '').toLowerCase())}
              placeholder="Enter username"
              className="mt-1"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Username can only contain letters, numbers, and underscores
            </p>
          </div>

          {/* Bio */}
          <div>
            <Label htmlFor="bio">Bio</Label>
            <Textarea
              id="bio"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Tell us about yourself"
              className="mt-1"
              rows={3}
              maxLength={200}
            />
            <p className="text-xs text-muted-foreground mt-1">
              {bio.length}/200 characters
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 pt-4">
            <Button variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={isUploading} className="flex-1">
              {isUploading ? (
                <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Uploading...</>
              ) : (
                'Save Changes'
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  if (typeof window === 'undefined') return null;
  return createPortal(modal, document.body);
};

export default EditProfileModal;
