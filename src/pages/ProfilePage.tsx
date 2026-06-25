import React, { useState, useEffect, useRef } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Settings, Edit, ThumbsUp, MessageCircle, Share2, Video, MessageSquare, MoreVertical, Maximize, Repeat, Bookmark, Clock, History, X, Eye, Play, Camera, Volume2, VolumeX, Trash } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { sharePost } from '@/utils/share';
import { showSuccess, showError } from '@/utils/toast';
import { FullscreenContent, Post } from '@/types';

interface UserProfile {
  id: string;
  name: string;
  username: string;
  avatar: string;
  bio?: string;
  posts: Post[];
  followers: number;
  following: number;
  [key: string]: unknown;
}

import EditProfileModal from '@/components/EditProfileModal';
import EditPostModal from '@/components/EditPostModal';
import CommentSection from '@/components/CommentSection';
import FullscreenViewer from '@/components/FullscreenViewer';
import VotingButtons from '@/components/VotingButtons';
import StandardPostMenu from '@/components/StandardPostMenu';
import WatchHistorySection from '@/components/WatchHistorySection';
// import UniversalMediaViewer from '@/components/UniversalMediaViewer';
import Moments from '@/components/Moments';
import { voteOnThought, likeThought } from '@/lib/thoughts';
import { getStoredUser } from '@/lib/auth';

const createDefaultProfile = (user?: { email?: string; fullName?: string; username?: string; id?: string }) => {
  const displayName = user?.fullName || (user?.email ? user.email.split('@')[0] : 'John Doe');
  const handle = user?.username || (user?.email ? `@${user.email.split('@')[0]}` : '@johndoe');
  const avatarSeed = user?.email?.split('@')[0] || 'john';
  return {
    _userEmail: user?.email || '',
    id: user?.id || 'default-user',
    name: displayName,
    username: handle,
    avatar: `https://picsum.photos/seed/${avatarSeed}/200/200`,
    bio: 'Welcome to Equyvo!',
    followers: 0,
    following: 0,
    posts: [] as Post[],
  };
};

