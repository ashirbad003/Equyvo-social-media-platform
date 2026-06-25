import React, { useState } from 'react';
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Clock, Video, MessageSquare, Maximize, Bookmark, X, Eye, Play, Trash } from 'lucide-react';
import { Post } from '@/types';
import { showSuccess } from '@/utils/toast';

interface WatchHistorySectionProps {
  watchHistory: (Post & { watchedAt?: string; watchDuration?: number })[];
  savedPosts: Set<string>;
  onClearHistory: () => void;
  onRemoveItem: (index: number) => void;
  onFullscreen: (post: Post) => void;
  onSave: (postId: string) => void;
}

const WatchHistorySection: React.FC<WatchHistorySectionProps> = ({
  watchHistory,
  savedPosts,
  onClearHistory,
  onRemoveItem,
  onFullscreen,
  onSave
}) => {
  const [filterType, setFilterType] = useState<'all' | 'videos' | 'posts' | 'moments'>('all');

  const filteredHistory = watchHistory.filter(item => {
    switch (filterType) {
      case 'videos':
        return item.mediaType === 'video' || item.type === 'video';
      case 'posts':
        return item.type === 'post' || item.type === 'thought';
      case 'moments':
        return item.type === 'moment';
      default:
        return true;
    }
  });

  const getContentIcon = (item: any) => {
    if (item.mediaType === 'video' || item.type === 'video' || item.type === 'moment') {
      return <Video className="h-5 w-5 text-primary" />;
    }
    if (item.type === 'thought') {
      return <MessageSquare className="h-5 w-5 text-primary" />;
    }
    return <MessageSquare className="h-5 w-5 text-primary" />;
  };

  const getContentTypeLabel = (item: any) => {
    if (item.type === 'thought') return 'Thought';
    if (item.type === 'moment') return 'Moment';
    if (item.mediaType === 'video' || item.type === 'video') return 'Video';
    return 'Post';
  };

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Watch History
        </CardTitle>
        {watchHistory.length > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={onClearHistory}
            className="text-destructive hover:bg-destructive/10"
          >
            <Trash className="h-4 w-4 mr-1" />
            Clear History
          </Button>
        )}
      </div>

      {watchHistory.length > 0 ? (
        <>
          {/* Filter Tabs */}
          <div className="flex items-center gap-2 mb-4">
            <span className="text-sm text-muted-foreground">Filter:</span>
            <div className="flex gap-1">
              {(['all', 'videos', 'posts', 'moments'] as const).map((type) => (
                <Button
                  key={type}
                  variant={filterType === type ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setFilterType(type)}
                  className="h-7 px-3 text-xs capitalize"
                >
                  {type === 'all' ? `All (${watchHistory.length})` : type}
                </Button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2 mb-4 text-sm text-muted-foreground">
            <span>{filteredHistory.length} items</span>
            <span>•</span>
            <span>Most recent first</span>
          </div>

          <div className="space-y-4">
            {filteredHistory.map((item, index) => (
              <Card key={`${item.id}-${index}`} className="p-4 hover:bg-muted/50 transition-colors">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 mt-1">
                    {getContentIcon(item)}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between mb-1">
                      <p className="font-medium text-sm line-clamp-2 flex-1">
                        {item.content || item.title || `${getContentTypeLabel(item)} ${item.id}`}
                      </p>
                      <span className="text-xs text-muted-foreground ml-2 flex-shrink-0">
                        {getContentTypeLabel(item)}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                      <span>{item.user || item.creator || 'Unknown'}</span>
                      <span>•</span>
                      <span>{item.time || 'Recently'}</span>
                      {item.watchedAt && typeof item.watchedAt === 'string' && (
                        <>
                          <span>•</span>
                          <span>Watched {new Date(item.watchedAt).toLocaleDateString()}</span>
                        </>
                      )}
                    </div>

                    {item.views && (
                      <div className="flex items-center gap-1 mb-2">
                        <Eye className="h-3 w-3 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">{item.views} views</span>
                      </div>
                    )}

                    {(item.media || item.thumbnail || item.image) && (
                      <div className="mb-2">
                        {item.mediaType === 'video' || item.type === 'video' ? (
                          <div className="relative w-full rounded-lg overflow-hidden bg-black" style={{ aspectRatio: '16/9', maxHeight: '120px' }}>
                            <img
                              src={item.thumbnail || item.media || item.image}
                              alt="Video thumbnail"
                              className="w-full h-full object-cover"
                            />
                            <div className="absolute inset-0 flex items-center justify-center">
                              <div className="bg-black/50 backdrop-blur-sm rounded-full p-2">
                                <Play className="h-4 w-4 text-white" />
                              </div>
                            </div>
                          </div>
                        ) : (
                          <img
                            src={item.media || item.thumbnail || item.image}
                            alt="Content preview"
                            className="w-full rounded-lg object-cover max-h-32 cursor-pointer hover:opacity-90 transition-opacity"
                          />
                        )}
                      </div>
                    )}

                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onFullscreen(item)}
                        className="h-7 px-2 text-xs"
                      >
                        <Maximize className="h-3 w-3 mr-1" />
                        View
                      </Button>

                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onSave(item.id)}
                        className={`h-7 px-2 text-xs ${savedPosts.has(item.id) ? 'text-blue-500' : ''}`}
                      >
                        <Bookmark className={`h-3 w-3 mr-1 ${savedPosts.has(item.id) ? 'fill-current' : ''}`} />
                        {savedPosts.has(item.id) ? 'Saved' : 'Save'}
                      </Button>

                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          onRemoveItem(index);
                          showSuccess('Removed from history');
                        }}
                        className="h-7 px-2 text-xs text-destructive hover:bg-destructive/10"
                      >
                        <X className="h-3 w-3 mr-1" />
                        Remove
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {filteredHistory.length === 0 && (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No items found for this filter</p>
            </div>
          )}
        </>
      ) : (
        <div className="text-center py-12">
          <Clock className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground text-lg mb-2">No watch history yet</p>
          <p className="text-muted-foreground text-sm">Start exploring content to see your viewing history here!</p>
        </div>
      )}
    </Card>
  );
};

export default WatchHistorySection;
