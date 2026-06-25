import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Maximize2, 
  Minimize2, 
  Eye, 
  Clock, 
  ThumbsUp, 
  MessageCircle,
  Share2,
  Play,
  Image as ImageIcon
} from 'lucide-react';
import { cn } from '@/lib/utils';
import ReportButton from './ReportButton';

interface ContentItem {
  id: string;
  title: string;
  description: string;
  type: 'video' | 'photo' | 'article';
  creator: string;
  views: string;
  likes?: string;
  comments?: string;
  thumbnail: string;
  duration?: string;
  publishedAt: string;
  category: string;
  tags: string[];
  videoUrl?: string;
}

interface SplitScreenViewProps {
  items: ContentItem[];
  selectedItem: ContentItem | null;
  onSelectItem: (item: ContentItem) => void;
  onClose: () => void;
  onFullscreen?: (content: any) => void;
  className?: string;
}

const SplitScreenView: React.FC<SplitScreenViewProps> = ({
  items,
  selectedItem,
  onSelectItem,
  onClose,
  onFullscreen,
  className = ''
}) => {
  const [isFullscreen, setIsFullscreen] = useState(false);

  const handleToggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  const formatNumber = (num: string) => {
    const n = parseInt(num);
    if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
    if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
    return n.toString();
  };

  return (
    <div className={cn(
      'fixed inset-0 bg-background/95 backdrop-blur-sm z-50 flex',
      isFullscreen && 'p-0',
      className
    )}>
      <div className={cn(
        'flex w-full h-full',
        isFullscreen ? 'gap-0' : 'gap-4 p-4'
      )}>
        {/* Left Panel - Video/Content Viewer */}
        <div className={cn(
          'flex-1 flex flex-col bg-background',
          isFullscreen ? 'w-2/3' : 'w-1/2'
        )}>
          {selectedItem ? (
            <>
              {/* Content Header */}
              <div className="p-4 border-b border-border">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h2 className="text-xl font-bold mb-2">{selectedItem.title}</h2>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span>{selectedItem.creator}</span>
                      <div className="flex items-center gap-1">
                        <Eye className="h-4 w-4" />
                        {formatNumber(selectedItem.views)} views
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        {selectedItem.publishedAt}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <ReportButton
                      contentId={selectedItem.id}
                      contentType={selectedItem.type === 'video' ? 'video' : 'post'}
                      variant="icon"
                    />
                    <Button variant="ghost" size="sm">
                      <Share2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>

              {/* Content Display */}
              <div className="flex-1 overflow-y-auto p-4">
                {/* Main Content */}
                <div className="mb-4">
                  {selectedItem.type === 'video' ? (
                    <div 
                      className="relative aspect-video bg-black rounded-lg overflow-hidden cursor-pointer"
                      onClick={() => {
                        // Create fullscreen content similar to LongFormVideos
                        const fullscreenContent = {
                          ...selectedItem,
                          type: 'video',
                          mediaUrl: selectedItem.videoUrl,
                          thumbnail: selectedItem.thumbnail,
                          title: selectedItem.title,
                          caption: selectedItem.description,
                          creator: selectedItem.creator
                        };
                        // Call the onFullscreen callback if provided
                        if (onFullscreen) {
                          onFullscreen(fullscreenContent);
                        }
                      }}
                    >
                      {selectedItem.videoUrl ? (
                      <video
                        src={selectedItem.videoUrl}
                        className="w-full h-full object-contain"
                        controls={true}
                        poster={selectedItem.thumbnail}
                      />
                      ) : null}
                      {/* Play button overlay */}
                      <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                        <div className="bg-white/90 rounded-full p-4 shadow-lg">
                          <Maximize2 className="h-6 w-6 text-black" />
                        </div>
                      </div>
                      {/* Click to play fullscreen hint */}
                      <div className="absolute bottom-2 left-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                        Click for fullscreen
                      </div>
                    </div>
                  ) : (
                    <div className="relative">
                      <img
                        src={selectedItem.thumbnail}
                        alt={selectedItem.title}
                        className="w-full rounded-lg"
                      />
                    </div>
                  )}
                </div>

                {/* Content Info */}
                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold mb-2">Description</h3>
                    <p className="text-muted-foreground">{selectedItem.description}</p>
                  </div>

                  <div>
                    <h3 className="font-semibold mb-2">Category & Tags</h3>
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant="secondary">{selectedItem.category}</Badge>
                      {selectedItem.tags.map((tag) => (
                        <Badge key={tag} variant="outline" className="text-xs">
                          #{tag}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <Separator />

                  {/* Engagement Stats */}
                  <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2">
                      <ThumbsUp className="h-5 w-5 text-muted-foreground" />
                      <span>{selectedItem.likes ? formatNumber(selectedItem.likes) : '0'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MessageCircle className="h-5 w-5 text-muted-foreground" />
                      <span>{selectedItem.comments ? formatNumber(selectedItem.comments) : '0'}</span>
                    </div>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center text-muted-foreground">
                <ImageIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Select an item to preview</p>
              </div>
            </div>
          )}
        </div>

        {/* Right Panel - Content List for Browsing */}
        <div className={cn(
          'bg-background border-l border-border overflow-hidden flex flex-col',
          isFullscreen ? 'w-1/3' : 'w-1/2 max-w-md'
        )}>
          {/* Header */}
          <div className="p-4 border-b border-border">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">Browse Content</h3>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleToggleFullscreen}
                  title={isFullscreen ? "Exit fullscreen" : "Fullscreen"}
                >
                  {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
                </Button>
                <Button variant="ghost" size="sm" onClick={onClose}>
                  ×
                </Button>
              </div>
            </div>
          </div>

          {/* Content List */}
          <div className="flex-1 overflow-y-auto">
            {items.map((item) => (
              <Card
                key={item.id}
                className={cn(
                  'm-2 cursor-pointer transition-all hover:shadow-md',
                  selectedItem?.id === item.id && 'ring-2 ring-primary'
                )}
                onClick={() => onSelectItem(item)}
              >
                <CardContent className="p-3">
                  <div className="flex gap-3">
                    <div className="relative flex-shrink-0">
                      <img
                        src={item.thumbnail}
                        alt={item.title}
                        className="w-20 h-14 object-cover rounded"
                      />
                      {item.type === 'video' && (
                        <div className="absolute inset-0 bg-black/40 rounded flex items-center justify-center">
                          <Play className="h-4 w-4 text-white" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-sm line-clamp-1 mb-1">
                        {item.title}
                      </h4>
                      <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                        {item.description}
                      </p>
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>{item.creator}</span>
                        <div className="flex items-center gap-1">
                          <Eye className="h-3 w-3" />
                          {formatNumber(item.views)}
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SplitScreenView;
