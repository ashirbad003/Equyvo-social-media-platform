import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import {
  Flame, Video, Image, Music, Radio, Users,
  LayoutGrid as Grid, ThumbsUp, MessageCircle, Share2, MoreVertical, Hash,
  Filter, SortDesc, Clock, TrendingUp, ChevronDown, List, Monitor, Maximize2
} from 'lucide-react';
import { showSuccess } from '@/utils/toast';
import FullscreenViewer from '@/components/FullscreenViewer';
import FullscreenBrowse from '@/components/FullscreenBrowse';
import CommentSection from '@/components/CommentSection';
import SearchSuggest from '@/components/SearchSuggest';
import StandardPostMenu from '@/components/StandardPostMenu';
import ReportModal from '@/components/ReportModal';
import { useNavigate } from 'react-router-dom';
import { navigateToProfile } from '@/utils/profile-navigation';
import type { FullscreenContent, ContentType } from '@/types';

const DiscoverPage = () => {
  const [activeTab, setActiveTab] = useState('grid');
  const [fullscreenContent, setFullscreenContent] = useState<FullscreenContent | null>(null);
  const [fullscreenType, setFullscreenType] = useState<ContentType>('image');
  const [likedPosts, setLikedPosts] = useState<Set<string>>(new Set());
  const [commentedPosts, setCommentedPosts] = useState<Set<string>>(new Set());
  const [sharedPosts, setSharedPosts] = useState<Set<string>>(new Set());
  const [postLikes, setPostLikes] = useState<Map<string, number>>(new Map());
  const [commentSectionOpen, setCommentSectionOpen] = useState(false);
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);
  const [selectedPostUser, setSelectedPostUser] = useState<string>('');
  const [reportModalOpen, setReportModalOpen] = useState<string | null>(null);
  const [fullscreenBrowseOpen, setFullscreenBrowseOpen] = useState(false);
  
  // New state for filtering and sorting
  const [sortBy, setSortBy] = useState<'relevance' | 'trending' | 'newest' | 'popular'>('relevance');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [timeFilter, setTimeFilter] = useState<'today' | 'week' | 'month' | 'all'>('all');
  const [contentTypeFilter, setContentTypeFilter] = useState<string>('all');
  
  const navigate = useNavigate();

  const handleSearch = useCallback((query: string) => {
    showSuccess(`Searching for "${query}"...`);
    navigate(`/app/search?q=${encodeURIComponent(query)}`);
  }, [navigate]);

  const handleExpandFullscreen = () => {
    // This will be called when the expand button is clicked in minimized mode
    // The FullscreenViewer will handle restoring the content
  };

  const handleFullscreenBrowse = () => {
    setFullscreenBrowseOpen(true);
  };

  const handleOpenFullscreen = (content: FullscreenContent, type: ContentType) => {
    setFullscreenContent(content);
    setFullscreenType(type);
  };

  const handleLike = (contentId: string) => {
    setLikedPosts(prev => {
      const newSet = new Set(prev);
      const isCurrentlyLiked = newSet.has(contentId);
      
      if (isCurrentlyLiked) {
        newSet.delete(contentId);
        showSuccess('💔 Post unliked');
        // Decrement likes
        setPostLikes(prevLikes => {
          const newLikes = new Map(prevLikes);
          const currentLikes = newLikes.get(contentId) || 0;
          newLikes.set(contentId, Math.max(0, currentLikes - 1));
          return newLikes;
        });
      } else {
        newSet.add(contentId);
        showSuccess('❤️ Post liked!');
        // Increment likes
        setPostLikes(prevLikes => {
          const newLikes = new Map(prevLikes);
          const currentLikes = newLikes.get(contentId) || 0;
          newLikes.set(contentId, currentLikes + 1);
          return newLikes;
        });
      }
      return newSet;
    });
  };

  const handleComment = (contentId: string, user?: string) => {
    setSelectedPostId(contentId);
    setSelectedPostUser(user || 'User');
    setCommentedPosts(prev => {
      const newSet = new Set(prev);
      newSet.add(contentId);
      return newSet;
    });
    setCommentSectionOpen(true);
  };

  const handleShare = (content: any) => {
    setSharedPosts(prev => {
      const newSet = new Set(prev);
      newSet.add(content.id);
      return newSet;
    });
    if (navigator.share) {
      navigator.share({
        title: content.title || 'Discover Content',
        text: 'Check out this content!',
        url: window.location.href
      }).catch(() => {
        navigator.clipboard.writeText(window.location.href);
        showSuccess('🔗 Link copied to clipboard!');
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      showSuccess('🔗 Link copied to clipboard!');
    }
  };

  const handleCloseFullscreen = () => {
    setFullscreenContent(null);
  };

  // Menu handlers
  const handleReport = (postId: string) => {
    setReportModalOpen(postId);
  };

  const handleHide = (postId: string) => {
    showSuccess('Content hidden from discover');
  };

  const handleCopyLink = (postId: string) => {
    const shareUrl = `${window.location.origin}/discover/${postId}`;
    navigator.clipboard.writeText(shareUrl);
    showSuccess('🔗 Link copied to clipboard!');
  };

  // Handle reopening fullscreen from minimized state
  useEffect(() => {
    const handleReopenFullscreen = (event: any) => {
      const content = event.detail;
      setFullscreenContent(content);
    };

    // Handle split view video selection
    const handleSplitViewVideoSelected = (event: CustomEvent) => {
      const { content } = event.detail;
      
      // Set the new content immediately
      setFullscreenContent(content);
      setFullscreenType(content.type || 'video');
      
      // Clear temp content to avoid duplicate processing
      (window as any).tempFullscreenContent = null;
    };

    window.addEventListener('reopenFullscreen', handleReopenFullscreen);
    window.addEventListener('splitViewVideoSelected', handleSplitViewVideoSelected as EventListener);
    
    return () => {
      window.removeEventListener('reopenFullscreen', handleReopenFullscreen);
      window.removeEventListener('splitViewVideoSelected', handleSplitViewVideoSelected as EventListener);
    };
  }, []);

  // Check for temp content on mount
  useEffect(() => {
    if ((window as any).tempFullscreenContent) {
      setFullscreenContent((window as any).tempFullscreenContent);
      (window as any).tempFullscreenContent = null;
    }
  }, []);

  // Categories for filtering
  const categories = [
    { id: 'all', name: 'All Categories', icon: Grid },
    { id: 'photography', name: 'Photography', icon: Image },
    { id: 'video', name: 'Video', icon: Video },
    { id: 'music', name: 'Music', icon: Music },
    { id: 'live', name: 'Live', icon: Radio },
    { id: 'art', name: 'Art & Design', icon: Image },
    { id: 'gaming', name: 'Gaming', icon: Video },
    { id: 'education', name: 'Education', icon: Video },
  ];

  const contentTypes = [
    { id: 'all', name: 'All Content' },
    { id: 'image', name: 'Images' },
    { id: 'video', name: 'Videos' },
    { id: 'live', name: 'Live Streams' },
  ];

  // Tags data for different sections
  const sectionTags = {
    grid: ['#photography', '#art', '#nature', '#urban', '#portraits', '#street', '#landscape', '#minimalist'],
    trending: ['#viral', '#trending', '#popular', '#hot', '#featured', '#explore', '#fyp', '#foryou'],
    live: ['#gaming', '#music', '#talk', '#sports', '#news', '#entertainment', '#education', '#cooking'],
    longform: ['#tutorial', '#documentary', '#review', '#interview', '#podcast', '#course', '#webinar', '#deepdive']
  };

  const currentTags = sectionTags[activeTab as keyof typeof sectionTags] || [];

  // Sample video URLs for video and live content
  const sampleVideoUrls = [
    'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
    'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
    'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4',
    'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4',
    'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4',
    'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
    'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4',
  ];

  // Mock data with proper categories and content types
  const generateMockData = (section: string, count: number) => {
    return Array.from({ length: count }, (_, i) => {
      const categoryContentTypeMap: { [key: string]: string[] } = {
        'photography': ['image'],
        'video': ['video'],
        'music': ['video', 'live'],
        'live': ['live'],
        'art': ['image'],
        'gaming': ['video', 'live'],
        'education': ['video', 'live']
      };
      
      const categoryOptions = ['photography', 'video', 'music', 'live', 'art', 'gaming', 'education'];
      
      let allowedCategories;
      if (section === 'live') {
        allowedCategories = ['live', 'music', 'gaming', 'education'];
      } else {
        allowedCategories = categoryOptions;
      }
      
      const randomCategory = allowedCategories[i % allowedCategories.length];
      const allowedContentTypes = categoryContentTypeMap[randomCategory];
      
      let randomContentType;
      if (section === 'live') {
        randomContentType = 'live';
      } else {
        randomContentType = allowedContentTypes[i % allowedContentTypes.length];
      }
      
      const now = new Date();
      const timestamps = [
        now,
        new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000),
        new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000),
        new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000),
      ];
      const randomTimestamp = timestamps[i % timestamps.length];

      const isVideo = randomContentType === 'video';
      const isLive = randomContentType === 'live';
      const videoUrl = isVideo || isLive ? sampleVideoUrls[i % sampleVideoUrls.length] : undefined;

      return {
        id: `${section}-${i}`,
        category: randomCategory,
        contentType: randomContentType,
        timestamp: randomTimestamp,
        likes: 100 + i * 20,
        views: 1000 + i * 100,
        comments: 10 + i,
        title: `${section.charAt(0).toUpperCase() + section.slice(1)} Item ${i + 1}`,
        creator: 'User',
        image: `https://picsum.photos/seed/${section}${i}/500/500`,
        thumbnail: `https://picsum.photos/seed/${section}${i}/500/500`,
        videoUrl,
        isLive,
        live: isLive,
        duration: isVideo ? `${Math.floor(Math.random() * 10) + 1}:${Math.floor(Math.random() * 60).toString().padStart(2, '0')}` : undefined,
      };
    });
  };

  // Filter data based on current filters
  const filterData = (data: any[]) => {
    return data.filter(item => {
      // Category filter
      if (selectedCategory !== 'all' && item.category !== selectedCategory) {
        return false;
      }
      
      // Content type filter - if selected, only show content of that type
      if (contentTypeFilter !== 'all' && item.contentType !== contentTypeFilter) {
        return false;
      }
      
      // Smart filtering: when category is photography, only show images
      // when category is video, only show videos
      // when category is live, only show live streams (no images or videos)
      if (selectedCategory === 'photography' && item.contentType !== 'image') {
        return false;
      }
      if (selectedCategory === 'video' && item.contentType !== 'video') {
        return false;
      }
      if (selectedCategory === 'live' && item.contentType !== 'live') {
        return false;
      }
      
      // Time filter
      if (timeFilter !== 'all') {
        const now = new Date();
        const itemTime = new Date(item.timestamp);
        
        switch (timeFilter) {
          case 'today':
            const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            if (itemTime < today) return false;
            break;
          case 'week':
            const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            if (itemTime < weekAgo) return false;
            break;
          case 'month':
            const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
            if (itemTime < monthAgo) return false;
            break;
        }
      }
      
      return true;
    }).sort((a, b) => {
      // Sort by selected criteria
      switch (sortBy) {
        case 'trending':
          return b.likes - a.likes;
        case 'newest':
          return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
        case 'popular':
          return b.views - a.views;
        case 'relevance':
        default:
          return 0; // Keep original order for relevance
      }
    });
  };

  // Generate and filter data for each section
  const gridData = import.meta.env.DEV ? filterData(generateMockData('grid', 12)) : [];
  const trendingData = import.meta.env.DEV ? filterData(generateMockData('trending', 6)) : [];
  const liveData = import.meta.env.DEV ? filterData(generateMockData('live', 3)) : [];
  const longformData = import.meta.env.DEV ? filterData(generateMockData('longform', 3)) : [];

  // Initialize postLikes map with initial like counts
  React.useEffect(() => {
    const allData = [...gridData, ...trendingData, ...liveData, ...longformData];
    const initialLikes = new Map<string, number>();
    
    allData.forEach(item => {
      if (!postLikes.has(item.id)) {
        initialLikes.set(item.id, item.likes);
      }
    });
    
    if (initialLikes.size > 0) {
      setPostLikes(prev => new Map([...prev, ...initialLikes]));
    }
  }, []); // Only run once on mount

  const handleTagClick = (tag: string) => {
    // Open fullscreen browse instead of navigating to search
    setFullscreenBrowseOpen(true);
    showSuccess(`Opening fullscreen browse for ${tag}`);
  };

  const handleSortChange = (value: 'relevance' | 'trending' | 'newest' | 'popular') => {
    setSortBy(value);
    showSuccess(`Sorting by ${value}`);
  };

  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category);
    showSuccess(`Filtered by ${categories.find(c => c.id === category)?.name || category}`);
  };

  const handleViewModeToggle = () => {
    const newMode = viewMode === 'grid' ? 'list' : 'grid';
    setViewMode(newMode);
    showSuccess(`Switched to ${newMode} view`);
  };

  const handleTimeFilterChange = (timeFilter: 'today' | 'week' | 'month' | 'all') => {
    setTimeFilter(timeFilter);
    const timeLabels = {
      today: 'Today',
      week: 'This Week',
      month: 'This Month',
      all: 'All Time'
    };
    showSuccess(`Filtered by ${timeLabels[timeFilter]}`);
  };

  const handleContentTypeFilter = (type: string) => {
    setContentTypeFilter(type);
    showSuccess(`Filtered by ${contentTypes.find(t => t.id === type)?.name || type}`);
  };

  // Filter and sort controls component
  const FilterControls = () => (
    <div className="flex flex-wrap items-center gap-3 mb-6 p-4 bg-muted/30 rounded-lg">
      {/* Sort By Dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="gap-2">
            <SortDesc className="w-4 h-4" />
            {sortBy === 'relevance' && 'Relevance'}
            {sortBy === 'trending' && 'Trending'}
            {sortBy === 'newest' && 'Newest'}
            {sortBy === 'popular' && 'Most Popular'}
            <ChevronDown className="w-3 h-3" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem onClick={() => handleSortChange('relevance')}>
            <TrendingUp className="w-4 h-4 mr-2" /> Relevance
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleSortChange('trending')}>
            <Flame className="w-4 h-4 mr-2" /> Trending
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleSortChange('newest')}>
            <Clock className="w-4 h-4 mr-2" /> Newest
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleSortChange('popular')}>
            <ThumbsUp className="w-4 h-4 mr-2" /> Most Popular
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Category Filter */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="gap-2">
            <Filter className="w-4 h-4" />
            {categories.find(c => c.id === selectedCategory)?.name || 'All Categories'}
            <ChevronDown className="w-3 h-3" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          {categories.map((category) => {
            const IconComponent = category.icon;
            return (
              <DropdownMenuItem key={category.id} onClick={() => handleCategoryChange(category.id)}>
                <IconComponent className="w-4 h-4 mr-2" /> {category.name}
              </DropdownMenuItem>
            );
          })}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Content Type Filter */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="gap-2">
            <Grid className="w-4 h-4" />
            {contentTypes.find(t => t.id === contentTypeFilter)?.name || 'All Content'}
            <ChevronDown className="w-3 h-3" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          {contentTypes.map((type) => (
            <DropdownMenuItem key={type.id} onClick={() => handleContentTypeFilter(type.id)}>
              {type.name}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Time Filter */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="gap-2">
            <Clock className="w-4 h-4" />
            {timeFilter === 'today' && 'Today'}
            {timeFilter === 'week' && 'This Week'}
            {timeFilter === 'month' && 'This Month'}
            {timeFilter === 'all' && 'All Time'}
            <ChevronDown className="w-3 h-3" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem onClick={() => handleTimeFilterChange('today')}>Today</DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleTimeFilterChange('week')}>This Week</DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleTimeFilterChange('month')}>This Month</DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleTimeFilterChange('all')}>All Time</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* View Mode Toggle */}
      <Button
        variant="outline"
        size="sm"
        onClick={handleViewModeToggle}
        className="gap-2"
      >
        {viewMode === 'grid' ? <List className="w-4 h-4" /> : <Grid className="w-4 h-4" />}
        {viewMode === 'grid' ? 'List View' : 'Grid View'}
      </Button>

      {/* Clear Filters */}
      {(selectedCategory !== 'all' || contentTypeFilter !== 'all' || timeFilter !== 'all') && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            setSelectedCategory('all');
            setContentTypeFilter('all');
            setTimeFilter('all');
            setSortBy('relevance');
            showSuccess('Filters cleared');
          }}
          className="text-muted-foreground hover:text-foreground"
        >
          Clear Filters
        </Button>
      )}
    </div>
  );

  // Search Bar Section matching Navbar implementation
  const SearchBarSection = () => (
    <div className="mb-8">
      <div className="flex items-center gap-4 max-w-2xl mx-auto">
        <div className="flex-1">
          <SearchSuggest
            onSearch={handleSearch}
            placeholder="Search for content, users, tags... (Press '/' to focus)"
            className="w-full"
            showTrending={true}
            maxSuggestions={6}
          />
        </div>
        <Button
          variant="outline"
          size="icon"
          onClick={handleFullscreenBrowse}
          className="hidden md:flex items-center justify-center h-10 w-10 hover:bg-primary/10 hover:text-primary transition-all duration-200"
          title="Fullscreen Browse"
        >
          <Monitor className="h-5 w-5" />
        </Button>
      </div>
    </div>
  );

  // Instagram Style Grid Content
  const GridContent = () => {
    if (viewMode === 'list') {
      // List view implementation
      return (
        <div className="space-y-4">
          {gridData.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Filter className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No content found matching your filters</p>
              <Button variant="outline" size="sm" className="mt-4" onClick={() => {
                setSelectedCategory('all');
                setContentTypeFilter('all');
                setTimeFilter('all');
                setSortBy('relevance');
                showSuccess('Filters cleared');
              }}>
                Clear Filters
              </Button>
            </div>
          ) : (
            gridData.map((item, i) => (
              <Card 
                key={item.id} 
                className="group cursor-pointer hover:shadow-lg transition-all duration-300"
                onClick={() => handleOpenFullscreen({
                  id: item.id,
                  type: item.contentType === 'video' ? 'moment' : item.contentType,
                  contentType: item.contentType,
                  forcePortrait: item.contentType === 'video',
                  title: item.title,
                  creator: item.creator,
                  creatorId: `user-${item.creator}`,
                  image: item.image,
                  thumbnail: item.thumbnail,
                  videoUrl: item.videoUrl,
                  mediaUrl: item.videoUrl,
                  likes: postLikes.get(item.id) || item.likes,
                  comments: item.comments,
                  category: item.category,
                  isLive: item.isLive,
                  live: item.live,
                  views: item.views,
                  duration: item.duration,
                }, item.contentType === 'video' ? 'moment' : item.contentType)}
              >
                <CardContent className="p-4">
                  <div className="flex gap-4">
                    <div className="w-24 h-24 flex-shrink-0 rounded-lg overflow-hidden">
                      <img
                        src={item.thumbnail}
                        alt="Post"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold group-hover:text-primary transition-colors">
                          {item.title}
                        </h3>
                        <Badge variant="secondary" className="text-xs">
                          {item.category}
                        </Badge>
                        <Badge variant={item.contentType === 'live' ? 'destructive' : 'outline'} className="text-xs">
                          {item.contentType === 'live' ? (
                            <span className="flex items-center gap-1"><div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" /> LIVE</span>
                          ) : item.contentType === 'video' ? (
                            <span className="flex items-center gap-1"><Video className="w-3 h-3" /> Video</span>
                          ) : (
                            <span className="flex items-center gap-1"><Image className="w-3 h-3" /> Photo</span>
                          )}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-3">
                        {item.contentType === 'live' ? `🔴 Live streaming by ${item.creator} - join now!` :
                         item.contentType === 'video' ? `▶️ Video content from ${item.creator} - watch this amazing video` :
                         `📷 Photo by ${item.creator} - stunning visual content`}
                      </p>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <ThumbsUp className="w-4 h-4" /> {postLikes.get(item.id) || item.likes}
                        </span>
                        <span className="flex items-center gap-1">
                          <MessageCircle className="w-4 h-4" /> {item.comments}
                        </span>
                        <span>{Math.floor((new Date().getTime() - new Date(item.timestamp).getTime()) / (1000 * 60 * 60))} hours ago</span>
                      </div>
                    </div>
                    <div className="flex flex-col gap-2">
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleLike(item.id);
                        }}
                        className={`p-2 rounded-full hover:bg-muted transition-all ${
                          likedPosts?.has(item.id) ? 'text-red-500' : 'text-muted-foreground'
                        }`}
                      >
                        <ThumbsUp className={`w-4 h-4 ${likedPosts?.has(item.id) ? 'fill-current' : ''}`} />
                      </button>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleComment(item.id, item.creator);
                        }}
                        className={`p-2 rounded-full hover:bg-muted transition-all ${
                          commentedPosts?.has(item.id) ? 'text-blue-500' : 'text-muted-foreground'
                        }`}
                      >
                        <MessageCircle className={`w-4 h-4 ${commentedPosts?.has(item.id) ? 'fill-current' : ''}`} />
                      </button>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleShare({
                            id: item.id,
                            title: item.title,
                            image: item.image
                          });
                        }}
                        className={`p-2 rounded-full hover:bg-muted transition-all ${
                          sharedPosts?.has(item.id) ? 'text-green-500' : 'text-muted-foreground'
                        }`}
                      >
                        <Share2 className={`w-4 h-4 ${sharedPosts?.has(item.id) ? 'fill-current' : ''}`} />
                      </button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      );
    }

    // Grid view (original implementation)
    return (
      <div className="grid grid-cols-3 gap-1 md:gap-2">
        {gridData.length === 0 ? (
          <div className="col-span-3 text-center py-12 text-muted-foreground">
            <Filter className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No content found matching your filters</p>
            <Button variant="outline" size="sm" className="mt-4" onClick={() => {
              setSelectedCategory('all');
              setContentTypeFilter('all');
              setTimeFilter('all');
              setSortBy('relevance');
              showSuccess('Filters cleared');
            }}>
              Clear Filters
            </Button>
          </div>
        ) : (
          gridData.map((item, i) => (
            <div 
              key={item.id} 
              className={`relative aspect-square bg-muted group cursor-pointer overflow-hidden ${i % 3 === 0 && i % 2 === 0 ? 'row-span-2 col-span-2' : ''}`}
              onClick={() => handleOpenFullscreen({
                id: item.id,
                type: item.contentType === 'video' ? 'moment' : item.contentType,
                contentType: item.contentType,
                forcePortrait: item.contentType === 'video',
                title: item.title,
                creator: item.creator,
                creatorId: `user-${item.creator}`,
                image: item.image,
                thumbnail: item.thumbnail,
                videoUrl: item.videoUrl,
                mediaUrl: item.videoUrl,
                likes: postLikes.get(item.id) || item.likes,
                comments: item.comments,
                category: item.category,
                isLive: item.isLive,
                live: item.live,
                views: item.views,
                duration: item.duration,
              }, item.contentType === 'video' ? 'moment' : item.contentType)}
            >
              <img
                src={item.thumbnail}
                alt="Post"
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity hidden md:flex items-center justify-center gap-3 text-white">
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    handleLike(item.id);
                  }}
                  className={`flex items-center gap-1 bg-black/50 p-2 rounded-full hover:bg-black/70 transition-all hover:scale-110 ${
                    likedPosts?.has(item.id) ? 'text-red-500' : ''
                  }`}
                >
                  <ThumbsUp className={`w-4 h-4 ${likedPosts?.has(item.id) ? 'fill-current' : ''}`} /> 
                  <span className="text-xs font-medium">{postLikes.get(item.id) || item.likes}</span>
                </button>
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    handleComment(item.id, item.creator);
                  }}
                  className={`flex items-center gap-1 bg-black/50 p-2 rounded-full hover:bg-black/70 transition-all hover:scale-110 ${
                    commentedPosts?.has(item.id) ? 'text-blue-500' : ''
                  }`}
                >
                  <MessageCircle className={`w-4 h-4 ${commentedPosts?.has(item.id) ? 'fill-current' : ''}`} /> 
                  <span className="text-xs font-medium">{item.comments}</span>
                </button>
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    handleShare({
                      id: item.id,
                      title: item.title,
                      image: item.image
                    });
                  }}
                  className={`flex items-center gap-1 bg-black/50 p-2 rounded-full hover:bg-black/70 transition-all hover:scale-110 ${
                    sharedPosts?.has(item.id) ? 'text-green-500' : ''
                  }`}
                >
                  <Share2 className={`w-4 h-4 ${sharedPosts?.has(item.id) ? 'fill-current' : ''}`} />
                </button>
              </div>
              {item.contentType === 'live' && (
                <div className="absolute top-2 right-2 flex items-center gap-1 bg-red-600 text-white text-xs px-2 py-0.5 rounded animate-pulse">
                  <div className="w-1.5 h-1.5 bg-white rounded-full" />
                  LIVE
                </div>
              )}
              {item.contentType === 'video' && (
                <div className="absolute top-2 right-2">
                  <Video className="w-5 h-5 text-white drop-shadow-md" />
                </div>
              )}
              {item.contentType === 'video' && (
                <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                  {item.duration || `${Math.floor(Math.random() * 10) + 1}:${Math.floor(Math.random() * 60).toString().padStart(2, '0')}`}
                </div>
              )}
              <div className="absolute top-2 left-2">
                <Badge className="text-xs bg-black/50 hover:bg-black/70">
                  {item.category}
                </Badge>
              </div>
            </div>
          ))
        )}
      </div>
    );
  };

  // Trending Section (List/Grid mix)
  const TrendingSection = () => (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-4">
        <Flame className="w-6 h-6 text-orange-500 fill-orange-500 animate-pulse" />
        <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-orange-400 to-red-600">Trending Now</h2>
      </div>
      {trendingData.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <Filter className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>No trending content found matching your filters</p>
          <Button variant="outline" size="sm" className="mt-4" onClick={() => {
            setSelectedCategory('all');
            setContentTypeFilter('all');
            setTimeFilter('all');
            setSortBy('relevance');
            showSuccess('Filters cleared');
          }}>
            Clear Filters
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {trendingData.map((item, i) => (
            <Card 
              key={item.id} 
              className="overflow-hidden hover:shadow-lg transition-all duration-300 border-border/50 group cursor-pointer"
              onClick={() => handleOpenFullscreen({
                id: item.id,
                type: item.contentType === 'video' ? 'moment' : item.contentType,
                contentType: item.contentType,
                forcePortrait: item.contentType === 'video',
                title: item.title,
                creator: item.creator,
                creatorId: `user-${item.creator}`,
                videoUrl: item.videoUrl || 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
                mediaUrl: item.videoUrl || 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
                thumbnail: item.thumbnail,
                image: item.image,
                likes: postLikes.get(item.id) || item.likes,
                views: item.views,
                duration: item.duration || '3:45',
                published: `${Math.floor((new Date().getTime() - new Date(item.timestamp).getTime()) / (1000 * 60 * 60))} hours ago`,
                verified: true,
                subscribers: 50000 + i * 10000,
                description: 'This is an amazing trending content that everyone is talking about!',
                category: item.category,
                isLive: item.isLive,
                live: item.live,
              }, item.contentType === 'video' ? 'moment' : item.contentType)}
            >
              <div className="relative aspect-video">
                <img src={item.thumbnail} className="w-full h-full object-cover" />
                <Badge className="absolute top-2 left-2 bg-orange-500/90 hover:bg-orange-600 border-none">#{i + 1} Trending</Badge>
                {item.contentType === 'video' && (
                  <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                    3:45
                  </div>
                )}
                <div className="absolute top-2 right-12">
                  <Badge className="text-xs bg-black/50 hover:bg-black/70">
                    {item.category}
                  </Badge>
                </div>
              </div>
              <CardContent className="p-3">
                <div className="flex gap-3 items-start justify-between">
                  <div className="flex gap-3">
                    <Avatar 
                      className="w-8 h-8 cursor-pointer hover:ring-2 hover:ring-primary/50 transition-all duration-200"
                      onClick={() => {
                        // Navigate to user profile when avatar is clicked
                        navigateToProfile(navigate, item.creatorId, item.creator);
                      }}
                      title={`${item.creator}'s Profile`}
                    >
                      <AvatarImage src={`https://github.com/shadcn.png`} />
                      <AvatarFallback>U</AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="font-bold leading-tight group-hover:text-primary transition-colors">{item.title}</h3>
                      <p className="text-xs text-muted-foreground mt-1">{item.creator} • {item.views} views • {Math.floor((new Date().getTime() - new Date(item.timestamp).getTime()) / (1000 * 60 * 60))} hours ago</p>
                    </div>
                  </div>
                  <StandardPostMenu
                    postId={item.id}
                    onReport={handleReport}
                    onHide={handleHide}
                    onCopyLink={handleCopyLink}
                    onShare={() => handleShare({
                      id: item.id,
                      title: item.title,
                      image: item.thumbnail
                    })}
                  />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );

  // Live Section
  const LiveSection = () => (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-4">
        <Radio className="w-6 h-6 text-red-500 animate-pulse" />
        <h2 className="text-2xl font-bold">Live Channels</h2>
      </div>
      {liveData.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <Filter className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>No live content found matching your filters</p>
          <Button variant="outline" size="sm" className="mt-4" onClick={() => {
            setSelectedCategory('all');
            setContentTypeFilter('all');
            setTimeFilter('all');
            setSortBy('relevance');
            showSuccess('Filters cleared');
          }}>
            Clear Filters
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {liveData.map((item, i) => (
            <Card 
              key={item.id} 
              className="group cursor-pointer"
              onClick={() => handleOpenFullscreen({
                id: item.id,
                type: 'live',
                contentType: 'live',
                title: item.title,
                creator: item.creator,
                creatorId: `user-${item.creator}`,
                videoUrl: item.videoUrl || 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
                mediaUrl: item.videoUrl || 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
                thumbnail: item.thumbnail,
                image: item.image,
                isLive: true,
                live: true,
                likes: postLikes.get(item.id) || item.likes,
                views: item.views,
                verified: true,
                subscribers: 25000 + i * 5000,
                description: 'Live streaming content - join the stream now!',
                category: item.category,
                duration: item.duration,
              }, 'live')}
            >
              <div className="relative aspect-video">
                <img src={item.thumbnail} className="w-full h-full object-cover rounded-t-lg" />
                <div className="absolute top-3 left-3 bg-red-600 text-white px-2 py-0.5 rounded text-xs font-bold animate-pulse">LIVE</div>
                <div className="absolute bottom-3 left-3 bg-black/60 text-white px-2 py-0.5 rounded text-xs backdrop-blur-sm flex items-center gap-1">
                  <Users className="w-3 h-3" /> {item.views} watching
                </div>
                <div className="absolute top-3 right-3">
                  <Badge className="text-xs bg-black/50 hover:bg-black/70">
                    {item.category}
                  </Badge>
                </div>
              </div>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Avatar 
                      className="w-8 h-8 ring-2 ring-red-500 ring-offset-2 cursor-pointer hover:ring-4 hover:ring-red-400 transition-all duration-200"
                      onClick={() => {
                        // Navigate to user profile when avatar is clicked
                        navigateToProfile(navigate, item.creatorId, item.creator);
                      }}
                      title={`${item.creator}'s Profile`}
                    >
                      <AvatarImage src="https://github.com/shadcn.png" />
                      <AvatarFallback>STR</AvatarFallback>
                    </Avatar>
                    <div>
                      <span className="font-semibold text-sm">{item.creator}</span>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline" className="text-xs">{item.category}</Badge>
                      </div>
                    </div>
                  </div>
                  <StandardPostMenu
                    postId={item.id}
                    onReport={handleReport}
                    onHide={handleHide}
                    onCopyLink={handleCopyLink}
                    onShare={() => handleShare({
                      id: item.id,
                      title: item.title,
                      image: item.thumbnail
                    })}
                  />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );

  // Longform Video Section (YouTube style)
  const LongformSection = () => (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-4">
        <Video className="w-6 h-6 text-red-600" />
        <h2 className="text-2xl font-bold">Long Videos</h2>
      </div>
      {longformData.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <Filter className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>No long videos found matching your filters</p>
          <Button variant="outline" size="sm" className="mt-4" onClick={() => {
            setSelectedCategory('all');
            setContentTypeFilter('all');
            setTimeFilter('all');
            setSortBy('relevance');
            showSuccess('Filters cleared');
          }}>
            Clear Filters
          </Button>
        </div>
      ) : (
        <div className="space-y-6">
          {longformData.map((item, i) => (
            <div 
              key={item.id} 
              className="flex flex-col sm:flex-row gap-4 group cursor-pointer hover:bg-muted/30 p-2 rounded-xl transition-colors"
              onClick={() => handleOpenFullscreen({
                id: item.id,
                type: 'video',
                contentType: item.contentType,
                title: item.title || 'Comprehensive Guide to building Social Media Apps in 2026 - Full Course',
                creator: item.creator,
                creatorId: `user-${item.creator}`,
                videoUrl: item.videoUrl || 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
                mediaUrl: item.videoUrl || 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
                thumbnail: item.thumbnail,
                image: item.image,
                likes: postLikes.get(item.id) || item.likes,
                views: item.views,
                duration: item.duration || '12:45',
                published: `${Math.floor((new Date().getTime() - new Date(item.timestamp).getTime()) / (1000 * 60 * 60))} hours ago`,
                verified: true,
                subscribers: 100000 + i * 20000,
                description: 'In this video we will explore how to build a production ready social media application using the latest tech stack...',
                category: item.category,
                isLive: item.isLive,
                live: item.live,
              }, 'video')}
            >
              <div className="relative sm:w-64 md:w-80 flex-shrink-0 aspect-video rounded-xl overflow-hidden shadow-md">
                <img src={item.thumbnail} className="w-full h-full object-cover" />
                {item.contentType === 'video' && (
                  <div className="absolute bottom-2 right-2 bg-black/90 text-white text-xs px-1.5 py-0.5 rounded font-medium">
                    12:45
                  </div>
                )}
                <div className="absolute top-2 left-2">
                  <Badge className="text-xs bg-black/50 hover:bg-black/70">
                    {item.category}
                  </Badge>
                </div>
              </div>
              <div className="flex-1 py-1">
                <h3 className="text-lg font-bold leading-tight line-clamp-2 group-hover:text-primary transition-colors mb-1">
                  {item.title}
                </h3>
                <Avatar 
                  className="w-8 h-8 ring-2 ring-red-500 ring-offset-2 cursor-pointer hover:ring-4 hover:ring-red-400 transition-all duration-200"
                  onClick={() => {
                    // Navigate to user profile when avatar is clicked
                    navigateToProfile(navigate, item.creatorId, item.creator);
                  }}
                  title={`${item.creator}'s Profile`}
                >
                  <AvatarImage src="https://github.com/shadcn.png" />
                  <AvatarFallback>STR</AvatarFallback>
                </Avatar>
                <div>
                  <span className="font-semibold text-sm">{item.creator}</span>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="outline" className="text-xs">{item.category}</Badge>
                  </div>
                </div>
                <div className="hidden sm:block text-sm text-muted-foreground space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground/80">{item.creator}</span>
                    <Badge variant="secondary" className="h-4 px-1 text-[10px]">✓</Badge>
                  </div>
                  <div className="flex items-center gap-1">
                    <span>{item.views} views</span>
                    <span>•</span>
                    <span>{Math.floor((new Date().getTime() - new Date(item.timestamp).getTime()) / (1000 * 60 * 60))} hours ago</span>
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-2 pt-2">
                    In this video we will explore how to build a production ready social media application using the latest tech stack...
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto pb-24 px-4 pt-6">
      <SearchBarSection />
      <FilterControls />

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="w-full justify-start overflow-x-auto bg-transparent border-b border-border/40 p-0 h-auto mb-4 gap-2 no-scrollbar">
          <TabsTrigger value="grid" className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary rounded-full px-4 py-2 text-sm font-medium border border-transparent data-[state=active]:border-primary/20">
            <Grid className="w-4 h-4 mr-2" /> All Posts
          </TabsTrigger>
          <TabsTrigger value="trending" className="data-[state=active]:bg-orange-500/10 data-[state=active]:text-orange-500 rounded-full px-4 py-2 text-sm font-medium border border-transparent data-[state=active]:border-orange-500/20">
            <Flame className="w-4 h-4 mr-2" /> Trending
          </TabsTrigger>
          <TabsTrigger value="live" className="data-[state=active]:bg-red-500/10 data-[state=active]:text-red-500 rounded-full px-4 py-2 text-sm font-medium border border-transparent data-[state=active]:border-red-500/20">
            <Radio className="w-4 h-4 mr-2" /> Live
          </TabsTrigger>
          <TabsTrigger value="longform" className="data-[state=active]:bg-blue-500/10 data-[state=active]:text-blue-500 rounded-full px-4 py-2 text-sm font-medium border border-transparent data-[state=active]:border-blue-500/20">
            <Video className="w-4 h-4 mr-2" /> Long Videos
          </TabsTrigger>
        </TabsList>

        {/* Tag Bar */}
        <div className="mb-6">
          <div className="flex items-center gap-2 flex-wrap">
            <Hash className="w-4 h-4 text-muted-foreground" />
            {currentTags.map((tag, index) => (
              <Button
                key={index}
                variant="outline"
                size="sm"
                onClick={() => handleTagClick(tag)}
                className="h-7 px-3 text-xs rounded-full border-border/50 hover:border-primary/50 hover:bg-primary/5 hover:text-primary transition-all duration-200 cursor-pointer"
              >
                {tag}
              </Button>
            ))}
          </div>
        </div>

        <TabsContent value="grid" className="mt-0 animate-in fade-in-50 duration-300">
          <GridContent />
        </TabsContent>
        <TabsContent value="trending" className="mt-0 animate-in fade-in-50 duration-300">
          <TrendingSection />
        </TabsContent>
        <TabsContent value="live" className="mt-0 animate-in fade-in-50 duration-300">
          <LiveSection />
        </TabsContent>
        <TabsContent value="longform" className="mt-0 animate-in fade-in-50 duration-300">
          <LongformSection />
        </TabsContent>
      </Tabs>
      
      {/* Fullscreen Viewer */}
      {fullscreenContent && (
        <FullscreenViewer
          content={fullscreenContent}
          type={fullscreenType}
          onClose={handleCloseFullscreen}
          onExpand={handleExpandFullscreen}
        />
      )}

      {/* Fullscreen Browse */}
      <FullscreenBrowse
        isOpen={fullscreenBrowseOpen}
        onClose={() => setFullscreenBrowseOpen(false)}
      />

      {/* Comment Section */}
      <CommentSection
        isOpen={commentSectionOpen}
        onClose={() => setCommentSectionOpen(false)}
        postId={selectedPostId || ''}
        postUser={selectedPostUser}
      />

      {/* Report Modal */}
      <ReportModal
        isOpen={reportModalOpen !== null}
        onClose={() => setReportModalOpen(null)}
        contentId={reportModalOpen || ''}
        contentType="post"
      />
    </div>
  );
};

export default DiscoverPage;
