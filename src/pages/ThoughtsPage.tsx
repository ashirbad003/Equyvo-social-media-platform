"use client";

import React, { useState, useEffect, useRef, useCallback, memo } from 'react';
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  MessageCircle, 
  Share2, 
  Bookmark, 
  MoreHorizontal,
  TrendingUp,
  Flame,
  Repeat2,
  Repeat,
  Copy,
  Flag,
  EyeOff,
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize2
} from 'lucide-react';
import { Badge } from "@/components/ui/badge";
import ReportModal from '@/components/ReportModal';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import VotingButtons from '@/components/VotingButtons';
import { getThoughts, voteOnThought, getThoughtVotes, likeThought } from '@/lib/thoughts';
import { Thought, ThoughtMedia } from '@/types/thoughts';
import FullscreenViewer from '@/components/FullscreenViewer';
import { showSuccess } from '@/utils/toast';
import { FullscreenContent } from '@/types';
import { useNavigate } from 'react-router-dom';
import { navigateToProfile } from '@/utils/profile-navigation';

// MediaRenderer component to handle different media types
const MediaRenderer: React.FC<{ 
  media: ThoughtMedia; 
  onFullscreen?: (content: FullscreenContent, videoRef?: React.RefObject<HTMLVideoElement>) => void; 
  videoRef?: React.RefObject<HTMLVideoElement> 
}> = ({ media, onFullscreen, videoRef: externalVideoRef }) => {
  const internalVideoRef = useRef<HTMLVideoElement>(null);
  const videoRef = externalVideoRef || internalVideoRef;
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [imageError, setImageError] = useState(false);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
    }
  };

  const isLongVideo = media.type === 'video' && media.duration && media.duration > 300; // > 5 minutes

  if (media.type === 'photo') {
    if (imageError) {
      return (
        <div className="mt-3 rounded-lg overflow-hidden bg-muted border border-border flex items-center justify-center h-64">
          <div className="text-center p-4">
            <div className="text-muted-foreground text-sm mb-2">🖼️ Image failed to load</div>
            <button 
              onClick={() => setImageError(false)}
              className="text-xs text-primary hover:underline"
            >
              Try again
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className="mt-3 rounded-lg overflow-hidden">
        <img 
          src={media.url} 
          alt="Thought content" 
          className="w-full object-cover max-h-96 cursor-pointer hover:scale-105 transition-transform duration-300"
          onClick={() => onFullscreen && onFullscreen({
            type: 'image',
            src: media.url,
            thumbnail: media.url,
            title: 'Photo from Thought',
            creator: 'Thought User',
            id: `photo-${media.url}`
          })}
          onError={() => setImageError(true)}
          loading="lazy"
        />
      </div>
    );
  }

  if (media.type === 'gif') {
    if (imageError) {
      return (
        <div className="mt-3 rounded-lg overflow-hidden bg-muted border border-border flex items-center justify-center h-64">
          <div className="text-center p-4">
            <div className="text-muted-foreground text-sm mb-2">🎬 GIF failed to load</div>
            <button 
              onClick={() => setImageError(false)}
              className="text-xs text-primary hover:underline"
            >
              Try again
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className="mt-3 rounded-lg overflow-hidden relative">
        <img 
          src={media.url} 
          alt="GIF content" 
          className="w-full object-cover max-h-96 cursor-pointer hover:scale-105 transition-transform duration-300"
          onClick={() => onFullscreen && onFullscreen({
            type: 'image',
            src: media.url,
            thumbnail: media.url,
            title: 'GIF from Thought',
            creator: 'Thought User',
            id: `gif-${media.url}`
          })}
          onError={() => setImageError(true)}
          loading="lazy"
        />
        <div className="absolute top-2 right-2 bg-black/50 text-white text-xs px-2 py-1 rounded">
          GIF
        </div>
      </div>
    );
  }

  if (media.type === 'video' && media.url) {
    return (
      <div className="mt-3 rounded-lg overflow-hidden bg-black relative">
        <video
          ref={videoRef}
          src={media.url}
          poster={media.thumbnail}
          className="w-full max-h-96"
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
          onClick={togglePlay}
          playsInline
        />
        
        {/* Video overlay controls */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          {!isPlaying && (
            <div className="bg-black/50 rounded-full p-4 pointer-events-auto cursor-pointer" onClick={togglePlay}>
              <Play className="h-8 w-8 text-white" />
            </div>
          )}
        </div>

        {/* Video controls bar */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
          <div className="flex items-center justify-between text-white">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="sm"
                className="text-white hover:bg-white/20 pointer-events-auto"
                onClick={togglePlay}
              >
                {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="text-white hover:bg-white/20 pointer-events-auto"
                onClick={toggleMute}
              >
                {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
              </Button>
              <span className="text-xs">
                {formatDuration(currentTime)} / {formatDuration(duration)}
              </span>
            </div>
            <div className="flex items-center gap-2">
              {isLongVideo && (
                <Badge variant="secondary" className="text-xs">
                  Long Video ({formatDuration(media.duration || 0)})
                </Badge>
              )}
              <Button
                variant="ghost"
                size="sm"
                className="text-white hover:bg-white/20 pointer-events-auto"
                onClick={() => {
                  // Pause the current video before opening fullscreen to prevent double audio
                  if (videoRef.current) {
                    videoRef.current.pause();
                  }
                  if (onFullscreen) {
                    onFullscreen({
                      type: 'video',
                      videoUrl: media.url,
                      thumbnail: media.thumbnail,
                      title: 'Video from Thought',
                      creator: 'Thought User',
                      id: `video-${media.url}`,
                      duration: media.duration
                    }, videoRef);
                  }
                }}
              >
                <Maximize2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
};

const ThoughtsPage = memo(() => {
  const navigate = useNavigate();
  const [thoughts, setThoughts] = useState<Thought[]>([]);
  const [loading, setLoading] = useState(true);
  const [initialLoading, setInitialLoading] = useState(true);
  const [voting, setVoting] = useState<string | null>(null);
  const [liking, setLiking] = useState<string | null>(null);
  const [savedThoughts, setSavedThoughts] = useState<Set<string>>(new Set());
  const [commentDialogOpen, setCommentDialogOpen] = useState<string | null>(null);
  const [newComment, setNewComment] = useState('');
  const [sharing, setSharing] = useState<string | null>(null);
  const [retweeting, setRetweeting] = useState<string | null>(null);
  const [reactedThoughts, setReactedThoughts] = useState<Set<string>>(new Set());
  const [thoughtReacts, setThoughtReacts] = useState<{ [key: string]: number }>({});
  const [userReactedThoughts, setUserReactedThoughts] = useState<Thought[]>([]);
  const [reportModalOpen, setReportModalOpen] = useState<string | null>(null);
  const [fullscreenContent, setFullscreenContent] = useState<FullscreenContent | null>(null);
  const [fullscreenType, setFullscreenType] = useState<'post' | 'live' | 'video' | 'moment' | 'image' | 'thought' | 'reacted'>('image');
  const [originalVideoRef, setOriginalVideoRef] = useState<React.RefObject<HTMLVideoElement> | null>(null);
  const [originalVideoState, setOriginalVideoState] = useState<{ currentTime: number; isPlaying: boolean } | null>(null);
  const videoRefs = useRef<{ [key: string]: React.RefObject<HTMLVideoElement> }>({});
  const isInitialized = useRef(false);

  const [trendingTopics] = useState([
    { name: '#AIRevolution', posts: '12.3K', trend: 'up' },
    { name: '#WebDevelopment', posts: '8.7K', trend: 'up' },
    { name: '#StartupLife', posts: '6.2K', trend: 'down' },
    { name: '#TechNews', posts: '4.5K', trend: 'up' },
    { name: '#Coding', posts: '3.8K', trend: 'stable' }
  ]);

  const fetchThoughts = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await getThoughts();
      if (error || !data || data.length === 0) {
        setThoughts(import.meta.env.DEV ? getMockThoughts() : []);
      } else {
        setThoughts(data);
      }
    } catch {
      setThoughts(import.meta.env.DEV ? getMockThoughts() : []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchThoughts();
    
    // Handle initial loading delay to prevent flash
    const timer = setTimeout(() => {
      setInitialLoading(false);
    }, 500);

    return () => clearTimeout(timer);
  }, [fetchThoughts]);

  const getMockThoughts = (): Thought[] => {
    return [
      {
        id: 't1',
        user_id: 'mock-user-1',
        content: 'The future of AI is here! Just tried the new GPT-4 features and mind = blown 🤯 The possibilities are endless. What do you think about the rapid advancement in AI?',
        platform: 'twitter',
        tags: ['AI', 'Technology', 'Future'],
        created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        updated_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        likes_count: 1234,
        comments_count: 89,
        shares_count: 45,
        retweets_count: 156,
        upvotes_count: 0,
        downvotes_count: 0,
        reacts_count: 42,
        media: [
          {
            type: 'photo',
            url: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=800&fit=crop',
            width: 800,
            height: 600
          }
        ],
        user: {
          id: 'mock-user-1',
          username: '@techguy',
          avatar_url: 'https://github.com/shadcn.png'
        },
        user_vote: null,
        user_has_liked: false
      },
      {
        id: 't2',
        user_id: 'mock-user-2',
        content: '🔥 HOT TAKE: TypeScript is overrated for small projects. Sometimes plain JavaScript is just fine. Fight me! \n\nWhat are your thoughts? When do you choose TS over JS?',
        image_url: 'https://images.unsplash.com/photo-1516116216624-53e697fedbea?w=800&h=400&fit=crop',
        platform: 'reddit',
        tags: ['Programming', 'TypeScript', 'JavaScript'],
        created_at: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
        updated_at: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
        likes_count: 567,
        comments_count: 234,
        shares_count: 78,
        retweets_count: 89,
        upvotes_count: 0,
        downvotes_count: 0,
        reacts_count: 18,
        user: {
          id: 'mock-user-2',
          username: '@devcomm',
          avatar_url: 'https://github.com/shadcn.png'
        },
        user_vote: null,
        user_has_liked: false
      },
      {
        id: 't3',
        user_id: 'mock-user-3',
        content: 'Day 42 of my startup journey:\n\n✅ Launched MVP\n❌ 0 customers so far\n🤔 Should I pivot or persist?\n\nBuilding in public is hard but rewarding. Any advice from fellow founders?',
        platform: 'threads',
        tags: ['Startup', 'Entrepreneurship', 'BuildingInPublic'],
        created_at: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
        updated_at: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
        likes_count: 890,
        comments_count: 156,
        shares_count: 67,
        retweets_count: 234,
        upvotes_count: 0,
        downvotes_count: 0,
        reacts_count: 67,
        media: [
          {
            type: 'gif',
            url: 'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExMjZqYnZzMmZ1c3R0b3Vqam9sbXg3b2Fva3Y2dDZzZ3RqcmZmZ3ZkbyZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/3o7aD2saalBwwftBIc/giphy.gif',
            width: 480,
            height: 270
          }
        ],
        user: {
          id: 'mock-user-3',
          username: '@startuplife',
          avatar_url: 'https://github.com/shadcn.png'
        },
        user_vote: null,
        user_has_liked: false
      },
      {
        id: 't4',
        user_id: 'mock-user-4',
        content: 'BREAKING: New gaming console announced! 🔥\n\nSpecs:\n• 8K gaming at 120fps\n• AI-powered ray tracing\n• Backward compatible with all previous gen games\n• Price: $499\n\nPre-orders start next week. Who\'s getting one?',
        image_url: 'https://images.unsplash.com/photo-1496171367470-9edbe5dee8c1?w=800&h=500&fit=crop',
        platform: 'twitter',
        tags: ['Gaming', 'Console', 'Tech'],
        created_at: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
        updated_at: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
        likes_count: 3456,
        comments_count: 567,
        shares_count: 234,
        retweets_count: 890,
        upvotes_count: 0,
        downvotes_count: 0,
        reacts_count: 156,
        user: {
          id: 'mock-user-4',
          username: '@gamingnews',
          avatar_url: 'https://github.com/shadcn.png'
        },
        user_vote: null,
        user_has_liked: false
      },
      {
        id: 't5',
        user_id: 'mock-user-5',
        content: 'Just finished editing my latest documentary about sustainable architecture! This 12-minute film explores how buildings can coexist with nature. 🌿\n\nFull video link in bio! #Documentary #Architecture #Sustainability',
        platform: 'twitter',
        tags: ['Documentary', 'Architecture', 'Sustainability'],
        created_at: new Date(Date.now() - 10 * 60 * 60 * 1000).toISOString(),
        updated_at: new Date(Date.now() - 10 * 60 * 60 * 1000).toISOString(),
        likes_count: 2341,
        comments_count: 412,
        shares_count: 189,
        retweets_count: 567,
        upvotes_count: 0,
        downvotes_count: 0,
        reacts_count: 89,
        media: [
          {
            type: 'video',
            url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
            thumbnail: 'https://images.unsplash.com/photo-1448630360428-65456885c650?w=800&h=450&fit=crop',
            duration: 720, // 12 minutes
            width: 1280,
            height: 720
          }
        ],
        user: {
          id: 'mock-user-5',
          username: '@filmmaker',
          avatar_url: 'https://github.com/shadcn.png'
        },
        user_vote: null,
        user_has_liked: false
      },
      {
        id: 't6',
        user_id: 'mock-user-6',
        content: 'Nature photography session today! Caught this amazing sunset at the mountains. The colors were absolutely incredible! 📸\n\nShot on: Canon EOS R5\nSettings: f/8, 1/250s, ISO 100\n\n#Photography #Nature #Sunset #Landscape',
        platform: 'instagram',
        tags: ['Photography', 'Nature', 'Sunset'],
        created_at: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
        updated_at: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
        likes_count: 4567,
        comments_count: 234,
        shares_count: 345,
        retweets_count: 123,
        upvotes_count: 0,
        downvotes_count: 0,
        reacts_count: 234,
        media: [
          {
            type: 'photo',
            url: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1200&h=800&fit=crop',
            width: 1200,
            height: 800
          }
        ],
        user: {
          id: 'mock-user-6',
          username: '@photographer',
          avatar_url: 'https://github.com/shadcn.png'
        },
        user_vote: null,
        user_has_liked: false
      },
      {
        id: 't7',
        user_id: 'mock-user-7',
        content: 'When your code finally works after 3 hours of debugging 😂\n\nProgramming is 90% debugging and 10% writing actual code, am I right?\n\n#Programming #Coding #DeveloperLife #Debugging',
        platform: 'twitter',
        tags: ['Programming', 'Coding', 'DeveloperLife'],
        created_at: new Date(Date.now() - 14 * 60 * 60 * 1000).toISOString(),
        updated_at: new Date(Date.now() - 14 * 60 * 60 * 1000).toISOString(),
        likes_count: 8901,
        comments_count: 567,
        shares_count: 234,
        retweets_count: 345,
        upvotes_count: 0,
        downvotes_count: 0,
        reacts_count: 345,
        media: [
          {
            type: 'gif',
            url: 'https://media.giphy.com/media/l4FGnqnI5hobI2xOk/giphy.gif',
            width: 500,
            height: 281
          }
        ],
        user: {
          id: 'mock-user-7',
          username: '@developer',
          avatar_url: 'https://github.com/shadcn.png'
        },
        user_vote: null,
        user_has_liked: false
      },
      {
        id: 't8',
        user_id: 'mock-user-8',
        content: 'Deep Dive: The Complete History of Artificial Intelligence\n\nIn this comprehensive 45-minute documentary, we explore AI\'s evolution from the 1950s to today. From Turing machines to neural networks and beyond.\n\nChapters:\n0:00 - Introduction\n5:30 - The Birth of AI\n15:20 - AI Winter\n25:40 - Neural Networks\n35:10 - Deep Learning Revolution\n40:00 - The Future\n\n#AI #Documentary #History #Technology',
        platform: 'youtube',
        tags: ['AI', 'Documentary', 'History', 'Technology'],
        created_at: new Date(Date.now() - 16 * 60 * 60 * 1000).toISOString(),
        updated_at: new Date(Date.now() - 16 * 60 * 60 * 1000).toISOString(),
        likes_count: 12345,
        comments_count: 890,
        shares_count: 567,
        retweets_count: 234,
        upvotes_count: 0,
        downvotes_count: 0,
        reacts_count: 567,
        media: [
          {
            type: 'video',
            url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4',
            thumbnail: 'https://images.unsplash.com/photo-1620712943543-bcc4688e7485?w=1280&h=720&fit=crop',
            duration: 2700, // 45 minutes
            width: 1920,
            height: 1080
          }
        ],
        user: {
          id: 'mock-user-8',
          username: '@techeducator',
          avatar_url: 'https://github.com/shadcn.png'
        },
        user_vote: null,
        user_has_liked: false
      }
    ];
  };

  const handleVote = async (thoughtId: string, voteType: 'upvote' | 'downvote') => {
    try {
      setVoting(thoughtId);
      
      const thoughtIndex = thoughts.findIndex(t => t.id === thoughtId);
      if (thoughtIndex === -1) return;
      
      const thought = thoughts[thoughtIndex];
      const currentUpvotes = thought.upvotes_count || 0;
      const currentDownvotes = thought.downvotes_count || 0;
      
      let newUpvotes = currentUpvotes;
      let newDownvotes = currentDownvotes;
      let newUserVote: 'upvote' | 'downvote' | null = voteType;
      
      if (thought.user_vote === voteType) {
        // Remove vote
        newUserVote = null;
        if (voteType === 'upvote') {
          newUpvotes = Math.max(0, newUpvotes - 1);
        } else {
          newDownvotes = Math.max(0, newDownvotes - 1);
        }
      } else if (thought.user_vote) {
        // Change vote
        if (thought.user_vote === 'upvote' && voteType === 'downvote') {
          newUpvotes = Math.max(0, newUpvotes - 1);
          newDownvotes = newDownvotes + 1;
        } else if (thought.user_vote === 'downvote' && voteType === 'upvote') {
          newUpvotes = newUpvotes + 1;
          newDownvotes = Math.max(0, newDownvotes - 1);
        }
      } else {
        // New vote
        if (voteType === 'upvote') {
          newUpvotes = newUpvotes + 1;
        } else {
          newDownvotes = newDownvotes + 1;
        }
      }
      
      const updatedThoughts = [...thoughts];
      updatedThoughts[thoughtIndex] = {
        ...thought,
        upvotes_count: newUpvotes,
        downvotes_count: newDownvotes,
        user_vote: newUserVote
      };
      
      setThoughts(updatedThoughts);
      
      // Sync with database (only if user is authenticated)
      try {
        const { error } = await voteOnThought({ thought_id: thoughtId, vote_type: voteType });
        if (error) {
          // Don't revert local state in development if database fails
          if (!import.meta.env.DEV) {
            setThoughts(thoughts);
          }
        }
      } catch {
        // Don't revert local state in development if database fails
        if (!import.meta.env.DEV) {
          setThoughts(thoughts);
        }
      }
    } catch {
      // Don't revert local state in development if database fails
      if (!import.meta.env.DEV) {
        setThoughts(thoughts);
      }
    } finally {
      setVoting(null);
    }
  };

  const handleLike = async (thoughtId: string) => {
    try {
      setLiking(thoughtId);
      
      // For mock data, just update local state
      const thoughtIndex = thoughts.findIndex(t => t.id === thoughtId);
      if (thoughtIndex === -1) return;
      
      const thought = thoughts[thoughtIndex];
      let newLikesCount = thought.likes_count;
      const newUserHasLiked = !thought.user_has_liked;
      
      if (thought.user_has_liked) {
        // Remove like
        newLikesCount = Math.max(0, newLikesCount - 1);
      } else {
        // Add like
        newLikesCount = newLikesCount + 1;
      }
      
      const updatedThoughts = [...thoughts];
      updatedThoughts[thoughtIndex] = {
        ...thought,
        likes_count: newLikesCount,
        user_has_liked: newUserHasLiked
      };
      
      setThoughts(updatedThoughts);
      
      // Try to sync with database (will fail gracefully with mock data)
      try {
        await likeThought({ thought_id: thoughtId });
      } catch {
        // Database sync failed (expected with mock data)
      }
    } catch {
      // Database sync failed (expected with mock data)
    } finally {
      setLiking(null);
    }
  };


  const handleSave = async (thoughtId: string) => {
    try {
      const newSavedThoughts = new Set(savedThoughts);
      const thought = thoughts.find(t => t.id === thoughtId);
      
      if (newSavedThoughts.has(thoughtId)) {
        newSavedThoughts.delete(thoughtId);
        showSuccess('🗑️ Thought removed from saved');
        
        // Dispatch event to notify profile page
        window.dispatchEvent(new CustomEvent('contentUnsaved', { 
          detail: { postId: thoughtId, content: thought } 
        }));
      } else {
        newSavedThoughts.add(thoughtId);
        showSuccess('📌 Thought saved successfully!');
        
        // Store full content data when saving
        if (thought) {
          const savedContentData = localStorage.getItem('savedContentData');
          const savedContent = savedContentData ? JSON.parse(savedContentData) : {};
          savedContent[thoughtId] = {
            ...thought,
            savedAt: new Date().toISOString()
          };
          localStorage.setItem('savedContentData', JSON.stringify(savedContent));
        }
        
        // Dispatch event to notify profile page
        window.dispatchEvent(new CustomEvent('contentSaved', { 
          detail: { postId: thoughtId, content: thought } 
        }));
      }
      setSavedThoughts(newSavedThoughts);
      
      // Save to localStorage for persistence
      localStorage.setItem('savedThoughts', JSON.stringify(Array.from(newSavedThoughts)));
    } catch {
      // Handle save error
    }
  };

  const handleShare = async (thoughtId: string) => {
    try {
      setSharing(thoughtId);
      const thought = thoughts.find(t => t.id === thoughtId);
      if (thought) {
        const shareUrl = `${window.location.origin}/thoughts/${thoughtId}`;
        
        if (navigator.share) {
          await navigator.share({
            title: `Thought by ${thought.user?.username}`,
            text: thought.content.substring(0, 100) + '...',
            url: shareUrl
          });
        } else {
          // Fallback: copy to clipboard
          await navigator.clipboard.writeText(shareUrl);
          alert('Link copied to clipboard!');
        }
      }
    } catch {
      // Handle share error
    } finally {
      setSharing(null);
    }
  };

  const handleComment = async (thoughtId: string) => {
    if (newComment.trim()) {
      try {
        // Here you would typically save the comment to your database
        // For now, we'll just update the local state
        
        // Update local state to show new comment count
        const thoughtIndex = thoughts.findIndex(t => t.id === thoughtId);
        if (thoughtIndex !== -1) {
          const updatedThoughts = [...thoughts];
          updatedThoughts[thoughtIndex] = {
            ...updatedThoughts[thoughtIndex],
            comments_count: updatedThoughts[thoughtIndex].comments_count + 1
          };
          setThoughts(updatedThoughts);
        }
        
        setNewComment('');
        setCommentDialogOpen(null);
      } catch {
        // Handle comment error
      }
    }
  };

  const handleCopyLink = async (thoughtId: string) => {
    try {
      const shareUrl = `${window.location.origin}/thoughts/${thoughtId}`;
      await navigator.clipboard.writeText(shareUrl);
      alert('Link copied to clipboard!');
    } catch {
      // Handle copy link error
    }
  };

  const handleReport = (thoughtId: string) => {
    setReportModalOpen(thoughtId);
  };

  const handleRetweet = async (thoughtId: string) => {
    try {
      setRetweeting(thoughtId);
      
      // Update local state to show new retweet count
      const thoughtIndex = thoughts.findIndex(t => t.id === thoughtId);
      if (thoughtIndex !== -1) {
        const updatedThoughts = [...thoughts];
        updatedThoughts[thoughtIndex] = {
          ...updatedThoughts[thoughtIndex],
          retweets_count: updatedThoughts[thoughtIndex].retweets_count + 1
        };
        setThoughts(updatedThoughts);
      }
      
      // Here you would typically sync with your database
      // For now, we'll just update the local state
    } catch {
      // Handle retweet error
    } finally {
      setRetweeting(null);
    }
  };

  const handleReact = (thoughtId: string) => {
    const newReactedThoughts = new Set(reactedThoughts);
    const newThoughtReacts = { ...thoughtReacts };
    const thought = thoughts.find(t => t.id === thoughtId);

    if (reactedThoughts.has(thoughtId)) {
      // Remove reaction - decrement count by 1
      newReactedThoughts.delete(thoughtId);
      newThoughtReacts[thoughtId] = Math.max(0, (newThoughtReacts[thoughtId] || 0) - 1);
      const updatedUserReactedThoughts = userReactedThoughts.filter(t => (t as any).originalThoughtId !== thoughtId);
      setUserReactedThoughts(updatedUserReactedThoughts);
      
      // Save to localStorage
      localStorage.setItem('userReactedThoughts', JSON.stringify(updatedUserReactedThoughts));
      
      // Dispatch event to notify profile page
      window.dispatchEvent(new CustomEvent('thoughtUnreacted', { 
        detail: { thoughtId, userReactedThoughts: updatedUserReactedThoughts } 
      }));
      
      showSuccess('Reaction removed - thought no longer yours');
    } else {
      // Add reaction - increment count by 1
      newReactedThoughts.add(thoughtId);
      newThoughtReacts[thoughtId] = (newThoughtReacts[thoughtId] || 0) + 1;

      if (thought) {
        const userReactedThought: Thought & { originalThoughtId: string; originalAuthor: string } = {
          ...thought,
          id: `user-reacted-${thoughtId}`,
          originalThoughtId: thoughtId,
          originalAuthor: thought.user?.username || 'Unknown',
          user: {
            id: 'current-user',
            username: 'You',
            avatar_url: 'https://picsum.photos/seed/user/100/100'
          },
          content: `🔄 Reacted to: ${thought.content}`,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          likes_count: thought.likes_count,
          comments_count: thought.comments_count,
          shares_count: thought.shares_count,
          retweets_count: thought.retweets_count,
          upvotes_count: thought.upvotes_count,
          downvotes_count: thought.downvotes_count,
          reacts_count: thought.reacts_count,
          user_vote: thought.user_vote,
          user_has_liked: thought.user_has_liked
        };
        const updatedUserReactedThoughts = [userReactedThought, ...userReactedThoughts];
        setUserReactedThoughts(updatedUserReactedThoughts);
        
        // Save to localStorage
        localStorage.setItem('userReactedThoughts', JSON.stringify(updatedUserReactedThoughts));
        
        // Dispatch event to notify profile page
        window.dispatchEvent(new CustomEvent('thoughtReacted', { 
          detail: { thoughtId, userReactedThought: userReactedThought, userReactedThoughts: updatedUserReactedThoughts } 
        }));
      }
      showSuccess('🔄 Thought reacted! This thought is now yours too!');
    }

    setReactedThoughts(newReactedThoughts);
    setThoughtReacts(newThoughtReacts);
  };

  const handleHide = (thoughtId: string) => {
    setThoughts(thoughts.filter(t => t.id !== thoughtId));
  };

  const handleFullscreen = (content: FullscreenContent, videoRef?: React.RefObject<HTMLVideoElement>) => {
    // Save original video state if it's a video
    if (content.type === 'video' && videoRef?.current) {
      const video = videoRef.current;
      setOriginalVideoRef(videoRef);
      setOriginalVideoState({
        currentTime: video.currentTime,
        isPlaying: !video.paused
      });
      // Pause the original video to prevent double audio
      video.pause();
    }
    
    setFullscreenContent(content);
    setFullscreenType((content.type === 'story' ? 'image' : content.type) || 'image');
  };

  const handleCloseFullscreen = () => {
    // Restore original video state if it exists
    if (originalVideoRef?.current && originalVideoState && fullscreenType === 'video') {
      const video = originalVideoRef.current;
      video.currentTime = originalVideoState.currentTime;
      if (originalVideoState.isPlaying) {
        video.play().catch(() => {});
      }
    }
    
    // Clear the saved state
    setOriginalVideoRef(null);
    setOriginalVideoState(null);
    setFullscreenContent(null);
  };
  useEffect(() => {
    const saved = localStorage.getItem('savedThoughts');
    if (saved) {
      try {
        setSavedThoughts(new Set(JSON.parse(saved)));
      } catch {
        // Handle load saved thoughts error
      }
    }

    // Load user reacted thoughts from localStorage
    const savedReactedThoughts = localStorage.getItem('userReactedThoughts');
    if (savedReactedThoughts) {
      try {
        const reactedThoughts = JSON.parse(savedReactedThoughts);
        setUserReactedThoughts(reactedThoughts);
        
        // Also set reacted thoughts IDs for UI state
        const reactedIds = new Set<string>(reactedThoughts.map((t: any) => t.originalThoughtId).filter(Boolean));
        setReactedThoughts(reactedIds);
      } catch {
        // Handle load reacted thoughts error
      }
    }
  }, []);

  // Initialize thought reacts when component mounts or thoughts change
  useEffect(() => {
    // Initialize thought reacts from current thoughts data
    const initialReacts: { [key: string]: number } = {};
    thoughts.forEach(thought => {
      if (thought.reacts_count) {
        initialReacts[thought.id] = thought.reacts_count;
      }
    });

    // Only add user reactions on initial load or when thoughts change
    if (!isInitialized.current || thoughts.length > 0) {
      const userReactsCount: { [key: string]: number } = { ...initialReacts };
      userReactedThoughts.forEach((t: any) => {
        if (t.originalThoughtId) {
          userReactsCount[t.originalThoughtId] = (userReactsCount[t.originalThoughtId] || 0) + 1;
        }
      });
      setThoughtReacts(userReactsCount);
      isInitialized.current = true;
    }
  }, [thoughts]);

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'just now';
    if (diffInHours < 24) return `${diffInHours}h`;
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d`;
    return date.toLocaleDateString();
  };

  const handleTrendingTopicClick = (topicName: string) => {
    // Remove the # symbol and convert to lowercase for URL
    const topic = topicName.replace('#', '').toLowerCase();
    
    // Navigate to search page with the topic as query parameter
    navigate(`/search?q=${encodeURIComponent(topic)}`);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 bg-background/95 backdrop-blur-xl border-b border-border/50 z-40 mobile-top-safe">
        <div className="max-w-2xl mx-auto p-4">
          <h1 className="text-2xl font-bold">Thoughts</h1>
        </div>
      </div>

      <div className="max-w-2xl mx-auto p-4 space-y-6 pb-safe">
        {/* Trending Topics */}
        <Card className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20 border-blue-200 dark:border-blue-800">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Flame className="h-5 w-5 text-orange-500" />
              <h3 className="font-semibold">Trending Now</h3>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            {trendingTopics.map((topic, index) => (
              <div 
                key={topic.name} 
                className="flex items-center justify-between p-2 rounded-lg hover:bg-white/50 dark:hover:bg-black/20 transition-colors cursor-pointer"
                onClick={() => handleTrendingTopicClick(topic.name)}
              >
                <div className="flex items-center gap-3">
                  <span className="text-lg font-bold text-muted-foreground">#{index + 1}</span>
                  <div>
                    <p className="font-medium text-sm">{topic.name}</p>
                    <p className="text-xs text-muted-foreground">{topic.posts} posts</p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  {topic.trend === 'up' && <TrendingUp className="h-4 w-4 text-green-500" />}
                  {topic.trend === 'down' && <TrendingUp className="h-4 w-4 text-red-500 rotate-180" />}
                  {topic.trend === 'stable' && <span className="text-xs text-muted-foreground">—</span>}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Thoughts Feed */}
        {initialLoading ? (
          <div className="space-y-4">
            {/* Enhanced skeleton for thoughts */}
            {[1, 2, 3, 4, 5].map((i) => (
              <Card key={i} className="overflow-hidden">
                <CardContent className="p-0">
                  {/* Header skeleton */}
                  <div className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <Skeleton className="w-12 h-12 rounded-full" />
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <Skeleton className="h-4 w-24 mb-1" />
                            <Skeleton className="h-3 w-3 mb-1" />
                            <Skeleton className="h-3 w-16 mb-1" />
                            <Skeleton className="h-4 w-4 mb-1" />
                          </div>
                        </div>
                      </div>
                      <Skeleton className="h-8 w-8 rounded" />
                    </div>

                    {/* Content skeleton */}
                    <div className="mt-3">
                      <div className="space-y-2 mb-3">
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-5/6" />
                        <Skeleton className="h-4 w-4/5" />
                        <Skeleton className="h-4 w-3/4" />
                      </div>
                      
                      {/* Tags skeleton */}
                      <div className="flex flex-wrap gap-2 mb-3">
                        <Skeleton className="h-6 w-16 rounded-full" />
                        <Skeleton className="h-6 w-20 rounded-full" />
                        <Skeleton className="h-6 w-14 rounded-full" />
                      </div>

                      {/* Media skeleton */}
                      <Skeleton className="w-full h-64 rounded-lg mb-3" />
                    </div>
                  </div>

                  {/* Interaction buttons skeleton */}
                  <div className="flex items-center justify-between p-4 border-t">
                    <div className="flex items-center gap-2">
                      <Skeleton className="h-8 w-16 rounded" />
                      <Skeleton className="h-8 w-12 rounded" />
                      <Skeleton className="h-8 w-12 rounded" />
                      <Skeleton className="h-8 w-14 rounded" />
                    </div>
                    <div className="flex items-center gap-1">
                      <Skeleton className="h-8 w-8 rounded" />
                      <Skeleton className="h-8 w-8 rounded" />
                      <Skeleton className="h-8 w-8 rounded" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
            thoughts.map((thought) => (
            <Card key={thought.id} className="overflow-hidden hover:shadow-lg transition-shadow">
              <CardContent className="p-0">
                {/* Header */}
                <div className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar 
                        className="h-12 w-12 cursor-pointer hover:ring-2 hover:ring-primary/50 transition-all duration-200"
                        onClick={() => {
                          // Navigate to user profile when avatar is clicked
                          navigateToProfile(navigate, thought.user?.id, thought.user?.username);
                        }}
                        title={`${thought.user?.username}'s Profile`}
                      >
                        <AvatarImage src={thought.user?.avatar_url} />
                        <AvatarFallback>{typeof thought.user?.username === 'string' ? thought.user.username.substring(0, 2).toUpperCase() : 'U'}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold">{thought.user?.username || 'Anonymous'}</h3>
                          <span className="text-muted-foreground text-sm">·</span>
                          <span className="text-muted-foreground text-sm">{formatTimeAgo(thought.created_at)}</span>
                        </div>
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleCopyLink(thought.id)}>
                          <Copy className="h-4 w-4 mr-2" />
                          Copy Link
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleShare(thought.id)} disabled={sharing === thought.id}>
                          <Share2 className="h-4 w-4 mr-2" />
                          Share
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => handleReport(thought.id)}>
                          <Flag className="h-4 w-4 mr-2" />
                          Report
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleHide(thought.id)} className="text-red-600">
                          <EyeOff className="h-4 w-4 mr-2" />
                          Hide
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  {/* Content */}
                  <div className="mt-3">
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">{thought.content}</p>
                    
                    {/* Tags */}
                    {thought.tags.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-3">
                        {thought.tags.map((tag) => (
                          <Badge key={tag} variant="secondary" className="text-xs">
                            #{tag}
                          </Badge>
                        ))}
                      </div>
                    )}

                    {/* Image - Legacy support */}
                    {thought.image_url && !thought.media && (
                      <div className="mt-3 rounded-lg overflow-hidden">
                        <img src={thought.image_url} alt="Thought content" className="w-full object-cover max-h-64" />
                      </div>
                    )}

                    {/* Media - New support for photos, GIFs, and videos */}
                    {thought.media && thought.media.length > 0 && (
                      <div className="space-y-3">
                        {thought.media.map((mediaItem, index) => {
                          // Create a unique key for each media item
                          const mediaKey = `${thought.id}-${index}`;
                          
                          // Create video ref if it doesn't exist
                          if (!videoRefs.current[mediaKey]) {
                            videoRefs.current[mediaKey] = React.createRef<HTMLVideoElement>();
                          }
                          
                          return (
                            <MediaRenderer 
                              key={index} 
                              media={mediaItem} 
                              videoRef={videoRefs.current[mediaKey]}
                              onFullscreen={(content) => handleFullscreen(content, videoRefs.current[mediaKey])}
                            />
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Voting and Actions */}
                  <div className="mt-4 pt-3 border-t">
                    {/* Primary action buttons */}
                    <div className="flex items-center gap-2 mb-3 flex-wrap">
                      <VotingButtons
                        thoughtId={thought.id}
                        upvotesCount={thought.upvotes_count || 0}
                        downvotesCount={thought.downvotes_count || 0}
                        likesCount={thought.likes_count}
                        userVote={thought.user_vote}
                        userHasLiked={thought.user_has_liked || false}
                        onVote={handleVote}
                        onLike={handleLike}
                        disabled={voting === thought.id || liking === thought.id}
                        size="sm"
                      />
                      
                      <Dialog open={commentDialogOpen === thought.id} onOpenChange={(open) => !open && setCommentDialogOpen(null)}>
                        <DialogTrigger asChild>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="flex items-center gap-1 text-muted-foreground flex-shrink-0"
                            onClick={() => setCommentDialogOpen(thought.id)}
                          >
                            <MessageCircle className="h-4 w-4" />
                            <span className="text-xs">{thought.comments_count > 1000 ? `${(thought.comments_count / 1000).toFixed(1)}K` : thought.comments_count}</span>
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Add Comment</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4">
                            <Textarea
                              placeholder="Share your thoughts..."
                              value={newComment}
                              onChange={(e) => setNewComment(e.target.value)}
                              className="min-h-[100px]"
                            />
                            <div className="flex justify-end gap-2">
                              <Button variant="outline" onClick={() => setCommentDialogOpen(null)}>
                                Cancel
                              </Button>
                              <Button onClick={() => handleComment(thought.id)} disabled={!newComment.trim()}>
                                Post Comment
                              </Button>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>

                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className={`flex items-center gap-1 flex-shrink-0 ${reactedThoughts.has(thought.id) ? 'text-green-500 hover:text-green-600' : 'text-muted-foreground hover:text-foreground'}`}
                        onClick={() => handleReact(thought.id)}
                        title={reactedThoughts.has(thought.id) ? "Remove reaction - this thought will no longer be yours" : "React to make this thought yours"}
                      >
                        {reactedThoughts.has(thought.id) ? (
                          <>
                            <Repeat2 className="h-4 w-4 fill-current" />
                            <span className="text-xs font-medium">Reacted</span>
                          </>
                        ) : (
                          <>
                            <Repeat className="h-4 w-4" />
                            <span className="text-xs">React</span>
                          </>
                        )}
                        <span className="text-xs ml-1">({thoughtReacts[thought.id] || thought.reacts_count || 0})</span>
                      </Button>
                    </div>

                    {/* Secondary action buttons */}
                    <div className="flex items-center gap-1 justify-end">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className={`${savedThoughts.has(thought.id) ? 'text-blue-500' : 'text-muted-foreground'} flex-shrink-0`}
                        onClick={() => handleSave(thought.id)}
                      >
                        <Bookmark className={`h-4 w-4 ${savedThoughts.has(thought.id) ? 'fill-current' : ''}`} />
                      </Button>
                      
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="text-muted-foreground flex-shrink-0"
                        onClick={() => handleShare(thought.id)}
                        disabled={sharing === thought.id}
                      >
                        <Share2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Report Modal */}
      <ReportModal
        isOpen={reportModalOpen !== null}
        onClose={() => setReportModalOpen(null)}
        contentId={reportModalOpen || ''}
        contentType="thought"
      />

      {/* Fullscreen Viewer */}
      {fullscreenContent && (
        <FullscreenViewer
          content={fullscreenContent}
          type={fullscreenType}
          onClose={handleCloseFullscreen}
        />
      )}
    </div>
  );
});

ThoughtsPage.displayName = 'ThoughtsPage';

export default ThoughtsPage;
