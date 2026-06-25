import React, { useState } from 'react';
import { X, Share2, ThumbsUp, MessageCircle, Bookmark, MoreVertical, Play, Eye, Users, Clock } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { showSuccess } from '@/utils/toast';
import FullscreenViewer from '@/components/FullscreenViewer';
import CommentSection from '@/components/CommentSection';

interface FullscreenBrowseProps {
  isOpen: boolean;
  onClose: () => void;
}

const FullscreenBrowse: React.FC<FullscreenBrowseProps> = ({ isOpen, onClose }) => {
  const [likedItems, setLikedItems] = useState<Set<string>>(new Set());
  const [savedItems, setSavedItems] = useState<Set<string>>(new Set());
  const [commentSectionOpen, setCommentSectionOpen] = useState(false);
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);
  const [selectedPostUser, setSelectedPostUser] = useState<string>('');
  const [fullscreenContent, setFullscreenContent] = useState<any>(null);
  const [fullscreenType, setFullscreenType] = useState<'post' | 'live' | 'video' | 'moment' | 'image'>('image');

  if (!isOpen) return null;

  // Sample content from different parts of Equyvo app
  const featuredContent = [
    {
      id: 'featured-1',
      type: 'video',
      title: 'Amazing Sunset Timelapse',
      creator: 'NaturePhotographer',
      thumbnail: 'https://picsum.photos/seed/sunset1/400/225',
      videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
      views: 125000,
      likes: 8900,
      comments: 234,
      duration: '3:45',
      verified: true,
      subscribers: 45000
    },
    {
      id: 'featured-2',
      type: 'image',
      title: 'Urban Architecture',
      creator: 'CityExplorer',
      thumbnail: 'https://picsum.photos/seed/city1/400/400',
      image: 'https://picsum.photos/seed/city1/400/400',
      views: 89000,
      likes: 5600,
      comments: 123,
      verified: false,
      subscribers: 12000
    },
    {
      id: 'featured-3',
      type: 'live',
      title: 'Live Gaming Session',
      creator: 'ProGamer',
      thumbnail: 'https://picsum.photos/seed/gaming1/400/225',
      videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
      isLive: true,
      viewers: 3500,
      likes: 2100,
      verified: true,
      subscribers: 89000
    }
  ];

  const trendingContent = Array.from({ length: 8 }, (_, i) => ({
    id: `trending-${i}`,
    type: i % 2 === 0 ? 'video' : 'image',
    title: `Trending Content ${i + 1}`,
    creator: `Creator ${i + 1}`,
    thumbnail: `https://picsum.photos/seed/trend${i}/200/200`,
    videoUrl: i % 2 === 0 ? 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4' : null,
    views: Math.floor(Math.random() * 50000) + 10000,
    likes: Math.floor(Math.random() * 5000) + 500,
    comments: Math.floor(Math.random() * 200) + 50,
    duration: i % 2 === 0 ? `${Math.floor(Math.random() * 10) + 1}:${Math.floor(Math.random() * 60).toString().padStart(2, '0')}` : null,
    verified: Math.random() > 0.5
  }));

  const handleLike = (itemId: string) => {
    setLikedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(itemId)) {
        newSet.delete(itemId);
        showSuccess('💔 Removed from liked');
      } else {
        newSet.add(itemId);
        showSuccess('❤️ Added to liked');
      }
      return newSet;
    });
  };

  const handleShare = (content: any) => {
    if (navigator.share) {
      navigator.share({
        title: content.title,
        text: `Check out this ${content.type} by ${content.creator}!`,
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

  const handleComment = (content: any) => {
    setSelectedPostId(content.id);
    setSelectedPostUser(content.creator);
    setCommentSectionOpen(true);
  };

  const handleContentClick = (content: any) => {
    // Open content in fullscreen viewer
    const fullscreenData = {
      ...content,
      // Ensure proper video/image URLs for fullscreen viewer
      videoUrl: content.videoUrl || content.image || content.thumbnail,
      image: content.image || content.thumbnail,
      thumbnail: content.thumbnail,
      // Add missing properties for fullscreen viewer compatibility
      likes: content.likes || 0,
      comments: content.comments || 0,
      views: content.views || 0,
      verified: content.verified || false,
      subscribers: content.subscribers || 0,
      published: content.published || 'Recently',
      description: content.description || `Amazing ${content.type} content by ${content.creator}`
    };
    
    setFullscreenContent(fullscreenData);
    setFullscreenType(content.type === 'live' ? 'live' : content.type === 'video' ? 'video' : 'image');
  };

  const handleCloseFullscreen = () => {
    setFullscreenContent(null);
  };

  const handleSave = (itemId: string) => {
    setSavedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(itemId)) {
        newSet.delete(itemId);
        showSuccess('📁 Removed from saved');
      } else {
        newSet.add(itemId);
        showSuccess('📁 Added to saved');
      }
      return newSet;
    });
  };

  const formatNumber = (num: number): string => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col">
      {/* Header */}
      <div className="bg-black/90 backdrop-blur-md border-b border-white/10 p-4">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center gap-4">
            <img src="/Equyvo_logo.png" alt="Equyvo" className="h-8 w-8" />
            <h1 className="text-white text-xl font-bold">Equyvo</h1>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="text-white hover:bg-white/10"
              title="Exit Fullscreen"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-7xl mx-auto p-6">
          {/* Featured Section */}
          <div className="mb-8">
            <h2 className="text-white text-2xl font-bold mb-4">Featured</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredContent.map((content) => (
                <Card key={content.id} className="bg-gray-900 border-gray-800 overflow-hidden group cursor-pointer hover:shadow-xl transition-all duration-300" style={{ pointerEvents: 'auto' }} onClick={() => {
                  handleContentClick(content);
                }}>
                  <div className="relative aspect-video">
                    <img 
                      src={content.thumbnail} 
                      alt={content.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    {content.type === 'video' && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="bg-black/60 rounded-full p-3 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Play className="h-6 w-6 text-white" />
                        </div>
                      </div>
                    )}
                    {content.isLive && (
                      <div className="absolute top-2 left-2 bg-red-600 text-white px-2 py-1 rounded text-xs font-bold animate-pulse">
                        LIVE
                      </div>
                    )}
                    {content.duration && !content.isLive && (
                      <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                        {content.duration}
                      </div>
                    )}
                  </div>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={`https://picsum.photos/seed/${content.creator}/100/100`} />
                          <AvatarFallback className="bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs">
                            {content.creator.substring(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <h3 className="text-white font-semibold text-sm line-clamp-1">{content.title}</h3>
                          <div className="flex items-center gap-2">
                            <span className="text-gray-400 text-xs">{content.creator}</span>
                            {content.verified && (
                              <div className="bg-blue-500 rounded-full p-0.5">
                                <div className="w-2 h-2 bg-white rounded-full"></div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4 text-gray-400 text-xs mb-3">
                      {content.views && (
                        <span className="flex items-center gap-1">
                          <Eye className="h-3 w-3" /> {formatNumber(content.views)}
                        </span>
                      )}
                      {content.viewers && (
                        <span className="flex items-center gap-1">
                          <Users className="h-3 w-3" /> {formatNumber(content.viewers)} watching
                        </span>
                      )}
                      {content.subscribers && (
                        <span>{formatNumber(content.subscribers)} subscribers</span>
                      )}
                    </div>

                    <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()} style={{ pointerEvents: 'auto' }}>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleLike(content.id);
                        }}
                        className={`text-gray-400 hover:text-white ${likedItems.has(content.id) ? 'text-red-500' : ''}`}
                      >
                        <ThumbsUp className={`h-4 w-4 ${likedItems.has(content.id) ? 'fill-current' : ''}`} />
                        {content.likes && <span className="ml-1 text-xs">{formatNumber(content.likes)}</span>}
                      </Button>
                      
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleComment(content);
                        }}
                        className="text-gray-400 hover:text-white"
                      >
                        <MessageCircle className="h-4 w-4" />
                        {content.comments && <span className="ml-1 text-xs">{formatNumber(content.comments)}</span>}
                      </Button>
                      
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleShare(content);
                        }}
                        className="text-gray-400 hover:text-white"
                      >
                        <Share2 className="h-4 w-4" />
                      </Button>
                      
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSave(content.id);
                        }}
                        className={`text-gray-400 hover:text-white ${savedItems.has(content.id) ? 'text-blue-500' : ''}`}
                      >
                        <Bookmark className={`h-4 w-4 ${savedItems.has(content.id) ? 'fill-current' : ''}`} />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Trending Grid */}
          <div>
            <h2 className="text-white text-2xl font-bold mb-4">Trending Now</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {trendingContent.map((content) => (
                <div key={content.id} className="relative group cursor-pointer" style={{ pointerEvents: 'auto' }} onClick={() => {
                  handleContentClick(content);
                }}>
                  <div className="aspect-square rounded-lg overflow-hidden">
                    <img 
                      src={content.thumbnail} 
                      alt={content.title}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                    />
                    {content.type === 'video' && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="bg-black/60 rounded-full p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Play className="h-4 w-4 text-white" />
                        </div>
                      </div>
                    )}
                    {content.duration && (
                      <div className="absolute bottom-1 right-1 bg-black/70 text-white text-[10px] px-1 py-0.5 rounded">
                        {content.duration}
                      </div>
                    )}
                  </div>
                  <div className="mt-2">
                    <p className="text-white text-xs font-medium line-clamp-1">{content.title}</p>
                    <div className="flex items-center gap-1 text-gray-400 text-[10px]">
                      <span>{content.creator}</span>
                      {content.verified && (
                        <div className="bg-blue-500 rounded-full p-0.5 scale-75">
                          <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-gray-400 text-[10px] mt-1">
                      <span className="flex items-center gap-0.5">
                        <Eye className="h-2 w-2" /> {formatNumber(content.views)}
                      </span>
                      <span className="flex items-center gap-0.5">
                        <ThumbsUp className="h-2 w-2" /> {formatNumber(content.likes)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Fullscreen Viewer */}
      {fullscreenContent && (
        <FullscreenViewer
          content={fullscreenContent}
          type={fullscreenType}
          onClose={handleCloseFullscreen}
        />
      )}

      {/* Comment Section */}
      <CommentSection
        isOpen={commentSectionOpen}
        onClose={() => setCommentSectionOpen(false)}
        postId={selectedPostId || ''}
        postUser={selectedPostUser}
      />
    </div>
  );
};

export default FullscreenBrowse;
