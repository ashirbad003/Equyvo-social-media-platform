import React, { useEffect, useRef, useState, useCallback } from 'react';
import { X, ThumbsUp, MessageCircle, Share2, Users, Clock, Calendar, Minimize2, Play, Pause, Volume2, VolumeX, Maximize2, Columns, Eye, Image, RotateCcw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import SaveButton from '@/components/SaveButton';
import CommentSection from '@/components/CommentSection';
import { showSuccess } from '@/utils/toast';
import { FullscreenContent } from '@/types';
import { navigateToProfile } from '@/utils/profile-navigation';
import { useVideoKeyboardShortcuts } from '@/hooks/use-video-keyboard-shortcuts';
import { useMediaSession } from '@/hooks/use-media-session';
import { useVideoGestures } from '@/hooks/use-video-gestures';

interface FullscreenViewerProps {
  content: FullscreenContent;
  type: 'post' | 'live' | 'video' | 'moment' | 'image' | 'thought' | 'reacted' | 'story';
  onClose: () => void;
  onComment?: (videoId: string, creator: string) => void;
  onShare?: (video: FullscreenContent) => void;
  followedCreators?: Set<string>;
  onFollow?: (creatorId: string) => void;
  onExpand?: () => void;
  onContentChange?: (content: FullscreenContent) => void;
}

const FullscreenViewer: React.FC<FullscreenViewerProps> = ({ 
  content, 
  type, 
  onClose, 
  onComment,
  onShare,
  followedCreators = new Set(),
  onFollow,
  onExpand,
  onContentChange
}) => {
  // Check for temp content from split view
  const actualContent = (window as any).tempFullscreenContent || content;
  const actualType = (window as any).tempFullscreenContent ? (window as any).tempFullscreenContent.type || 'video' : type;
  
  // Clear temp content after using it
  if ((window as any).tempFullscreenContent) {
    (window as any).tempFullscreenContent = null;
  }
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(false); // Start unmuted in fullscreen mode
  const [volume, setVolume] = useState(1);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [showControls, setShowControls] = useState(true);
  const [isDesktop, setIsDesktop] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState<number>(0);
  const [showCommentSection, setShowCommentSection] = useState(false);
  const [isSplitView, setIsSplitView] = useState(false);
  const [liveStreamProgress, setLiveStreamProgress] = useState(0);
  const [liveStreamDuration] = useState(Infinity); // Live streams have infinite duration
  const [showDetailsPanel, setShowDetailsPanel] = useState(false);
  const [showImageOverlay, setShowImageOverlay] = useState(false);
  const controlsTimeoutRef = useRef<NodeJS.Timeout>();
  const lastMouseMoveRef = useRef<number>(Date.now());
  const mouseActivityRef = useRef<boolean>(false);
  const liveStreamIntervalRef = useRef<NodeJS.Timeout>();
  const detailsPanelTimeoutRef = useRef<NodeJS.Timeout>();
  const controlsShowCountRef = useRef<number>(0);
  const navigate = useNavigate();

  // Detect mobile device and orientation
  const isMobileDevice = window.innerWidth < 768;
  const isPortraitOrientation = window.innerHeight > window.innerWidth;

  // Resolve the effective type from multiple sources of truth
  const resolvedType = actualType ||
                        actualContent?.type ||
                        actualContent?.contentType ||
                        'image';
  const resolvedContentType = actualContent?.contentType || resolvedType;
  
  // Enhanced video type detection using all available type indicators
  const videoTypeValues = new Set(['video', 'moment', 'live', 'story']);
  const isVideoType = videoTypeValues.has(resolvedType) ||
                       videoTypeValues.has(actualContent?.type || '') ||
                       videoTypeValues.has(actualContent?.contentType || '');
  const isPortraitMoment = resolvedType === 'moment' ||
                            actualContent?.type === 'moment' ||
                            actualContent?.contentType === 'moment' ||
                            actualContent?.forcePortrait;
  const isStory = resolvedType === 'story' ||
                   actualContent?.type === 'story' ||
                   actualContent?.contentType === 'story';
  const isLiveStream = resolvedType === 'live' ||
                        actualContent?.type === 'live' ||
                        actualContent?.contentType === 'live' ||
                        actualContent?.isLive === true ||
                        actualContent?.live === true;
  
  // Force landscape mode for mobile videos (except moments and stories)
  const shouldForceLandscape = isMobileDevice && isVideoType && !isPortraitMoment && !isStory;
  
  // Single unified video source detection with fallbacks
  const sampleVideoUrl = 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4';
  const videoSrc = actualContent?.videoUrl || 
                   actualContent?.mediaUrl || 
                   actualContent?.media || 
                   actualContent?.src ||
                   actualContent?.url ||
                   (isVideoType ? sampleVideoUrl : undefined);
  
  // For live streams, use the same detection as other video content with live indicators
  const fallbackVideoSrc = isVideoType ? videoSrc : null;
    
  // Determine container style based on content type and device
  const getContainerStyle = () => {
    
    if (isSplitView) {
      return {
        position: 'fixed' as const,
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: '100vw',
        height: '100vh',
        display: 'flex',
        backgroundColor: 'black',
        overflow: 'hidden',
        margin: 0,
        padding: 0
      };
    }
    
    // Mobile moments and stories use portrait mode
    if (isMobileDevice && (isPortraitMoment || isStory)) {
      return {
        position: 'fixed' as const,
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: '100vw',
        height: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'black',
        overflow: 'hidden',
        margin: 0,
        padding: 0
      };
    }
    
    // Mobile videos (non-moments, non-stories) use 16:9 fullscreen
    if (isMobileDevice && isVideoType && !isPortraitMoment && !isStory) {
      return {
        position: 'fixed' as const,
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: '100vw',
        height: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'black',
        overflow: 'hidden',
        margin: 0,
        padding: 0
      };
    }
    
    // Desktop moments and stories keep portrait mode
    if (isPortraitMoment || isStory) {
      return {
        position: 'fixed' as const,
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: '100vw',
        height: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'black',
        overflow: 'hidden',
        margin: 0,
        padding: 0
      };
    }
    
    // Default desktop fullscreen
    return {
      position: 'fixed' as const,
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      width: '100vw',
      height: '100vh',
      backgroundColor: 'black',
      overflow: 'hidden',
      margin: 0,
      padding: 0
    };
  };
  
  // Get video container style for portrait moments, stories, and mobile 16:9
  const getVideoContainerStyle = (): React.CSSProperties => {
    
    // Mobile moments and stories should always be portrait (9:16)
    if (isMobileDevice && (isPortraitMoment || isStory)) {
      return {
        width: '100vw',
        height: '177.78vw', // 9:16 ratio (16/9 = 1.7778)
        maxHeight: '100vh',
        maxWidth: '56.25vh', // 9/16 = 0.5625
        objectFit: 'cover',
        position: 'relative',
        backgroundColor: 'black'
      };
    }
    
    // Mobile videos (non-moments, non-stories) use 16:9 ratio - force landscape
    if (isMobileDevice && isVideoType && !isPortraitMoment && !isStory) {
      return {
        width: '100vw',
        height: '56.25vw', // 16:9 ratio (9/16 = 0.5625) - forces landscape orientation
        maxHeight: '100vh',
        maxWidth: '177.78vh', // 16/9 = 1.7778
        objectFit: 'contain',
        position: 'relative',
        backgroundColor: 'black',
        transform: 'rotate(0deg)', // Ensure no rotation
        transformOrigin: 'center'
      };
    }
    
    // Desktop moments and stories keep portrait mode (9:16)
    if (isPortraitMoment || isStory) {
      return {
        height: '100vh',
        maxWidth: '100vw',
        aspectRatio: '9/16',
        objectFit: 'cover',
        backgroundColor: 'black'
      };
    }
    
    // Desktop videos use cover
    return {
      position: 'absolute' as const,
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      objectFit: 'cover' as const,
      zIndex: 0
    };
  };

  useEffect(() => {
    const rawLikes = actualContent?.likes;
    const parsedLikes = typeof rawLikes === 'number' ? rawLikes : Number.parseInt(String(rawLikes ?? 0), 10);
    setIsLiked(false);
    setLikeCount(Number.isFinite(parsedLikes) ? parsedLikes : 0);
  }, [actualContent?.id]);

  useEffect(() => {
    // Add shimmer animation to document head
    const style = document.createElement('style');
    style.textContent = `
      @keyframes shimmer {
        0% { background-position: 200% 0; }
        100% { background-position: -200% 0; }
      }
    `;
    document.head.appendChild(style);
    
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  useEffect(() => {
    const handleGlobalClick = (e: MouseEvent) => {
      // Only prevent clicks that would exit fullscreen in split view
      if (isSplitView) {
        const target = e.target as HTMLElement;
        
        // Allow clicks on buttons and actionable elements
        if (target.closest('button') || target.closest('input') || target.closest('[role="button"]')) {
          return;
        }
        
        // Allow clicks on the top bar controls
        if (target.closest('.fixed.top-0.left-0.right-0')) {
          return;
        }
        
        // Allow clicks on the split view panel (right side) for video selection
        if (target.closest('.split-view-panel')) {
          return;
        }
        
        // Allow clicks on the main video container (left side) - let it handle play/pause
        if (target.closest('.main-video-container')) {
          return;
        }
        
        // Only prevent clicks on the main fullscreen container that would exit fullscreen
        if (target.closest('.fixed.inset-0.bg-black.z-50') && !target.closest('.main-video-container') && !target.closest('.split-view-panel') && !target.closest('.fixed.top-0')) {
          e.stopPropagation();
          e.preventDefault();
        }
      }
    };

    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        cleanup();
        onClose();
      }
    };

    // Use bubble phase instead of capture to avoid conflicts with button click handlers
    document.addEventListener('click', handleGlobalClick, false);
    document.addEventListener('keydown', handleEsc);
    
    return () => {
      document.removeEventListener('click', handleGlobalClick, false);
      document.removeEventListener('keydown', handleEsc);
      cleanup();
    };
  }, [isSplitView, onClose]);

  useEffect(() => {
    // Detect if desktop or mobile
    const checkDevice = () => {
      setIsDesktop(window.innerWidth >= 768);
    };
    
    // Check fullscreen state
    const checkFullscreen = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    
    checkDevice();
    checkFullscreen();
    window.addEventListener('resize', checkDevice);
    document.addEventListener('fullscreenchange', checkFullscreen);
    
    return () => {
      window.removeEventListener('resize', checkDevice);
      document.removeEventListener('fullscreenchange', checkFullscreen);
    };
  }, []);

  // Poll currentTime every 200ms to keep progress bar in sync
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const poll = setInterval(() => {
      setCurrentTime(video.currentTime);
    }, 200);

    return () => clearInterval(poll);
  }, []);

  // Sync isPlaying state with native video events
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);

    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);

    return () => {
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
    };
  }, []);

  // Update duration when metadata loads
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const updateDuration = () => setDuration(video.duration);
    video.addEventListener('loadedmetadata', updateDuration);

    if (video.readyState >= HTMLMediaElement.HAVE_METADATA) {
      updateDuration();
    }

    return () => video.removeEventListener('loadedmetadata', updateDuration);
  }, []);

  // Restore video state if coming from minimized viewer
  useEffect(() => {
    if (!actualContent?.isFromMinimized) return;
    const video = videoRef.current;
    if (!video) return;

    const restoreTime = actualContent?.restoreTime || 0;
    const restorePaused = actualContent?.restorePaused !== false;

    setTimeout(() => {
      if (video.duration) {
        video.currentTime = restoreTime;
        if (!restorePaused) {
          video.play().catch(() => {});
        }
      }
    }, 100);
  }, [actualContent?.isFromMinimized, actualContent?.restoreTime, actualContent?.restorePaused]);

  // Ensure videos start unmuted in fullscreen mode
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !isVideoType) return;

    // When video loads, ensure it's unmuted for fullscreen experience
    const ensureUnmuted = () => {
      if (video.readyState >= 2) { // HAVE_CURRENT_DATA
        video.muted = false;
        setIsMuted(false);
      }
    };

    // Try immediately if video is ready
    ensureUnmuted();
    
    // Also try when video loads
    video.addEventListener('loadeddata', ensureUnmuted);
    video.addEventListener('canplay', ensureUnmuted);
    
    return () => {
      video.removeEventListener('loadeddata', ensureUnmuted);
      video.removeEventListener('canplay', ensureUnmuted);
    };
  }, [actualContent?.id, isVideoType]);

  const toggleFullscreen = useCallback(() => {
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      document.documentElement.requestFullscreen();
    }
  }, []);

  useVideoKeyboardShortcuts({
    videoRef,
    isPlaying,
    setIsPlaying,
    isMuted,
    setIsMuted,
    volume,
    setVolume,
    onToggleFullscreen: toggleFullscreen,
  });

  useMediaSession({
    videoRef,
    isPlaying,
    setIsPlaying,
    title: actualContent?.title || actualContent?.description || actualContent?.content || 'Video',
    artist: actualContent?.user || actualContent?.creator || (actualContent as any)?.username || 'Equyvo',
  });

  const { handleClick: handleVideoTap } = useVideoGestures({
    videoRef,
    seekTime: 10,
    onSingleTap: () => {
      togglePlay();
    },
    enabled: isVideoType,
  });

  const HIDE_DELAY = 5000;

  // Show controls on any keyboard activity, auto-hide after 5s
  useEffect(() => {
    const onKeyActivity = () => {
      scheduleHide();
    };
    window.addEventListener('keydown', onKeyActivity);
    return () => window.removeEventListener('keydown', onKeyActivity);
  }, []);

  const scheduleHide = () => {
    setShowControls(true);
    if (isVideoType) setShowDetailsPanel(true);
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    if (detailsPanelTimeoutRef.current) clearTimeout(detailsPanelTimeoutRef.current);
    controlsTimeoutRef.current = setTimeout(() => setShowControls(false), HIDE_DELAY);
    if (isVideoType) {
      detailsPanelTimeoutRef.current = setTimeout(() => setShowDetailsPanel(false), HIDE_DELAY);
    }
  };

  const handleMouseMove = () => {
    lastMouseMoveRef.current = Date.now();
    scheduleHide();
  };

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;
    
    if (isPlaying) {
      video.pause();
    } else {
      video.play().catch(() => {});
    }
  };

  const toggleMute = () => {
    const video = videoRef.current;
    if (!video) return;
    
    video.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const video = videoRef.current;
    if (!video) return;
    
    const newVolume = parseFloat(e.target.value);
    video.volume = newVolume;
    setVolume(newVolume);
    setIsMuted(newVolume === 0);
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = parseFloat(e.target.value);
    setCurrentTime(newTime);
    const video = videoRef.current;
    if (video) {
      video.currentTime = newTime;
    }
  };

  // Add mouse leave handler for desktop fade away
  const handleMouseLeave = () => {
    if (isDesktop) {
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
      if (detailsPanelTimeoutRef.current) {
        clearTimeout(detailsPanelTimeoutRef.current);
      }
      // Hide controls immediately when mouse leaves
      setShowControls(false);
      // Hide details panel immediately for video content
      if (isVideoType) {
        setShowDetailsPanel(false);
      }
    }
  };

  // Cleanup function
  const cleanup = () => {
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    if (detailsPanelTimeoutRef.current) {
      clearTimeout(detailsPanelTimeoutRef.current);
    }
    
    // Pause video if exists
    if (videoRef.current) {
      videoRef.current.pause();
    }
    
    // Dispatch event to notify Moments component to stop all videos
    window.dispatchEvent(new CustomEvent('fullscreenViewerClosed'));
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  if (!actualContent) return null;

  const formatNumber = (num: number): string => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const handleLike = () => {
    setIsLiked(prev => {
      const next = !prev;
      setLikeCount(current => Math.max(0, current + (next ? 1 : -1)));
      return next;
    });
  };

  const handleComment = () => {
    if (onComment) {
      onComment(actualContent.id, actualContent.creator);
    } else {
      // Show comment section directly if no external handler
      setShowCommentSection(true);
    }
  };

  const handleShare = () => {
    if (onShare) {
      onShare(actualContent);
    } else {
      // Fallback share functionality
      const shareData = {
        title: actualContent?.title || actualContent?.content || 'Check out this content',
        text: actualContent?.content || actualContent?.description || `Check out this ${actualType} by ${actualContent?.creator || 'Unknown Creator'}`,
        url: window.location.href
      };
      
      if (navigator.share) {
        navigator.share(shareData).then(() => {
          showSuccess('Content shared successfully!');
        }).catch(() => {
          navigator.clipboard.writeText(window.location.href).then(() => {
            showSuccess('🔗 Link copied to clipboard!');
          }).catch(() => {
            showSuccess('🔗 Link ready to share!');
          });
        });
      } else {
        navigator.clipboard.writeText(window.location.href).then(() => {
          showSuccess('🔗 Link copied to clipboard!');
        }).catch(() => {
          showSuccess('🔗 Link ready to share!');
        });
      }
    }
  };

  const handleMinimize = () => {
    const video = videoRef.current;
    
    // Create a minimized picture-in-picture style window
    const minimizedViewer = document.createElement('div');
    minimizedViewer.id = 'minimized-video-viewer';
    minimizedViewer.style.cssText = `
      position: fixed;
      bottom: 20px;
      right: 20px;
      width: 320px;
      height: 180px;
      background: black;
      border-radius: 8px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.5);
      z-index: 1000;
      overflow: hidden;
      cursor: move;
      user-select: none;
    `;
    
    // Add drag functionality
    let isDragging = false;
    let initialX;
    let initialY;

    const dragStart = (e: MouseEvent) => {
      if (e.target === closeBtn || e.target === expandBtn) return;
      
      const rect = minimizedViewer.getBoundingClientRect();
      initialX = e.clientX - rect.left;
      initialY = e.clientY - rect.top;

      if (e.target === minimizedViewer || 
          e.target === dragHandle ||
          minimizedViewer.contains(e.target as Node)) {
        isDragging = true;
        minimizedViewer.style.cursor = 'grabbing';
      }
    };

    const dragEnd = () => {
      isDragging = false;
      minimizedViewer.style.cursor = 'move';
    };

    const drag = (e: MouseEvent) => {
      if (isDragging) {
        e.preventDefault();
        
        const newX = e.clientX - initialX;
        const newY = e.clientY - initialY;

        // Keep the window within viewport bounds
        const maxX = window.innerWidth - minimizedViewer.offsetWidth;
        const maxY = window.innerHeight - minimizedViewer.offsetHeight;
        
        const boundedX = Math.max(0, Math.min(newX, maxX));
        const boundedY = Math.max(0, Math.min(newY, maxY));

        minimizedViewer.style.bottom = 'auto';
        minimizedViewer.style.right = 'auto';
        minimizedViewer.style.left = `${boundedX}px`;
        minimizedViewer.style.top = `${boundedY}px`;
      }
    };

    // Add event listeners for dragging
    document.addEventListener('mousedown', dragStart);
    document.addEventListener('mouseup', dragEnd);
    document.addEventListener('mousemove', drag);
    
    if (video && fallbackVideoSrc) {
      // Get current video state
      const currentTime = video.currentTime;
      const isPaused = video.paused;
      
      const minimizedVideo = document.createElement('video');
      minimizedVideo.src = fallbackVideoSrc;
      minimizedVideo.style.cssText = `
        width: 100%;
        height: 100%;
        object-fit: cover;
      `;
      minimizedVideo.controls = true;
      minimizedVideo.currentTime = currentTime; // Preserve current time
      if (!isPaused) {
        minimizedVideo.play().catch(() => {});
      }
      
      minimizedViewer.appendChild(minimizedVideo);
    } else if (!isVideoType && (actualContent?.thumbnail || actualContent?.image || actualContent?.mediaUrl || actualContent?.media)) {
      // For images, show the image
      const minimizedImage = document.createElement('img');
      minimizedImage.src = actualContent?.thumbnail || actualContent?.image || actualContent?.mediaUrl || actualContent?.media;
      minimizedImage.style.cssText = `
        width: 100%;
        height: 100%;
        object-fit: cover;
      `;
      minimizedViewer.appendChild(minimizedImage);
    }
    
    const closeBtn = document.createElement('button');
    closeBtn.innerHTML = '×';
    closeBtn.style.cssText = `
      position: absolute;
      top: 8px;
      right: 8px;
      width: 24px;
      height: 24px;
      background: rgba(0,0,0,0.7);
      color: white;
      border: none;
      border-radius: 50%;
      cursor: pointer;
      font-size: 16px;
      z-index: 1001;
    `;
    
    closeBtn.onclick = () => {
      const videoElement = minimizedViewer.querySelector('video');
      if (videoElement) {
        videoElement.pause();
      }
      // Remove drag event listeners
      document.removeEventListener('mousedown', dragStart);
      document.removeEventListener('mouseup', dragEnd);
      document.removeEventListener('mousemove', drag);
      document.body.removeChild(minimizedViewer);
    };
    
    // Add expand button
    const expandBtn = document.createElement('button');
    expandBtn.innerHTML = '⛶';
    expandBtn.style.cssText = `
      position: absolute;
      top: 8px;
      right: 40px;
      width: 24px;
      height: 24px;
      background: rgba(0,0,0,0.7);
      color: white;
      border: none;
      border-radius: 50%;
      cursor: pointer;
      font-size: 14px;
      z-index: 1001;
      display: flex;
      align-items: center;
      justify-content: center;
    `;
    
    expandBtn.onclick = () => {
      // Get current video state
      const videoElement = minimizedViewer.querySelector('video');
      const currentTime = videoElement ? videoElement.currentTime : 0;
      const isPaused = videoElement ? videoElement.paused : true;
      
      // Remove drag event listeners
      document.removeEventListener('mousedown', dragStart);
      document.removeEventListener('mouseup', dragEnd);
      document.removeEventListener('mousemove', drag);
      
      // Remove minimized viewer
      document.body.removeChild(minimizedViewer);
      
      // Store current state to restore after re-render
      (window as any).restoreVideoState = { currentTime, isPaused };
      
      // Ensure video source is preserved in temp content
      const restoredContent = {
        ...actualContent,
        restoreTime: currentTime,
        restorePaused: isPaused,
        isFromMinimized: true, // Flag to indicate this is from minimized state
        // Explicitly preserve video sources
        videoUrl: actualContent?.videoUrl || actualContent?.mediaUrl || actualContent?.media || actualContent?.src || fallbackVideoSrc,
        mediaUrl: actualContent?.mediaUrl || actualContent?.videoUrl || fallbackVideoSrc,
        media: actualContent?.media || actualContent?.videoUrl || fallbackVideoSrc,
        src: actualContent?.src || actualContent?.videoUrl || fallbackVideoSrc
      };
      
      // Set temp content for restoration with proper flags
      (window as any).tempFullscreenContent = restoredContent;
      
      // Trigger a custom event to notify parent to reopen fullscreen
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('reopenFullscreen', { 
          detail: { 
            content: restoredContent,
            currentTime, 
            isPaused,
            isFromMinimized: true 
          } 
        }));
      }, 100);
    };
    
    minimizedViewer.appendChild(expandBtn);
    minimizedViewer.appendChild(closeBtn);
    
    // Add drag handle indicator
    const dragHandle = document.createElement('div');
    dragHandle.innerHTML = '⋮⋮';
    dragHandle.style.cssText = `
      position: absolute;
      top: 8px;
      left: 8px;
      color: rgba(255,255,255,0.5);
      font-size: 12px;
      cursor: move;
      z-index: 1001;
      padding: 4px;
      border-radius: 4px;
      transition: color 0.2s;
    `;
    dragHandle.onmouseenter = () => {
      dragHandle.style.color = 'rgba(255,255,255,0.8)';
    };
    dragHandle.onmouseleave = () => {
      dragHandle.style.color = 'rgba(255,255,255,0.5)';
    };
    minimizedViewer.appendChild(dragHandle);
    
    document.body.appendChild(minimizedViewer);
    
    onClose();
  };

  const handleSplitViewVideoClick = (videoData: any) => {
    // Create a new content object with selected video
    const newContent = {
      ...videoData,
      id: videoData.id || `video-${Date.now()}`,
      videoUrl: videoData.videoUrl || videoData.src || `https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4`,
      thumbnail: videoData.thumbnail || videoData.image || `https://picsum.photos/seed/${videoData.id || 'fallback'}/320/180`,
      title: videoData.title || 'Selected Video',
      creator: videoData.creator || 'Unknown Creator',
      creatorId: videoData.creator?.toLowerCase().replace(/\s+/g, '-') || videoData.id || 'unknown-creator',
      type: videoData.type || 'video',
      likes: videoData.likes || Math.floor(Math.random() * 1000),
      views: videoData.views || Math.floor(Math.random() * 10000),
      duration: videoData.duration || '5:23',
      published: videoData.published || '2 days ago',
      description: videoData.description || 'This is a sample video description for selected content.',
      verified: videoData.verified || Math.random() > 0.7,
      subscribers: videoData.subscribers || Math.floor(Math.random() * 100000),
      // Add additional fields for better compatibility
      media: videoData.videoUrl || videoData.src,
      mediaUrl: videoData.videoUrl || videoData.src,
      content: videoData.description || videoData.content || 'This is a sample video description for selected content.'
    };
    
    // Store the new content for parent to pick up
    (window as any).tempFullscreenContent = newContent;
    // Exit split view first
    setIsSplitView(false);
    
    // Trigger a custom event to notify parent of content change
    window.dispatchEvent(new CustomEvent('splitViewVideoSelected', { 
      detail: { content: newContent } 
    }));
    
    // Don't close the viewer - let the parent handle the content change
    // The fullscreen viewer will stay open with the new content
  };

  const handleSplitView = () => {
    const video = videoRef.current;
    const wasPlaying = video && !video.paused;
    
    setIsSplitView(!isSplitView);
    
    // Restore video state after state update
    setTimeout(() => {
      if (video && wasPlaying && video.paused) {
        video.play().catch(() => {});
      }
    }, 100);
  };

  const handleFollow = () => {
    if (onFollow && actualContent?.creatorId) {
      onFollow(actualContent.creatorId);
      showSuccess(followedCreators.has(actualContent.creatorId) ? 'Unfollowed creator' : 'Following creator!');
    } else if (actualContent?.creator) {
      // Fallback if no creatorId but creator name exists
      const creatorId = actualContent.creatorId || actualContent.creator.toLowerCase().replace(/\s+/g, '-');
      if (onFollow) {
        onFollow(creatorId);
        showSuccess(followedCreators.has(creatorId) ? 'Unfollowed creator' : 'Following creator!');
      } else {
        showSuccess('Follow functionality not available');
      }
    } else {
      showSuccess('No creator to follow');
    }
  };

  return (
    <div
      className={`fixed inset-0 bg-black z-50 ${isSplitView ? 'flex' : ''}`}
      style={getContainerStyle()}
    >
      {/* Top bar with minimal controls */}
      <div
        className={`fixed top-0 left-0 right-0 z-50 bg-gradient-to-b from-black/90 via-black/70 to-transparent p-4 ${isSplitView ? 'w-1/2' : ''} top-controls-bar transition-all duration-500 ${isVideoType ? (showDetailsPanel ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-full') : 'opacity-100 translate-y-0'}`}
        style={{
          paddingTop: 'calc(env(safe-area-inset-top, 0px) + 8px)',
          pointerEvents: isVideoType && !showDetailsPanel ? 'none' : 'auto'
        }}
        onMouseEnter={() => {
          if (isVideoType) {
            setShowDetailsPanel(true);
          }
        }}
        onMouseMove={() => {
          if (isVideoType) {
            setShowDetailsPanel(true);
          }
        }}
      >
        <div className="flex justify-end gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleMinimize}
            className="text-white hover:bg-white/20 bg-white/10 backdrop-blur-sm rounded-full p-2 shadow-lg"
            title="Minimize"
          >
            <Minimize2 className="h-5 w-5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
              handleSplitView();
            }}
            className="text-white hover:bg-white/20 bg-white/10 backdrop-blur-sm rounded-full p-2 shadow-lg"
            title="Split View"
          >
            <Columns className="h-5 w-5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              setIsSplitView(false);
              setTimeout(() => {
                onClose();
              }, 100);
            }}
            className="text-white hover:bg-white/20 bg-white/10 backdrop-blur-sm rounded-full p-2 shadow-lg"
            title="Escape"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Video Container - Full height or split view */}
      {isVideoType && (
        <div 
          className={`main-video-container ${isSplitView ? 'w-1/2 h-full relative flex' : 'fixed inset-0 w-full h-full'}`}
          style={{
            position: isSplitView ? 'relative' : 'fixed',
            top: isSplitView ? 'auto' : 0,
            left: isSplitView ? 'auto' : 0,
            right: isSplitView ? 'auto' : 0,
            bottom: isSplitView ? 'auto' : 0,
            width: isSplitView ? '50%' : '100vw',
            height: isSplitView ? '100%' : '100vh',
            margin: 0,
            padding: 0,
            backgroundColor: 'black',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden'
          }}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          onMouseEnter={() => {
            if (isVideoType) {
              setShowDetailsPanel(true);
            }
          }}
          onClick={(e) => {
            const target = e.target as HTMLElement | null;
            
            if (target?.closest('.top-controls-bar')) return;
            
            if (isSplitView) {
              if (target?.closest('video')) {
                e.stopPropagation();
                e.preventDefault();
                togglePlay();
                return;
              }
              return;
            }
            
            scheduleHide();
            handleVideoTap(e);
          }}
        >
          {fallbackVideoSrc ? (
            <video
              ref={videoRef}
              src={fallbackVideoSrc}
              className={`${isPortraitMoment || isStory ? 'max-w-full max-h-screen object-cover mx-auto' : 'absolute inset-0 w-full h-full'}`}
              style={getVideoContainerStyle()}
              autoPlay
              playsInline
              controls={false}
              muted={false}
              loop={isPortraitMoment || isStory}
              onTimeUpdate={(e) => { setCurrentTime(e.currentTarget.currentTime); }}
              onSeeked={(e) => { setCurrentTime(e.currentTarget.currentTime); }}
              onLoadedMetadata={(e) => { setDuration(e.currentTarget.duration); }}
            />
          ) : (
            <div className="absolute inset-0 w-full h-full flex items-center justify-center" style={{ zIndex: 1, pointerEvents: 'none' }}>
              <div className="text-white text-center">
                <p className="text-xl mb-2">Video not available</p>
                <p className="text-sm text-gray-400">No video URL provided</p>
              </div>
            </div>
          )}
          
          {/* Combined bottom overlay with video info and controls */}
          <div className="absolute bottom-0 left-0 right-0 flex flex-col justify-end pointer-events-none">
            {/* Details Section - above controls */}
            {!isSplitView && (
              <div className={`bg-gradient-to-t from-black/90 via-black/70 to-transparent p-4 pt-12 transition-all duration-500 ${isVideoType ? (showDetailsPanel ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-full') : 'opacity-100 translate-y-0'}`}
                style={{
                  pointerEvents: isVideoType && !showDetailsPanel ? 'none' : 'auto'
                }}
                onMouseEnter={() => {
                  if (isVideoType) {
                    setShowDetailsPanel(true);
                  }
                }}
                onMouseMove={() => {
                  if (isVideoType) {
                    setShowDetailsPanel(true);
                  }
                }}
              >
                {/* Video Information */}
                <div className="mb-3">
                  <h2 className="text-white text-lg md:text-xl font-semibold mb-1 line-clamp-2">
                    {actualContent.title || 'Untitled Video'}
                  </h2>
                  <div className="flex items-center gap-3 text-white/80 text-sm">
                    <div className="flex items-center gap-2">
                      <Avatar 
                        className="h-8 w-8 cursor-pointer hover:ring-2 hover:ring-white/50 transition-all duration-200"
                        onClick={() => {
                          navigateToProfile(navigate, actualContent.creatorId, actualContent.creator);
                        }}
                        title={`${actualContent.creator}'s Profile`}
                      >
                        <AvatarImage src={`https://picsum.photos/seed/${actualContent.creatorId || actualContent.creator || 'unknown'}/100/100`} />
                        <AvatarFallback className="bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs">
                          {(actualContent.creator || 'Unknown').substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <span 
                        className="font-medium hover:text-white transition-colors cursor-pointer"
                        onClick={() => navigateToProfile(navigate, actualContent.creatorId, actualContent.creator)}
                      >
                        {actualContent.creator || 'Unknown Creator'}
                      </span>
                      {actualContent.verified && (
                        <div className="bg-blue-500 rounded-full p-0.5">
                          <div className="w-2 h-2 bg-white rounded-full"></div>
                        </div>
                      )}
                    </div>
                    {actualContent.subscribers && (
                      <span className="text-white/60">{formatNumber(actualContent.subscribers)} subscribers</span>
                    )}
                    {actualContent.views && (
                      <span className="flex items-center gap-1">
                        <Users className="h-4 w-4" /> {formatNumber(actualContent.views)} views
                      </span>
                    )}
                    {actualContent.published && (
                      <span className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" /> {actualContent.published}
                      </span>
                    )}
                    {actualContent.duration && (
                      <span className="flex items-center gap-1">
                        <Clock className="h-4 w-4" /> {actualContent.duration}
                      </span>
                    )}
                  </div>
                  {actualContent.description && (
                    <p className="text-white/70 text-sm mt-2 line-clamp-2">
                      {actualContent.description}
                    </p>
                  )}
                </div>

                {/* Tags */}
                {actualContent.tags && actualContent.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-3">
                    {(actualContent.tags || []).slice(0, 6).map((tag: string, index: number) => (
                      <Badge key={index} variant="outline" className="text-xs bg-white/10 text-white/80 border-white/20">
                        #{tag}
                      </Badge>
                    ))}
                    {actualContent.tags.length > 6 && (
                      <Badge variant="outline" className="text-xs bg-white/10 text-white/80 border-white/20">
                        +{actualContent.tags.length - 6}
                      </Badge>
                    )}
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex items-center gap-2 flex-wrap">
                  <Button
                    variant="ghost"
                    size="sm"
                    className={`text-white hover:bg-white/20 hover:text-white transition-all duration-200 ${isLiked ? 'text-red-500' : ''}`}
                    onClick={handleLike}
                    title="Like video"
                  >
                    <ThumbsUp className={`h-4 w-4 ${isLiked ? 'fill-current' : ''}`} />
                    <span className="ml-1 text-xs">{formatNumber(likeCount)}</span>
                  </Button>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-white hover:bg-white/20 hover:text-white transition-all duration-200"
                    onClick={handleComment}
                    title="Comment"
                  >
                    <MessageCircle className="h-4 w-4" />
                    {(actualContent?.comments ?? actualContent?.engagement?.comments) && (
                      <span className="ml-1 text-xs">{formatNumber(actualContent?.comments ?? actualContent?.engagement?.comments)}</span>
                    )}
                  </Button>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-white hover:bg-white/20 hover:text-white transition-all duration-200"
                    onClick={handleShare}
                    title="Share video"
                  >
                    <Share2 className="h-4 w-4" />
                  </Button>
                  
                  <div className="flex items-center">
                    <SaveButton postId={actualContent.id || actualContent.videoId || 'unknown'} content={actualContent} />
                  </div>
                  
                  {actualContent.creatorId && (
                    <Button
                      variant={followedCreators.has(actualContent.creatorId) ? "default" : "outline"}
                      size="sm"
                      className="text-white border-white/30 hover:bg-white/20 hover:text-white"
                      onClick={handleFollow}
                    >
                      {followedCreators.has(actualContent.creatorId) ? "Following" : "Follow"}
                    </Button>
                  )}
                </div>
              </div>
            )}
            
            {/* Custom Video Controls */}
            <div 
              className={`bg-gradient-to-t from-black/90 via-black/60 to-transparent p-4 transition-opacity duration-500 pointer-events-none ${showControls ? 'opacity-100' : 'opacity-0'}`}
              style={{ 
                paddingBottom: isPortraitMoment
                  ? 'calc(env(safe-area-inset-bottom, 0px) + 120px)'
                  : (isMobileDevice && !isPortraitMoment && !isStory)
                    ? 'calc(env(safe-area-inset-bottom, 0px) + 80px)'
                    : 'calc(env(safe-area-inset-bottom, 0px) + 140px)',
                display: showControls ? 'block' : 'none'
              }}
            >
              {/* Progress Bar */}
              <div className="mb-3">
                {isLiveStream ? (
                  <div className="relative">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-red-500 text-xs font-medium flex items-center gap-1">
                        <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                        LIVE
                      </span>
                      <span className="text-white text-xs font-medium">
                        {formatTime(liveStreamProgress)}
                      </span>
                    </div>
                    <div className="w-full h-2 bg-red-500/30 rounded-lg overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-red-500 via-red-600 to-red-500 rounded-full animate-pulse"
                        style={{ 
                          width: '100%',
                          backgroundSize: '200% 100%',
                          animation: 'shimmer 2s ease-in-out infinite'
                        }}
                      />
                    </div>
                  </div>
                ) : (
                  <input
                    type="range"
                    min="0"
                    max={duration || 100}
                    value={currentTime}
                    onChange={handleSeek}
                    className="w-full h-2 bg-white/30 rounded-lg appearance-none cursor-pointer slider pointer-events-auto"
                    style={{
                      background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${(currentTime / (duration || 100)) * 100}%, rgba(255,255,255,0.3) ${(currentTime / (duration || 100)) * 100}%, rgba(255,255,255,0.3) 100%)`,
                      cursor: 'pointer',
                      height: '8px',
                      borderRadius: '4px'
                    }}
                  />
                )}
              </div>
              
              {/* Controls Row */}
              <div className="flex items-center justify-between pointer-events-auto">
                <div className="flex items-center gap-4">
                  <button
                    onClick={togglePlay}
                    className="text-white hover:text-blue-400 transition-colors p-2 hover:bg-white/10 rounded-full"
                  >
                    {isPlaying ? <Pause className="h-6 w-6" /> : <Play className="h-6 w-6" />}
                  </button>
                  
                  <button
                    onClick={() => {
                      const v = videoRef.current;
                      if (v) v.currentTime = Math.max(0, v.currentTime - 5);
                    }}
                    className="text-white hover:text-blue-400 transition-colors p-2 hover:bg-white/10 rounded-full max-md:hidden"
                  >
                    <RotateCcw className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => {
                      const v = videoRef.current;
                      if (v) v.currentTime = Math.min(v.duration || Infinity, v.currentTime + 5);
                    }}
                    className="text-white hover:text-blue-400 transition-colors p-2 hover:bg-white/10 rounded-full max-md:hidden"
                  >
                    <RotateCcw className="h-5 w-5 scale-x-[-1]" />
                  </button>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={toggleMute}
                      className="text-white hover:text-blue-400 transition-colors p-2 hover:bg-white/10 rounded-full"
                    >
                      {isMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
                    </button>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.1"
                      value={isMuted ? 0 : volume}
                      onChange={handleVolumeChange}
                      className="w-24 h-1 bg-white/30 rounded-lg appearance-none cursor-pointer"
                    />
                  </div>
                  
                  <span className="text-white text-sm font-medium">
                    {isLiveStream ? `LIVE ${formatTime(liveStreamProgress)}` : `${formatTime(currentTime)} / ${formatTime(duration || 100)}`}
                  </span>
                </div>
                
                <div className="flex items-center gap-3">
                  <button 
                    onClick={() => {
                      if (isFullscreen) {
                        document.exitFullscreen?.();
                      } else {
                        document.documentElement.requestFullscreen();
                      }
                    }}
                    className="text-white hover:text-blue-400 transition-colors p-2 hover:bg-white/10 rounded-full"
                    title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
                  >
                    {isFullscreen ? <Minimize2 className="h-5 w-5" /> : <Maximize2 className="h-5 w-5" />}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Split View Bottom Bar - appears inside video container */}
      {isSplitView && isVideoType && videoSrc && (
        <div
          className="absolute bottom-0 left-0 right-0 z-30 bg-gradient-to-t from-black/90 via-black/70 to-transparent p-4"
          style={{
            paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 16px)'
          }}
        >
          {/* Video Information */}
          <div className="mb-3">
            <h2 className="text-white text-lg md:text-xl font-semibold mb-1 line-clamp-2">
              {actualContent.title || 'Untitled Video'}
            </h2>
            <div className="flex items-center gap-3 text-white/80 text-sm">
              <div className="flex items-center gap-2">
                <Avatar 
                  className="h-8 w-8 cursor-pointer hover:ring-2 hover:ring-white/50 transition-all duration-200"
                  onClick={() => {
                    // Navigate to creator's profile when avatar is clicked
                    navigateToProfile(navigate, actualContent.creatorId, actualContent.creator);
                  }}
                  title={`${actualContent.creator}'s Profile`}
                >
                  <AvatarImage src={`https://picsum.photos/seed/${actualContent.creatorId || actualContent.creator || 'unknown'}/100/100`} />
                  <AvatarFallback className="bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs">
                    {(actualContent.creator || 'Unknown').substring(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <span 
                  className="font-medium hover:text-white transition-colors cursor-pointer"
                  onClick={() => navigateToProfile(navigate, actualContent.creatorId, actualContent.creator)}
                  title={`${actualContent.creator}'s Profile`}
                >
                  {actualContent.creator || 'Unknown Creator'}
                </span>
                {actualContent.verified && (
                  <div className="bg-blue-500 rounded-full p-0.5">
                    <div className="w-2 h-2 bg-white rounded-full"></div>
                  </div>
                )}
              </div>
              {actualContent.subscribers && (
                <span className="text-white/60">{formatNumber(actualContent.subscribers)} subscribers</span>
              )}
              {actualContent.views && (
                <span className="flex items-center gap-1">
                  <Users className="h-4 w-4" /> {formatNumber(actualContent.views)} views
                </span>
              )}
              {actualContent.published && (
                <span className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" /> {actualContent.published}
                </span>
              )}
              {actualContent.duration && (
                <span className="flex items-center gap-1">
                  <Clock className="h-4 w-4" /> {actualContent.duration}
                </span>
              )}
            </div>
            {actualContent.description && (
              <p className="text-white/70 text-sm mt-2 line-clamp-2">
                {actualContent.description}
              </p>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 flex-wrap">
            <Button
              variant="ghost"
              size="sm"
              className={`text-white hover:bg-white/20 hover:text-white transition-all duration-200 ${isLiked ? 'text-red-500' : ''}`}
              onClick={handleLike}
              title="Like video"
            >
              <ThumbsUp className={`h-4 w-4 ${isLiked ? 'fill-current' : ''}`} />
              <span className="ml-1 text-xs">{formatNumber(likeCount)}</span>
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              className="text-white hover:bg-white/20 hover:text-white transition-all duration-200"
              onClick={() => {
                if (onComment) {
                  onComment(actualContent.id, actualContent.creator);
                } else {
                  setShowCommentSection(true);
                }
              }}
              title="Comment"
            >
              <MessageCircle className="h-4 w-4" />
              {(actualContent?.comments ?? actualContent?.engagement?.comments) && (
                <span className="ml-1 text-xs">{formatNumber(actualContent?.comments ?? actualContent?.engagement?.comments)}</span>
              )}
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              className="text-white hover:bg-white/20 hover:text-white transition-all duration-200"
              onClick={() => {
                if (onShare) {
                  onShare(actualContent);
                } else {
                  // Fallback share functionality
                  if (navigator.share) {
                    navigator.share({
                      title: actualContent.title,
                      text: actualContent.content || `Check out this ${actualContent.type} by ${actualContent.creator}`,
                      url: window.location.href
                    }).catch(() => {
                      navigator.clipboard.writeText(window.location.href);
                      showSuccess('Link copied to clipboard!');
                    });
                  } else {
                    navigator.clipboard.writeText(window.location.href);
                    showSuccess('Link copied to clipboard!');
                  }
                }
              }}
              title="Share video"
            >
              <Share2 className="h-4 w-4" />
            </Button>
            
            <div className="flex items-center">
              <SaveButton postId={actualContent.id || actualContent.videoId || 'unknown'} content={actualContent} />
            </div>
            
            {actualContent.creatorId && onFollow && (
              <Button
                variant={followedCreators.has(actualContent.creatorId) ? "default" : "outline"}
                size="sm"
                className="text-white border-white/30 hover:bg-white/20 hover:text-white"
                onClick={() => onFollow(actualContent.creatorId)}
              >
                {followedCreators.has(actualContent.creatorId) ? "Following" : "Follow"}
              </Button>
            )}
          </div>
        </div>
      )}
      
      {/* Split View Bottom Bar - appears inside image container */}
      {isSplitView && !isVideoType && actualType === 'image' && (
        <div
          className="absolute bottom-0 left-0 right-0 z-30 bg-gradient-to-t from-black/90 via-black/70 to-transparent p-4"
          style={{
            paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 16px)'
          }}
        >
          {/* Image Information */}
          <div className="mb-3">
            <h2 className="text-white text-lg md:text-xl font-semibold mb-1 line-clamp-2">
              {actualContent.title || 'Untitled Image'}
            </h2>
            <div className="flex items-center gap-3 text-white/80 text-sm">
              <div className="flex items-center gap-2">
                <Avatar 
                  className="h-8 w-8 cursor-pointer hover:ring-2 hover:ring-white/50 transition-all duration-200"
                  onClick={() => {
                    // Navigate to creator's profile when avatar is clicked
                    navigateToProfile(navigate, actualContent.creatorId, actualContent.creator);
                  }}
                  title={`${actualContent.creator}'s Profile`}
                >
                  <AvatarImage src={`https://picsum.photos/seed/${actualContent.creatorId || actualContent.creator || 'unknown'}/100/100`} />
                  <AvatarFallback className="bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs">
                    {(actualContent.creator || 'Unknown').substring(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <span 
                  className="font-medium hover:text-white transition-colors cursor-pointer"
                  onClick={() => navigateToProfile(navigate, actualContent.creatorId, actualContent.creator)}
                  title={`${actualContent.creator}'s Profile`}
                >
                  {actualContent.creator || 'Unknown Creator'}
                </span>
                {actualContent.verified && (
                  <div className="bg-blue-500 rounded-full p-0.5">
                    <div className="w-2 h-2 bg-white rounded-full"></div>
                  </div>
                )}
              </div>
              {actualContent.views && (
                <span className="flex items-center gap-1">
                  <Eye className="h-4 w-4" /> {formatNumber(actualContent.views)} views
                </span>
              )}
              {actualContent.likes && (
                <span className="flex items-center gap-1">
                  <ThumbsUp className="h-4 w-4" /> {formatNumber(actualContent.likes)} likes
                </span>
              )}
            </div>
            {actualContent.description && (
              <p className="text-white/70 text-sm mt-2 line-clamp-2">
                {actualContent.description}
              </p>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 flex-wrap">
            <Button
              variant="ghost"
              size="sm"
              className={`text-white hover:bg-white/20 hover:text-white transition-all duration-200 ${isLiked ? 'text-red-500' : ''}`}
              onClick={handleLike}
              title="Like image"
            >
              <ThumbsUp className={`h-4 w-4 ${isLiked ? 'fill-current' : ''}`} />
              <span className="ml-1 text-xs">{formatNumber(likeCount)}</span>
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              className="text-white hover:bg-white/20 hover:text-white transition-all duration-200"
              onClick={() => {
                if (onComment) {
                  onComment(actualContent.id, actualContent.creator);
                } else {
                  setShowCommentSection(true);
                }
              }}
              title="Comment"
            >
              <MessageCircle className="h-4 w-4" />
              {(actualContent?.comments ?? actualContent?.engagement?.comments) && (
                <span className="ml-1 text-xs">{formatNumber(actualContent?.comments ?? actualContent?.engagement?.comments)}</span>
              )}
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              className="text-white hover:bg-white/20 hover:text-white transition-all duration-200"
              onClick={() => {
                if (onShare) {
                  onShare(actualContent);
                } else {
                  // Fallback share functionality
                  if (navigator.share) {
                    navigator.share({
                      title: actualContent.title,
                      text: actualContent.content || `Check out this ${actualContent.type} by ${actualContent.creator}`,
                      url: window.location.href
                    }).catch(() => {
                      navigator.clipboard.writeText(window.location.href);
                      showSuccess('Link copied to clipboard!');
                    });
                  } else {
                    navigator.clipboard.writeText(window.location.href);
                    showSuccess('Link copied to clipboard!');
                  }
                }
              }}
              title="Share image"
            >
              <Share2 className="h-4 w-4" />
            </Button>
            
            <div className="flex items-center">
              <SaveButton postId={actualContent.id || actualContent.imageId || 'unknown'} content={actualContent} />
            </div>
            
            {actualContent.creatorId && onFollow && (
              <Button
                variant={followedCreators.has(actualContent.creatorId) ? "default" : "outline"}
                size="sm"
                className="text-white border-white/30 hover:bg-white/20 hover:text-white"
                onClick={() => onFollow(actualContent.creatorId)}
              >
                {followedCreators.has(actualContent.creatorId) ? "Following" : "Follow"}
              </Button>
            )}
          </div>
        </div>
      )}
      
      {/* Split View Panel - Browse other videos */}
      {isSplitView && (
        <div 
          className="split-view-panel w-1/2 h-full bg-gray-900 overflow-hidden flex flex-col"
          style={{ pointerEvents: 'auto' }}
        >
          <div className="p-4 border-b border-gray-800">
            <p className="text-gray-400 text-sm">Browse more {resolvedType === 'moment' ? 'moments' : resolvedType === 'live' ? 'live streams' : resolvedType === 'video' ? 'videos' : resolvedType === 'post' ? 'posts' : resolvedType === 'thought' ? 'thoughts' : resolvedType === 'story' ? 'stories' : 'content'} while watching</p>
          </div>
          <div className="flex-1 overflow-y-auto p-4">
            <div className="space-y-4">
              {/* Only show the section matching the current content type */}
              {resolvedType === 'moment' && (
                <div>
                  <h4 className="text-white text-sm font-medium mb-2">More Moments</h4>
                  <div className="grid grid-cols-3 gap-2">
                    {Array.from({ length: 6 }, (_, index) => (
                      <div 
                        key={`moment-${index}`}
                        className="cursor-pointer group hover:opacity-80 transition-opacity"
                        onClick={() => {
                          handleSplitViewVideoClick({
                            id: `moment-${index}`,
                            title: `Moment ${index + 1}`,
                            creator: `User ${index + 1}`,
                            videoUrl: [
                              'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
                              'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
                              'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
                              'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4',
                              'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4',
                              'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4'
                            ][index],
                            thumbnail: `https://picsum.photos/seed/moment${index}/160/280`,
                            type: 'moment',
                            forcePortrait: true,
                            aspectRatio: '9/16',
                            duration: '0:30',
                            views: Math.floor(Math.random() * 80000 + 5000),
                            likes: Math.floor(Math.random() * 8000 + 500)
                          });
                        }}
                        data-type="moment"
                      >
                        <div className="relative aspect-[9/16] bg-gray-800 rounded-lg overflow-hidden">
                          <img 
                            src={`https://picsum.photos/seed/moment${index}/160/280`}
                            alt={`Moment ${index + 1}`}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all duration-300 flex items-center justify-center">
                            <Play className="h-4 w-4 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                          </div>
                        </div>
                        <div className="mt-1">
                          <p className="text-gray-400 text-xs truncate">User {index + 1}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {resolvedType === 'live' && (
                <div>
                  <h4 className="text-white text-sm font-medium mb-2">More Live Streams</h4>
                  <div className="grid grid-cols-2 gap-3">
                    {Array.from({ length: 4 }, (_, index) => (
                      <div 
                        key={`live-${index}`}
                        className="cursor-pointer group hover:opacity-80 transition-opacity"
                        onClick={() => {
                          handleSplitViewVideoClick({
                            id: `live-${index}`,
                            title: `Live Stream ${index + 1}`,
                            creator: `Streamer ${index + 1}`,
                            videoUrl: [
                              'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
                              'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4',
                              'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4',
                              'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4'
                            ][index],
                            thumbnail: `https://picsum.photos/seed/live${index}/320/180`,
                            live: true,
                            isLive: true,
                            type: 'live',
                            duration: 'LIVE',
                            views: Math.floor(Math.random() * 50000 + 5000),
                            likes: Math.floor(Math.random() * 5000 + 500)
                          });
                        }}
                        data-type="live"
                      >
                        <div className="relative aspect-video bg-gray-800 rounded-lg overflow-hidden">
                          <img 
                            src={`https://picsum.photos/seed/live${index}/320/180`}
                            alt={`Live Stream ${index + 1}`}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                          <div className="absolute top-2 left-2">
                            <div className="bg-red-600 text-white text-xs px-2 py-1 rounded flex items-center gap-1">
                              <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                              LIVE
                            </div>
                          </div>
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all duration-300 flex items-center justify-center">
                            <Play className="h-6 w-6 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                          </div>
                        </div>
                        <div className="mt-2">
                          <h5 className="text-white text-xs font-medium line-clamp-2">Live Stream {index + 1}</h5>
                          <p className="text-gray-400 text-xs mt-1">Streamer {index + 1}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {resolvedType === 'video' && (
                <div>
                  <h4 className="text-white text-sm font-medium mb-2">More Long Videos</h4>
                  <div className="grid grid-cols-2 gap-3">
                    {Array.from({ length: 4 }, (_, index) => {
                      const durations = ['1:15:00', '2:30:00', '1:45:00', '3:20:00'];
                      return (
                      <div 
                        key={`long-${index}`}
                        className="cursor-pointer group hover:opacity-80 transition-opacity"
                        onClick={() => {
                          handleSplitViewVideoClick({
                            id: `long-${index}`,
                            title: `Long Video ${index + 1}`,
                            creator: `Creator ${index + 1}`,
                            videoUrl: [
                              'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4',
                              'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4',
                              'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
                              'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4'
                            ][index],
                            thumbnail: `https://picsum.photos/seed/long${index}/320/180`,
                            type: 'video',
                            duration: durations[index],
                            views: Math.floor(Math.random() * 200000 + 10000),
                            likes: Math.floor(Math.random() * 20000 + 1000)
                          });
                        }}
                        data-type="video"
                      >
                        <div className="relative aspect-video bg-gray-800 rounded-lg overflow-hidden">
                          <img 
                            src={`https://picsum.photos/seed/long${index}/320/180`}
                            alt={`Long Video ${index + 1}`}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all duration-300 flex items-center justify-center">
                            <Play className="h-6 w-6 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                          </div>
                          <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                            {durations[index]}
                          </div>
                        </div>
                        <div className="mt-2">
                          <h5 className="text-white text-xs font-medium line-clamp-2">Long Video {index + 1}</h5>
                          <p className="text-gray-400 text-xs mt-1">Creator {index + 1}</p>
                        </div>
                      </div>
                      );
                    })}
                  </div>
                </div>
              )}
              
              {resolvedType === 'post' && (
                <div>
                  <h4 className="text-white text-sm font-medium mb-2">More Posts</h4>
                  <div className="space-y-2">
                    {Array.from({ length: 3 }, (_, index) => (
                      <div 
                        key={`post-${index}`}
                        className="cursor-pointer group bg-gray-800 rounded-lg p-3 hover:bg-gray-700 transition-colors"
                        onClick={() => handleSplitViewVideoClick({
                          id: `post-${index}`,
                          title: `Post ${index + 1}`,
                          creator: `User ${index + 1}`,
                          content: `This is post content ${index + 1}`,
                          thumbnail: `https://picsum.photos/seed/post${index}/320/180`,
                          type: 'post'
                        })}
                        data-type="post"
                      >
                        <div className="flex gap-3">
                          <div className="flex-shrink-0 w-16 h-16 bg-gray-700 rounded overflow-hidden">
                            <img 
                              src={`https://picsum.photos/seed/post${index}/64/64`}
                              alt={`Post ${index + 1}`}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h5 className="text-white text-xs font-medium line-clamp-2">Post content {index + 1}</h5>
                            <p className="text-gray-400 text-xs mt-1">User {index + 1}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {resolvedType === 'thought' && (
                <div>
                  <h4 className="text-white text-sm font-medium mb-2">More Thoughts</h4>
                  <div className="space-y-2">
                    {Array.from({ length: 3 }, (_, index) => (
                      <div 
                        key={`thought-${index}`}
                        className="cursor-pointer group bg-gray-800 rounded-lg p-3 hover:bg-gray-700 transition-colors"
                        onClick={() => handleSplitViewVideoClick({
                          id: `thought-${index}`,
                          title: `Thought ${index + 1}`,
                          creator: `Thinker ${index + 1}`,
                          content: `This is a thought ${index + 1}`,
                          type: 'thought'
                        })}
                        data-type="thought"
                      >
                        <h5 className="text-white text-xs font-medium line-clamp-3">This is thought content {index + 1}</h5>
                        <p className="text-gray-400 text-xs mt-1">Thinker {index + 1}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Default: show images for image type */}
              {resolvedType === 'image' && (
                <div>
                  <h4 className="text-white text-sm font-medium mb-2">More Images</h4>
                  <div className="grid grid-cols-3 gap-2">
                    {Array.from({ length: 6 }, (_, index) => (
                      <div 
                        key={`image-${index}`}
                        className="cursor-pointer group hover:opacity-80 transition-opacity"
                        onClick={() => handleSplitViewVideoClick({
                          id: `image-${index}`,
                          title: `Image ${index + 1}`,
                          creator: `Photographer ${index + 1}`,
                          thumbnail: `https://picsum.photos/seed/image${index}/320/320`,
                          type: 'image'
                        })}
                        data-type="image"
                      >
                        <div className="relative aspect-square bg-gray-800 rounded-lg overflow-hidden">
                          <img 
                            src={`https://picsum.photos/seed/image${index}/320/320`}
                            alt={`Image ${index + 1}`}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all duration-300 flex items-center justify-center">
                            <Image className="h-5 w-5 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      
      {/* Content for images */}
      {!isVideoType && (actualType === 'image' || actualType === 'post') && (
        <div 
          className={`${isSplitView ? 'w-1/2 h-full relative' : 'fixed inset-0'} h-full flex items-center justify-center cursor-zoom-in`}
          style={{ 
            zIndex: 1,
            width: isSplitView ? '50%' : '100vw',
            height: isSplitView ? '100%' : '100vh'
          }}
          onClick={() => {
            setShowImageOverlay(prev => !prev);
          }}
        >
          <img
            src={actualContent?.thumbnail || 
                 actualContent?.image || 
                 actualContent?.mediaUrl || 
                 actualContent?.media ||
                 actualContent?.src}
            alt={actualContent?.title || 'Fullscreen Image'}
            className="max-w-full max-h-full object-contain transition-all duration-300"
            style={{
              width: 'auto',
              height: 'auto',
              maxWidth: isSplitView ? '100%' : '100vw',
              maxHeight: isSplitView ? '100%' : '100vh',
              objectFit: 'contain',
              objectPosition: 'center',
              display: 'block',
              imageRendering: 'crisp-edges',
              imageResolution: 'from-image 1dppx'
            }}
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              if (!target.src.includes('picsum')) {
                target.src = `https://picsum.photos/seed/${actualContent?.id || 'fallback'}/1920/1080`;
              }
            }}
            onLoad={(e) => {
              const target = e.target as HTMLImageElement;
              target.style.imageRendering = 'auto';
            }}
          />
        </div>
      )}

      {/* Image overlay with actions (non-split-view) */}
      {!isVideoType && (actualType === 'image' || actualType === 'post') && !isSplitView && showImageOverlay && (
        <div
          className="fixed bottom-0 left-0 right-0 z-40 bg-gradient-to-t from-black/90 via-black/70 to-transparent p-4 animate-in slide-in-from-bottom duration-300"
          style={{
            paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 16px)'
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="mb-3">
            <h2 className="text-white text-lg md:text-xl font-semibold mb-1 line-clamp-2">
              {actualContent.title || 'Untitled Image'}
            </h2>
            <div className="flex items-center gap-3 text-white/80 text-sm">
              <div className="flex items-center gap-2">
                <Avatar 
                  className="h-8 w-8 cursor-pointer hover:ring-2 hover:ring-white/50 transition-all duration-200"
                  onClick={() => navigateToProfile(navigate, actualContent.creatorId, actualContent.creator)}
                >
                  <AvatarImage src={`https://picsum.photos/seed/${actualContent.creatorId || actualContent.creator || 'unknown'}/100/100`} />
                  <AvatarFallback className="bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs">
                    {(actualContent.creator || 'Unknown').substring(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <span 
                  className="font-medium hover:text-white transition-colors cursor-pointer"
                  onClick={() => navigateToProfile(navigate, actualContent.creatorId, actualContent.creator)}
                >
                  {actualContent.creator || 'Unknown Creator'}
                </span>
                {actualContent.verified && (
                  <div className="bg-blue-500 rounded-full p-0.5">
                    <div className="w-2 h-2 bg-white rounded-full"></div>
                  </div>
                )}
              </div>
              {actualContent.views && (
                <span className="flex items-center gap-1">
                  <Eye className="h-4 w-4" /> {formatNumber(actualContent.views)} views
                </span>
              )}
            </div>
            {actualContent.description && (
              <p className="text-white/70 text-sm mt-2 line-clamp-2">
                {actualContent.description}
              </p>
            )}
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <Button
              variant="ghost"
              size="sm"
              className={`text-white hover:bg-white/20 hover:text-white transition-all duration-200 ${isLiked ? 'text-red-500' : ''}`}
              onClick={(e) => {
                e.stopPropagation();
                handleLike();
              }}
              title="Like image"
            >
              <ThumbsUp className={`h-4 w-4 ${isLiked ? 'fill-current' : ''}`} />
              <span className="ml-1 text-xs">{formatNumber(likeCount)}</span>
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              className="text-white hover:bg-white/20 hover:text-white transition-all duration-200"
              onClick={(e) => {
                e.stopPropagation();
                if (onComment) {
                  onComment(actualContent.id, actualContent.creator);
                } else {
                  setShowCommentSection(true);
                }
              }}
              title="Comment"
            >
              <MessageCircle className="h-4 w-4" />
              {(actualContent?.comments ?? actualContent?.engagement?.comments) && (
                <span className="ml-1 text-xs">{formatNumber(actualContent?.comments ?? actualContent?.engagement?.comments)}</span>
              )}
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              className="text-white hover:bg-white/20 hover:text-white transition-all duration-200"
              onClick={(e) => {
                e.stopPropagation();
                if (onShare) {
                  onShare(actualContent);
                } else {
                  if (navigator.share) {
                    navigator.share({
                      title: actualContent.title,
                      text: actualContent.content || `Check out this ${actualContent.type} by ${actualContent.creator}`,
                      url: window.location.href
                    }).catch(() => {
                      navigator.clipboard.writeText(window.location.href);
                      showSuccess('Link copied to clipboard!');
                    });
                  } else {
                    navigator.clipboard.writeText(window.location.href);
                    showSuccess('Link copied to clipboard!');
                  }
                }
              }}
              title="Share image"
            >
              <Share2 className="h-4 w-4" />
            </Button>
            
            <div className="flex items-center">
              <SaveButton postId={actualContent.id || actualContent.imageId || 'unknown'} content={actualContent} />
            </div>
          </div>
        </div>
      )}

      {/* Content for other non-video types - try to show as image if possible */}
      {!isVideoType && actualType !== 'image' && actualType !== 'post' && (
        <div 
          className={`${isSplitView ? 'w-1/2 h-full relative' : 'fixed inset-0'} h-full flex items-center justify-center cursor-zoom-in`}
          style={{ 
            zIndex: 1,
            width: isSplitView ? '50%' : '100vw',
            height: isSplitView ? '100%' : '100vh'
          }}
          onClick={() => {
            if (document.fullscreenElement) {
              document.exitFullscreen?.();
            } else {
              document.documentElement.requestFullscreen();
            }
          }}
        >
          <img
            src={actualContent?.thumbnail || 
                 actualContent?.image || 
                 actualContent?.mediaUrl || 
                 actualContent?.media || 
                 actualContent?.videoUrl ||
                 actualContent?.src}
            alt={actualContent?.title || 'Fullscreen Content'}
            className="max-w-full max-h-full object-contain transition-all duration-300"
            style={{
              width: 'auto',
              height: 'auto',
              maxWidth: isSplitView ? '100%' : '100vw',
              maxHeight: isSplitView ? '100%' : '100vh',
              objectFit: 'contain',
              objectPosition: 'center',
              display: 'block',
              imageRendering: 'crisp-edges',
              imageResolution: 'from-image 1dppx'
            }}
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              // Try fallback sources with higher resolution
              if (!target.src.includes('picsum')) {
                target.src = `https://picsum.photos/seed/${actualContent?.id || 'fallback'}/1920/1080`;
              }
            }}
            onLoad={(e) => {
              const target = e.target as HTMLImageElement;
              // Enhance image quality for HD displays
              target.style.imageRendering = 'auto';
            }}
          />
          
        </div>
      )}





      {/* Comment Section */}
      <CommentSection
        isOpen={showCommentSection}
        onClose={() => setShowCommentSection(false)}
        postId={actualContent?.id || 'unknown'}
        postUser={actualContent?.creator || actualContent?.user || 'Unknown'}
      />
    </div>
  );
};

export default FullscreenViewer;