const ProfilePage = () => {
  const { userId, username } = useParams();
  const location = useLocation();

  // Bot profiles data
  const botProfiles = {
    'p1': {
      id: 'p1',
      name: 'Nature Channel',
      username: '@naturechannel',
      avatar: 'https://picsum.photos/seed/nature/200/200',
      bio: 'Bringing you the best nature documentaries and wildlife content from around the world! 🌿🦁🐾',
      followers: '45.2K',
      following: '120',
      posts: [
        { id: 'moment1', type: 'moment' as const, user: 'Nature Channel', content: 'Beautiful nature documentary 🌿 #nature #wildlife', media: 'https://picsum.photos/seed/nature1/400/700', thumbnail: 'https://picsum.photos/seed/nature1/400/700', mediaType: 'video' as const, videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4', likes: 8921, reacts: 0, comments: 456, shares: 0, views: 23456, time: '2h ago' },
        { id: 'p6', type: 'post' as const, user: 'Nature Channel', content: 'Sunrise at the mountains 🏔️', media: 'https://picsum.photos/seed/sunrise3/400/300', mediaType: 'image' as const, likes: 567, reacts: 23, comments: 89, shares: 34, views: 2340, time: '1 day ago' },
      ] as Post[],
    },
    'bot-channel': {
      id: 'bot-channel',
      name: 'Bot Channel',
      username: '@botchannel',
      avatar: 'https://picsum.photos/seed/bot/200/200',
      bio: '🤖 AI Generated Content Stream - Your source for automated entertainment and AI-powered creativity!',
      followers: '28.7K',
      following: '5',
      posts: [
        { id: 'moment4', type: 'moment' as const, user: 'Bot Channel', content: '🤖 AI Generated Content Stream #bot #ai', media: 'https://picsum.photos/seed/bot1/400/700', thumbnail: 'https://picsum.photos/seed/bot1/400/700', mediaType: 'video' as const, videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4', likes: 7234, reacts: 0, comments: 445, shares: 0, views: 28901, time: 'LIVE NOW', isLive: true },
        { id: 'p7', type: 'thought' as const, user: 'Bot Channel', content: 'AI is transforming how we create and consume content! 🚀', media: null, mediaType: 'text' as const, likes: 1234, reacts: 89, comments: 234, shares: 56, views: 5678, time: '3h ago' },
      ] as Post[],
    },
    'tech-reviews': {
      id: 'tech-reviews',
      name: 'Tech Reviews',
      username: '@techreviews',
      avatar: 'https://picsum.photos/seed/tech/200/200',
      bio: 'Latest tech reviews, gadget unboxings, and digital lifestyle content! 📱💻⌚',
      followers: '67.3K',
      following: '250',
      posts: [
        { id: 'moment2', type: 'moment' as const, user: 'Tech Reviews', content: 'Latest tech review! 📱 #tech #gadgets', media: 'https://picsum.photos/seed/tech1/400/700', thumbnail: 'https://picsum.photos/seed/tech1/400/700', mediaType: 'video' as const, videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4', likes: 5643, reacts: 0, comments: 289, shares: 0, views: 12890, time: '4h ago' },
        { id: 'p8', type: 'post' as const, user: 'Tech Reviews', content: 'New smartphone review is live! Check it out', media: 'https://picsum.photos/seed/phone/400/300', mediaType: 'image' as const, likes: 890, reacts: 45, comments: 123, shares: 67, views: 4567, time: '6h ago' },
      ] as Post[],
    },
    'gaming-stream': {
      id: 'gaming-stream',
      name: 'Live Gaming Stream',
      username: '@gaminglive',
      avatar: 'https://picsum.photos/seed/gaming/200/200',
      bio: '🔴 LIVE Gaming Sessions! Join me for epic gameplay, tournaments, and gaming community fun! 🎮🏆',
      followers: '123K',
      following: '89',
      posts: [
        { id: 'moment3', type: 'moment' as const, user: 'Live Gaming Stream', content: '🔴 LIVE Gaming Session! Join me now! #gaming #live', media: 'https://picsum.photos/seed/gaming1/400/700', thumbnail: 'https://picsum.photos/seed/gaming1/400/700', mediaType: 'video' as const, videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4', likes: 15432, reacts: 0, comments: 892, shares: 0, views: 45678, time: 'LIVE NOW', isLive: true },
        { id: 'p9', type: 'thought' as const, user: 'Live Gaming Stream', content: 'That was an epic match! GG everyone! 🎮', media: null, mediaType: 'text' as const, likes: 2345, reacts: 123, comments: 456, shares: 78, views: 8901, time: '1h ago' },
      ] as Post[],
    }
  };

  const [likedPosts, setLikedPosts] = useState<Set<string>>(new Set());
  const [postLikes, setPostLikes] = useState<{ [key: string]: number }>({});
  const [reactedPosts, setReactedPosts] = useState<Set<string>>(new Set());
  const [postReacts, setPostReacts] = useState<{ [key: string]: number }>({});
  const [voting, setVoting] = useState<string | null>(null);
  const [liking, setLiking] = useState<string | null>(null);
  const [userReactedPosts, setUserReactedPosts] = useState<Post[]>([]);
  const [showEditProfileModal, setShowEditProfileModal] = useState(false);
  const [showEditPostModal, setShowEditPostModal] = useState(false);
  const [currentEditingPost, setCurrentEditingPost] = useState<Post | null>(null);
  const [showCommentSection, setShowCommentSection] = useState(false);
  const [currentPostId, setCurrentPostId] = useState<string>('');
  const [currentPostUser, setCurrentPostUser] = useState<string>('');
  const [fullscreenContent, setFullscreenContent] = useState<FullscreenContent | null>(null);
  const [universalMediaContent, setUniversalMediaContent] = useState<FullscreenContent | null>(null);
  const [savedPosts, setSavedPosts] = useState<Set<string>>(new Set());
  const [savedStories, setSavedStories] = useState<Set<string>>(new Set());
  const [watchHistory, setWatchHistory] = useState<Post[]>([]);
  const [allSavedContent, setAllSavedContent] = useState<Post[]>([]);

  // Video state management
  const [playingVideos, setPlayingVideos] = useState<Set<string>>(new Set());
  const [isMuted, setIsMuted] = useState(true);
  const [videoErrors, setVideoErrors] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState<{ [key: string]: boolean }>({});
  const [videoProgress, setVideoProgress] = useState<{ [key: string]: number }>({});
  const [videoDuration, setVideoDuration] = useState<{ [key: string]: number }>({});
  const [currentTime, setCurrentTime] = useState<{ [key: string]: number }>({});
  const [isSeeking, setIsSeeking] = useState(false);
  const videoRefs = useRef<{ [key: string]: HTMLVideoElement }>({});

  // Load profile from localStorage on mount
  const [userProfile, setUserProfile] = useState(() => {
    if (!import.meta.env.DEV) {
      return { name: '', username: '', avatar: '', bio: '', followers: '0', following: '0', posts: [] as Post[] };
    }
    // Determine which profile to show based on URL parameters
    if (userId || username) {
      const profileKey = userId || username?.replace('@', '');
      const botProfile = botProfiles[profileKey as keyof typeof botProfiles];
      if (botProfile) {
        return botProfile;
      }
    }
    
    // Default user profile
    return {
      name: 'John Doe',
      username: '@johndoe',
      avatar: 'https://picsum.photos/seed/john/200/200',
      bio: 'Passionate creator, sharing my journey and thoughts. Love coding, photography, and exploring new ideas! ',
      followers: '1.5K',
      following: '300',
      posts: [
        { id: 'p1', type: 'thought' as const, user: 'John Doe', content: 'Just launched my new project! Check it out! 💻✨', media: 'https://picsum.photos/seed/project/400/300', mediaType: 'image' as const, likes: 120, reacts: 8, comments: 15, shares: 5, views: 245, time: '2h ago' },
        { id: 'p2', type: 'post' as const, user: 'John Doe', content: 'Working on something amazing! Can\'t wait to share it with you all soon. 🚀', media: 'https://picsum.photos/seed/work/400/300', mediaType: 'image' as const, likes: 89, reacts: 12, comments: 23, shares: 8, views: 567, time: '5h ago' },
        { id: 'p3', type: 'thought' as const, user: 'John Doe', content: 'The future of technology is incredibly exciting! What are you most looking forward to? 🤖✨', media: null, mediaType: 'text' as const, likes: 234, reacts: 45, comments: 67, shares: 23, views: 1234, time: '1 day ago' },
        { id: 'p4', type: 'post' as const, user: 'John Doe', content: 'Beautiful sunset from my morning walk! Nature never disappoints. 🌅', media: 'https://picsum.photos/seed/sunset2/400/300', mediaType: 'image' as const, likes: 156, reacts: 23, comments: 34, shares: 12, views: 890, time: '2 days ago' },
        { id: 'p5', type: 'thought' as const, user: 'John Doe', content: 'Beautiful morning coffee! ☕', media: 'https://picsum.photos/seed/coffee/400/300', mediaType: 'image' as const, likes: 45, reacts: 3, comments: 6, shares: 2, views: 89, time: '6h ago' },
      ] as Post[],
    };
  });

  // Load saved profile from localStorage on client side
  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedProfile = localStorage.getItem('userProfile');
      const currentUser = getStoredUser();

      if (savedProfile && currentUser) {
        const parsed = JSON.parse(savedProfile);
        // Only load cached profile if it belongs to the current user
        if (parsed._userEmail === currentUser.email || parsed.id === currentUser.id) {
          setUserProfile(parsed);
        } else {
          // Stale profile from a different user — discard and create fresh default
          const fresh = createDefaultProfile(currentUser);
          setUserProfile(fresh);
          localStorage.setItem('userProfile', JSON.stringify(fresh));
        }
      } else if (savedProfile && !currentUser) {
        // No signed-in user — discard orphaned profile
        localStorage.removeItem('userProfile');
      } else if (!savedProfile && currentUser) {
        // Signed-in user with no saved profile yet — create one
        const fresh = createDefaultProfile(currentUser);
        setUserProfile(fresh);
        localStorage.setItem('userProfile', JSON.stringify(fresh));
      }

      // Load saved posts, saved stories, and watch history
      const saved = localStorage.getItem('savedPosts');
      if (saved) {
        setSavedPosts(new Set(JSON.parse(saved)));
      }

      const savedStoriesData = localStorage.getItem('savedStories');
      if (savedStoriesData) {
        setSavedStories(new Set(JSON.parse(savedStoriesData)));
      }

      const history = localStorage.getItem('watchHistory');
      if (history) {
        setWatchHistory(JSON.parse(history));
      }

      // Load user reacted thoughts from localStorage
      const savedReactedThoughts = localStorage.getItem('userReactedThoughts');
      if (savedReactedThoughts) {
        try {
          const reactedThoughts = JSON.parse(savedReactedThoughts);
          setUserReactedPosts(reactedThoughts as Post[]);
        } catch (error) {
        }
      }
    }
  }, []);

  // Save profile to localStorage whenever it changes
  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('userProfile', JSON.stringify(userProfile));
    }
  }, [userProfile]);

  // Save saved posts to localStorage whenever they change
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('savedPosts', JSON.stringify(Array.from(savedPosts)));
    }
  }, [savedPosts]);

  // Save saved stories to localStorage whenever they change
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('savedStories', JSON.stringify(Array.from(savedStories)));
    }
  }, [savedStories]);

  // Save watch history to localStorage whenever it changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('watchHistory', JSON.stringify(watchHistory));
    }
  }, [watchHistory]);

  // Listen for save/unsave events from other components
  useEffect(() => {
    const handleContentSaved = (event: CustomEvent) => {
      const { postId, content } = event.detail;
      
      // Update saved posts set
      setSavedPosts(prev => new Set(prev).add(postId));
      
      // Trigger re-gathering of saved content
      setTimeout(() => {
        const savedContentData = localStorage.getItem('savedContentData');
        const savedContent = savedContentData ? JSON.parse(savedContentData) : {};
        const allContent = Object.values(savedContent);
        
        // Also include user's own posts that are saved (for backward compatibility)
        const userSavedPosts = userProfile.posts.filter(post => savedPosts.has(post.id) && !savedContent[post.id]);
        allContent.push(...userSavedPosts);

        // Also include watch history items that are saved (for backward compatibility)
        const savedHistoryItems = watchHistory.filter(item => savedPosts.has(item.id) && !savedContent[item.id]);
        allContent.push(...savedHistoryItems);

        // Sort by savedAt date if available, otherwise by time
        allContent.sort((a: Post, b: Post) => {
          const dateA = a.savedAt ? new Date(a.savedAt).getTime() : 0;
          const dateB = b.savedAt ? new Date(b.savedAt).getTime() : 0;
          return dateB - dateA; // Most recent first
        });

        setAllSavedContent(allContent as Post[]);
      }, 100);
    };

    const handleContentUnsaved = (event: CustomEvent) => {
      const { postId, content } = event.detail;
      
      // Update saved posts set
      setSavedPosts(prev => {
        const newSet = new Set(prev);
        newSet.delete(postId);
        return newSet;
      });
      
      // Remove from all saved content immediately
      setAllSavedContent(prev => {
        const filtered = prev.filter(item => item.id !== postId);
        return filtered;
      });
      
      // Also remove from savedContentData localStorage
      const savedContentData = localStorage.getItem('savedContentData');
      if (savedContentData) {
        const savedContent = JSON.parse(savedContentData);
        delete savedContent[postId];
        localStorage.setItem('savedContentData', JSON.stringify(savedContent));
      }
    };

    // Listen for thought reacted events from ThoughtsPage
    const handleThoughtReacted = (event: CustomEvent) => {
      const { userReactedThought, userReactedThoughts } = event.detail;
      
      // Add the reacted thought to user's reacted posts
      setUserReactedPosts(prev => [userReactedThought as Post, ...prev] as Post[]);
    };

    // Listen for thought unreacted events from ThoughtsPage
    const handleThoughtUnreacted = (event: CustomEvent) => {
      const { thoughtId, userReactedThoughts } = event.detail;
      
      // Remove the reacted thought from user's reacted posts
      setUserReactedPosts(prev => prev.filter(p => (p as any).originalThoughtId !== thoughtId));
    };

    window.addEventListener('contentSaved', handleContentSaved as EventListener);
    window.addEventListener('contentUnsaved', handleContentUnsaved as EventListener);
    window.addEventListener('thoughtReacted', handleThoughtReacted as EventListener);
    window.addEventListener('thoughtUnreacted', handleThoughtUnreacted as EventListener);
    
    return () => {
      window.removeEventListener('contentSaved', handleContentSaved as EventListener);
      window.removeEventListener('contentUnsaved', handleContentUnsaved as EventListener);
      window.removeEventListener('thoughtReacted', handleThoughtReacted as EventListener);
      window.removeEventListener('thoughtUnreacted', handleThoughtUnreacted as EventListener);
    };
  }, [savedPosts, userProfile.posts, watchHistory]); // Add missing dependencies

  // Handle split view video selection
  useEffect(() => {
    const handleSplitViewVideoSelected = (event: CustomEvent) => {
      const { content } = event.detail;
      
      // Set the new content immediately
      setFullscreenContent(content);
      
      // Clear temp content to avoid duplicate processing
      (window as unknown as { tempFullscreenContent?: FullscreenContent }).tempFullscreenContent = null;
    };

    window.addEventListener('splitViewVideoSelected', handleSplitViewVideoSelected as EventListener);
    
    return () => {
      window.removeEventListener('splitViewVideoSelected', handleSplitViewVideoSelected as EventListener);
    };
  }, []);

  // Gather all saved content from different sources
  useEffect(() => {
    const gatherAllSavedContent = () => {
      // Get saved content data from localStorage
      const savedContentData = localStorage.getItem('savedContentData');
      const savedContent = savedContentData ? JSON.parse(savedContentData) : {};
      
      // Convert saved content object to array
      const allContent = Object.values(savedContent);
      
      // Also include user's own posts that are saved (for backward compatibility)
      // But only if they're not already in savedContentData
      const userSavedPosts = userProfile.posts.filter(post => 
        savedPosts.has(post.id) && !savedContent[post.id]
      );
      allContent.push(...userSavedPosts);

      // Also include watch history items that are saved (for backward compatibility)
      // But only if they're not already in savedContentData
      const savedHistoryItems = watchHistory.filter(item => 
        savedPosts.has(item.id) && !savedContent[item.id]
      );
      allContent.push(...savedHistoryItems);

      // Sort by savedAt date if available, otherwise by time
      allContent.sort((a: Post, b: Post) => {
        const dateA = a.savedAt ? new Date(a.savedAt).getTime() : 0;
        const dateB = b.savedAt ? new Date(b.savedAt).getTime() : 0;
        return dateB - dateA; // Most recent first
      });

      setAllSavedContent(allContent as Post[]);
    };

    gatherAllSavedContent();
  }, [savedPosts, userProfile.posts, watchHistory]);

  // Initialize post likes and retweets
  React.useEffect(() => {
    const likesMap: { [key: string]: number } = {};
    const reactsMap: { [key: string]: number } = {};
    userProfile.posts.forEach(post => {
      likesMap[post.id] = post.likes;
      reactsMap[post.id] = post.reacts || 0;
    });
    setPostLikes(likesMap);
    setPostReacts(reactsMap);
  }, []);

  const handleLike = (postId: string) => {
    const newLikedPosts = new Set(likedPosts);
    const newPostLikes = { ...postLikes };

    if (likedPosts.has(postId)) {
      newLikedPosts.delete(postId);
      newPostLikes[postId] -= 1;
    } else {
      newLikedPosts.add(postId);
      newPostLikes[postId] += 1;
    }

    setLikedPosts(newLikedPosts);
    setPostLikes(newPostLikes);
  };

  const handleVote = async (thoughtId: string, voteType: 'upvote' | 'downvote') => {
    try {
      setVoting(thoughtId);
      
      const postIndex = userProfile.posts.findIndex(p => p.id === thoughtId);
      if (postIndex === -1) return;
      
      const post = userProfile.posts[postIndex];
      const currentUpvotes = (post as any).upvotes_count || Math.floor(post.likes * 0.7);
      const currentDownvotes = (post as any).downvotes_count || Math.floor(post.likes * 0.1);
      
      let newUpvotes = currentUpvotes;
      let newDownvotes = currentDownvotes;
      let newUserVote: 'upvote' | 'downvote' | null = voteType;
      
      if ((post as any).user_vote === voteType) {
        // Remove vote
        newUserVote = null;
        if (voteType === 'upvote') {
          newUpvotes = Math.max(0, newUpvotes - 1);
        } else {
          newDownvotes = Math.max(0, newDownvotes - 1);
        }
      } else if ((post as any).user_vote) {
        // Change vote
        if ((post as any).user_vote === 'upvote' && voteType === 'downvote') {
          newUpvotes = Math.max(0, newUpvotes - 1);
          newDownvotes = newDownvotes + 1;
        } else if ((post as any).user_vote === 'downvote' && voteType === 'upvote') {
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
      
      const updatedPosts = [...userProfile.posts];
      updatedPosts[postIndex] = {
        ...post,
        upvotes_count: newUpvotes,
        downvotes_count: newDownvotes,
        user_vote: newUserVote
      };
      
      setUserProfile(prev => ({
        ...prev,
        posts: updatedPosts
      }));
      
      // Sync with database
      const { error } = await voteOnThought({ thought_id: thoughtId, vote_type: voteType });
      if (error) {
        // Revert local state on error
        setUserProfile(prev => ({
          ...prev,
          posts: userProfile.posts
        }));
      }
    } catch (error) {
      // Handle vote error - revert local state
      setUserProfile(prev => ({
        ...prev,
        posts: userProfile.posts
      }));
    } finally {
      setVoting(null);
    }
  };

  const handleReact = (postId: string) => {
    const newReactedPosts = new Set(reactedPosts);
    const newPostReacts = { ...postReacts };
    const post = userProfile.posts.find(p => p.id === postId);

    if (reactedPosts.has(postId)) {
      // Remove reaction and remove from user's reacted posts
      newReactedPosts.delete(postId);
      newPostReacts[postId] -= 1;
      setUserReactedPosts(prev => prev.filter(p => p.originalPostId !== postId));
      showSuccess('Reaction removed - post no longer yours');
    } else {
      // Add reaction and make it user's own post
      newReactedPosts.add(postId);
      newPostReacts[postId] += 1;

      if (post) {
        const userReactedPost: Post = {
          id: `user-reacted-${postId}`,
          originalPostId: postId,
          user: 'You',
          avatar: 'https://picsum.photos/seed/user/100/100',
          time: 'Just now',
          content: `🔄 Reacted to: ${post.content}`,
          likes: post.likes,
          reacts: (post.reacts || 0) + 1,
          comments: post.comments,
          shares: post.shares,
          originalAuthor: post.user,
          type: post.type as 'post' | 'thought' | 'reacted' | 'moment' | 'video',
          media: post.media,
          mediaType: post.mediaType as 'video' | 'image' | 'moment',
          videoUrl: post.videoUrl
        };
        setUserReactedPosts(prev => [userReactedPost as Post, ...prev] as Post[]);
      }
      showSuccess('🔄 Post reacted! This post is now yours too!');
    }

    setReactedPosts(newReactedPosts);
    setPostReacts(newPostReacts);
  };


  const handleShare = async (post: Post) => {
    const result = await sharePost({
      id: post.id,
      user: post.user,
      content: post.content || '',
      image: post.media || post.image
    });
    if (result.success) {
      if ('fallback' in result && result.fallback) {
        showSuccess(result.message || 'Link copied to clipboard!');
      } else {
        showSuccess('Shared successfully!');
      }
    } else {
      showError(result.error || 'Share failed');
    }
  };

  const handleSave = (postId: string) => {
    const newSavedPosts = new Set(savedPosts);
    const post = userProfile.posts.find(p => p.id === postId) || 
                 allSavedContent.find(item => item.id === postId);

    if (savedPosts.has(postId)) {
      newSavedPosts.delete(postId);
      showSuccess('Removed from saved');
      
      // Dispatch event to notify other components
      window.dispatchEvent(new CustomEvent('contentUnsaved', { 
        detail: { postId, content: post } 
      }));
    } else {
      newSavedPosts.add(postId);
      showSuccess('Saved to collection');
      
      // Store full content data when saving
      if (post) {
        const savedContentData = localStorage.getItem('savedContentData');
        const savedContent = savedContentData ? JSON.parse(savedContentData) : {};
        savedContent[postId] = {
          ...post,
          savedAt: new Date().toISOString()
        };
        localStorage.setItem('savedContentData', JSON.stringify(savedContent));
      }
      
      // Dispatch event to notify other components
      window.dispatchEvent(new CustomEvent('contentSaved', { 
        detail: { postId, content: post } 
      }));
    }

    setSavedPosts(newSavedPosts);
  };

  const handleSaveStory = (storyId: string) => {
    const newSavedStories = new Set(savedStories);

    if (savedStories.has(storyId)) {
      newSavedStories.delete(storyId);
      showSuccess('Story removed from saved');
    } else {
      newSavedStories.add(storyId);
      showSuccess('Story saved successfully!');
    }

    setSavedStories(newSavedStories);
  };

  const addToWatchHistory = (post: Post) => {
    const historyItem = {
      ...post,
      watchedAt: new Date().toISOString(),
      watchDuration: 0
    };
    
    const newHistory = [historyItem, ...watchHistory.filter(h => h.id !== post.id)].slice(0, 50); // Keep last 50 items
    setWatchHistory(newHistory);
    
    // Also dispatch event for global tracking
    window.dispatchEvent(new CustomEvent('contentWatched', { 
      detail: { content: historyItem } 
    }));
  };

  const handleComment = (postId: string, postUser: string) => {
    setCurrentPostId(postId);
    setCurrentPostUser(postUser);
    setShowCommentSection(true);
  };



  const handleEditProfile = () => {
    setShowEditProfileModal(true);
  };

  const handleSaveProfile = (updatedProfile: Partial<UserProfile>) => {
    const currentUser = getStoredUser();
    setUserProfile(prev => ({
      ...prev,
      ...updatedProfile,
      _userEmail: currentUser?.email || prev._userEmail,
    } as unknown as typeof prev));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('profileUpdated', { detail: { ...updatedProfile, _userEmail: currentUser?.email } }));
    }
  };

  const handleEditPost = (post: Post) => {
    setCurrentEditingPost(post);
    setShowEditPostModal(true);
  };

  const handleSavePost = (updatedPost: Partial<Post>) => {
    setUserProfile(prev => ({
      ...prev,
      posts: prev.posts.map(post =>
        post.id === updatedPost.id ? updatedPost as Post : post
      )
    } as typeof prev));
  };

  const handleDeletePost = (postId: string) => {
    setUserProfile(prev => ({
      ...prev,
      posts: prev.posts.filter(post => post.id !== postId)
    }));
    showSuccess('Post deleted successfully');
  };

  // Menu handlers for standardized menu
  const handleReport = (postId: string) => {
    showSuccess(`Report submitted for post ${postId}`);
  };

  const handleHide = (postId: string) => {
    setUserProfile(prev => ({
      ...prev,
      posts: prev.posts.filter(post => post.id !== postId)
    }));
    showSuccess('Post hidden from public viewing');
  };

  const handleCopyLink = (postId: string) => {
    const shareUrl = `${window.location.origin}/profile/posts/${postId}`;
    navigator.clipboard.writeText(shareUrl);
    showSuccess('🔗 Link copied to clipboard!');
  };

  const handleMenuShare = (postId: string) => {
    const post = userProfile.posts.find(p => p.id === postId);
    if (post) {
      const shareUrl = `${window.location.origin}/profile/posts/${postId}`;
      if (navigator.share) {
        navigator.share({
          title: `Post by ${post.user}`,
          text: post.content,
          url: shareUrl
        });
      } else {
        navigator.clipboard.writeText(shareUrl);
        showSuccess('🔗 Link copied to clipboard!');
      }
    }
  };


  const handleFullscreen = (post: Post) => {
    // Track content view in history
    addToWatchHistory(post);
    const isMoment = post.type === 'moment' || post.mediaType === 'moment';
    
    // Enhanced content structure for fullscreen viewer with complete metadata
    const mediaContent = {
      ...post,
      type: isMoment ? 'moment' : (post.type || post.mediaType || (post.videoUrl ? 'video' : 'image')),
      videoUrl: post.videoUrl || post.media,
      media: post.media || post.image,
      thumbnail: post.thumbnail || post.image || post.media,
      mediaType: post.mediaType || (post.videoUrl ? 'video' : 'image'),
      creator: post.user || 'Unknown',
      content: post.content || '',
      likes: post.likes || 0,
      comments: post.comments || 0,
      views: post.views || 0,
      time: post.time || '',
      published: post.time || '',
      duration: post.duration,
      description: post.content || '',
      creatorId: post.user || 'unknown',
      verified: Math.random() > 0.7,
      subscribers: Math.floor(Math.random() * 100000),
      fallbackImage: post.thumbnail || post.image || post.media,
      // Ensure proper aspect ratio and orientation for moments
      aspectRatio: isMoment ? '9/16' : post.image ? '16/9' : undefined,
      forcePortrait: isMoment,
      viewMode: isMoment ? 'fullscreen' : undefined
    };
    
    setFullscreenContent(mediaContent);
  };

  const closeFullscreen = () => {
    setFullscreenContent(null);
  };

  const closeUniversalMediaViewer = () => {
    setUniversalMediaContent(null);
  };

  // Video handling functions
  const handleVideoPlayPause = async (postId: string) => {
    const video = videoRefs.current[postId];
    if (!video || videoErrors.has(postId)) return;

    const newPlayingVideos = new Set(playingVideos);

    if (playingVideos.has(postId)) {
      video.pause();
      newPlayingVideos.delete(postId);
    } else {
      // Track video play in history
      const post = userProfile.posts.find(p => p.id === postId) || 
                   userReactedPosts.find(p => p.id === postId);
      if (post) {
        addToWatchHistory(post);
      }
      
      // Pause all other videos first
      Object.keys(videoRefs.current).forEach(id => {
        if (id !== postId && videoRefs.current[id]) {
          videoRefs.current[id].pause();
        }
      });

      newPlayingVideos.clear();
      newPlayingVideos.add(postId);
      setIsLoading(prev => ({ ...prev, [postId]: true }));

      video.muted = isMuted;
      video.currentTime = 0;

      try {
        await video.play();
        setIsLoading(prev => ({ ...prev, [postId]: false }));
      } catch (error) {
        video.muted = true;
        try {
          await video.play();
          setIsLoading(prev => ({ ...prev, [postId]: false }));
        } catch (e) {
          handleVideoError(postId, e);
        }
      }
    }

    setPlayingVideos(newPlayingVideos);
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
    // Update all video elements
    Object.values(videoRefs.current).forEach(video => {
      if (video) {
        video.muted = !isMuted;
      }
    });
  };

  const handleVideoError = (postId: string, error?: Event | React.SyntheticEvent) => {
    setVideoErrors(prev => new Set(prev).add(postId));
    setPlayingVideos(prev => {
      const newSet = new Set(prev);
      newSet.delete(postId);
      return newSet;
    });
    setIsLoading(prev => ({ ...prev, [postId]: false }));
  };

  const handleTimeUpdate = (postId: string, video: HTMLVideoElement) => {
    if (!isSeeking && video.duration) {
      const progress = (video.currentTime / video.duration) * 100;
      const newProgress = { ...videoProgress };
      const newCurrentTime = { ...currentTime };
      newProgress[postId] = progress || 0;
      newCurrentTime[postId] = video.currentTime || 0;
      setVideoProgress(newProgress);
      setCurrentTime(newCurrentTime);
    }
  };

  const handleLoadedMetadata = (postId: string, video: HTMLVideoElement) => {
    const newDuration = { ...videoDuration };
    newDuration[postId] = video.duration || 0;
    setVideoDuration(newDuration);
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-6">
      {/* Profile Header */}
      <Card className="p-4 md:p-6">
        <div className="flex flex-col items-center text-center">
          <Avatar className="h-20 w-20 md:h-24 md:w-24 mb-3 md:mb-4">
            <AvatarImage src={userProfile.avatar} />
            <AvatarFallback className="text-lg md:text-xl">{userProfile.name?.substring(0, 2) || 'JD'}</AvatarFallback>
          </Avatar>
          <h1 className="text-xl md:text-3xl font-bold">{userProfile.name}</h1>
          <p className="text-muted-foreground mb-2 text-sm md:text-base">{userProfile.username}</p>
          <p className="text-center max-w-md mb-3 md:mb-4 text-sm md:text-base px-2">{userProfile.bio}</p>
          <div className="flex gap-3 md:gap-4 mb-3 md:mb-4">
            <div className="flex flex-col items-center">
              <span className="font-bold text-sm md:text-base">{userProfile.followers}</span>
              <span className="text-xs md:text-sm text-muted-foreground">Followers</span>
            </div>
            <div className="flex flex-col items-center">
              <span className="font-bold text-sm md:text-base">{userProfile.following}</span>
              <span className="text-xs md:text-sm text-muted-foreground">Following</span>
            </div>
          </div>
          <div className="flex gap-2 flex-wrap justify-center">
            <Button variant="outline" size="sm" className="flex items-center gap-2 text-xs md:text-sm" onClick={handleEditProfile}>
              <Edit className="h-3 w-3 md:h-4 md:w-4" /> <span className="hidden xs:inline">Edit Profile</span><span className="xs:hidden">Edit</span>
            </Button>
            <Button variant="ghost" size="sm" className="h-8 w-8 md:h-10 md:w-10" onClick={() => {
              if (typeof window !== 'undefined') {
                window.location.href = '/app/settings';
              }
            }}>
              <Settings className="h-3 w-3 md:h-4 md:w-4" />
            </Button>
          </div>
        </div>
      </Card>

      {/* User Content Tabs */}
      <Tabs defaultValue="posts" className="w-full">
        <TabsList className="grid w-full grid-cols-5 h-auto">
          <TabsTrigger value="posts" className="text-xs md:text-sm py-2 px-1">All Posts</TabsTrigger>
          <TabsTrigger value="moments" className="text-xs md:text-sm py-2 px-1">Moments</TabsTrigger>
          <TabsTrigger value="videos" className="text-xs md:text-sm py-2 px-1">Videos</TabsTrigger>
          <TabsTrigger value="thoughts" className="text-xs md:text-sm py-2 px-1">Thoughts</TabsTrigger>
          <TabsTrigger value="history" className="text-xs md:text-sm py-2 px-1">History</TabsTrigger>
          <TabsTrigger value="saved" className="text-xs md:text-sm py-2 px-1">Saved</TabsTrigger>
        </TabsList>
        <TabsContent value="posts" className="mt-4 md:mt-6 space-y-3 md:space-y-4">
          {/* Combine user's original posts with reacted posts */}
          {[
            ...userReactedPosts.map(post => ({ ...post, isReacted: true })),
            ...userProfile.posts
          ].length > 0 ? (
            <>
              {/* Filter moments and render them with Moments component */}
              {[...userReactedPosts.map(post => ({ ...post, isReacted: true })), ...userProfile.posts]
                .filter(post => post.type === 'moment').length > 0 && (
                <div className="space-y-4">
                  <h4 className="text-sm font-medium text-muted-foreground">Moments</h4>
                  <Moments
                    moments={[...userReactedPosts.map(post => ({ ...post, isReacted: true })), ...userProfile.posts]
                      .filter(post => post.type === 'moment').map(post => ({
                        id: post.id,
                        user: post.user,
                        content: post.content || '',
                        image: post.thumbnail || post.media || '',
                        video: post.videoUrl,
                        videoUrl: post.videoUrl,
                        thumbnail: post.thumbnail || post.media,
                        likes: post.likes,
                        comments: post.comments,
                        shares: post.shares,
                        time: post.time,
                        avatar: post.avatar,
                        fallbackImage: post.thumbnail || post.media,
                        media: post.videoUrl || post.media || post.thumbnail || '',
                        mediaType: (post.mediaType === 'video' || post.mediaType === 'image') ? post.mediaType : 'video',
                        views: post.views || 0
                      }))}
                    onFullscreen={(moment) => {
                      const fullPost = [...userReactedPosts.map(post => ({ ...post, isReacted: true })), ...userProfile.posts]
                        .find(p => p.id === moment.id) || moment as unknown as Post;
                      addToWatchHistory(fullPost);
                      handleFullscreen(fullPost);
                    }}
                    onComment={(momentId, user) => handleComment(momentId, user)}
                    onLike={(momentId) => handleLike(momentId)}
                    likedMoments={likedPosts}
                    isHomePage={false}
                    isMomentsPage={true}
                  />
                </div>
              )}

              {/* Render non-moment posts as regular cards */}
              {[...userReactedPosts.map(post => ({ ...post, isReacted: true })), ...userProfile.posts]
                .filter(post => post.type !== 'moment').map((post) => (
                <Card key={post.id} className={`p-3 md:p-4 slide-up ${post.isReacted ? 'border-green-200 bg-green-50/50' : ''}`}>
                  <CardHeader className="flex flex-row items-center justify-between p-0 mb-3 md:mb-4">
                    <div className="flex items-center gap-2 md:gap-3">
                      {post.isReacted ? (
                        <Repeat className="h-4 w-4 md:h-5 md:w-5 text-green-600" />
                      ) : (
                        <MessageSquare className="h-4 w-4 md:h-5 md:w-5 text-primary" />
                      )}
                      <div>
                        <CardTitle className={`text-sm md:text-base capitalize ${post.isReacted ? 'text-green-600' : ''}`}>
                          {post.isReacted ? 'Reacted Post' : post.type}
                        </CardTitle>
                        <p className="text-xs md:text-sm text-muted-foreground">
                          {post.time}
                          {post.isReacted && ` • Reacted to ${(post as any).originalAuthor}'s post`}
                        </p>
                      </div>
                    </div>

                    {/* 3-dot menu */}
                    <StandardPostMenu
                      postId={post.id}
                      postUserId={post.user}
                      currentUserId={userProfile.name} // Assuming current user is the profile owner
                      isProfilePage={true}
                      onReport={handleReport}
                      onDelete={() => handleDeletePost(post.id)}
                      onEdit={() => handleEditPost(post)}
                      onHide={() => handleHide(post.id)}
                      onShare={handleMenuShare}
                      onCopyLink={handleCopyLink}
                    />
                  </CardHeader>
                  <CardContent className="p-0">
                    <p className="mb-3 md:mb-4 text-sm md:text-base">{post.content}</p>

                    {post.media && (
                      <img 
                        src={post.media} 
                        alt="Post media" 
                        className="w-full rounded-lg mb-3 md:mb-4 object-cover max-h-48 md:max-h-60 cursor-pointer" 
                        onClick={() => handleFullscreen(post)}
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = `https://picsum.photos/seed/fallback-${post.id}/400/300.jpg`;
                        }}
                      />
                    )}
                    <div className="flex items-center gap-1 md:gap-2 flex-wrap">
                      {post.isReacted ? (
                        <>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="flex items-center gap-1 text-green-600 text-xs md:text-sm"
                            onClick={() => {
                              // Find the original post ID and remove reaction
                              const originalPostId = (post as any).originalPostId || (post as any).originalThoughtId;
                              if (originalPostId) {
                                // Remove from user reacted posts
                                setUserReactedPosts(prev => prev.filter(p => (p as any).originalPostId !== originalPostId && (p as any).originalThoughtId !== originalPostId));
                                // Update localStorage
                                const updatedReactedPosts = userReactedPosts.filter(p => (p as any).originalPostId !== originalPostId && (p as any).originalThoughtId !== originalPostId);
                                localStorage.setItem('userReactedThoughts', JSON.stringify(updatedReactedPosts));
                                showSuccess('Reaction removed');
                              }
                            }}
                          >
                            <Repeat className="h-3 w-3 md:h-4 md:w-4 fill-current" />
                            <span className="font-medium">{(post as any).reacts || 0}</span>
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="flex items-center gap-1 text-xs md:text-sm"
                            onClick={() => handleComment(post.id, post.user)}
                          >
                            <MessageCircle className="h-3 w-3 md:h-4 md:w-4" /> <span className="font-medium">{post.comments}</span>
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="flex items-center gap-1 text-xs md:text-sm"
                            onClick={() => handleShare(post)}
                          >
                            <Share2 className="h-3 w-3 md:h-4 md:w-4" /> <span className="font-medium hidden sm:inline">{post.shares}</span><span className="font-medium sm:hidden">{post.shares > 0 ? post.shares : ''}</span>
                          </Button>
                        </>
                      ) : post.type === 'thought' ? (
                        <VotingButtons
                          thoughtId={post.id}
                          upvotesCount={post.upvotes_count || Math.floor(post.likes * 0.7)}
                          downvotesCount={post.downvotes_count || Math.floor(post.likes * 0.1)}
                          likesCount={post.likes}
                          userVote={post.user_vote || null}
                          userHasLiked={likedPosts.has(post.id)}
                          onVote={handleVote}
                          onLike={(thoughtId) => {
                            handleLike(thoughtId);
                          }}
                          disabled={voting === post.id || liking === post.id}
                          size="sm"
                        />
                      ) : (
                        <Button
                          variant="ghost"
                          size="sm"
                          className={`flex items-center gap-1 text-xs md:text-sm ${likedPosts.has(post.id) ? 'text-red-500' : ''}`}
                          onClick={() => handleLike(post.id)}
                        >
                          <ThumbsUp className={`h-3 w-3 md:h-4 md:w-4 ${likedPosts.has(post.id) ? 'fill-current' : ''}`} />
                          <span className="font-medium">{postLikes[post.id] || post.likes}</span>
                        </Button>
                      )}
                      {!post.isReacted && (
                        <>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="flex items-center gap-1 text-xs md:text-sm"
                            onClick={() => handleComment(post.id, post.user)}
                          >
                            <MessageCircle className="h-3 w-3 md:h-4 md:w-4" /> <span className="font-medium">{post.comments}</span>
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="flex items-center gap-1 text-xs md:text-sm"
                            onClick={() => handleShare(post)}
                          >
                            <Share2 className="h-3 w-3 md:h-4 md:w-4" /> <span className="font-medium hidden sm:inline">{post.shares}</span><span className="font-medium sm:hidden">{post.shares > 0 ? post.shares : ''}</span>
                          </Button>
                        </>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        className={`flex items-center gap-1 text-xs md:text-sm ${savedPosts.has(post.id) ? 'text-blue-500' : ''}`}
                        onClick={() => handleSave(post.id)}
                      >
                        <Bookmark className={`h-3 w-3 md:h-4 md:w-4 ${savedPosts.has(post.id) ? 'fill-current' : ''}`} />
                      </Button>
                      {post.media && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="flex items-center gap-1 text-xs md:text-sm"
                          onClick={() => {
                            handleFullscreen(post);
                            addToWatchHistory(post);
                          }}
                          title="View in fullscreen"
                        >
                          <Maximize className="h-3 w-3 md:h-4 md:w-4" />
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </>
          ) : (
            <p className="text-center text-muted-foreground">No posts yet. Share something!</p>
          )}
        </TabsContent>
        <TabsContent value="moments" className="mt-6">
          <Moments
            moments={userProfile.posts.filter(post => post.type === 'moment').map(post => ({
              id: post.id,
              user: post.user,
              content: post.content || '',
              image: post.thumbnail || post.media || '',
              video: post.videoUrl,
              videoUrl: post.videoUrl,
              thumbnail: post.thumbnail || post.media,
              likes: post.likes,
              comments: post.comments,
              shares: post.shares,
              time: post.time,
              avatar: post.avatar,
              fallbackImage: post.thumbnail || post.media,
              media: post.videoUrl || post.media || post.thumbnail || '',
              mediaType: (post.mediaType === 'video' || post.mediaType === 'image') ? post.mediaType : 'video',
              views: post.views || 0
            }))}
            onFullscreen={(moment) => {
              const fullPost = userProfile.posts.find(p => p.id === moment.id) || moment as unknown as Post;
              addToWatchHistory(fullPost);
              handleFullscreen(fullPost);
            }}
            onComment={(momentId, user) => handleComment(momentId, user)}
            onLike={(momentId) => handleLike(momentId)}
            likedMoments={likedPosts}
            isHomePage={false}
            isMomentsPage={true}
          />
        </TabsContent>

        <TabsContent value="videos" className="mt-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {userProfile.posts.filter(post => (post.type === 'video' || (post.mediaType === 'video' && post.type !== 'moment'))).map((video) => (
              <Card key={video.id} className="overflow-hidden cursor-pointer hover:shadow-md transition-shadow" onClick={() => {
              addToWatchHistory(video);
              handleFullscreen(video);
            }}>
                <div className="relative aspect-video bg-black">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Play className="h-10 w-10 text-white opacity-80" />
                  </div>
                  <img
                    src={video.thumbnail || video.media}
                    alt={video.content}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute bottom-2 right-2 bg-black/80 text-white text-xs px-1 rounded">
                    12:45
                  </div>
                </div>
                <CardContent className="p-3">
                  <h3 className="font-semibold line-clamp-2 leading-tight mb-1">{video.content}</h3>
                  <p className="text-xs text-muted-foreground">{video.views} views • {video.time}</p>
                </CardContent>
              </Card>
            ))}
            {userProfile.posts.filter(post => (post.type === 'video' || (post.mediaType === 'video' && post.type !== 'moment'))).length === 0 && (
              <div className="col-span-full text-center py-8 text-muted-foreground">
                <Video className="h-10 w-10 mx-auto mb-2 opacity-20" />
                <p>No long-form videos yet</p>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="thoughts" className="mt-6 space-y-4">
          {[...userReactedPosts.map(post => ({ ...post, isReacted: true })), ...userProfile.posts.filter(p => p.type === 'thought')].length > 0 ? (
            [...userReactedPosts.map(post => ({ ...post, isReacted: true })), ...userProfile.posts.filter(p => p.type === 'thought')].map((post) => (
              <Card key={post.id} className={`p-4 slide-up ${post.isReacted ? 'border-green-200 bg-green-50/50' : ''}`}>
                <CardHeader className="flex flex-row items-center justify-between p-0 mb-4">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={post.avatar} />
                      <AvatarFallback>{typeof post.user === 'string' ? post.user.substring(0, 2).toUpperCase() : (post.user && typeof post.user === 'object' && 'username' in post.user ? String((post.user as any).username).substring(0, 2).toUpperCase() : 'U')}</AvatarFallback>
                    </Avatar>
                    <div>
                      <CardTitle className={`text-base ${post.isReacted ? 'text-green-600' : ''}`}>{post.user}</CardTitle>
                      <p className="text-sm text-muted-foreground">
                        {post.time}
                        {post.isReacted && ` • Reacted to ${(post as any).originalAuthor}'s post`}
                      </p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <p className="mb-4">{post.content}</p>
                  {post.media && (
                    <div className="mb-4">
                      {post.mediaType === 'video' ? (
                        <div className="relative w-full rounded-lg overflow-hidden bg-black" style={{ aspectRatio: '9/16', maxHeight: '320px' }}>
                          <img
                            src={post.thumbnail || post.media}
                            alt="Video thumbnail"
                            className="absolute inset-0 w-full h-full object-cover"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.src = `https://picsum.photos/seed/fallback-video-${post.id}/400/300.jpg`;
                            }}
                          />
                          {post.videoUrl ? (
                          <video
                            ref={(el) => { if (el) videoRefs.current[post.id] = el; }}
                            src={post.videoUrl}
                            className="absolute inset-0 w-full h-full object-cover cursor-pointer"
                            muted={isMuted}
                            loop
                            playsInline
                            preload="metadata"
                            onClick={() => handleVideoPlayPause(post.id)}
                            onError={(e) => handleVideoError(post.id, e)}
                            onTimeUpdate={() => handleTimeUpdate(post.id, videoRefs.current[post.id])}
                            onLoadedMetadata={() => handleLoadedMetadata(post.id, videoRefs.current[post.id])}
                            onMouseEnter={(e) => {
                              const video = e.target as HTMLVideoElement;
                              video.play().catch(() => {});
                            }}
                            onMouseLeave={(e) => {
                              const video = e.target as HTMLVideoElement;
                              video.pause();
                            }}
                          />
                          ) : null}
                          {isLoading[post.id] && (
                            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-white"></div>
                            </div>
                          )}
                          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                            {!playingVideos.has(post.id) && (
                              <div className="bg-black/50 backdrop-blur-sm rounded-full p-2">
                                <Play className="h-4 w-4 text-white" />
                              </div>
                            )}
                          </div>
                          <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-sm rounded-full px-2 py-1">
                            <Video className="h-3 w-3 text-white" />
                          </div>
                          {/* Progress Bar */}
                          {playingVideos.has(post.id) && (
                            <div className="absolute bottom-2 left-2 right-2 z-20">
                              <div className="flex items-center gap-1">
                                <span className="text-white text-xs font-medium min-w-[25px]">
                                  {formatTime(currentTime[post.id] || 0)}
                                </span>
                                <div className="flex-1 h-0.5 bg-white/30 rounded-full">
                                  <div
                                    className="h-full bg-white rounded-full transition-all relative"
                                    style={{ width: `${videoProgress[post.id] || 0}%` }}
                                  />
                                </div>
                                <span className="text-white text-xs font-medium min-w-[25px]">
                                  {formatTime(videoDuration[post.id] || 0)}
                                </span>
                              </div>
                            </div>
                          )}
                        </div>
                      ) : (
                        <img
                          src={post.media}
                          alt="Post media"
                          className="w-full rounded-lg object-cover max-h-60 cursor-pointer"
                          onClick={() => handleFullscreen(post)}
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.src = `https://picsum.photos/seed/fallback-${post.id}/400/300.jpg`;
                          }}
                        />
                      )}
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    {post.isReacted ? (
                      <>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="flex items-center gap-1 text-green-600"
                          onClick={() => {
                            // Find the original thought ID and remove reaction
                            const originalThoughtId = (post as any).originalThoughtId;
                            if (originalThoughtId) {
                              // Remove from user reacted posts
                              setUserReactedPosts(prev => prev.filter(p => (p as any).originalThoughtId !== originalThoughtId));
                              // Update localStorage
                              const updatedReactedPosts = userReactedPosts.filter(p => (p as any).originalThoughtId !== originalThoughtId);
                              localStorage.setItem('userReactedThoughts', JSON.stringify(updatedReactedPosts));
                              showSuccess('Reaction removed');
                            }
                          }}
                        >
                          <Repeat className="h-4 w-4 fill-current" />
                          <span className="font-medium">{(post as any).reacts || 0}</span>
                        </Button>
                        <Button variant="ghost" size="sm" className="flex items-center gap-1">
                          <MessageCircle className="h-4 w-4" /> <span className="font-medium">{post.comments}</span>
                        </Button>
                        <Button variant="ghost" size="sm" className="flex items-center gap-1">
                          <Share2 className="h-4 w-4" /> <span className="font-medium">{post.shares}</span>
                        </Button>
                      </>
                    ) : (
                      <VotingButtons
                        thoughtId={post.id}
                        upvotesCount={post.upvotes_count || Math.floor(post.likes * 0.7)}
                        downvotesCount={post.downvotes_count || Math.floor(post.likes * 0.1)}
                        likesCount={post.likes}
                        userVote={post.user_vote || null}
                        userHasLiked={likedPosts.has(post.id)}
                        onVote={handleVote}
                        onLike={(thoughtId) => {
                          handleLike(thoughtId);
                        }}
                        disabled={voting === post.id || liking === post.id}
                        size="sm"
                      />
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <MessageSquare className="h-10 w-10 mx-auto mb-2 opacity-20" />
              <p>No thoughts yet</p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="history" className="mt-6 space-y-4">
          <WatchHistorySection
            watchHistory={watchHistory}
            savedPosts={savedPosts}
            onClearHistory={() => {
              setWatchHistory([]);
              localStorage.removeItem('watchHistory');
              showSuccess('Watch history cleared');
            }}
            onRemoveItem={(index) => {
              setWatchHistory(prev => prev.filter((_, i) => i !== index));
            }}
            onFullscreen={handleFullscreen}
            onSave={handleSave}
          />
        </TabsContent>

        <TabsContent value="saved" className="mt-6 space-y-4">
          {/* All Saved Content */}
          <Card className="p-6">
            <CardTitle className="flex items-center gap-2 mb-4">
              <Bookmark className="h-5 w-5" />
              Saved Content
            </CardTitle>
            {allSavedContent.length > 0 ? (
              <div className="space-y-4">
                {allSavedContent.map((post) => (
                  <Card key={post.id} className="p-4">
                    <div className="flex items-center gap-3 mb-3">
                      {post.type === 'moment' ? (
                        <Video className="h-5 w-5 text-primary" />
                      ) : post.type === 'thought' ? (
                        <MessageSquare className="h-5 w-5 text-primary" />
                      ) : post.type === 'story' ? (
                        <Bookmark className="h-5 w-5 text-blue-500" />
                      ) : post.mediaType === 'video' ? (
                        <Video className="h-5 w-5 text-primary" />
                      ) : (
                        <MessageSquare className="h-5 w-5 text-primary" />
                      )}
                      <div className="flex-1">
                        <p className="font-medium">{post.content || post.title || post.caption || 'Saved content'}</p>
                        <p className="text-sm text-muted-foreground">
                          {post.user || post.creator || 'Unknown'} • {post.time || 'Recently'}
                          {post.type === 'story' && ' • Story'}
                        </p>
                        {post.views && (
                          <div className="flex items-center gap-1 mt-1">
                            <Eye className="h-3 w-3 text-muted-foreground" />
                            <span className="text-xs text-muted-foreground">{post.views} views</span>
                          </div>
                        )}
                      </div>
                    </div>
                    {(post.media || post.thumbnail || post.image) && (
                      <div className="mb-3">
                        {(post.mediaType === 'video' || post.type === 'video') && (post.videoUrl || post.video) ? (
                          <video
                            src={post.videoUrl || post.video}
                            className="w-full rounded-lg object-cover max-h-40 cursor-pointer"
                            muted
                            loop
                            playsInline
                            onClick={() => handleFullscreen(post)}
                            onMouseEnter={(e) => e.currentTarget.play().catch(() => {})}
                            onMouseLeave={(e) => e.currentTarget.pause()}
                          />
                        ) : (
                          <img
                            src={post.media || post.thumbnail || post.image}
                            alt="Saved content"
                            className="w-full rounded-lg object-cover max-h-40 cursor-pointer"
                            onClick={() => handleFullscreen(post)}
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.src = `https://picsum.photos/seed/fallback-saved-${post.id}/400/300.jpg`;
                            }}
                          />
                        )}
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        className={`flex items-center gap-1 ${savedPosts.has(post.id) ? 'text-blue-500' : ''}`}
                        onClick={() => handleSave(post.id)}
                      >
                        <Bookmark className={`h-4 w-4 ${savedPosts.has(post.id) ? 'fill-current' : ''}`} />
                      </Button>
                      {post.likes && (
                        <Button variant="ghost" size="sm" className="flex items-center gap-1">
                          <ThumbsUp className="h-4 w-4" /> {post.likes}
                        </Button>
                      )}
                      {post.comments && (
                        <Button variant="ghost" size="sm" className="flex items-center gap-1">
                          <MessageCircle className="h-4 w-4" /> {post.comments}
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleFullscreen(post)}
                      >
                        <Maximize className="h-4 w-4" />
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Bookmark className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground text-lg mb-2">No saved content yet</p>
                <p className="text-muted-foreground text-sm">Start saving posts and stories you love to see them here!</p>
              </div>
            )}
          </Card>
        </TabsContent>
      </Tabs>

      {/* Edit Profile Modal */}
      <EditProfileModal
        isOpen={showEditProfileModal}
        onClose={() => setShowEditProfileModal(false)}
        currentProfile={{
          name: userProfile.name,
          username: userProfile.username.replace('@', ''),
          bio: userProfile.bio,
          avatar: userProfile.avatar,
        }}
        onSave={handleSaveProfile}
      />

      {/* Edit Post Modal */}
      {currentEditingPost && (
        <EditPostModal
          isOpen={showEditPostModal}
          onClose={() => setShowEditPostModal(false)}
          currentPost={{
            id: currentEditingPost.id,
            content: currentEditingPost.content || '',
            type: currentEditingPost.type || 'post',
            image: currentEditingPost.media || currentEditingPost.image
          }}
          onSave={handleSavePost}
        />
      )}

      {/* Comment Section */}
      <CommentSection
        isOpen={showCommentSection}
        onClose={() => setShowCommentSection(false)}
        postId={currentPostId}
        postUser={currentPostUser}
        showPinOptions={true}
      />

      {/* Fullscreen Viewer */}
      {fullscreenContent && (
        <FullscreenViewer
          content={fullscreenContent}
          type={fullscreenContent.type || (fullscreenContent.mediaType === 'video' ? 'video' : fullscreenContent.mediaType === 'image' ? 'image' : 'live')}
          onClose={closeFullscreen}
          onComment={(videoId, creator) => handleComment(videoId, creator)}
          onShare={handleShare}
        />
      )}
    </div>
  );
};

export default ProfilePage;