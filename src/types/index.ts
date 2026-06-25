export type ContentType = 'post' | 'live' | 'video' | 'moment' | 'image' | 'thought' | 'reacted' | 'story';

export interface FullscreenContent {
  id: string;
  type?: ContentType;
  contentType?: string;
  src?: string;
  thumbnail?: string;
  title?: string;
  user?: string;
  avatar?: string;
  time?: string;
  content?: string;
  description?: string;
  likes?: number;
  comments?: number;
  videoUrl?: string;
  mediaUrl?: string;
  media?: string;
  url?: string;
  image?: string;
  creator?: string;
  creatorId?: string;
  category?: string;
  isLive?: boolean;
  live?: boolean;
  views?: number;
  published?: string;
  duration?: string;
  verified?: boolean;
  subscribers?: number;
  forcePortrait?: boolean;
  isFromMinimized?: boolean;
  restoreTime?: number;
  restorePaused?: boolean;
  tags?: string[];
  [key: string]: unknown;
}

export interface Post {
  id: string;
  user: string;
  avatar?: string;
  time?: string;
  content?: string;
  likes?: number;
  comments?: number;
  shares?: number;
  image?: string;
  videoUrl?: string;
  media?: string;
  thumbnail?: string;
  duration?: string;
  reacts?: number;
  views?: number;
  type?: 'post' | 'thought' | 'reacted' | 'moment' | 'video' | 'story';
  originalAuthor?: string;
  originalPostId?: string;
  engagement?: number;
  relevanceScore?: number;
  tags?: string[];
  categories?: string[];
  upvotes_count?: number;
  downvotes_count?: number;
  user_vote?: 'upvote' | 'downvote' | null;
  mediaType?: 'video' | 'image' | 'moment';
  isLive?: boolean;
  savedAt?: string;
  video?: string;
  caption?: string;
  title?: string;
  creator?: string;
  published?: string;
  fallbackImage?: string;
  aspectRatio?: string;
  forcePortrait?: boolean;
  verified?: boolean;
  subscribers?: number;
  [key: string]: unknown;
}

export interface Moment {
  id: string;
  user: string;
  content: string;
  image?: string;
  video?: string;
  thumbnail?: string;
  likes?: number;
  comments?: number;
  shares?: number;
  time?: string;
  avatar?: string;
  fallbackImage?: string;
  media?: string;
  mediaType?: 'video' | 'image' | 'moment';
  videoUrl?: string;
  views?: number;
  userId?: string;
  createdAt?: string;
}

export interface Story {
  id: string;
  user: string;
  avatar?: string;
  image: string;
  video?: string;
  audio?: string;
  type?: 'image' | 'video';
  time?: string;
  content?: string;
  userId?: string;
  createdAt?: string;
  isBotContent?: boolean;
  isFollowing?: boolean;
  isOwn?: boolean;
}
