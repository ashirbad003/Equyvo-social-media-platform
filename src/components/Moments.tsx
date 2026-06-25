import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Play, Pause, Video, Camera, Eye, ThumbsUp, MessageCircle, Volume2, VolumeX, ChevronLeft, ChevronRight, AlertTriangle, Maximize, Bookmark, RotateCcw } from 'lucide-react';
import { showSuccess, showError } from '@/utils/toast';
import { handleAsyncError, createError } from '@/utils/error-handling';
import { usePlatformOptimizations } from '@/hooks/use-platform-optimizations';
import SaveButton from '@/components/SaveButton';

interface Moment {
  id: string;
  user: string;
  content: string;
  media: string;
  thumbnail?: string;
  mediaType: 'video' | 'image';
  videoUrl?: string;
  likes: number;
  comments: number;
  views: number;
  time: string;
  fallbackImage?: string;
}

interface MomentsProps {
  moments: Moment[];
  onFullscreen: (moment: Moment) => void;
  onComment: (momentId: string, user: string) => void;
  onLike?: (momentId: string) => void;
  likedMoments?: Set<string>;
  isHomePage?: boolean; // Add prop to detect if we're on home page
  isMomentsPage?: boolean; // Add prop to detect if we're on the dedicated MomentsPage
}

const Moments: React.FC<MomentsProps> = ({ moments, onFullscreen, onComment, onLike, likedMoments = new Set(), isHomePage = false, isMomentsPage = false }) => {
  const [playingVideos, setPlayingVideos] = useState<Set<string>>(new Set());
  const [isMuted, setIsMuted] = useState(false); // Start unmuted for audio
  const [videoErrors, setVideoErrors] = useState<Set<string>>(new Set());
  const [thumbnailErrors, setThumbnailErrors] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState<{[key: string]: boolean}>({});
  const [videoProgress, setVideoProgress] = useState<{[key: string]: number}>({});
  const [videoDuration, setVideoDuration] = useState<{[key: string]: number}>({});
  const [currentTime, setCurrentTime] = useState<{[key: string]: number}>({});
  const [isSeeking, setIsSeeking] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const videoRefs = useRef<{[key: string]: HTMLVideoElement}>({});
  const playingVideosRef = useRef(playingVideos);
  playingVideosRef.current = playingVideos;
  const isMutedRef = useRef(isMuted);
  isMutedRef.current = isMuted;
  const { getVideoProps, getTouchHandlers, debounce, deviceCapabilities } = usePlatformOptimizations();
  const lastTapRef = useRef<{ [key: string]: number }>({});
  const tapTimerRef = useRef<{ [key: string]: ReturnType<typeof setTimeout> }>({});
  const [likeAnimMomentId, setLikeAnimMomentId] = useState<string | null>(null);

  const stopAllVideos = () => {
    // Stop all videos and reset states
    Object.keys(videoRefs.current).forEach(id => {
      const video = videoRefs.current[id];
      if (video) {
        video.pause();
        video.currentTime = 0;
      }
    });
    setPlayingVideos(new Set());
    setIsLoading({});
  };

  // Stop all videos when component unmounts
  useEffect(() => {
    return () => {
      stopAllVideos();
    };
  }, []);

  // Ensure all videos are paused on component mount to prevent auto-play
  useEffect(() => {
    const pauseAllVideos = () => {
      Object.keys(videoRefs.current).forEach(id => {
        const video = videoRefs.current[id];
        if (video) {
          video.pause();
          video.currentTime = 0;
        }
      });
      setPlayingVideos(new Set());
    };

    // Pause videos immediately and also after a short delay to catch any late-loading videos
    pauseAllVideos();
    const timeoutId = setTimeout(pauseAllVideos, 100);
    
    return () => clearTimeout(timeoutId);
  }, [moments]); // Re-run when moments change

  // Stop all videos when fullscreen viewer closes
  useEffect(() => {
    const handleFullscreenClose = () => {
      stopAllVideos();
    };

    // Listen for custom event from fullscreen viewer
    window.addEventListener('fullscreenViewerClosed', handleFullscreenClose);
    
    return () => {
      window.removeEventListener('fullscreenViewerClosed', handleFullscreenClose);
    };
  }, []);

  const handleVideoPlayPause = debounce(async (momentId: string, videoUrl?: string) => {
    const moment = moments.find(m => m.id === momentId);
    const actualVideoUrl = videoUrl || moment?.videoUrl || moment?.media;
    const fallbackUrl = 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4';
    const finalVideoUrl = actualVideoUrl || fallbackUrl;
    
    if (!finalVideoUrl) {
      return;
    }

    const video = videoRefs.current[momentId];
    if (!video) {
      return;
    }

    const newPlayingVideos = new Set(playingVideos);
    
    if (playingVideos.has(momentId)) {
      // Pause video
      video.pause();
      newPlayingVideos.delete(momentId);
    } else {
      // Pause all other videos first
      Object.keys(videoRefs.current).forEach(id => {
        if (id !== momentId && videoRefs.current[id]) {
          videoRefs.current[id].pause();
        }
      });
      
      // Play this video
      newPlayingVideos.clear();
      newPlayingVideos.add(momentId);
      setIsLoading(prev => ({ ...prev, [momentId]: true }));
      
      // Ensure video respects user's mute preference
      video.muted = isMuted;
      video.currentTime = 0;
      
      // Update video source if needed
      if (video.src !== finalVideoUrl && !video.src.includes(finalVideoUrl)) {
        video.src = finalVideoUrl;
      }
      
      try {
        // Try to play with user's audio preference
        await video.play();
        setIsLoading(prev => ({ ...prev, [momentId]: false }));
      } catch (error) {
        // Fallback: force mute and try again for autoplay compatibility
        video.muted = true;
        try {
          await video.play();
          setIsLoading(prev => ({ ...prev, [momentId]: false }));
          // Show user that video is muted so they can unmute
          if (!isMuted) {
            setIsMuted(true);
          }
        } catch (e) {
          // Try fallback video as last resort
          if (actualVideoUrl !== fallbackUrl) {
            video.src = fallbackUrl;
            try {
              await video.play();
              setIsLoading(prev => ({ ...prev, [momentId]: false }));
            } catch (fallbackError) {
              handleVideoError(momentId, fallbackError);
            }
          } else {
            handleVideoError(momentId, e);
          }
        }
      }
    }
    
    setPlayingVideos(newPlayingVideos);
  }, 100);

  const toggleMute = () => {
    setIsMuted(!isMuted);
    // Apply mute/unmute to all currently playing videos
    Object.keys(videoRefs.current).forEach(id => {
      const video = videoRefs.current[id];
      if (video && playingVideos.has(id)) {
        video.muted = !isMuted;
      }
    });
  };

  const handleVideoClick = (moment: Moment) => {
    // Stop all videos before opening fullscreen
    stopAllVideos();
    
    // On tap/click, go to fullscreen portrait mode with proper moment structure
    const momentContent = {
      ...moment,
      type: 'moment',
      contentType: 'moment',
      videoUrl: moment.videoUrl || moment.media,
      media: moment.media,
      thumbnail: moment.thumbnail || moment.media,
      mediaType: 'moment',
      creator: moment.user,
      content: moment.content,
      likes: moment.likes,
      comments: moment.comments,
      views: moment.views,
      time: moment.time,
      published: moment.time,
      duration: moment.mediaType === 'video' ? '0:30' : undefined,
      description: moment.content,
      creatorId: moment.user,
      verified: Math.random() > 0.7,
      subscribers: Math.floor(Math.random() * 100000),
      fallbackImage: moment.thumbnail || moment.media,
      // Ensure portrait mode for moments
      aspectRatio: '9/16',
      forcePortrait: true,
      // Force fullscreen mode for moments
      viewMode: 'fullscreen'
    };
    onFullscreen(momentContent);
  };

  const handleMomentDoubleClick = (momentId: string) => {
    onLike?.(momentId);
    if (!likedMoments.has(momentId)) {
      setLikeAnimMomentId(momentId);
      setTimeout(() => setLikeAnimMomentId(null), 800);
    }
  };

  const handleVideoError = (momentId: string, error?: Event | React.SyntheticEvent) => {
    const video = videoRefs.current[momentId];
    const moment = moments.find(m => m.id === momentId);
    
    if (video && moment) {
      const fallbackUrl = 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4';
      const currentSrc = video.src;
      
      // If current source failed and it's not already the fallback, try fallback
      if (!currentSrc.includes('BigBuckBunny.mp4')) {
        video.src = fallbackUrl;
        video.load();
        
        // Try to play the fallback video
        setTimeout(() => {
          video.play().then(() => {
            setIsLoading(prev => ({ ...prev, [momentId]: false }));
            // Clear error state since fallback is working
            setVideoErrors(prev => {
              const newSet = new Set(prev);
              newSet.delete(momentId);
              return newSet;
            });
          }).catch(() => {
            setVideoErrors(prev => new Set(prev).add(momentId));
            setIsLoading(prev => ({ ...prev, [momentId]: false }));
          });
        }, 200);
        return; // Don't set error state yet, wait for fallback attempt
      }
    }
    
    // Only set error state if fallback also failed or no fallback available
    setVideoErrors(prev => new Set(prev).add(momentId));
    setPlayingVideos(prev => {
      const newSet = new Set(prev);
      newSet.delete(momentId);
      return newSet;
    });
    setIsLoading(prev => ({ ...prev, [momentId]: false }));
    
    // Don't show error toast for home page to avoid spamming user
    if (!isHomePage) {
      const videoElement = videoRefs.current[momentId];
      if (videoElement?.error) {
        showError('Video failed to load. Please try again later.');
      }
    }
  };

  const handleThumbnailError = (momentId: string) => {
    setThumbnailErrors(prev => new Set(prev).add(momentId));
  };

  const retryVideo = async (momentId: string) => {
    // Clear all error states for this moment
    setVideoErrors(prev => {
      const newSet = new Set(prev);
      newSet.delete(momentId);
      return newSet;
    });
    
    // Force video reload
    const video = videoRefs.current[momentId];
    const moment = moments.find(m => m.id === momentId);
    
    if (video && moment) {
      // Try to update video source with fallback URL if needed
      const currentSrc = video.src;
      const fallbackUrl = 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4';
      
      // Reset video element
      video.currentTime = 0;
      
      // If current source failed, try fallback
      if (video.error || videoErrors.has(momentId)) {
        video.src = fallbackUrl;
      } else {
        video.load();
      }
      
      // Try to play again after a short delay
      setTimeout(() => {
        handleVideoPlayPause(momentId, video.src || fallbackUrl);
      }, 200);
    }
  };

  const handleVideoLoaded = (momentId: string) => {
    setIsLoading(prev => ({ ...prev, [momentId]: false }));
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>, momentId: string) => {
    const video = videoRefs.current[momentId];
    if (!video || !video.duration || isSeeking) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const percentage = clickX / rect.width;
    const newTime = percentage * video.duration;
    
    video.currentTime = newTime;
    const newProgress = (newTime / video.duration) * 100;
    const newCurrentTime = { ...currentTime };
    const newVideoProgress = { ...videoProgress };
    newCurrentTime[momentId] = newTime;
    newVideoProgress[momentId] = newProgress;
    setCurrentTime(newCurrentTime);
    setVideoProgress(newVideoProgress);
  };

  const handleSeekStart = () => {
    setIsSeeking(true);
  };

  const handleSeekEnd = () => {
    setIsSeeking(false);
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const handleTimeUpdate = (momentId: string, video: HTMLVideoElement) => {
    if (!isSeeking && video.duration) {
      const progress = (video.currentTime / video.duration) * 100;
      const newProgress = { ...videoProgress };
      const newCurrentTime = { ...currentTime };
      newProgress[momentId] = progress || 0;
      newCurrentTime[momentId] = video.currentTime || 0;
      setVideoProgress(newProgress);
      setCurrentTime(newCurrentTime);
    }
  };

  const handleSeeked = (momentId: string, video: HTMLVideoElement | null) => {
    if (!video || !video.duration) return;
    const progress = (video.currentTime / video.duration) * 100;
    setVideoProgress(prev => ({ ...prev, [momentId]: progress || 0 }));
    setCurrentTime(prev => ({ ...prev, [momentId]: video.currentTime || 0 }));
  };

  const handleLoadedMetadata = (momentId: string, video: HTMLVideoElement) => {
    const newDuration = { ...videoDuration };
    newDuration[momentId] = video.duration || 0;
    setVideoDuration(newDuration);
  };

  const handleVideoHover = (momentId: string, isHovering: boolean, videoUrl?: string) => {
    // Disable hover auto-play on profile page (when not home page)
    if (!isHomePage || isMomentsPage) {
      return;
    }
    
    const actualVideoUrl = videoUrl || moments.find(m => m.id === momentId)?.videoUrl || moments.find(m => m.id === momentId)?.media;
    if (!actualVideoUrl || videoErrors.has(momentId)) return;
    
    const video = videoRefs.current[momentId];
    if (!video) return;
    
    const newPlayingVideos = new Set(playingVideos);
    
    if (isHovering) {
      // Clear all other playing videos first
      Object.keys(videoRefs.current).forEach(id => {
        if (id !== momentId && videoRefs.current[id]) {
          videoRefs.current[id].pause();
          videoRefs.current[id].currentTime = 0;
        }
      });
      
      newPlayingVideos.clear();
      newPlayingVideos.add(momentId);
      setIsLoading(prev => ({ ...prev, [momentId]: true }));
      
      // Always start muted for hover preview
      video.muted = true;
      video.currentTime = 0;
      
      video.play().then(() => {
        setIsLoading(prev => ({ ...prev, [momentId]: false }));
      }).catch(error => {
        handleVideoError(momentId, error);
      });
    } else {
      video.pause();
      video.currentTime = 0;
      newPlayingVideos.delete(momentId);
    }
    
    setPlayingVideos(newPlayingVideos);
  };

  const scrollLeft = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: -200, behavior: 'smooth' });
    }
  };

  const scrollRight = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: 200, behavior: 'smooth' });
    }
  };

  // Desktop keyboard shortcuts for video control - always active on desktop
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) return;
      if (window.innerWidth < 768) return;

      const videoEntries = Object.entries(videoRefs.current);
      if (videoEntries.length === 0) return;

      const playingIds = Array.from(playingVideosRef.current);
      const activeId = playingIds.length > 0 ? playingIds[0] : videoEntries[0][0];
      const video = videoRefs.current[activeId];
      if (!video) return;

      switch (e.key) {
        case ' ':
        case 'k':
        case 'K':
          e.preventDefault();
          if (video.paused) video.play(); else video.pause();
          break;
        case 'ArrowLeft':
          e.preventDefault();
          video.currentTime = Math.max(0, video.currentTime - 5);
          break;
        case 'ArrowRight':
          e.preventDefault();
          video.currentTime = Math.min(video.duration || Infinity, video.currentTime + 5);
          break;
        case 'j':
        case 'J':
          e.preventDefault();
          video.currentTime = Math.max(0, video.currentTime - 10);
          break;
        case 'l':
        case 'L':
          e.preventDefault();
          video.currentTime = Math.min(video.duration || Infinity, video.currentTime + 10);
          break;
        case 'm':
        case 'M':
          e.preventDefault();
          video.muted = !isMutedRef.current;
          setIsMuted(!isMutedRef.current);
          break;
        case ',':
          e.preventDefault();
          video.currentTime = Math.max(0, video.currentTime - 1 / 30);
          break;
        case '.':
          e.preventDefault();
          video.currentTime = Math.min(video.duration || Infinity, video.currentTime + 1 / 30);
          break;
      }

      if (e.key >= '0' && e.key <= '9' && !e.ctrlKey && !e.metaKey && !e.altKey) {
        e.preventDefault();
        const pct = parseInt(e.key) / 10;
        video.currentTime = (video.duration || 0) * pct;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Ensure moments fill the horizontal space by duplicating if needed
  const getDisplayMoments = () => {
    if (!isHomePage || moments.length === 0) return moments;
    
    // Calculate how many moments needed to fill the screen (approximately 6-8 visible)
    const minVisibleCount = 8;
    const displayMoments = [...moments];
    
    // Duplicate moments if we don't have enough to fill the space
    while (displayMoments.length < minVisibleCount && moments.length > 0) {
      displayMoments.push(...moments.map(m => ({ ...m, id: `${m.id}-duplicate-${displayMoments.length}` })));
    }
    
    return displayMoments;
  };

  const displayMoments = getDisplayMoments();
  const showActionOverlay = deviceCapabilities.isTouchDevice;

  // For home page, render horizontal scrollable layout
  if (isHomePage) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Video className="w-5 h-5 text-red-500" />
            Moments
          </h3>
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
              onClick={scrollLeft}
              disabled={displayMoments.length === 0}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
              onClick={scrollRight}
              disabled={displayMoments.length === 0}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        <div className="relative">
          <div 
            ref={scrollContainerRef}
            className="flex gap-3 overflow-x-auto scrollbar-hide scroll-smooth pb-2"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {displayMoments.map((moment) => (
              <Card 
                key={moment.id} 
                className="flex-shrink-0 overflow-hidden group cursor-pointer bg-black relative"
                  onClick={() => handleVideoClick(moment)}
                  onDoubleClick={() => handleMomentDoubleClick(moment.id)}
                  style={{ aspectRatio: '9/16', width: '180px', height: '320px' }}
                >
                  <div className="relative w-full h-full bg-black" style={{ aspectRatio: '9/16' }}>
                  {moment.mediaType === 'video' ? (
                    <div className="relative w-full h-full">
                      {/* Show thumbnail for video moments */}
                      {thumbnailErrors.has(moment.id) ? (
                        <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 to-blue-900/20 flex items-center justify-center">
                          <div className="text-center p-4">
                            <Video className="w-8 h-8 text-white/60 mx-auto mb-2" />
                            <p className="text-white/60 text-xs">Loading thumbnail...</p>
                          </div>
                        </div>
                      ) : (
                        <img
                          src={moment.thumbnail || moment.fallbackImage || `https://picsum.photos/seed/${moment.id}-portrait/400/700.jpg`}
                          alt="Moment thumbnail"
                          className="w-full h-full object-cover"
                            onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            // Try multiple fallback images in sequence
                            if (!target.src.includes('picsum.photos/seed/')) {
                              target.src = `https://picsum.photos/seed/${moment.id}-portrait/400/700.jpg`;
                            } else if (!target.src.includes('unsplash')) {
                              target.src = 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=700&fit=crop&auto=format&dpr=2';
                            } else {
                              handleThumbnailError(moment.id);
                            }
                          }}
                          onLoad={() => {
                            // Clear thumbnail error if successfully loaded
                            if (thumbnailErrors.has(moment.id)) {
                              setThumbnailErrors(prev => {
                                const newSet = new Set(prev);
                                newSet.delete(moment.id);
                                return newSet;
                              });
                            }
                          }}
                        />
                      )}
                      {/* Video element for hover preview (hidden) */}
                      {videoErrors.has(moment.id) ? (
                        <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                          <div className="text-center p-4">
                            <Video className="w-8 h-8 text-white/60 mx-auto mb-2" />
                            <p className="text-white/60 text-sm mb-2">Video loading...</p>
                            <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-white/60 mx-auto"></div>
                          </div>
                        </div>
                      ) : (
                        <video
                          ref={(el) => { if (el) videoRefs.current[moment.id] = el; }}
                          src={moment.videoUrl || moment.media}
                          className="absolute inset-0 w-full h-full object-cover"
                          style={{
                            aspectRatio: '9/16',
                            objectFit: 'cover'
                          }}
                          muted={isMuted}
                          loop
                          playsInline
                          preload="metadata"
                          autoPlay={false} // Explicitly disable auto-play for home page too
                          onMouseEnter={() => handleVideoHover(moment.id, true, moment.videoUrl || moment.media)}
                          onMouseLeave={() => handleVideoHover(moment.id, false, moment.videoUrl || moment.media)}
                          onError={(e) => {
                            handleVideoError(moment.id, e);
                          }}
                          onLoadedData={() => {
                            handleVideoLoaded(moment.id);
                          }}
                          onTimeUpdate={() => handleTimeUpdate(moment.id, videoRefs.current[moment.id])}
                          onSeeked={() => handleSeeked(moment.id, videoRefs.current[moment.id])}
                          onLoadedMetadata={() => handleLoadedMetadata(moment.id, videoRefs.current[moment.id])}
                          onClick={(e) => {
                            e.stopPropagation();
                            const now = Date.now();
                            const lastTap = lastTapRef.current[moment.id] || 0;
                            lastTapRef.current[moment.id] = now;
                            if (now - lastTap < 400) {
                              if (tapTimerRef.current[moment.id]) clearTimeout(tapTimerRef.current[moment.id]);
                              const v = videoRefs.current[moment.id];
                              if (v) {
                                const rect = e.currentTarget.getBoundingClientRect();
                                if (e.clientX - rect.left > rect.width / 2) {
                                  v.currentTime = Math.min(v.duration || Infinity, v.currentTime + 10);
                                } else {
                                  v.currentTime = Math.max(0, v.currentTime - 10);
                                }
                              }
                              return;
                            }
                            tapTimerRef.current[moment.id] = setTimeout(() => {
                              handleVideoPlayPause(moment.id, moment.videoUrl || moment.media);
                            }, 400);
                          }}
                          onLoadStart={() => {
                            setIsLoading(prev => ({ ...prev, [moment.id]: true }));
                          }}
                          onPlay={() => {
                            // Ensure video only plays if it's in playingVideos set or being hovered
                            if (!playingVideos.has(moment.id)) {
                              const video = videoRefs.current[moment.id];
                              if (video) {
                                video.pause();
                                video.currentTime = 0;
                              }
                            }
                          }}
                        />
                      )}
                      {isLoading[moment.id] && (
                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-white"></div>
                        </div>
                      )}
                      {/* Play/Pause indicator overlay - only show when not playing */}
                      <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                        {!playingVideos.has(moment.id) && (
                          <div className="bg-black/50 backdrop-blur-sm rounded-full p-2">
                            <Play className="h-4 w-4 text-white" />
                          </div>
                        )}
                      </div>
                      {/* Video indicator */}
                      <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-sm rounded-full px-2 py-1">
                        <Video className="h-3 w-3 text-white" />
                      </div>
                      {/* Mute/Unmute button */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleMute();
                        }}
                        className="absolute top-2 left-2 bg-black/60 backdrop-blur-sm rounded-full p-1.5 hover:bg-black/80 transition-colors"
                        title={isMuted ? "Unmute" : "Mute"}
                      >
                        {isMuted ? <VolumeX className="h-3 w-3 text-white" /> : <Volume2 className="h-3 w-3 text-white" />}
                      </button>
                    </div>
                  ) : (
                    <div className="relative w-full h-full">
                      <img
                        src={moment.thumbnail || moment.media}
                        alt="Moment"
                        className="w-full h-full object-cover"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleVideoClick(moment);
                        }}
                      />
                      {/* Photo indicator */}
                      <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-sm rounded-full px-2 py-1">
                        <Camera className="h-3 w-3 text-white" />
                      </div>
                      {/* Progress Bar */}
                      {playingVideos.has(moment.id) && (
                        <div className="absolute bottom-2 left-2 right-2 z-20">
                          <div className="flex items-center gap-1">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                const v = videoRefs.current[moment.id];
                                if (v) v.currentTime = Math.max(0, v.currentTime - 5);
                              }}
                              className="max-md:hidden text-white/70 hover:text-white p-0.5"
                            >
                              <RotateCcw className="h-2.5 w-2.5" />
                            </button>
                            <span className="text-white text-xs font-medium min-w-[25px]">
                              {formatTime(currentTime[moment.id] || 0)}
                            </span>
                            <div 
                              className="flex-1 h-0.5 bg-white/30 rounded-full cursor-pointer group hover:h-1 transition-all"
                              onClick={(e) => handleSeek(e, moment.id)}
                              onMouseDown={handleSeekStart}
                              onMouseUp={handleSeekEnd}
                            >
                              <div 
                                className="h-full bg-white rounded-full transition-all relative"
                                style={{ width: `${videoProgress[moment.id] || 0}%` }}
                              >
                                <div 
                                  className="absolute right-0 top-1/2 -translate-y-1/2 w-2 h-2 bg-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                  style={{ transform: 'translateX(50%) translateY(-50%)' }}
                                />
                              </div>
                            </div>
                            <span className="text-white text-xs font-medium min-w-[25px]">
                              {formatTime(videoDuration[moment.id] || 0)}
                            </span>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                const v = videoRefs.current[moment.id];
                                if (v) v.currentTime = Math.min(v.duration || Infinity, v.currentTime + 5);
                              }}
                              className="max-md:hidden text-white/70 hover:text-white p-0.5"
                            >
                              <RotateCcw className="h-2.5 w-2.5 scale-x-[-1]" />
                            </button>
                          </div>
                        </div>
                      )}
                      {/* Overlay gradient */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent">
                        <div className="absolute bottom-0 left-0 right-0 p-3 text-white">
                          <p className="text-xs line-clamp-2 mb-2">{moment.content}</p>
                          <div className="flex items-center justify-between">
                            <div className="flex flex-wrap items-center gap-2 text-xs sm:flex-nowrap sm:gap-2">
                              <span className="flex items-center gap-1">
                                <Eye className="h-3 w-3" /> {moment.views || 0}
                              </span>
                              <span className="flex items-center gap-1">
                                <ThumbsUp className="h-3 w-3" /> {moment.likes}
                              </span>
                              <span className="flex items-center gap-1">
                                <MessageCircle className="h-3 w-3" /> {moment.comments}
                              </span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-5 w-5 p-0 text-white hover:bg-white/20"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onComment(moment.id, moment.user);
                                }}
                                title="Comment"
                              >
                                <MessageCircle className="h-3 w-3" />
                              </Button>
                              <div onClick={(e) => e.stopPropagation()}>
                                <SaveButton postId={moment.id} content={moment} />
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent">
                    <div className="absolute bottom-0 left-0 right-0 p-3 text-white">
                      <p className="text-xs line-clamp-2 mb-2">{moment.content}</p>
                      <div className="flex items-center justify-between">
                        <div className="flex flex-wrap items-center gap-2 text-xs sm:flex-nowrap sm:gap-2">
                          <span className="flex items-center gap-1">
                            <Eye className="h-3 w-3" /> {moment.views || 0}
                          </span>
                          <span className="flex items-center gap-1">
                            <ThumbsUp className="h-3 w-3" /> {moment.likes}
                          </span>
                          <span className="flex items-center gap-1">
                            <MessageCircle className="h-3 w-3" /> {moment.comments}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-5 w-5 p-0 text-white hover:bg-white/20"
                            onClick={(e) => {
                              e.stopPropagation();
                              onComment(moment.id, moment.user);
                            }}
                            title="Comment"
                          >
                            <MessageCircle className="h-3 w-3" />
                          </Button>
                          <div onClick={(e) => e.stopPropagation()}>
                            <SaveButton postId={moment.id} content={moment} />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  </div>
                  {likeAnimMomentId === moment.id && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-50">
                      <ThumbsUp className="h-12 w-12 text-blue-500 fill-blue-500 animate-like-float drop-shadow-2xl" />
                    </div>
                  )}
                </Card>
            ))}
          </div>
        </div>
        
        {moments.length === 0 && (
          <div className="text-center py-8">
            <Video className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No moments yet. Share your first short video!</p>
          </div>
        )}
      </div>
    );
  }

  // Original grid layout for non-home pages
  return (
    <div className="space-y-4">
      <div className="flex items-center mb-4">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Video className="w-5 h-5 text-red-500" />
          Moments
        </h3>
      </div>
      
      {/* Use horizontal scroll layout for non-MomentsPage pages */}
      <div className={`${isMomentsPage ? 'grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2' : 'flex gap-4 overflow-x-auto scrollbar-hide pb-4'} max-w-6xl mx-auto`}>
        {moments.map((moment) => (
          <Card 
            key={moment.id} 
            className={`${isMomentsPage ? '' : 'flex-shrink-0'} overflow-hidden group cursor-pointer bg-black relative`} 
            style={{ 
              aspectRatio: '9/16',
              width: isMomentsPage ? '180px' : '200px', 
              height: isMomentsPage ? '320px' : '356px'
            }}
            onClick={() => handleVideoClick(moment)}
            onDoubleClick={() => handleMomentDoubleClick(moment.id)}
          >
            <div className="relative w-full h-full bg-black" style={{ aspectRatio: '9/16' }}>
              {moment.mediaType === 'video' ? (
                <div className="relative w-full h-full">
                  {/* Show thumbnail for video moments */}
                  {thumbnailErrors.has(moment.id) ? (
                    <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 to-blue-900/20 flex items-center justify-center">
                      <div className="text-center p-4">
                        <Video className="w-8 h-8 text-white/60 mx-auto mb-2" />
                        <p className="text-white/60 text-xs">Loading thumbnail...</p>
                      </div>
                    </div>
                  ) : (
                    <img
                      src={moment.thumbnail || moment.fallbackImage || `https://picsum.photos/seed/${moment.id}-portrait/400/700.jpg`}
                      alt="Moment thumbnail"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        if (!target.src.includes('picsum.photos/seed/')) {
                          handleThumbnailError(moment.id);
                          target.src = `https://picsum.photos/seed/${moment.id}-portrait/400/700.jpg`;
                        } else if (!target.src.includes('unsplash')) {
                          target.src = 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=700&fit=crop&auto=format&dpr=2';
                        } else {
                          handleThumbnailError(moment.id);
                        }
                      }}
                      onLoad={() => {
                        // Clear thumbnail error if successfully loaded
                        if (thumbnailErrors.has(moment.id)) {
                          setThumbnailErrors(prev => {
                            const newSet = new Set(prev);
                            newSet.delete(moment.id);
                            return newSet;
                          });
                        }
                      }}
                    />
                  )}
                  {/* Video element for tap-to-play */}
                  {videoErrors.has(moment.id) ? (
                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                      <div className="text-center p-4">
                        <Video className="w-8 h-8 text-white/60 mx-auto mb-2" />
                        <p className="text-white/60 text-sm mb-2">Video loading...</p>
                        <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-white/60 mx-auto"></div>
                      </div>
                    </div>
                  ) : (
                    <video
                      ref={(el) => { if (el) videoRefs.current[moment.id] = el; }}
                      src={moment.videoUrl || moment.media}
                      className="absolute inset-0 w-full h-full object-cover transition-opacity duration-300"
                      muted={isMuted}
                      loop
                      playsInline
                      preload="metadata"
                      autoPlay={false}
                      onClick={(e) => {
                        e.stopPropagation();
                        const now = Date.now();
                        const lastTap = lastTapRef.current[moment.id] || 0;
                        lastTapRef.current[moment.id] = now;
                        if (now - lastTap < 400) {
                          if (tapTimerRef.current[moment.id]) clearTimeout(tapTimerRef.current[moment.id]);
                          const v = videoRefs.current[moment.id];
                          if (v) {
                            const rect = e.currentTarget.getBoundingClientRect();
                            if (e.clientX - rect.left > rect.width / 2) {
                              v.currentTime = Math.min(v.duration || Infinity, v.currentTime + 10);
                            } else {
                              v.currentTime = Math.max(0, v.currentTime - 10);
                            }
                          }
                          return;
                        }
                        tapTimerRef.current[moment.id] = setTimeout(() => {
                          handleVideoPlayPause(moment.id, moment.videoUrl || moment.media);
                        }, 400);
                      }}
                      onError={(e) => {
                        handleVideoError(moment.id, e);
                      }}
                      onLoadedData={() => {
                        handleVideoLoaded(moment.id);
                      }}
                      onTimeUpdate={() => handleTimeUpdate(moment.id, videoRefs.current[moment.id])}
                      onSeeked={() => handleSeeked(moment.id, videoRefs.current[moment.id])}
                      onLoadedMetadata={() => handleLoadedMetadata(moment.id, videoRefs.current[moment.id])}
                      onPlay={() => {
                        // Ensure video only plays if it's in the playingVideos set
                        if (!playingVideos.has(moment.id)) {
                          const video = videoRefs.current[moment.id];
                          if (video) {
                            video.pause();
                            video.currentTime = 0;
                          }
                        }
                      }}
                    />
                  )}
                  {isLoading[moment.id] && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-white"></div>
                    </div>
                  )}
                  {/* Play/Pause indicator overlay */}
                  <div 
                    className="absolute inset-0 flex items-center justify-center bg-black/30"
                    onClick={(e) => {
                      e.stopPropagation();
                      const now = Date.now();
                      const lastTap = lastTapRef.current[moment.id] || 0;
                      lastTapRef.current[moment.id] = now;
                      if (now - lastTap < 400) {
                        if (tapTimerRef.current[moment.id]) clearTimeout(tapTimerRef.current[moment.id]);
                        const v = videoRefs.current[moment.id];
                        if (v) {
                          const rect = e.currentTarget.getBoundingClientRect();
                          if (e.clientX - rect.left > rect.width / 2) {
                            v.currentTime = Math.min(v.duration || Infinity, v.currentTime + 10);
                          } else {
                            v.currentTime = Math.max(0, v.currentTime - 10);
                          }
                        }
                        return;
                      }
                      tapTimerRef.current[moment.id] = setTimeout(() => {
                        handleVideoPlayPause(moment.id, moment.videoUrl || moment.media);
                      }, 400);
                    }}
                  >
                    {!playingVideos.has(moment.id) && (
                      <div className="bg-black/50 backdrop-blur-sm rounded-full p-2">
                        <Play className="h-4 w-4 text-white" />
                      </div>
                    )}
                  </div>
                  {/* Video indicator */}
                  <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-sm rounded-full px-2 py-1">
                    <Video className="h-3 w-3 text-white" />
                  </div>
                  {/* Mute/Unmute button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleMute();
                    }}
                    className="absolute top-2 left-2 bg-black/60 backdrop-blur-sm rounded-full p-1.5 hover:bg-black/80 transition-colors"
                    title={isMuted ? "Unmute" : "Mute"}
                  >
                    {isMuted ? <VolumeX className="h-3 w-3 text-white" /> : <Volume2 className="h-3 w-3 text-white" />}
                  </button>
                  
                  {/* Progress Bar */}
                  {playingVideos.has(moment.id) && (
                    <div className="absolute bottom-2 left-2 right-2 z-20">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            const v = videoRefs.current[moment.id];
                            if (v) v.currentTime = Math.max(0, v.currentTime - 5);
                          }}
                          className="max-md:hidden text-white/70 hover:text-white p-0.5"
                        >
                          <RotateCcw className="h-2.5 w-2.5" />
                        </button>
                        <span className="text-white text-xs font-medium min-w-[25px]">
                          {formatTime(currentTime[moment.id] || 0)}
                        </span>
                        <div 
                          className="flex-1 h-0.5 bg-white/30 rounded-full cursor-pointer group hover:h-1 transition-all"
                          onClick={(e) => handleSeek(e, moment.id)}
                          onMouseDown={handleSeekStart}
                          onMouseUp={handleSeekEnd}
                        >
                          <div 
                            className="h-full bg-white rounded-full transition-all relative"
                            style={{ width: `${videoProgress[moment.id] || 0}%` }}
                          >
                            <div 
                              className="absolute right-0 top-1/2 -translate-y-1/2 w-2 h-2 bg-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                              style={{ transform: 'translateX(50%) translateY(-50%)' }}
                            />
                          </div>
                        </div>
                        <span className="text-white text-xs font-medium min-w-[25px]">
                          {formatTime(videoDuration[moment.id] || 0)}
                        </span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            const v = videoRefs.current[moment.id];
                            if (v) v.currentTime = Math.min(v.duration || Infinity, v.currentTime + 5);
                          }}
                          className="max-md:hidden text-white/70 hover:text-white p-0.5"
                        >
                          <RotateCcw className="h-2.5 w-2.5 scale-x-[-1]" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="relative w-full h-full">
                  {thumbnailErrors.has(moment.id) ? (
                    <div className="absolute inset-0 bg-gray-800 flex items-center justify-center">
                      <div className="text-center p-4">
                        <Camera className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                        <p className="text-gray-300 text-xs">Thumbnail unavailable</p>
                      </div>
                    </div>
                  ) : (
                    <img
                      src={moment.thumbnail || 'https://images.unsplash.com/photo-1551632811-561732d1e306?w=400&h=700&fit=crop'}
                      alt="Moment"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        if (!target.src.includes('placeholder')) {
                          handleThumbnailError(moment.id);
                          target.src = 'https://images.unsplash.com/photo-1551632811-561732d1e306?w=400&h=700&fit=crop';
                        }
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleVideoClick(moment);
                      }}
                    />
                  )}
                  {/* Photo indicator */}
                  <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-sm rounded-full px-2 py-1">
                    <Camera className="h-3 w-3 text-white" />
                  </div>
                </div>
              )}
              <div className={`absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent transition-opacity duration-300 ${showActionOverlay ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
                  <p className="text-sm line-clamp-2 mb-2">{moment.content}</p>
                  <div className="flex items-center justify-between">
                    <div className="flex flex-wrap items-center gap-3 text-xs sm:flex-nowrap sm:gap-3">
                      <span className="flex items-center gap-1">
                        <Eye className="h-3 w-3" /> {moment.views || 0}
                      </span>
                      <span className="flex items-center gap-1">
                        <ThumbsUp className="h-3 w-3" /> {moment.likes}
                      </span>
                      <span className="flex items-center gap-1">
                        <MessageCircle className="h-3 w-3" /> {moment.comments}
                      </span>
                      <span>{moment.time}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0 text-white hover:bg-white/20"
                        onClick={(e) => {
                          e.stopPropagation();
                          onComment(moment.id, moment.user);
                        }}
                        title="Comment"
                      >
                        <MessageCircle className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0 text-white hover:bg-white/20"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleVideoClick(moment);
                        }}
                        title="View in fullscreen"
                      >
                        <Maximize className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            {likeAnimMomentId === moment.id && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-50">
                <ThumbsUp className="h-12 w-12 text-blue-500 fill-blue-500 animate-like-float drop-shadow-2xl" />
              </div>
            )}
          </Card>
        ))}
      </div>
      
      {moments.length === 0 && (
        <div className="text-center py-8">
          <Video className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">No moments yet. Share your first short video!</p>
        </div>
      )}
    </div>
  );
};

export default Moments;
