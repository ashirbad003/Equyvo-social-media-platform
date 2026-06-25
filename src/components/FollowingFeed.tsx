import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Repeat, Maximize, Users, Eye, MessageCircle } from 'lucide-react';
import FollowButton from './FollowButton';
import CommentSection from './CommentSection';
import FullscreenViewer from './FullscreenViewer';
import SaveButton from './SaveButton';
import LikeButton from './LikeButton';
import VotingButtons from './VotingButtons';
import ShareButton from './ShareButton';
import StandardPostMenu from './StandardPostMenu';
import ReportModal from './ReportModal';
import EditProfileContentModal from './EditProfileContentModal';
import { showSuccess, showError } from '@/utils/toast';
import { deleteContent, confirmDelete } from '@/utils/delete';
import { Post } from '@/types';

interface FollowingFeedProps {
  posts: Post[];
  followingAccounts: string[];
  onLike: (postId: string) => void;
  onReact: (postId: string) => void;
  onComment: (postId: string, postUser: string) => void;
  onShare: (post: Post) => void;
  onFullscreen: (post: Post) => void;
  onReport: (postId: string) => void;
  onDelete: (postId: string) => void;
  onAddToHistory?: (post: Post) => void;
  onVote?: (postId: string, voteType: 'upvote' | 'downvote') => void;
  likedPosts: Set<string>;
  reactedPosts: Set<string>;
  postLikes: { [key: string]: number };
  postReacts: { [key: string]: number };
  postCommentCounts?: { [key: string]: number };
  currentUserId?: string;
  isProfilePage?: boolean;
}

