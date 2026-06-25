import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MessageCircle, Send, X, ThumbsUp, Pin, Edit, Trash2 } from 'lucide-react';
import { showSuccess } from '@/utils/toast';

interface Comment {
  id: string;
  user: string;
  avatar: string;
  content: string;
  time: string;
  likes: number;
  reacts: number;
  isPinned?: boolean;
  isOwn?: boolean;
}

interface CommentSectionProps {
  isOpen: boolean;
  onClose: () => void;
  postId: string;
  postUser: string;
  onCommentCountChange?: (postId: string, count: number) => void;
  showPinOptions?: boolean;
}

const CommentSection: React.FC<CommentSectionProps> = ({ isOpen, onClose, postId, postUser, onCommentCountChange, showPinOptions = false }) => {
  const [comments, setComments] = useState<Comment[]>([
    {
      id: 'c1',
      user: 'Alice Chen',
      avatar: 'https://picsum.photos/seed/alice/100/100',
      content: 'This is amazing! Love the content you\'re sharing 🎉',
      time: '2 hours ago',
      likes: 12,
      reacts: 3,
      isPinned: false,
      isOwn: false
    },
    {
      id: 'c2',
      user: 'Bob Smith',
      avatar: 'https://picsum.photos/seed/bob/100/100',
      content: 'Great post! Really inspiring stuff. Keep it up! 💪',
      time: '3 hours ago',
      likes: 8,
      reacts: 2,
      isPinned: false,
      isOwn: false
    },
    {
      id: 'c3',
      user: 'Charlie Davis',
      avatar: 'https://picsum.photos/seed/charlie/100/100',
      content: 'This made my day! Thanks for sharing this perspective 🌟',
      time: '5 hours ago',
      likes: 15,
      reacts: 4,
      isPinned: false,
      isOwn: false
    }
  ]);
  
  const [newComment, setNewComment] = useState('');
  const [likedComments, setLikedComments] = useState<Set<string>>(new Set());
  const [commentLikes, setCommentLikes] = useState<{[key: string]: number}>({});
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editingContent, setEditingContent] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  // Initialize comment likes
  useEffect(() => {
    const likesMap: {[key: string]: number} = {};
    comments.forEach(comment => {
      likesMap[comment.id] = comment.likes;
    });
    setCommentLikes(likesMap);
  }, []);

  // Focus input when opened
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  // Update comment count when comments change
  useEffect(() => {
    if (onCommentCountChange) {
      onCommentCountChange(postId, comments.length);
    }
  }, [comments.length, postId, onCommentCountChange]);

  const handleCommentLike = (commentId: string) => {
    const newLikedComments = new Set(likedComments);
    const newCommentLikes = { ...commentLikes };
    
    if (likedComments.has(commentId)) {
      newLikedComments.delete(commentId);
      newCommentLikes[commentId] -= 1;
    } else {
      newLikedComments.add(commentId);
      newCommentLikes[commentId] += 1;
    }
    
    setLikedComments(newLikedComments);
    setCommentLikes(newCommentLikes);
  };

  const handleTogglePin = (commentId: string) => {
    setComments(prev => prev.map(comment => 
      comment.id === commentId 
        ? { ...comment, isPinned: !comment.isPinned }
        : comment
    ));
    
    const comment = comments.find(c => c.id === commentId);
    if (comment) {
      showSuccess(comment.isPinned ? 'Comment unpinned' : 'Comment pinned! 📌');
    }
  };

  const handleSendComment = () => {
    if (!newComment.trim()) return;

    const comment: Comment = {
      id: `c${Date.now()}`,
      user: 'You',
      avatar: 'https://picsum.photos/seed/you/100/100',
      content: newComment,
      time: 'Just now',
      likes: 0,
      reacts: 0,
      isPinned: false,
      isOwn: true
    };

    setComments([comment, ...comments]);
    setCommentLikes({ ...commentLikes, [comment.id]: 0 });
    setNewComment('');
    showSuccess('Comment posted successfully!');
  };

  const handleEditComment = (commentId: string, content: string) => {
    setEditingCommentId(commentId);
    setEditingContent(content);
  };

  const handleSaveEdit = () => {
    if (editingCommentId && editingContent.trim()) {
      setComments(prev => prev.map(comment => 
        comment.id === editingCommentId 
          ? { ...comment, content: editingContent, time: 'Edited just now' }
          : comment
      ));
      setEditingCommentId(null);
      setEditingContent('');
      showSuccess('Comment updated successfully!');
    }
  };

  const handleCancelEdit = () => {
    setEditingCommentId(null);
    setEditingContent('');
  };

  const handleDeleteComment = (commentId: string) => {
    setComments(prev => prev.filter(comment => comment.id !== commentId));
    showSuccess('Comment deleted successfully!');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendComment();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9999] flex items-end justify-center">
      <Card className="w-full max-w-2xl max-h-[80vh] mx-4 mb-4 rounded-t-2xl">
        <CardContent className="p-0">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b">
            <div className="flex items-center gap-3">
              <MessageCircle className="h-5 w-5" />
              <h3 className="font-semibold">Comments</h3>
              <span className="text-sm text-muted-foreground">({comments.length})</span>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Comments List */}
          <div className="overflow-y-auto max-h-[50vh] p-4 space-y-4">
            {comments
              .sort((a, b) => {
                // Pinned comments first
                if (a.isPinned && !b.isPinned) return -1;
                if (!a.isPinned && b.isPinned) return 1;
                return 0;
              })
              .map((comment) => (
              <div key={comment.id} className="flex gap-3">
                <Avatar className="h-8 w-8 flex-shrink-0">
                  <AvatarImage src={comment.avatar} />
                  <AvatarFallback>{comment.user.substring(0, 2)}</AvatarFallback>
                </Avatar>
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2">
                    {comment.isPinned && <Pin className="h-3 w-3 text-blue-500" />}
                    <span className="font-semibold text-sm">{comment.user}</span>
                    <span className="text-xs text-muted-foreground">{comment.time}</span>
                  </div>
                  {editingCommentId === comment.id ? (
                    <div className="space-y-2">
                      <Input
                        value={editingContent}
                        onChange={(e) => setEditingContent(e.target.value)}
                        className="w-full"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleSaveEdit();
                          } else if (e.key === 'Escape') {
                            handleCancelEdit();
                          }
                        }}
                      />
                      <div className="flex gap-2">
                        <Button size="sm" onClick={handleSaveEdit}>Save</Button>
                        <Button size="sm" variant="outline" onClick={handleCancelEdit}>Cancel</Button>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm">{comment.content}</p>
                  )}
                  <div className="flex items-center gap-3">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className={`h-6 px-2 text-xs ${likedComments.has(comment.id) ? 'text-blue-500' : ''}`}
                      onClick={() => handleCommentLike(comment.id)}
                    >
                      <ThumbsUp className={`h-3 w-3 mr-1 ${likedComments.has(comment.id) ? 'fill-current' : ''}`} />
                      {commentLikes[comment.id] || comment.likes}
                    </Button>
                    {comment.isOwn && (
                      <>
                        {showPinOptions && (
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className={`h-6 px-2 text-xs ${comment.isPinned ? 'text-blue-500' : ''}`}
                            onClick={() => handleTogglePin(comment.id)}
                          >
                            {comment.isPinned ? <X className="h-3 w-3 mr-1" /> : <Pin className="h-3 w-3 mr-1" />}
                            {comment.isPinned ? 'Unpin' : 'Pin'}
                          </Button>
                        )}
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-6 px-2 text-xs"
                          onClick={() => handleEditComment(comment.id, comment.content)}
                        >
                          <Edit className="h-3 w-3 mr-1" />
                          Edit
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-6 px-2 text-xs text-red-500 hover:text-red-600"
                          onClick={() => handleDeleteComment(comment.id)}
                        >
                          <Trash2 className="h-3 w-3 mr-1" />
                          Delete
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
            
            {comments.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <MessageCircle className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>No comments yet. Be the first to comment!</p>
              </div>
            )}
          </div>

          {/* Comment Input */}
          <div className="border-t p-4">
            <div className="flex gap-2">
              <Avatar className="h-8 w-8 flex-shrink-0">
                <AvatarImage src="https://picsum.photos/seed/you/100/100" />
                <AvatarFallback>YU</AvatarFallback>
              </Avatar>
              <div className="flex-1 flex gap-2">
                <Input
                  ref={inputRef}
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder={`Comment on ${postUser}'s post...`}
                  className="flex-1"
                />
                <Button 
                  onClick={handleSendComment}
                  disabled={!newComment.trim()}
                  size="icon"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CommentSection;
