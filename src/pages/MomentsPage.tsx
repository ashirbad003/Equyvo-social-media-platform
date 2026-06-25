"use client";

import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Play, Pause, Volume2, VolumeX, ThumbsUp, MessageCircle, Share2, Bookmark, Music2, MoreVertical, Send, RotateCcw } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from '@/lib/utils';
import { useIsMobile } from "@/hooks/use-mobile";
import StandardPostMenu from '@/components/StandardPostMenu';
import { showSuccess } from '@/utils/toast';
import SaveButton from '@/components/SaveButton';
import CommentSection from '@/components/CommentSection';
import { navigateToProfile } from '@/utils/profile-navigation';
import { useMediaSession } from '@/hooks/use-media-session';

const MomentsPage = () => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [activeVideoIndex, setActiveVideoIndex] = useState(0);
  const [isMuted, setIsMuted] = useState(true); // Start muted for auto-play compatibility
  const [hasEngaged, setHasEngaged] = useState(false); // Track user engagement
  const [autoUnmuted, setAutoUnmuted] = useState(false); // Track if auto-unmute has been applied
  const [likedMoments, setLikedMoments] = useState<Set<string>>(new Set());
  const [momentLikes, setMomentLikes] = useState<{[key: string]: string}>({});
  const [isScrolling, setIsScrolling] = useState(false);
  const [commentSectionOpen, setCommentSectionOpen] = useState(false);
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);
  const [selectedPostUser, setSelectedPostUser] = useState<string>('');
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);
  const scrollTimeoutRef = useRef<NodeJS.Timeout>();
  const activeVideoIndexRef = useRef(activeVideoIndex);
  activeVideoIndexRef.current = activeVideoIndex;
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isActiveVideoPlaying, setIsActiveVideoPlaying] = useState(false);
  const lastTapRef = useRef<{ time: number; index: number }>({ time: 0, index: -1 });
  const tapTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [likeAnimIndex, setLikeAnimIndex] = useState<number | null>(null);

  // Track play state of the active video for media session
  useEffect(() => {
    const video = videoRefs.current[activeVideoIndex];
    if (!video) return;

    const onPlay = () => setIsActiveVideoPlaying(true);
    const onPause = () => setIsActiveVideoPlaying(false);

    video.addEventListener('play', onPlay);
    video.addEventListener('pause', onPause);

    setIsActiveVideoPlaying(!video.paused);

    return () => {
      video.removeEventListener('play', onPlay);
      video.removeEventListener('pause', onPause);
    };
  }, [activeVideoIndex]);

  // Mock moments data (development only)
  const moments = import.meta.env.DEV ? [
    {
      id: 'm1',
      user: 'alex_adventures',
      avatar: 'https://github.com/shadcn.png',
      description: 'The view from the top is absolutely breathtaking! 🏔️ #hiking #nature #sunset',
      videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
      song: 'Original Sound - Alex Chen',
      likes: '15.4K',
      comments: '892',
      shares: '2.3K',
      isLiked: false,
      isSaved: false
    },
    {
      id: 'm2',
      user: 'culinary_wizard',
      avatar: 'https://github.com/shadcn.png',
      description: 'Secret pasta recipe revealed! 🍝 You have to try this. #cooking #foodie #recipe',
      videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
      song: 'Italian Dinner Jazz - Foodie Beats',
      likes: '8.9K',
      comments: '567',
      shares: '123',
      isLiked: true,
      isSaved: false
    },
    {
      id: 'm3',
      user: 'fitness_pro',
      avatar: 'https://github.com/shadcn.png',
      description: 'No excuses. Get it done. 💪 #fitness #gym #motivation',
      videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
      song: 'High Energy Workout - Gym Tunes',
      likes: '22.1K',
      comments: '1.2K',
      shares: '456',
      isLiked: false,
      isSaved: true
    },
    {
      id: 'm4',
      user: 'urban_dancer',
      avatar: 'https://github.com/shadcn.png',
      description: 'Vibing in the city 🌃 #dance #street #vibes',
      videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
      song: 'City Lights - Dance Mix',
      likes: '45.6K',
      comments: '2.3K',
      shares: '7.8K',
      isLiked: true,
      isSaved: true
    }
  ] : [];

  useMediaSession({
    videoRef: {
      current: videoRefs.current[activeVideoIndex] || null,
    } as React.RefObject<HTMLVideoElement | null>,
    isPlaying: isActiveVideoPlaying,
    setIsPlaying: (val: boolean) => {
      const video = videoRefs.current[activeVideoIndex];
      if (!video) return;
      if (val) video.play().catch(() => {});
      else video.pause();
    },
    title: moments[activeVideoIndex]?.description || moments[activeVideoIndex]?.user || 'Moment',
    artist: moments[activeVideoIndex]?.user || 'Equyvo',
  });

  // Initialize likes state only (remove auto like/save initialization)
  useEffect(() => {
    const initialLikes: {[key: string]: string} = {};
    
    moments.forEach(moment => {
      initialLikes[moment.id] = moment.likes;
    });
    
    setMomentLikes(initialLikes);
  }, []);

  // Enhanced scroll handling with smooth transitions
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let startY = 0;
    let startTime = 0;
    let isDragging = false;

    const handleTouchStart = (e: TouchEvent) => {
      startY = e.touches[0].clientY;
      startTime = Date.now();
      isDragging = true;
      setIsScrolling(true);
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!isDragging) return;
      const currentY = e.touches[0].clientY;
      const deltaY = currentY - startY;
      
      // Add momentum based on swipe velocity
      const velocity = Math.abs(deltaY) / (Date.now() - startTime);
      if (velocity > 0.5) {
        container.style.scrollBehavior = 'auto';
      }
    };

    const handleTouchEnd = (e: TouchEvent) => {
      isDragging = false;
      container.style.scrollBehavior = 'smooth';
      
      // Clear existing timeout
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
      
      // Reset scrolling state after animation
      scrollTimeoutRef.current = setTimeout(() => {
        setIsScrolling(false);
      }, 500);
    };

    const handleWheel = (e: WheelEvent) => {
      setIsScrolling(true);
      
      // Clear existing timeout
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
      
      // Reset scrolling state after animation
      scrollTimeoutRef.current = setTimeout(() => {
        setIsScrolling(false);
      }, 150);
    };

    // Add event listeners
    container.addEventListener('touchstart', handleTouchStart, { passive: true });
    container.addEventListener('touchmove', handleTouchMove, { passive: true });
    container.addEventListener('touchend', handleTouchEnd, { passive: true });
    container.addEventListener('wheel', handleWheel, { passive: true });

    return () => {
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchmove', handleTouchMove);
      container.removeEventListener('touchend', handleTouchEnd);
      container.removeEventListener('wheel', handleWheel);
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, []);

  // Intersection observer for video playback management
  useEffect(() => {
    const options = {
      root: containerRef.current,
      rootMargin: '0px',
      threshold: 0.7 // Higher threshold for better detection
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        const index = Number(entry.target.getAttribute('data-index'));
        const video = videoRefs.current[index];
        
        if (entry.isIntersecting && !isScrolling) {
          setActiveVideoIndex(index);

          // Play current video with enhanced logic
          if (video) {
            video.currentTime = 0;
            video.muted = true;
            video.play().catch(() => {});
          }
        } else if (!entry.isIntersecting) {
          // Pause video when not visible
          if (video) {
            video.pause();
          }
        }
      });
    }, options);

    const slides = containerRef.current?.querySelectorAll('.moment-slide');
    slides?.forEach(slide => observer.observe(slide));

    return () => {
      observer.disconnect();
      slides?.forEach(slide => observer.unobserve(slide));
    };
  }, [isScrolling, activeVideoIndex]);

  // Auto-play first video on mount with multiple attempts
  useEffect(() => {
    const playFirstVideo = () => {
      const firstVideo = videoRefs.current[0];
      if (firstVideo) {
        // Start muted for reliable auto-play
        firstVideo.muted = true;
        
        const attemptPlay = (attempts = 0) => {
          if (attempts >= 10) {
            return;
          }
          
          firstVideo.play()
            .catch(() => {
              setTimeout(() => attemptPlay(attempts + 1), 100 * (attempts + 1));
            });
        };
        
        // Start attempting to play after a short delay
        setTimeout(() => attemptPlay(), 100);
      }
    };

    playFirstVideo();
  }, []);

  // Keyboard navigation for desktop - always active
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const container = containerRef.current;
      if (!container) return;

      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) return;

      const idx = activeVideoIndexRef.current;
      const video = videoRefs.current[idx];

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          {
            const nextIndex = Math.min(idx + 1, moments.length - 1);
            const nextSlide = container.querySelector(`[data-index="${nextIndex}"]`) as HTMLElement;
            if (nextSlide) {
              nextSlide.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
          }
          break;
        case ' ':
        case 'k':
        case 'K':
          e.preventDefault();
          togglePlay(idx);
          break;
        case 'ArrowUp':
          e.preventDefault();
          {
            const prevIndex = Math.max(idx - 1, 0);
            const prevSlide = container.querySelector(`[data-index="${prevIndex}"]`) as HTMLElement;
            if (prevSlide) {
              prevSlide.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
          }
          break;
        case 'ArrowLeft':
          e.preventDefault();
          if (video) try { video.currentTime = Math.max(0, video.currentTime - 5); } catch {}
          break;
        case 'ArrowRight':
          e.preventDefault();
          if (video) try { video.currentTime = Math.min(video.duration || Infinity, video.currentTime + 5); } catch {}
          break;
        case 'j':
        case 'J':
          e.preventDefault();
          if (video) try { video.currentTime = Math.max(0, video.currentTime - 10); } catch {}
          break;
        case 'l':
        case 'L':
          e.preventDefault();
          if (video) try { video.currentTime = Math.min(video.duration || Infinity, video.currentTime + 10); } catch {}
          break;
        case 'm':
        case 'M':
          e.preventDefault();
          toggleMuteVideo();
          break;
        case ',':
          e.preventDefault();
          if (video) try { video.currentTime = Math.max(0, video.currentTime - 1 / 30); } catch {}
          break;
        case '.':
          e.preventDefault();
          if (video) try { video.currentTime = Math.min(video.duration || Infinity, video.currentTime + 1 / 30); } catch {}
          break;
      }

      if (e.key >= '0' && e.key <= '9' && !e.ctrlKey && !e.metaKey && !e.altKey) {
        e.preventDefault();
        if (video) {
          try {
            const pct = parseInt(e.key) / 10;
            video.currentTime = (video.duration || 0) * pct;
          } catch {}
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Auto-unmute removed - user must tap to unmute

  // Reset time/duration when active video changes
  useEffect(() => {
    setCurrentTime(0);
    setDuration(0);
  }, [activeVideoIndex]);

  // Update mute state for all videos (removed - now controlled individually)

  const toggleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleMuteVideo();
  };

  const toggleMuteVideo = () => {
    setHasEngaged(true);
    setAutoUnmuted(true);
    const currentVideo = videoRefs.current[activeVideoIndexRef.current];
    if (currentVideo) {
      const newMutedState = !currentVideo.muted;
      currentVideo.muted = newMutedState;
      setIsMuted(newMutedState);
    }
  };

  const togglePlay = (index: number) => {
    setHasEngaged(true);
    setAutoUnmuted(true); // Prevent auto-unmute from triggering again
    const video = videoRefs.current[index];
    if (video) {
      if (video.paused) {
        video.play().catch(() => {});
      } else {
        video.pause();
      }
    }
  };

  const formatTime = (seconds: number) => {
    if (!seconds || isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleTimeUpdate = (index: number) => {
    const video = videoRefs.current[index];
    if (video) {
      setCurrentTime(video.currentTime);
    }
  };

  const handleSeeked = (index: number) => {
    const video = videoRefs.current[index];
    if (video) {
      setCurrentTime(video.currentTime);
    }
  };

  const handleLoadedMetadata = (index: number) => {
    const video = videoRefs.current[index];
    if (video) {
      setDuration(video.duration);
    }
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    const video = videoRefs.current[activeVideoIndex];
    if (!video || !video.duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const percentage = Math.max(0, Math.min(1, clickX / rect.width));
    const newTime = percentage * video.duration;
    video.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const toggleLike = (momentId: string) => {
    setLikedMoments(prev => {
      const newLiked = new Set(prev);
      const currentLikes = momentLikes[momentId] || '0';
      const numericLikes = parseFloat(currentLikes.replace('K', '')) * (currentLikes.includes('K') ? 1000 : 1);
      
      if (newLiked.has(momentId)) {
        newLiked.delete(momentId);
        const newLikes = Math.max(0, numericLikes - 1);
        setMomentLikes(current => ({
          ...current, 
          [momentId]: newLikes >= 1000 ? `${(newLikes / 1000).toFixed(1)}K` : newLikes.toString()
        }));
      } else {
        newLiked.add(momentId);
        const newLikes = numericLikes + 1;
        setMomentLikes(current => ({
          ...current, 
          [momentId]: newLikes >= 1000 ? `${(newLikes / 1000).toFixed(1)}K` : newLikes.toString()
        }));
      }
      return newLiked;
    });
  };

  const handleComment = (momentId: string, user: string) => {
    setSelectedPostId(momentId);
    setSelectedPostUser(user);
    setCommentSectionOpen(true);
  };

  const handleShare = (momentId: string) => {
    const moment = moments.find(m => m.id === momentId);
    if (moment) {
      const shareUrl = `${window.location.origin}/moments/${momentId}`;
      if (navigator.share) {
        navigator.share({
          title: `Moment by ${moment.user}`,
          text: moment.description,
          url: shareUrl
        });
      } else {
        navigator.clipboard.writeText(shareUrl);
        showSuccess('🔗 Link copied to clipboard!');
      }
    }
  };

  // Menu handlers
  const handleReport = (momentId: string) => {
    showSuccess(`Report submitted for moment ${momentId}`);
  };

  const handleHide = (momentId: string) => {
    showSuccess('Moment hidden from feed');
  };

  const handleCopyLink = (momentId: string) => {
    const shareUrl = `${window.location.origin}/moments/${momentId}`;
    navigator.clipboard.writeText(shareUrl);
    showSuccess('🔗 Link copied to clipboard!');
  };

  return (
    <div
      ref={containerRef}
      className={`w-full bg-black snap-y snap-mandatory overflow-y-scroll overflow-x-hidden no-scrollbar ${
        isMobile ? 'h-[calc(100vh-7rem)]' : 'h-[calc(100vh-4rem)]'
      }`}
      style={{ 
        scrollBehavior: 'smooth',
        scrollbarWidth: 'none',
        msOverflowStyle: 'none'
      }}
      onClick={() => setHasEngaged(true)}
    >
      {moments.map((moment, index) => (
        <div
          key={moment.id}
          data-index={index}
          className={`moment-slide relative w-full snap-start snap-always bg-black overflow-hidden ${
            isMobile ? 'h-[calc(100vh-7rem)]' : 'h-[calc(100vh-4rem)]'
          }`}
        >
          {/* Video Player - Full Page Portrait */}
          <div className="absolute inset-0 flex items-center justify-center bg-black">
            {moment.videoUrl ? (
            <video
              ref={el => videoRefs.current[index] = el}
              src={moment.videoUrl}
              className="h-full w-auto object-contain"
              style={{
                aspectRatio: '9/16',
                maxHeight: isMobile ? 'calc(100vh - 7rem)' : 'calc(100vh - 4rem)',
                maxWidth: '100vw',
                objectFit: 'contain',
                backgroundColor: 'black'
              }}
              loop
              playsInline
              muted={true}
              autoPlay
              onTimeUpdate={() => handleTimeUpdate(index)}
              onSeeked={() => handleSeeked(index)}
              onLoadedMetadata={() => handleLoadedMetadata(index)}
              onClick={(e) => {
                const now = Date.now();
                const isDbl = now - lastTapRef.current.time < 400 && lastTapRef.current.index === index;
                lastTapRef.current = { time: now, index };

                if (isDbl) {
                  if (tapTimerRef.current) clearTimeout(tapTimerRef.current);
                  const isCurrentlyLiked = likedMoments.has(moment.id);
                  toggleLike(moment.id);
                  if (!isCurrentlyLiked) {
                    setLikeAnimIndex(index);
                    setTimeout(() => setLikeAnimIndex(null), 800);
                  }
                  return;
                }

                tapTimerRef.current = setTimeout(() => {
                  if (isMuted) {
                    toggleMuteVideo();
                  } else {
                    togglePlay(index);
                  }
                }, 400);
              }}
            />) : null}
            {likeAnimIndex === index && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-30">
                <ThumbsUp className="h-20 w-20 text-blue-500 fill-blue-500 animate-like-float drop-shadow-2xl" />
              </div>
            )}
          </div>

          {/* Overlay Content - Optimized for Portrait */}
          <div className="absolute inset-0 max-w-md mx-auto pointer-events-none">
            {/* Top Bar (Mute) */}
            <div className="absolute top-4 right-4 z-20 pointer-events-auto">
              <Button
                variant="ghost"
                size="icon"
                className="bg-black/20 hover:bg-black/40 text-white rounded-full backdrop-blur-sm"
                onClick={toggleMute}
              >
                {isMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
              </Button>
            </div>

            {/* Right Side Actions */}
            <div className="absolute bottom-20 right-2 flex flex-col items-center gap-6 z-20 pointer-events-auto">
              <div className="flex flex-col items-center gap-1">
                <Avatar 
                  className="h-12 w-12 border-2 border-white cursor-pointer hover:scale-110 hover:ring-2 hover:ring-white/50 transition-all duration-200"
                  onClick={() => {
                    // Navigate to user profile when avatar is clicked
                    navigateToProfile(navigate, undefined, moment.user);
                  }}
                  title={`${moment.user}'s Profile`}
                >
                  <AvatarImage src={moment.avatar} />
                  <AvatarFallback>{moment.user[0]}</AvatarFallback>
                </Avatar>
              </div>

              <div className="flex flex-col items-center gap-1">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="p-0 hover:bg-transparent text-white hover:scale-110 transition-transform"
                  onClick={() => toggleLike(moment.id)}
                >
                  <ThumbsUp className={cn("h-8 w-8 drop-shadow-md", likedMoments.has(moment.id) ? "fill-current text-blue-500" : "")} />
                </Button>
                <span className="text-white text-xs font-medium drop-shadow-md">{momentLikes[moment.id] || moment.likes}</span>
              </div>

              <div className="flex flex-col items-center gap-1">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="p-0 hover:bg-transparent text-white hover:scale-110 transition-transform"
                  onClick={() => handleComment(moment.id, moment.user)}
                >
                  <MessageCircle className="h-8 w-8 drop-shadow-md" />
                </Button>
                <span className="text-white text-xs font-medium drop-shadow-md">{moment.comments}</span>
              </div>

              <div className="flex flex-col items-center gap-1">
                <div onClick={(e) => e.stopPropagation()}>
                  <SaveButton 
                    postId={moment.id} 
                    content={{
                      ...moment,
                      type: 'moment',
                      videoUrl: moment.videoUrl,
                      media: moment.videoUrl,
                      mediaType: 'video'
                    }} 
                    className="p-0 hover:bg-transparent text-white hover:scale-110 transition-transform"
                    iconClassName="h-8 w-8 drop-shadow-md"
                  />
                </div>
                <span className="text-white text-xs font-medium drop-shadow-md">Save</span>
              </div>

              <div className="flex flex-col items-center gap-1">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="p-0 hover:bg-transparent text-white hover:scale-110 transition-transform"
                  onClick={() => handleShare(moment.id)}
                >
                  <Share2 className="h-8 w-8 drop-shadow-md" />
                </Button>
                <span className="text-white text-xs font-medium drop-shadow-md">{moment.shares}</span>
              </div>

              <div className="flex flex-col items-center gap-1">
                <StandardPostMenu
                  postId={moment.id}
                  onReport={handleReport}
                  onHide={handleHide}
                  onCopyLink={handleCopyLink}
                  onShare={() => handleShare(moment.id)}
                  className="text-white hover:bg-transparent hover:scale-110 transition-transform"
                />
                <span className="text-white text-xs font-medium drop-shadow-md">More</span>
              </div>
            </div>

            {/* Bottom Info Area */}
            <div className="absolute bottom-4 left-4 right-16 z-20 text-white pointer-events-auto">
              <div className="mb-2">
                <h3 className="font-bold text-lg drop-shadow-md cursor-pointer hover:underline">@{moment.user}</h3>
              </div>
              <div className="mb-3">
                <p className="text-sm drop-shadow-md line-clamp-2 leading-snug">
                  {moment.description}
                </p>
              </div>
              <div className="flex items-center gap-2 bg-white/20 w-fit px-3 py-1 rounded-full backdrop-blur-sm animate-pulse cursor-pointer hover:bg-white/30 transition-colors">
                <Music2 className="h-3 w-3" />
                <p className="text-xs font-medium truncate max-w-[150px]">{moment.song}</p>
                {!isMuted && index === activeVideoIndex && (
                  <span className="text-xs text-green-400 ml-2 animate-pulse">🔊 Unmuted</span>
                )}
              </div>
            </div>
            {duration > 10 && (
              <div className="absolute bottom-2 left-4 right-4 z-30 pointer-events-auto">
                <div className="flex items-center gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      const v = videoRefs.current[activeVideoIndex];
                      if (v) v.currentTime = Math.max(0, v.currentTime - 5);
                    }}
                    className="max-md:hidden text-white/70 hover:text-white p-1"
                  >
                    <RotateCcw className="h-3 w-3" />
                  </button>
                  <span className="text-white/70 text-[10px] font-medium min-w-[28px] text-right tabular-nums">
                    {formatTime(currentTime)}
                  </span>
                  <div 
                    className="flex-1 h-1 bg-white/20 rounded-full cursor-pointer group hover:h-1.5 transition-all duration-200"
                    onClick={handleSeek}
                  >
                    <div 
                      className="h-full bg-white rounded-full transition-all duration-100 relative"
                      style={{ width: `${duration ? (currentTime / duration) * 100 : 0}%` }}
                    >
                      <div className="absolute right-0 top-1/2 -translate-y-1/2 w-2.5 h-2.5 bg-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-md" />
                    </div>
                  </div>
                  <span className="text-white/70 text-[10px] font-medium min-w-[28px] tabular-nums">
                    {formatTime(duration)}
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      const v = videoRefs.current[activeVideoIndex];
                      if (v) v.currentTime = Math.min(v.duration || Infinity, v.currentTime + 5);
                    }}
                    className="max-md:hidden text-white/70 hover:text-white p-1"
                  >
                    <RotateCcw className="h-3 w-3 scale-x-[-1]" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      ))}
      
      {/* Comment Section Modal */}
      {commentSectionOpen && selectedPostId && (
        <CommentSection
          isOpen={commentSectionOpen}
          onClose={() => {
            setCommentSectionOpen(false);
            setSelectedPostId(null);
            setSelectedPostUser('');
          }}
          postId={selectedPostId}
          postUser={selectedPostUser}
        />
      )}
    </div>
  );
};

export default MomentsPage;