const FollowingFeed: React.FC<FollowingFeedProps> = ({
  posts,
  followingAccounts,
  onLike,
  onReact,
  onComment,
  onShare,
  onFullscreen,
  onReport,
  onDelete,
  onAddToHistory,
  onVote,
  likedPosts,
  reactedPosts,
  postLikes,
  postReacts,
  postCommentCounts,
  currentUserId,
  isProfilePage = false
}) => {
  const [showCommentSection, setShowCommentSection] = useState(false);
  const [currentPostId, setCurrentPostId] = useState<string>('');
  const [currentPostUser, setCurrentPostUser] = useState<string>('');
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportPostId, setReportPostId] = useState<string>('');
  const [editingPostId, setEditingPostId] = useState<string>('');
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingPost, setEditingPost] = useState<Post | null>(null);

  // Filter posts to show only from following accounts
  const followingPosts = posts.filter(post => 
    followingAccounts.includes(post.user) || post.isFollowing
  );

  const handleComment = (postId: string, postUser: string) => {
    setCurrentPostId(postId);
    setCurrentPostUser(postUser);
    setShowCommentSection(true);
  };

  const handleReport = (postId: string) => {
    setReportPostId(postId);
    setShowReportModal(true);
  };

  const handleDelete = async (postId: string) => {
    if (!confirmDelete('post')) return;
    
    try {
      await deleteContent({ postId, onDeleteComplete: onDelete });
    } catch {
    }
  };

  const handleEdit = (postId: string) => {
    const post = followingPosts.find(p => p.id === postId);
    if (post) {
      setEditingPost(post);
      setEditingPostId(postId);
      setShowEditModal(true);
    }
  };

  const handleSaveEdit = (updatedPost: any) => {
    setShowEditModal(false);
    setEditingPost(null);
    setEditingPostId('');
  };

  const handleContentClick = (post: Post) => {
    // Add to watch history
    if (onAddToHistory) {
      onAddToHistory(post);
    }
    
    // Enhanced content structure for fullscreen viewer
    const isMomentPost = post.type === 'moment';
    const fullscreenContent = {
      ...post,
      type: isMomentPost ? 'moment' : (post.image ? ('image' as any) : post.type), // Keep original type for non-image posts
      videoUrl: post.videoUrl,
      media: post.image || post.media,
      thumbnail: post.image || post.thumbnail || post.media,
      mediaType: post.image ? 'image' : 'text',
      creator: post.user,
      content: post.content,
      likes: post.likes,
      comments: post.comments,
      views: post.views,
      time: post.time,
      published: post.time,
      duration: post.duration,
      description: post.content,
      creatorId: post.user,
      verified: Math.random() > 0.7,
      subscribers: Math.floor(Math.random() * 100000),
      fallbackImage: post.image || post.thumbnail || post.media,
      // Ensure proper aspect ratio for images
      aspectRatio: isMomentPost ? '9/16' : (post.image ? '16/9' : undefined),
      forcePortrait: isMomentPost
    };
    
    
    // Make bot content playable when tapped
    if (post.user.includes('Official') || post.user.includes('Tech') || post.user.includes('Bot')) {
      if (!post.image) {
        showSuccess(`🎵 Playing content from ${post.user}`);
      } else {
        onFullscreen(fullscreenContent as any);
      }
    } else {
      onFullscreen(fullscreenContent as any);
    }
  };

  return (
    <>
      <Card className="p-4">
        <CardTitle className="mb-4 text-lg flex items-center gap-2">
          <Users className="w-5 h-5 text-blue-500" />
          Following
          <span className="text-sm text-muted-foreground font-normal">
            - Content from accounts you follow
          </span>
        </CardTitle>
        
        {followingPosts.length === 0 ? (
          <div className="text-center py-8">
            <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No posts from following accounts</p>
            <p className="text-gray-400 text-sm mt-1">Follow more accounts to see their content here</p>
            <div className="mt-4 space-y-2">
              <p className="text-sm text-gray-400">Suggestions to follow:</p>
              <div className="flex justify-center gap-2 flex-wrap">
                {['Equyvo Official', 'Tech Enthusiast', 'Emma Thompson'].map(account => (
                  <Button key={account} variant="outline" size="sm" className="text-xs">
                    Follow {account}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {followingPosts.map((post) => (
              <Card key={post.id} className="p-4 slide-up border-l-4 border-l-blue-400">
                <CardHeader className="flex flex-row items-center justify-between p-0 mb-4">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <Avatar 
                        className="h-10 w-10 cursor-pointer hover:ring-2 hover:ring-primary/50 transition-all duration-200"
                        onClick={() => {
                          // Navigate to user profile when avatar is clicked

                        }}
                        title={`${post.user}'s Profile`}
                      >
                        <AvatarImage src={post.avatar} />
                        <AvatarFallback>{post.user.substring(0, 2)}</AvatarFallback>
                      </Avatar>
                      <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                    </div>
                    <div>
                      <CardTitle className="text-base">
                        {post.user}
                      </CardTitle>
                      <p className="text-sm text-muted-foreground">{post.time}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <FollowButton userName={post.user} />
                    
                    <StandardPostMenu
                      postId={post.id}
                      postUserId={post.user}
                      currentUserId={currentUserId}
                      isProfilePage={isProfilePage}
                      onReport={handleReport}
                      onDelete={handleDelete}
                      onEdit={handleEdit}
                      onShare={(postId) => onShare(posts.find(p => p.id === postId))}
                      onHide={(postId) => {
                        // Handle hide functionality - remove from feed
                        const updatedPosts = posts.filter(p => p.id !== postId);
                        // You might want to update the parent component's posts state
                        showSuccess('Post hidden from feed');
                      }}
                      onCopyLink={(postId) => {
                        // Handle copy link functionality
                        const shareUrl = `${window.location.origin}/posts/${postId}`;
                        navigator.clipboard.writeText(shareUrl);
                        showSuccess('🔗 Link copied to clipboard!');
                      }}
                    />
                  </div>
                </CardHeader>
                
                <CardContent className="p-0">
                  <p className="mb-4 cursor-pointer hover:text-primary transition-colors" onClick={() => handleContentClick(post)}>
                    {post.content}
                  </p>
                  
                  {post.image && (
                    <img 
                      src={post.image} 
                      alt="Post content" 
                      className="w-full rounded-lg mb-4 object-cover max-h-80 cursor-pointer" 
                      onClick={() => handleContentClick(post)} 
                    />
                  )}
                  
                  <div className="flex flex-wrap items-center gap-2 sm:flex-nowrap sm:gap-2">
                    {post.type === 'thought' ? (
                      <VotingButtons
                        thoughtId={post.id}
                        upvotesCount={post.upvotes_count || post.likes}
                        downvotesCount={post.downvotes_count || 0}
                        likesCount={post.likes}
                        userVote={post.user_vote || null}
                        userHasLiked={likedPosts.has(post.id)}
                        onVote={(thoughtId, voteType) => onVote?.(thoughtId, voteType)}
                        onLike={() => onLike(post.id)}
                        size="sm"
                      />
                    ) : (
                      <>
                        <LikeButton
                          isLiked={likedPosts.has(post.id)}
                          likesCount={postLikes[post.id] || post.likes}
                          onLike={() => onLike(post.id)}
                          size="sm"
                        />
                        
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className={`flex items-center gap-1 ${reactedPosts.has(post.id) ? 'text-green-500' : ''}`}
                          onClick={() => onReact(post.id)}
                          title="React to make this post yours"
                        >
                          <Repeat className={`h-4 w-4 ${reactedPosts.has(post.id) ? 'fill-current' : ''}`} /> 
                          {postReacts[post.id] || post.reacts}
                        </Button>
                      </>
                    )}
                    
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="flex items-center gap-1"
                      onClick={() => handleComment(post.id, post.user)}
                    >
                      <MessageCircle className="h-4 w-4" /> {postCommentCounts?.[post.id] || post.comments}
                    </Button>
                    
                    <ShareButton
                      post={post}
                      size="sm"
                      showCount={true}
                      sharesCount={post.shares}
                      onShare={() => onShare(post)}
                    />
                    
                    <SaveButton postId={post.id} content={post} />
                    
                    {post.views && (
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Eye className="h-3 w-3" />
                        {post.views}
                      </div>
                    )}
                    
                    {post.image && (
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="flex items-center gap-1"
                        onClick={() => onFullscreen(post)}
                        title="View in fullscreen"
                      >
                        <Maximize className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </Card>

      <CommentSection
        isOpen={showCommentSection}
        onClose={() => setShowCommentSection(false)}
        postId={currentPostId}
        postUser={currentPostUser}
      />
      
      <ReportModal
        isOpen={showReportModal}
        onClose={() => setShowReportModal(false)}
        contentId={reportPostId}
        contentType="post"
      />
      
      {showEditModal && editingPost && (
        <EditProfileContentModal
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          currentContent={{
            id: editingPost.id,
            content: editingPost.content,
            type: editingPost.type as 'post' | 'thought' | 'moment',
            image: editingPost.image
          }}
          onSave={handleSaveEdit}
        />
      )}
    </>
  );
};

export default FollowingFeed;
