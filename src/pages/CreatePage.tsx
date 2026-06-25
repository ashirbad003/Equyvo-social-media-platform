import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Text, Video, Camera, Mic, Zap, Upload, Image, FileVideo, Clock, X, Plus, Film, ImageIcon, Trash2, Calendar, Eye, Lock, Unlock, BarChart3, Users, TrendingUp, Play, Square, Brain, Loader2 } from 'lucide-react';
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { showSuccess, showError } from '@/utils/toast';
import { validateVideoDuration } from '@/lib/thoughts';
import { uploadToCloudinary, isCloudinaryConfigured, getThumbnailUrl, getOptimizedImageUrl, getOptimizedVideoUrl } from '@/lib/cloudinary';

const CreatePage = () => {
  const [activeTab, setActiveTab] = useState('story');
  const [storyFiles, setStoryFiles] = useState<File[]>([]);
  const [thoughtContent, setThoughtContent] = useState('');
  const [thoughtVideo, setThoughtVideo] = useState<File | null>(null);
  const [liveTitle, setLiveTitle] = useState('');
  const [liveDescription, setLiveDescription] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [recordedChunks, setRecordedChunks] = useState<Blob[]>([]);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [textStoryContent, setTextStoryContent] = useState('');
  const [textStoryBackground, setTextStoryBackground] = useState('#000000');
  const [textStoryColor, setTextStoryColor] = useState('#FFFFFF');
  const [photoFiles, setPhotoFiles] = useState<File[]>([]);
  const [videoFiles, setVideoFiles] = useState<File[]>([]);
  const [photoCaption, setPhotoCaption] = useState('');
  const [videoCaption, setVideoCaption] = useState('');

  // New states for scheduling and content management
  const [scheduledPosts, setScheduledPosts] = useState<ScheduledPost[]>([]);
  const [draftPosts, setDraftPosts] = useState<DraftPost[]>([]);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [scheduleDateTime, setScheduleDateTime] = useState('');
  const [currentContentType, setCurrentContentType] = useState('');

  // State for uploaded content management
  const [uploadedVideos, setUploadedVideos] = useState<UploadedVideo[]>([]);
  const [uploadedStories, setUploadedStories] = useState<UploadedStory[]>([]);
  const [uploadedThoughts, setUploadedThoughts] = useState<UploadedThought[]>([]);
  const [uploadedPhotos, setUploadedPhotos] = useState<UploadedPhoto[]>([]);
  const [uploadedTextStories, setUploadedTextStories] = useState<UploadedTextStory[]>([]);
  const [showContentManagement, setShowContentManagement] = useState(false);
  const [activeManagementTab, setActiveManagementTab] = useState<'all' | 'videos' | 'stories' | 'thoughts' | 'photos' | 'text-stories'>('all');
  const [isUploading, setIsUploading] = useState(false);

  // Type definitions for scheduled and draft posts
  interface ScheduledPost {
    id: string;
    type: string;
    content: any;
    scheduledTime: Date;
    status: 'scheduled' | 'posted' | 'failed';
  }

  interface DraftPost {
    id: string;
    type: string;
    content: any;
    createdAt: Date;
  }

  interface UploadedVideo {
    id: string;
    title: string;
    fileName: string;
    fileSize: number;
    duration: string;
    thumbnail: string;
    uploadDate: Date;
    isPrivate: boolean;
    views: number;
    likes: number;
    comments: number;
    shares: number;
    watchTime: number;
    engagement: number;
  }

  interface UploadedStory {
    id: string;
    type: 'image' | 'video';
    fileName: string;
    fileSize: number;
    duration?: string;
    thumbnail: string;
    uploadDate: Date;
    isPrivate: boolean;
    views: number;
    likes: number;
    comments: number;
    shares: number;
    expiresAt: Date;
  }

  interface UploadedThought {
    id: string;
    content: string;
    hasMedia: boolean;
    mediaType?: 'image' | 'video';
    mediaUrl?: string;
    uploadDate: Date;
    isPrivate: boolean;
    views: number;
    likes: number;
    comments: number;
    shares: number;
    reacts: number;
  }

  interface UploadedPhoto {
    id: string;
    fileName: string;
    fileSize: number;
    thumbnail: string;
    caption: string;
    uploadDate: Date;
    isPrivate: boolean;
    views: number;
    likes: number;
    comments: number;
    shares: number;
  }

  interface UploadedTextStory {
    id: string;
    content: string;
    backgroundColor: string;
    textColor: string;
    uploadDate: Date;
    isPrivate: boolean;
    views: number;
    likes: number;
    comments: number;
    shares: number;
    expiresAt: Date;
  }

  const handleFileUpload = async (files: FileList | null, type: string) => {
    if (!files || files.length === 0) return;

    const file = files[0];

    switch (type) {
      case 'story':
        if (files.length > 0) {
          const validFiles = Array.from(files).filter(file => {
            const isValidType = file.type.startsWith('image/') || file.type.startsWith('video/');
            const isValidSize = file.size <= 50 * 1024 * 1024; // 50MB limit
            if (!isValidType) {
              showError('Please select only images or videos');
              return false;
            }
            if (!isValidSize) {
              showError('File size must be less than 50MB');
              return false;
            }
            return true;
          });
          setStoryFiles(validFiles);
        }
        break;

      case 'thought':
        if (file.type.startsWith('video/') || file.type.startsWith('image/')) {
          if (file.type.startsWith('video/')) {
            // Check video duration
            const isValidDuration = await validateVideoDuration(file);
            if (!isValidDuration) {
              showError('Video must be less than 5 minutes long');
              return;
            }
            
            // Also check file size (reasonable limit for 5-minute video)
            const isValidSize = file.size <= 300 * 1024 * 1024; // 300MB limit
            if (!isValidSize) {
              showError('Video size must be less than 300MB');
              return;
            }
            
            setThoughtVideo(file);
          } else {
            // Image validation
            const isValidSize = file.size <= 50 * 1024 * 1024; // 50MB for images/GIFs
            if (isValidSize) {
              setThoughtVideo(file);
            } else {
              showError('Image/GIF must be less than 50MB');
            }
          }
        } else {
          showError('Please select a video, photo, or GIF');
        }
        break;


      case 'photo':
        if (file.type.startsWith('image/')) {
          const validPhotos = Array.from(files).filter(file => {
            const isValidType = file.type.startsWith('image/');
            const isValidSize = file.size <= 50 * 1024 * 1024; // 50MB limit
            if (!isValidType) {
              showError('Please select only images');
              return false;
            }
            if (!isValidSize) {
              showError('Image size must be less than 50MB');
              return false;
            }
            return true;
          });
          setPhotoFiles(validPhotos);
        } else {
          showError('Please select images only');
        }
        break;

      case 'video':
        if (file.type.startsWith('video/')) {
          const validVideos = Array.from(files).filter(file => {
            const isValidType = file.type.startsWith('video/');
            const isValidSize = file.size <= 500 * 1024 * 1024; // 500MB limit for longer videos
            if (!isValidType) {
              showError('Please select only videos');
              return false;
            }
            if (!isValidSize) {
              showError('Video size must be less than 500MB');
              return false;
            }
            return true;
          });
          setVideoFiles(validVideos);
        } else {
          showError('Please select videos only');
        }
        break;
    }
  };

  const handleRemoveFile = (index: number, type: string) => {
    switch (type) {
      case 'story':
        setStoryFiles(prev => prev.filter((_, i) => i !== index));
        break;
      case 'thought':
        setThoughtVideo(null);
        break;

      case 'photo':
        setPhotoFiles(prev => prev.filter((_, i) => i !== index));
        break;

      case 'video':
        setVideoFiles(prev => prev.filter((_, i) => i !== index));
        break;
    }
  };

  const handlePostStory = async (action: 'post' | 'schedule' | 'draft' = 'post') => {
    if (storyFiles.length === 0) {
      showError('Please select at least one file for your story');
      return;
    }

    const storyContent = {
      files: storyFiles,
      caption: (document.getElementById('story-caption') as HTMLTextAreaElement)?.value || ''
    };

    switch (action) {
      case 'post':
        setIsUploading(true);
        const uploadedStoryResults = await Promise.all(
          storyFiles.map(async (file) => {
            try {
              if (isCloudinaryConfigured()) {
                const result = await uploadToCloudinary(file, { folder: 'equyvo/stories' });
                return { file, result };
              }
            } catch (err) {
              showError(`Upload failed for ${file.name}`);
            }
            return { file, result: null };
          })
        );

        const newUploadedStories: UploadedStory[] = uploadedStoryResults.map(({ file, result }, index) => ({
          id: Date.now().toString() + index,
          type: file.type.startsWith('image/') ? 'image' : 'video',
          fileName: file.name,
          fileSize: file.size,
          duration: file.type.startsWith('video/') ? '0:15' : undefined,
          thumbnail: result?.secureUrl || getThumbnailUrl(result?.publicId || '', { width: 300, height: 400 }) || 'https://picsum.photos/seed/' + file.name + '/300/400',
          uploadDate: new Date(),
          isPrivate: false,
          views: Math.floor(Math.random() * 500),
          likes: Math.floor(Math.random() * 50),
          comments: Math.floor(Math.random() * 25),
          shares: Math.floor(Math.random() * 10),
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
        }));

        setUploadedStories(prev => [...prev, ...newUploadedStories]);
        setIsUploading(false);
        showSuccess('Story posted successfully! It will be available for 24 hours.');
        setStoryFiles([]);
        
        window.dispatchEvent(new CustomEvent('storyUploaded', { detail: newUploadedStories }));
        break;
      case 'schedule':
        if (!scheduleDateTime) {
          showError('Please select a date and time for scheduling');
          return;
        }
        const newScheduledStory: ScheduledPost = {
          id: Date.now().toString(),
          type: 'story',
          content: storyContent,
          scheduledTime: new Date(scheduleDateTime),
          status: 'scheduled'
        };
        setScheduledPosts(prev => [...prev, newScheduledStory]);
        showSuccess('Story scheduled successfully!');
        setStoryFiles([]);
        setShowScheduleModal(false);
        setScheduleDateTime('');
        break;
      case 'draft':
        const newDraftStory: DraftPost = {
          id: Date.now().toString(),
          type: 'story',
          content: storyContent,
          createdAt: new Date()
        };
        setDraftPosts(prev => [...prev, newDraftStory]);
        showSuccess('Story saved as draft!');
        break;
    }
  };

  const handlePostTextStory = (action: 'post' | 'schedule' | 'draft' = 'post') => {
    if (!textStoryContent.trim()) {
      showError('Please enter some text for your story');
      return;
    }

    const textStoryData = {
      content: textStoryContent,
      background: textStoryBackground,
      color: textStoryColor
    };

    switch (action) {
      case 'post':
        // Add text story to uploaded text stories list with analytics
        const newUploadedTextStory: UploadedTextStory = {
          id: Date.now().toString(),
          content: textStoryContent,
          backgroundColor: textStoryBackground,
          textColor: textStoryColor,
          uploadDate: new Date(),
          isPrivate: false,
          views: Math.floor(Math.random() * 300),
          likes: Math.floor(Math.random() * 30),
          comments: Math.floor(Math.random() * 15),
          shares: Math.floor(Math.random() * 8),
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours from now
        };

        setUploadedTextStories(prev => [...prev, newUploadedTextStory]);
        showSuccess('Text story posted successfully! It will be available for 24 hours.');
        setTextStoryContent('');
        setTextStoryBackground('#000000');
        setTextStoryColor('#FFFFFF');
        
        // Emit event to notify HomePage that user has uploaded stories
        window.dispatchEvent(new CustomEvent('storyUploaded', { detail: [newUploadedTextStory] }));
        break;
      case 'schedule':
        if (!scheduleDateTime) {
          showError('Please select a date and time for scheduling');
          return;
        }
        const newScheduledTextStory: ScheduledPost = {
          id: Date.now().toString(),
          type: 'text-story',
          content: textStoryData,
          scheduledTime: new Date(scheduleDateTime),
          status: 'scheduled'
        };
        setScheduledPosts(prev => [...prev, newScheduledTextStory]);
        showSuccess('Text story scheduled successfully!');
        setTextStoryContent('');
        setTextStoryBackground('#000000');
        setTextStoryColor('#FFFFFF');
        setShowScheduleModal(false);
        setScheduleDateTime('');
        break;
      case 'draft':
        const newDraftTextStory: DraftPost = {
          id: Date.now().toString(),
          type: 'text-story',
          content: textStoryData,
          createdAt: new Date()
        };
        setDraftPosts(prev => [...prev, newDraftTextStory]);
        showSuccess('Text story saved as draft!');
        break;
    }
  };

  const handlePostThought = async (action: 'post' | 'schedule' | 'draft' = 'post') => {
    if (!thoughtContent.trim()) {
      showError('Please enter your thought');
      return;
    }

    const thoughtData = {
      content: thoughtContent,
      video: thoughtVideo
    };

    switch (action) {
      case 'post':
        setIsUploading(true);
        let cloudinaryUrl: string | undefined;
        if (thoughtVideo && isCloudinaryConfigured()) {
          try {
            const result = await uploadToCloudinary(thoughtVideo, { folder: 'equyvo/thoughts' });
            cloudinaryUrl = result.secureUrl;
          } catch (err) {
            showError('Upload failed for thought media');
          }
        }

        const newUploadedThought: UploadedThought = {
          id: Date.now().toString(),
          content: thoughtContent,
          hasMedia: !!thoughtVideo,
          mediaType: thoughtVideo?.type.startsWith('image/') ? 'image' : thoughtVideo?.type.startsWith('video/') ? 'video' : undefined,
          mediaUrl: cloudinaryUrl || (thoughtVideo ? 'https://picsum.photos/seed/' + thoughtVideo.name + '/300/200' : undefined),
          uploadDate: new Date(),
          isPrivate: false,
          views: Math.floor(Math.random() * 200),
          likes: Math.floor(Math.random() * 40),
          comments: Math.floor(Math.random() * 20),
          shares: Math.floor(Math.random() * 12),
          reacts: Math.floor(Math.random() * 25)
        };

        setUploadedThoughts(prev => [...prev, newUploadedThought]);
        setIsUploading(false);
        showSuccess('Thought posted successfully!');
        setThoughtContent('');
        setThoughtVideo(null);
        break;
      case 'schedule':
        if (!scheduleDateTime) {
          showError('Please select a date and time for scheduling');
          return;
        }
        const newScheduledThought: ScheduledPost = {
          id: Date.now().toString(),
          type: 'thought',
          content: thoughtData,
          scheduledTime: new Date(scheduleDateTime),
          status: 'scheduled'
        };
        setScheduledPosts(prev => [...prev, newScheduledThought]);
        showSuccess('Thought scheduled successfully!');
        setThoughtContent('');
        setThoughtVideo(null);
        setShowScheduleModal(false);
        setScheduleDateTime('');
        break;
      case 'draft':
        const newDraftThought: DraftPost = {
          id: Date.now().toString(),
          type: 'thought',
          content: thoughtData,
          createdAt: new Date()
        };
        setDraftPosts(prev => [...prev, newDraftThought]);
        showSuccess('Thought saved as draft!');
        break;
    }
  };

  const handlePostPhotos = async (action: 'post' | 'schedule' | 'draft' = 'post') => {
    if (photoFiles.length === 0) {
      showError('Please select at least one photo');
      return;
    }

    const photosData = {
      files: photoFiles,
      caption: photoCaption
    };

    switch (action) {
      case 'post':
        setIsUploading(true);
        const uploadedPhotoResults = await Promise.all(
          photoFiles.map(async (file) => {
            try {
              if (isCloudinaryConfigured()) {
                const result = await uploadToCloudinary(file, { folder: 'equyvo/photos' });
                return { file, result };
              }
            } catch (err) {
              showError(`Upload failed for ${file.name}`);
            }
            return { file, result: null };
          })
        );

        const newUploadedPhotos: UploadedPhoto[] = uploadedPhotoResults.map(({ file, result }, index) => ({
          id: Date.now().toString() + index,
          fileName: file.name,
          fileSize: file.size,
          thumbnail: result?.secureUrl || getOptimizedImageUrl(result?.publicId || '') || 'https://picsum.photos/seed/' + file.name + '/300/400',
          caption: photoCaption,
          uploadDate: new Date(),
          isPrivate: false,
          views: Math.floor(Math.random() * 600),
          likes: Math.floor(Math.random() * 80),
          comments: Math.floor(Math.random() * 35),
          shares: Math.floor(Math.random() * 20)
        }));

        setUploadedPhotos(prev => [...prev, ...newUploadedPhotos]);
        setIsUploading(false);
        showSuccess(`${photoFiles.length} photo(s) posted successfully!`);
        setPhotoFiles([]);
        setPhotoCaption('');
        break;
      case 'schedule':
        if (!scheduleDateTime) {
          showError('Please select a date and time for scheduling');
          return;
        }
        const newScheduledPhotos: ScheduledPost = {
          id: Date.now().toString(),
          type: 'photos',
          content: photosData,
          scheduledTime: new Date(scheduleDateTime),
          status: 'scheduled'
        };
        setScheduledPosts(prev => [...prev, newScheduledPhotos]);
        showSuccess(`${photoFiles.length} photo(s) scheduled successfully!`);
        setPhotoFiles([]);
        setPhotoCaption('');
        setShowScheduleModal(false);
        setScheduleDateTime('');
        break;
      case 'draft':
        const newDraftPhotos: DraftPost = {
          id: Date.now().toString(),
          type: 'photos',
          content: photosData,
          createdAt: new Date()
        };
        setDraftPosts(prev => [...prev, newDraftPhotos]);
        showSuccess(`${photoFiles.length} photo(s) saved as draft!`);
        break;
    }
  };

  const handlePostVideos = async (action: 'post' | 'schedule' | 'draft' = 'post') => {
    if (videoFiles.length === 0) {
      showError('Please select at least one video');
      return;
    }

    const videosData = {
      files: videoFiles,
      caption: videoCaption
    };

    switch (action) {
      case 'post':
        setIsUploading(true);
        const uploadedVideoResults = await Promise.all(
          videoFiles.map(async (file) => {
            try {
              if (isCloudinaryConfigured()) {
                const result = await uploadToCloudinary(file, { folder: 'equyvo/videos' });
                return { file, result };
              }
            } catch (err) {
              showError(`Upload failed for ${file.name}`);
            }
            return { file, result: null };
          })
        );

        const newUploadedVideos: UploadedVideo[] = uploadedVideoResults.map(({ file, result }, index) => ({
          id: Date.now().toString() + index,
          title: videoCaption || file.name,
          fileName: file.name,
          fileSize: file.size,
          duration: result?.duration ? `${Math.floor(result.duration / 60)}:${String(Math.floor(result.duration % 60)).padStart(2, '0')}` : '0:00',
          thumbnail: result?.secureUrl || getThumbnailUrl(result?.publicId || '', { width: 300, height: 180 }) || 'https://picsum.photos/seed/' + file.name + '/300/180',
          uploadDate: new Date(),
          isPrivate: false,
          views: Math.floor(Math.random() * 1000),
          likes: Math.floor(Math.random() * 100),
          comments: Math.floor(Math.random() * 50),
          shares: Math.floor(Math.random() * 25),
          watchTime: Math.floor(Math.random() * 500),
          engagement: Math.floor(Math.random() * 100)
        }));

        setUploadedVideos(prev => [...prev, ...newUploadedVideos]);
        setIsUploading(false);
        showSuccess(`${videoFiles.length} video(s) posted successfully!`);
        setVideoFiles([]);
        setVideoCaption('');
        break;
      case 'schedule':
        if (!scheduleDateTime) {
          showError('Please select a date and time for scheduling');
          return;
        }
        const newScheduledVideos: ScheduledPost = {
          id: Date.now().toString(),
          type: 'videos',
          content: videosData,
          scheduledTime: new Date(scheduleDateTime),
          status: 'scheduled'
        };
        setScheduledPosts(prev => [...prev, newScheduledVideos]);
        showSuccess(`${videoFiles.length} video(s) scheduled successfully!`);
        setVideoFiles([]);
        setVideoCaption('');
        setShowScheduleModal(false);
        setScheduleDateTime('');
        break;
      case 'draft':
        const newDraftVideos: DraftPost = {
          id: Date.now().toString(),
          type: 'videos',
          content: videosData,
          createdAt: new Date()
        };
        setDraftPosts(prev => [...prev, newDraftVideos]);
        showSuccess(`${videoFiles.length} video(s) saved as draft!`);
        break;
    }
  };

  const handleStartLive = async () => {
    if (!liveTitle.trim()) {
      showError('Please enter a title for your live stream');
      return;
    }

    try {
      // Request camera and microphone permissions
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true
      });

      setStream(mediaStream);

      // Initialize MediaRecorder
      const recorder = new MediaRecorder(mediaStream, {
        mimeType: 'video/webm;codecs=vp9'
      });

      const chunks: Blob[] = [];

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunks.push(event.data);
        }
      };

      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'video/webm' });
        handleSaveRecording(blob);
      };

      setMediaRecorder(recorder);
      setRecordedChunks(chunks);

      // Start recording
      recorder.start();
      setIsRecording(true);

      showSuccess('Live stream started and recording has begun!');

    } catch (error) {
      if (error instanceof Error) {
        if (error.name === 'NotAllowedError') {
          showError('Camera and microphone access denied. Please allow access to go live.');
        } else if (error.name === 'NotFoundError') {
          showError('No camera or microphone found. Please connect a device to go live.');
        } else {
          showError('Failed to access camera/microphone. Please check your device permissions.');
        }
      }
    }
  };

  const handleEndLive = async () => {
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
      mediaRecorder.stop();
    }

    if (stream) {
      stream.getTracks().forEach(track => track.stop());
    }

    setIsRecording(false);
    setMediaRecorder(null);
    setStream(null);

    showSuccess('Live stream ended and recording saved!');
    setLiveTitle('');
    setLiveDescription('');
  };

  const handleSaveRecording = async (blob: Blob) => {
    const file = new File([blob], `live-stream-${Date.now()}.webm`, { type: 'video/webm' });

    setIsUploading(true);
    let cloudinaryResult: { secureUrl: string; publicId: string; duration?: number } | null = null;
    if (isCloudinaryConfigured()) {
      try {
        cloudinaryResult = await uploadToCloudinary(file, { folder: 'equyvo/live' });
      } catch (err) {
        showError('Upload failed for live recording');
      }
    }
    setIsUploading(false);

    const newUploadedVideo: UploadedVideo = {
      id: Date.now().toString(),
      title: liveTitle || `Live Stream ${new Date().toLocaleString()}`,
      fileName: file.name,
      fileSize: file.size,
      duration: cloudinaryResult?.duration
        ? `${Math.floor(cloudinaryResult.duration / 60)}:${String(Math.floor(cloudinaryResult.duration % 60)).padStart(2, '0')}`
        : '0:00',
      thumbnail: cloudinaryResult?.secureUrl || 'https://picsum.photos/seed/' + file.name + '/300/180',
      uploadDate: new Date(),
      isPrivate: false,
      views: 0,
      likes: 0,
      comments: 0,
      shares: 0,
      watchTime: 0,
      engagement: 0
    };

    setUploadedVideos(prev => [...prev, newUploadedVideo]);

    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = file.name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleDeleteScheduledPost = (id: string) => {
    setScheduledPosts(prev => prev.filter(post => post.id !== id));
    showSuccess('Scheduled post deleted successfully!');
  };

  const handleDeleteDraftPost = (id: string) => {
    setDraftPosts(prev => prev.filter(post => post.id !== id));
    showSuccess('Draft deleted successfully!');
  };

  // Content management functions
  const handleDeleteVideo = (id: string) => {
    setUploadedVideos(prev => prev.filter(video => video.id !== id));
    showSuccess('Video deleted successfully!');
  };

  const handleDeleteStory = (id: string) => {
    setUploadedStories(prev => prev.filter(story => story.id !== id));
    showSuccess('Story deleted successfully!');
  };

  const handleDeleteThought = (id: string) => {
    setUploadedThoughts(prev => prev.filter(thought => thought.id !== id));
    showSuccess('Thought deleted successfully!');
  };


  const handleDeletePhoto = (id: string) => {
    setUploadedPhotos(prev => prev.filter(photo => photo.id !== id));
    showSuccess('Photo deleted successfully!');
  };

  const handleDeleteTextStory = (id: string) => {
    setUploadedTextStories(prev => prev.filter(textStory => textStory.id !== id));
    showSuccess('Text story deleted successfully!');
  };

  const handleTogglePrivacy = (contentType: string, id: string) => {
    switch (contentType) {
      case 'video':
        setUploadedVideos(prev => prev.map(video =>
          video.id === id ? { ...video, isPrivate: !video.isPrivate } : video
        ));
        break;
      case 'story':
        setUploadedStories(prev => prev.map(story =>
          story.id === id ? { ...story, isPrivate: !story.isPrivate } : story
        ));
        break;
      case 'thought':
        setUploadedThoughts(prev => prev.map(thought =>
          thought.id === id ? { ...thought, isPrivate: !thought.isPrivate } : thought
        ));
        break;
      case 'photo':
        setUploadedPhotos(prev => prev.map(photo =>
          photo.id === id ? { ...photo, isPrivate: !photo.isPrivate } : photo
        ));
        break;
      case 'text-story':
        setUploadedTextStories(prev => prev.map(textStory =>
          textStory.id === id ? { ...textStory, isPrivate: !textStory.isPrivate } : textStory
        ));
        break;
    }
    showSuccess('Privacy settings updated!');
  };

  const handleEditDraftPost = (draft: DraftPost) => {
    // Load draft content back into form
    switch (draft.type) {
      case 'story':
        setStoryFiles(draft.content.files);
        if (draft.content.caption) {
          (document.getElementById('story-caption') as HTMLTextAreaElement).value = draft.content.caption;
        }
        setActiveTab('story');
        break;
      case 'text-story':
        setTextStoryContent(draft.content.content);
        setTextStoryBackground(draft.content.background);
        setTextStoryColor(draft.content.color);
        setActiveTab('text-story');
        break;
      case 'thought':
        setThoughtContent(draft.content.content);
        setThoughtVideo(draft.content.video);
        setActiveTab('thought');
        break;
      case 'photos':
        setPhotoFiles(draft.content.files);
        setPhotoCaption(draft.content.caption);
        setActiveTab('photo');
        break;
      case 'videos':
        setVideoFiles(draft.content.files);
        setVideoCaption(draft.content.caption);
        setActiveTab('video');
        break;
    }
    // Remove the draft after loading
    handleDeleteDraftPost(draft.id);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatScheduledTime = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  return (
    <div className="space-y-4 md:space-y-6 w-full px-4 sm:px-6 lg:px-8 pb-20 md:pb-6 lg:pb-8">
      <h1 className="text-lg md:text-2xl lg:text-3xl font-bold">Create New Content</h1>

      {/* Content Management Toggle */}
      {[
        ...uploadedVideos,
        ...uploadedStories,
        ...uploadedThoughts,
        ...uploadedPhotos,
        ...uploadedTextStories
      ].length > 0 && (
          <Card>
            <CardContent className="p-3 md:p-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4">
                <div className="flex flex-wrap items-center gap-2 sm:flex-nowrap sm:gap-2">
                  <BarChart3 className="h-4 w-4 md:h-5 md:w-5 text-blue-500" />
                  <span className="font-medium text-sm md:text-base">
                    Manage Your Content ({[
                      ...uploadedVideos,
                      ...uploadedStories,
                      ...uploadedThoughts,
                      ...uploadedPhotos,
                      ...uploadedTextStories
                    ].length})
                  </span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowContentManagement(!showContentManagement)}
                  className="text-xs md:text-sm"
                >
                  {showContentManagement ? 'Hide' : 'Show'} Management
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

      {/* Unified Content Management Section */}
      {showContentManagement && [
        ...uploadedVideos,
        ...uploadedStories,
        ...uploadedThoughts,
        ...uploadedPhotos,
        ...uploadedTextStories
      ].length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-blue-500" />
                Your Content Analytics & Management
              </CardTitle>
              {/* Management Tabs */}
              <div className="flex space-x-1 bg-muted rounded-lg p-1 overflow-x-auto">
                {(['all', 'videos', 'stories', 'thoughts', 'photos', 'text-stories'] as const).map((tab) => (
                  <Button
                    key={tab}
                    variant={activeManagementTab === tab ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setActiveManagementTab(tab)}
                    className="capitalize whitespace-nowrap text-xs md:text-sm"
                  >
                    {(() => {
                      switch (tab) {
                        case 'all': return 'All';
                        case 'videos': return '🎬 Videos';
                        case 'stories': return '📱 Stories';
                        case 'thoughts': return '💭 Thoughts';
                        case 'photos': return '🖼️ Photos';
                        case 'text-stories': return '📝 Text Stories';
                        default: return tab;
                      }
                    })()}
                  </Button>
                ))}
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Videos */}
                {(activeManagementTab === 'all' || activeManagementTab === 'videos') && uploadedVideos.map((video) => (
                  <div key={video.id} className="border rounded-lg p-3 md:p-4 space-y-3 md:space-y-4">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                      <div className="relative">
                        <img
                          src={video.thumbnail}
                          alt={video.title}
                          className="w-16 h-12 md:w-20 md:h-14 object-cover rounded"
                        />
                        <Play className="absolute bottom-1 right-1 h-3 w-3 md:h-4 md:w-4 text-white drop-shadow-md" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-sm md:text-base truncate">{video.title}</h3>
                        <p className="text-xs md:text-sm text-muted-foreground truncate">
                          {video.fileName} • {formatFileSize(video.fileSize)}
                        </p>
                        <p className="text-xs md:text-sm text-muted-foreground">
                          Uploaded {formatScheduledTime(video.uploadDate)}
                        </p>
                        {video.isPrivate && (
                          <div className="flex items-center gap-1 text-xs text-orange-600 mt-1">
                            <Lock className="h-3 w-3" />
                            Private
                          </div>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-2 sm:flex-nowrap sm:gap-2">
                        <Button
                          variant={video.isPrivate ? "default" : "outline"}
                          size="sm"
                          onClick={() => handleTogglePrivacy('video', video.id)}
                          className="flex items-center gap-1"
                        >
                          {video.isPrivate ? <Lock className="h-4 w-4" /> : <Unlock className="h-4 w-4" />}
                          {video.isPrivate ? 'Private' : 'Public'}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteVideo(video.id)}
                          className="text-red-500 hover:text-red-600 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t">
                      <div className="text-center">
                        <div className="flex items-center justify-center gap-1 text-blue-600">
                          <Eye className="h-4 w-4" />
                          <span className="text-lg font-bold">{video.views.toLocaleString()}</span>
                        </div>
                        <p className="text-xs text-muted-foreground">Views</p>
                      </div>
                      <div className="text-center">
                        <div className="flex items-center justify-center gap-1 text-red-600">
                          <TrendingUp className="h-4 w-4" />
                          <span className="text-lg font-bold">{video.likes}</span>
                        </div>
                        <p className="text-xs text-muted-foreground">Likes</p>
                      </div>
                      <div className="text-center">
                        <div className="flex items-center justify-center gap-1 text-green-600">
                          <Users className="h-4 w-4" />
                          <span className="text-lg font-bold">{video.comments}</span>
                        </div>
                        <p className="text-xs text-muted-foreground">Comments</p>
                      </div>
                      <div className="text-center">
                        <div className="flex items-center justify-center gap-1 text-purple-600">
                          <BarChart3 className="h-4 w-4" />
                          <span className="text-lg font-bold">{video.engagement}%</span>
                        </div>
                        <p className="text-xs text-muted-foreground">Engagement</p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t">
                      <span>Watch Time: {video.watchTime} minutes</span>
                      <span>Shares: {video.shares}</span>
                      <span>Duration: {video.duration}</span>
                    </div>
                  </div>
                ))}

                {/* Stories */}
                {(activeManagementTab === 'all' || activeManagementTab === 'stories') && uploadedStories.map((story) => (
                  <div key={story.id} className="border rounded-lg p-4 space-y-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <img
                            src={story.thumbnail}
                            alt={story.fileName}
                            className="w-20 h-24 object-cover rounded"
                          />
                          {story.type === 'video' && <Play className="absolute bottom-1 right-1 h-4 w-4 text-white drop-shadow-md" />}
                        </div>
                        <div>
                          <h3 className="font-semibold text-sm">{story.type === 'video' ? 'Video Story' : 'Photo Story'}</h3>
                          <p className="text-xs text-muted-foreground">
                            {story.fileName} • {formatFileSize(story.fileSize)}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Uploaded {formatScheduledTime(story.uploadDate)}
                          </p>
                          <p className="text-xs text-orange-600">
                            Expires in 24 hours
                          </p>
                          {story.isPrivate && (
                            <div className="flex items-center gap-1 text-xs text-orange-600 mt-1">
                              <Lock className="h-3 w-3" />
                              Private
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 sm:flex-nowrap sm:gap-2">
                        <Button
                          variant={story.isPrivate ? "default" : "outline"}
                          size="sm"
                          onClick={() => handleTogglePrivacy('story', story.id)}
                          className="flex items-center gap-1"
                        >
                          {story.isPrivate ? <Lock className="h-4 w-4" /> : <Unlock className="h-4 w-4" />}
                          {story.isPrivate ? 'Private' : 'Public'}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteStory(story.id)}
                          className="text-red-500 hover:text-red-600 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t">
                      <div className="text-center">
                        <div className="flex items-center justify-center gap-1 text-blue-600">
                          <Eye className="h-4 w-4" />
                          <span className="text-lg font-bold">{story.views.toLocaleString()}</span>
                        </div>
                        <p className="text-xs text-muted-foreground">Views</p>
                      </div>
                      <div className="text-center">
                        <div className="flex items-center justify-center gap-1 text-red-600">
                          <TrendingUp className="h-4 w-4" />
                          <span className="text-lg font-bold">{story.likes}</span>
                        </div>
                        <p className="text-xs text-muted-foreground">Likes</p>
                      </div>
                      <div className="text-center">
                        <div className="flex items-center justify-center gap-1 text-green-600">
                          <Users className="h-4 w-4" />
                          <span className="text-lg font-bold">{story.comments}</span>
                        </div>
                        <p className="text-xs text-muted-foreground">Comments</p>
                      </div>
                      <div className="text-center">
                        <div className="flex items-center justify-center gap-1 text-purple-600">
                          <BarChart3 className="h-4 w-4" />
                          <span className="text-lg font-bold">{story.shares}</span>
                        </div>
                        <p className="text-xs text-muted-foreground">Shares</p>
                      </div>
                    </div>
                  </div>
                ))}

                {/* Thoughts */}
                {(activeManagementTab === 'all' || activeManagementTab === 'thoughts') && uploadedThoughts.map((thought) => (
                  <div key={thought.id} className="border rounded-lg p-4 space-y-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        {thought.hasMedia && thought.mediaUrl && (
                          <img
                            src={thought.mediaUrl}
                            alt="Thought media"
                            className="w-16 h-16 object-cover rounded"
                          />
                        )}
                        <div className="w-full sm:flex-1">
                          <h3 className="font-semibold text-sm line-clamp-2">{thought.content}</h3>
                          <p className="text-xs text-muted-foreground mt-1">
                            {thought.hasMedia ? `${thought.mediaType} • ` : ''}Thought
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Posted {formatScheduledTime(thought.uploadDate)}
                          </p>
                          {thought.isPrivate && (
                            <div className="flex items-center gap-1 text-xs text-orange-600 mt-1">
                              <Lock className="h-3 w-3" />
                              Private
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 sm:flex-nowrap sm:gap-2">
                        <Button
                          variant={thought.isPrivate ? "default" : "outline"}
                          size="sm"
                          onClick={() => handleTogglePrivacy('thought', thought.id)}
                          className="flex items-center gap-1"
                        >
                          {thought.isPrivate ? <Lock className="h-4 w-4" /> : <Unlock className="h-4 w-4" />}
                          {thought.isPrivate ? 'Private' : 'Public'}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteThought(thought.id)}
                          className="text-red-500 hover:text-red-600 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t">
                      <div className="text-center">
                        <div className="flex items-center justify-center gap-1 text-blue-600">
                          <Eye className="h-4 w-4" />
                          <span className="text-lg font-bold">{thought.views.toLocaleString()}</span>
                        </div>
                        <p className="text-xs text-muted-foreground">Views</p>
                      </div>
                      <div className="text-center">
                        <div className="flex items-center justify-center gap-1 text-red-600">
                          <TrendingUp className="h-4 w-4" />
                          <span className="text-lg font-bold">{thought.likes}</span>
                        </div>
                        <p className="text-xs text-muted-foreground">Likes</p>
                      </div>
                      <div className="text-center">
                        <div className="flex items-center justify-center gap-1 text-green-600">
                          <Users className="h-4 w-4" />
                          <span className="text-lg font-bold">{thought.comments}</span>
                        </div>
                        <p className="text-xs text-muted-foreground">Comments</p>
                      </div>
                      <div className="text-center">
                        <div className="flex items-center justify-center gap-1 text-purple-600">
                          <BarChart3 className="h-4 w-4" />
                          <span className="text-lg font-bold">{thought.reacts}</span>
                        </div>
                        <p className="text-xs text-muted-foreground">Reacts</p>
                      </div>
                    </div>
                  </div>
                ))}


                {/* Photos */}
                {(activeManagementTab === 'all' || activeManagementTab === 'photos') && uploadedPhotos.map((photo) => (
                  <div key={photo.id} className="border rounded-lg p-4 space-y-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <img
                          src={photo.thumbnail}
                          alt={photo.fileName}
                          className="w-20 h-24 object-cover rounded"
                        />
                        <div>
                          <h3 className="font-semibold text-sm line-clamp-2">{photo.caption || 'Photo'}</h3>
                          <p className="text-xs text-muted-foreground">
                            {photo.fileName} • {formatFileSize(photo.fileSize)}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Posted {formatScheduledTime(photo.uploadDate)}
                          </p>
                          {photo.isPrivate && (
                            <div className="flex items-center gap-1 text-xs text-orange-600 mt-1">
                              <Lock className="h-3 w-3" />
                              Private
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 sm:flex-nowrap sm:gap-2">
                        <Button
                          variant={photo.isPrivate ? "default" : "outline"}
                          size="sm"
                          onClick={() => handleTogglePrivacy('photo', photo.id)}
                          className="flex items-center gap-1"
                        >
                          {photo.isPrivate ? <Lock className="h-4 w-4" /> : <Unlock className="h-4 w-4" />}
                          {photo.isPrivate ? 'Private' : 'Public'}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeletePhoto(photo.id)}
                          className="text-red-500 hover:text-red-600 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t">
                      <div className="text-center">
                        <div className="flex items-center justify-center gap-1 text-blue-600">
                          <Eye className="h-4 w-4" />
                          <span className="text-lg font-bold">{photo.views.toLocaleString()}</span>
                        </div>
                        <p className="text-xs text-muted-foreground">Views</p>
                      </div>
                      <div className="text-center">
                        <div className="flex items-center justify-center gap-1 text-red-600">
                          <TrendingUp className="h-4 w-4" />
                          <span className="text-lg font-bold">{photo.likes}</span>
                        </div>
                        <p className="text-xs text-muted-foreground">Likes</p>
                      </div>
                      <div className="text-center">
                        <div className="flex items-center justify-center gap-1 text-green-600">
                          <Users className="h-4 w-4" />
                          <span className="text-lg font-bold">{photo.comments}</span>
                        </div>
                        <p className="text-xs text-muted-foreground">Comments</p>
                      </div>
                      <div className="text-center">
                        <div className="flex items-center justify-center gap-1 text-purple-600">
                          <BarChart3 className="h-4 w-4" />
                          <span className="text-lg font-bold">{photo.shares}</span>
                        </div>
                        <p className="text-xs text-muted-foreground">Shares</p>
                      </div>
                    </div>
                  </div>
                ))}

                {/* Text Stories */}
                {(activeManagementTab === 'all' || activeManagementTab === 'text-stories') && uploadedTextStories.map((textStory) => (
                  <div key={textStory.id} className="border rounded-lg p-4 space-y-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-20 h-24 rounded flex items-center justify-center text-center p-2"
                          style={{
                            backgroundColor: textStory.backgroundColor,
                            color: textStory.textColor
                          }}
                        >
                          <p className="text-xs font-medium line-clamp-3">{textStory.content}</p>
                        </div>
                        <div>
                          <h3 className="font-semibold text-sm line-clamp-2">Text Story</h3>
                          <p className="text-xs text-muted-foreground">
                            Text Story • Posted {formatScheduledTime(textStory.uploadDate)}
                          </p>
                          <p className="text-xs text-orange-600">
                            Expires in 24 hours
                          </p>
                          {textStory.isPrivate && (
                            <div className="flex items-center gap-1 text-xs text-orange-600 mt-1">
                              <Lock className="h-3 w-3" />
                              Private
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 sm:flex-nowrap sm:gap-2">
                        <Button
                          variant={textStory.isPrivate ? "default" : "outline"}
                          size="sm"
                          onClick={() => handleTogglePrivacy('text-story', textStory.id)}
                          className="flex items-center gap-1"
                        >
                          {textStory.isPrivate ? <Lock className="h-4 w-4" /> : <Unlock className="h-4 w-4" />}
                          {textStory.isPrivate ? 'Private' : 'Public'}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteTextStory(textStory.id)}
                          className="text-red-500 hover:text-red-600 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t">
                      <div className="text-center">
                        <div className="flex items-center justify-center gap-1 text-blue-600">
                          <Eye className="h-4 w-4" />
                          <span className="text-lg font-bold">{textStory.views.toLocaleString()}</span>
                        </div>
                        <p className="text-xs text-muted-foreground">Views</p>
                      </div>
                      <div className="text-center">
                        <div className="flex items-center justify-center gap-1 text-red-600">
                          <TrendingUp className="h-4 w-4" />
                          <span className="text-lg font-bold">{textStory.likes}</span>
                        </div>
                        <p className="text-xs text-muted-foreground">Likes</p>
                      </div>
                      <div className="text-center">
                        <div className="flex items-center justify-center gap-1 text-green-600">
                          <Users className="h-4 w-4" />
                          <span className="text-lg font-bold">{textStory.comments}</span>
                        </div>
                        <p className="text-xs text-muted-foreground">Comments</p>
                      </div>
                      <div className="text-center">
                        <div className="flex items-center justify-center gap-1 text-purple-600">
                          <BarChart3 className="h-4 w-4" />
                          <span className="text-lg font-bold">{textStory.shares}</span>
                        </div>
                        <p className="text-xs text-muted-foreground">Shares</p>
                      </div>
                    </div>
                  </div>
                ))}

                {/* Empty state for filtered tabs */}
                {(() => {
                  const hasNoContent = uploadedVideos.length === 0 &&
                    uploadedStories.length === 0 &&
                    uploadedThoughts.length === 0 &&
                    uploadedPhotos.length === 0 &&
                    uploadedTextStories.length === 0;

                  const shouldShowEmptyState =
                    (activeManagementTab === 'all' && hasNoContent) ||
                    (activeManagementTab === 'videos' && uploadedVideos.length === 0) ||
                    (activeManagementTab === 'stories' && uploadedStories.length === 0) ||
                    (activeManagementTab === 'thoughts' && uploadedThoughts.length === 0) ||
                    (activeManagementTab === 'photos' && uploadedPhotos.length === 0) ||
                    (activeManagementTab === 'text-stories' && uploadedTextStories.length === 0);

                  return shouldShowEmptyState && (
                    <div className="text-center py-12">
                      <BarChart3 className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                      <p className="text-muted-foreground text-lg mb-2">
                        No {activeManagementTab === 'all' ? 'content' : activeManagementTab.replace('-', ' ')} found
                      </p>
                      <p className="text-muted-foreground text-sm">
                        Create and post some {activeManagementTab === 'all' ? 'content' : activeManagementTab.replace('-', ' ')} to see them here
                      </p>
                    </div>
                  );
                })()}
              </div>
            </CardContent>
          </Card>
        )}

      {/* Content Type Selection */}
      <Card>
        <CardHeader>
          <CardTitle>What would you like to create?</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          <Button
            variant={activeTab === 'story' ? 'default' : 'outline'}
            className="flex flex-col h-28 items-center justify-center gap-2 hover:scale-105 transition-transform duration-200"
            onClick={() => setActiveTab('story')}
          >
            <Camera className="h-8 w-8 text-pink-500" />
            <span>Story</span>
            <span className="text-xs text-muted-foreground">24hr</span>
          </Button>
          <Button
            variant={activeTab === 'text-story' ? 'default' : 'outline'}
            className="flex flex-col h-28 items-center justify-center gap-2 hover:scale-105 transition-transform duration-200"
            onClick={() => setActiveTab('text-story')}
          >
            <Text className="h-8 w-8 text-blue-400" />
            <span>Text Story</span>
            <span className="text-xs text-muted-foreground">24hr</span>
          </Button>
          <Button
            variant={activeTab === 'thought' ? 'default' : 'outline'}
            className="flex flex-col h-28 items-center justify-center gap-2 hover:scale-105 transition-transform duration-200"
            onClick={() => setActiveTab('thought')}
          >
            <Brain className="h-8 w-8 text-purple-500" />
            <span>Thought</span>
            <span className="text-xs text-muted-foreground">&lt;5min</span>
          </Button>
          <Button
            variant={activeTab === 'photo' ? 'default' : 'outline'}
            className="flex flex-col h-28 items-center justify-center gap-2 hover:scale-105 transition-transform duration-200"
            onClick={() => setActiveTab('photo')}
          >
            <ImageIcon className="h-8 w-8 text-blue-500" />
            <span>Photos</span>
            <span className="text-xs text-muted-foreground">Post</span>
          </Button>
          <Button
            variant={activeTab === 'video' ? 'default' : 'outline'}
            className="flex flex-col h-28 items-center justify-center gap-2 hover:scale-105 transition-transform duration-200"
            onClick={() => setActiveTab('video')}
          >
            <Film className="h-8 w-8 text-green-500" />
            <span>Videos</span>
            <span className="text-xs text-muted-foreground">Long</span>
          </Button>
          <Button
            variant={activeTab === 'live' ? 'default' : 'outline'}
            className="flex flex-col h-28 items-center justify-center gap-2 hover:scale-105 transition-transform duration-200"
            onClick={() => setActiveTab('live')}
          >
            <Zap className="h-8 w-8 text-red-500 fill-red-500 animate-pulse" />
            <span>Go Live!</span>
            <span className="text-xs text-muted-foreground">Stream</span>
          </Button>
        </CardContent>
      </Card>

      {/* Create Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="story">Story</TabsTrigger>
          <TabsTrigger value="text-story">Text Story</TabsTrigger>
          <TabsTrigger value="thought">Thought</TabsTrigger>
          <TabsTrigger value="photo">Photos</TabsTrigger>
          <TabsTrigger value="video">Videos</TabsTrigger>
          <TabsTrigger value="live">Live</TabsTrigger>
        </TabsList>

        {/* Story Upload */}
        <TabsContent value="story" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Camera className="h-5 w-5" />
                Create Story (24 hours)
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Share photos, videos, GIFs, or text that disappear after 24 hours
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* File Upload Area */}
              <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center">
                <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-lg font-semibold mb-2">Upload Story Content</p>
                <p className="text-sm text-muted-foreground mb-4">
                  Photos, Videos, or GIFs
                </p>
                <Input
                  type="file"
                  accept="image/*,video/*"
                  multiple
                  onChange={(e) => handleFileUpload(e.target.files, 'story')}
                  className="max-w-xs mx-auto"
                />
              </div>

              {/* Uploaded Files */}
              {storyFiles.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-semibold">Uploaded Files:</h4>
                  {storyFiles.map((file, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        {file.type.startsWith('image/') ? (
                          <Image className="h-5 w-5 text-blue-500" />
                        ) : (
                          <FileVideo className="h-5 w-5 text-green-500" />
                        )}
                        <div>
                          <p className="text-sm font-medium">{file.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {file.type.startsWith('image/') ? 'Image' : 'Video'}
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveFile(index, 'story')}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              {/* Story Caption */}
              <div>
                <Label htmlFor="story-caption">Add Caption (Optional)</Label>
                <Textarea
                  id="story-caption"
                  placeholder="What's happening in your story?"
                  className="mt-1"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-2">
                <Button onClick={() => handlePostStory('post')} className="w-full sm:flex-1">
                  Post Story
                </Button>
                <Button
                  onClick={() => {
                    setCurrentContentType('story');
                    setShowScheduleModal(true);
                  }}
                  variant="outline"
                  className="w-full sm:flex-1"
                >
                  <Calendar className="h-4 w-4 mr-2" />
                  Schedule
                </Button>
                <Button
                  onClick={() => handlePostStory('draft')}
                  variant="secondary"
                  className="w-full sm:flex-1"
                >
                  Save as Draft
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Text Story Upload */}
        <TabsContent value="text-story" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Text className="h-5 w-5" />
                Create Text Story (24 hours)
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Share text with custom colors and backgrounds that disappear after 24 hours
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Story Preview */}
              <div
                className="w-full h-64 rounded-lg flex items-center justify-center p-8 text-center"
                style={{
                  backgroundColor: textStoryBackground,
                  color: textStoryColor
                }}
              >
                <p className="text-lg font-medium break-words">
                  {textStoryContent || 'Your text will appear here...'}
                </p>
              </div>

              {/* Text Input */}
              <div>
                <Label htmlFor="text-story-content">Your Text</Label>
                <Textarea
                  id="text-story-content"
                  placeholder="What's on your mind?"
                  value={textStoryContent}
                  onChange={(e) => setTextStoryContent(e.target.value)}
                  className="mt-1"
                  rows={3}
                  maxLength={200}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {textStoryContent.length}/200 characters
                </p>
              </div>

              {/* Color Options */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="text-color">Text Color</Label>
                  <div className="flex gap-2 mt-1">
                    <Input
                      type="color"
                      id="text-color"
                      value={textStoryColor}
                      onChange={(e) => setTextStoryColor(e.target.value)}
                      className="w-16 h-10 p-1"
                    />
                    <Input
                      type="text"
                      value={textStoryColor}
                      onChange={(e) => setTextStoryColor(e.target.value)}
                      placeholder="#FFFFFF"
                      className="w-full sm:flex-1"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="bg-color">Background Color</Label>
                  <div className="flex gap-2 mt-1">
                    <Input
                      type="color"
                      id="bg-color"
                      value={textStoryBackground}
                      onChange={(e) => setTextStoryBackground(e.target.value)}
                      className="w-16 h-10 p-1"
                    />
                    <Input
                      type="text"
                      value={textStoryBackground}
                      onChange={(e) => setTextStoryBackground(e.target.value)}
                      placeholder="#000000"
                      className="w-full sm:flex-1"
                    />
                  </div>
                </div>
              </div>

              {/* Quick Background Templates */}
              <div>
                <Label>Quick Backgrounds</Label>
                <div className="grid grid-cols-6 gap-2 mt-2">
                  {[
                    { bg: '#000000', color: '#FFFFFF', name: 'Black' },
                    { bg: '#FFFFFF', color: '#000000', name: 'White' },
                    { bg: '#FF6B6B', color: '#FFFFFF', name: 'Red' },
                    { bg: '#4ECDC4', color: '#000000', name: 'Green' },
                    { bg: '#45B7D1', color: '#FFFFFF', name: 'Blue' },
                    { bg: '#FFA07A', color: '#000000', name: 'Orange' },
                    { bg: '#98D8C8', color: '#000000', name: 'Mint' },
                    { bg: '#FFD93D', color: '#000000', name: 'Yellow' },
                    { bg: '#6C5CE7', color: '#FFFFFF', name: 'Purple' },
                    { bg: '#FF69B4', color: '#000000', name: 'Pink' },
                    { bg: '#20B2AA', color: '#FFFFFF', name: 'Teal' },
                    { bg: '#795548', color: '#FFFFFF', name: 'Brown' },
                  ].map((template, index) => (
                    <button
                      key={index}
                      className="w-10 h-10 rounded border-2 border-gray-200 hover:border-gray-400 transition-colors"
                      style={{ backgroundColor: template.bg }}
                      onClick={() => {
                        setTextStoryBackground(template.bg);
                        setTextStoryColor(template.color);
                      }}
                      title={template.name}
                    />
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-2">
                <Button onClick={() => handlePostTextStory('post')} className="w-full sm:flex-1">
                  Post Text Story
                </Button>
                <Button
                  onClick={() => {
                    setCurrentContentType('text-story');
                    setShowScheduleModal(true);
                  }}
                  variant="outline"
                  className="w-full sm:flex-1"
                >
                  <Calendar className="h-4 w-4 mr-2" />
                  Schedule
                </Button>
                <Button
                  onClick={() => handlePostTextStory('draft')}
                  variant="secondary"
                  className="w-full sm:flex-1"
                >
                  Save as Draft
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Thought Creation */}
        <TabsContent value="thought" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Text className="h-5 w-5" />
                Share Your Thought
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Express yourself with text and optional short video
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="thought-content">Your Thought</Label>
                <Textarea
                  id="thought-content"
                  placeholder="What's on your mind?"
                  value={thoughtContent}
                  onChange={(e) => setThoughtContent(e.target.value)}
                  className="mt-1 min-h-[120px]"
                />
              </div>

              {/* Optional Video Upload */}
              <div>
                <Label htmlFor="thought-video">Add Video or Photos (Optional)</Label>
                <p className="text-sm text-muted-foreground mb-2">
                  Enhance your thought with a short video clip, photo, or GIF to make it more engaging
                </p>
                <div className="mt-1">
                  {thoughtVideo ? (
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <FileVideo className="h-5 w-5 text-green-500" />
                        <div>
                          <p className="text-sm font-medium">{thoughtVideo.name}</p>
                          <p className="text-xs text-muted-foreground">
                            Video
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveFile(0, 'thought')}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-4 text-center">
                      <Video className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground mb-2">
                        Upload a short video, photo, or GIF
                      </p>
                      <Input
                        type="file"
                        accept="video/*,image/*,image/gif"
                        onChange={(e) => handleFileUpload(e.target.files, 'thought')}
                        className="max-w-xs mx-auto"
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-2">
                <Button onClick={() => handlePostThought('post')} className="w-full sm:flex-1">
                  Post Thought
                </Button>
                <Button
                  onClick={() => {
                    setCurrentContentType('thought');
                    setShowScheduleModal(true);
                  }}
                  variant="outline"
                  className="w-full sm:flex-1"
                >
                  <Calendar className="h-4 w-4 mr-2" />
                  Schedule
                </Button>
                <Button
                  onClick={() => handlePostThought('draft')}
                  variant="secondary"
                  className="w-full sm:flex-1"
                >
                  Save as Draft
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>


        {/* Photo Upload */}
        <TabsContent value="photo" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ImageIcon className="h-5 w-5 text-blue-500" />
                Share Photos
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Upload and share your favorite photos with your followers
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Photo Upload Area */}
              <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center">
                <ImageIcon className="h-12 w-12 mx-auto mb-4 text-blue-500" />
                <p className="text-lg font-semibold mb-2">Upload Photos</p>
                <p className="text-sm text-muted-foreground mb-4">
                  Multiple photos supported
                </p>
                <Input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={(e) => handleFileUpload(e.target.files, 'photo')}
                  className="max-w-xs mx-auto"
                />
              </div>

              {/* Uploaded Photos */}
              {photoFiles.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-semibold">Uploaded Photos ({photoFiles.length}):</h4>
                  {photoFiles.map((file, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <ImageIcon className="h-5 w-5 text-blue-500" />
                        <div>
                          <p className="text-sm font-medium">{file.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {formatFileSize(file.size)} • Photo
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveFile(index, 'photo')}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              {/* Photo Caption */}
              <div>
                <Label htmlFor="photo-caption">Add Caption</Label>
                <Textarea
                  id="photo-caption"
                  placeholder="Tell your photo story..."
                  value={photoCaption}
                  onChange={(e) => setPhotoCaption(e.target.value)}
                  className="mt-1"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-2">
                <Button onClick={() => handlePostPhotos('post')} className="w-full sm:flex-1">
                  Post Photos
                </Button>
                <Button
                  onClick={() => {
                    setCurrentContentType('photos');
                    setShowScheduleModal(true);
                  }}
                  variant="outline"
                  className="w-full sm:flex-1"
                >
                  <Calendar className="h-4 w-4 mr-2" />
                  Schedule
                </Button>
                <Button
                  onClick={() => handlePostPhotos('draft')}
                  variant="secondary"
                  className="w-full sm:flex-1"
                >
                  Save as Draft
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Video Upload */}
        <TabsContent value="video" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Film className="h-5 w-5 text-green-500" />
                Share Videos
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Upload longer videos for your followers to enjoy
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Video Upload Area */}
              <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center">
                <Film className="h-12 w-12 mx-auto mb-4 text-green-500" />
                <p className="text-lg font-semibold mb-2">Upload Videos</p>
                <p className="text-sm text-muted-foreground mb-4">
                  Multiple videos supported
                </p>
                <Input
                  type="file"
                  accept="video/*"
                  multiple
                  onChange={(e) => handleFileUpload(e.target.files, 'video')}
                  className="max-w-xs mx-auto"
                />
              </div>

              {/* Uploaded Videos */}
              {videoFiles.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-semibold">Uploaded Videos ({videoFiles.length}):</h4>
                  {videoFiles.map((file, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <Film className="h-5 w-5 text-green-500" />
                        <div>
                          <p className="text-sm font-medium">{file.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {formatFileSize(file.size)} • Video
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveFile(index, 'video')}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              {/* Video Caption */}
              <div>
                <Label htmlFor="video-caption">Add Caption</Label>
                <Textarea
                  id="video-caption"
                  placeholder="Describe your video..."
                  value={videoCaption}
                  onChange={(e) => setVideoCaption(e.target.value)}
                  className="mt-1"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-2">
                <Button onClick={() => handlePostVideos('post')} className="w-full sm:flex-1">
                  Post Videos
                </Button>
                <Button
                  onClick={() => {
                    setCurrentContentType('videos');
                    setShowScheduleModal(true);
                  }}
                  variant="outline"
                  className="w-full sm:flex-1"
                >
                  <Calendar className="h-4 w-4 mr-2" />
                  Schedule
                </Button>
                <Button
                  onClick={() => handlePostVideos('draft')}
                  variant="secondary"
                  className="w-full sm:flex-1"
                >
                  Save as Draft
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Live Stream */}
        <TabsContent value="live" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-red-500" />
                Start Live Stream
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Go live and engage with your audience in real-time
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="live-title">Stream Title</Label>
                <Input
                  id="live-title"
                  placeholder="Give your stream a catchy title"
                  value={liveTitle}
                  onChange={(e) => setLiveTitle(e.target.value)}
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="live-description">Description</Label>
                <Textarea
                  id="live-description"
                  placeholder="What's your stream about?"
                  value={liveDescription}
                  onChange={(e) => setLiveDescription(e.target.value)}
                  className="mt-1"
                />
              </div>

              <div className="bg-muted/50 rounded-lg p-4">
                <h4 className="font-semibold mb-2">Before you go live:</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Make sure you have a stable internet connection</li>
                  <li>• Find a quiet, well-lit space</li>
                  <li>• Test your camera and microphone</li>
                  <li>• Prepare topics to discuss</li>
                </ul>
              </div>

              {isRecording && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                    <span className="font-semibold text-red-700">Recording in Progress</span>
                  </div>
                  <p className="text-sm text-red-600">
                    Your live stream is being recorded. Click "End Live Stream" to stop recording and save the video.
                  </p>
                </div>
              )}

              {!isRecording ? (
                <Button onClick={handleStartLive} className="w-full bg-red-500 hover:bg-red-600">
                  <Zap className="h-4 w-4 mr-2" />
                  Go Live Now
                </Button>
              ) : (
                <Button onClick={handleEndLive} className="w-full bg-gray-800 hover:bg-gray-900">
                  <Square className="h-4 w-4 mr-2" />
                  End Live Stream
                </Button>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Scheduled Posts Section */}
      {scheduledPosts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Scheduled Posts ({scheduledPosts.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {scheduledPosts.map((post) => (
                <div key={post.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${post.status === 'scheduled' ? 'bg-blue-500' :
                        post.status === 'posted' ? 'bg-green-500' : 'bg-red-500'
                      }`} />
                    <div>
                      <p className="text-sm font-medium capitalize">{post.type}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatScheduledTime(post.scheduledTime)}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 sm:flex-nowrap sm:gap-2">
                    <span className={`text-xs px-2 py-1 rounded ${post.status === 'scheduled' ? 'bg-blue-100 text-blue-700' :
                        post.status === 'posted' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                      }`}>
                      {post.status}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteScheduledPost(post.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Drafts Section */}
      {draftPosts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileVideo className="h-5 w-5" />
              Drafts ({draftPosts.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {draftPosts.map((draft) => (
                <div key={draft.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full bg-gray-500" />
                    <div>
                      <p className="text-sm font-medium capitalize">{draft.type} draft</p>
                      <p className="text-xs text-muted-foreground">
                        Created {formatScheduledTime(draft.createdAt)}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 sm:flex-nowrap sm:gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEditDraftPost(draft)}
                    >
                      Edit
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteDraftPost(draft.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Upload Loading Overlay */}
      {isUploading && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <Card className="p-8 text-center">
            <Loader2 className="h-10 w-10 animate-spin mx-auto mb-4 text-primary" />
            <p className="text-lg font-semibold">Uploading your media to Cloudinary...</p>
            <p className="text-sm text-muted-foreground mt-2">This may take a moment depending on file size</p>
          </Card>
        </div>
      )}

      {/* Schedule Modal */}
      {showScheduleModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Schedule Post</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="schedule-date">Date and Time</Label>
                <Input
                  type="datetime-local"
                  id="schedule-date"
                  value={scheduleDateTime}
                  onChange={(e) => setScheduleDateTime(e.target.value)}
                  className="mt-1"
                  min={new Date(Date.now() + 60000).toISOString().slice(0, 16)} // Minimum 1 minute from now
                />
              </div>
              <div className="flex flex-col sm:flex-row gap-2">
                <Button
                  onClick={() => {
                    switch (currentContentType) {
                      case 'story':
                        handlePostStory('schedule');
                        break;
                      case 'text-story':
                        handlePostTextStory('schedule');
                        break;
                      case 'thought':
                        handlePostThought('schedule');
                        break;
                      case 'photos':
                        handlePostPhotos('schedule');
                        break;
                      case 'videos':
                        handlePostVideos('schedule');
                        break;
                    }
                  }}
                  className="w-full sm:flex-1"
                  disabled={!scheduleDateTime}
                >
                  Confirm Schedule
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowScheduleModal(false);
                    setScheduleDateTime('');
                    setCurrentContentType('');
                  }}
                  className="w-full sm:flex-1"
                >
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default CreatePage;