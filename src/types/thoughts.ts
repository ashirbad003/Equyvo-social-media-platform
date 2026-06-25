export interface ThoughtMedia {
  type: 'photo' | 'gif' | 'video';
  url: string;
  thumbnail?: string;
  duration?: number; // in seconds, for videos
  size?: number; // in bytes
  width?: number;
  height?: number;
}

export interface Thought {
  id: string;
  user_id: string;
  content: string;
  image_url?: string; // deprecated, use media instead
  media?: ThoughtMedia[];
  platform: string;
  tags: string[];
  created_at: string;
  updated_at: string;
  likes_count: number;
  comments_count: number;
  shares_count: number;
  retweets_count: number;
  upvotes_count?: number;
  downvotes_count?: number;
  reacts_count?: number;
  user?: {
    id: string;
    username: string;
    avatar_url?: string;
  };
  user_vote?: 'upvote' | 'downvote' | null;
  user_has_liked?: boolean;
}

export interface Vote {
  id: string;
  user_id: string;
  thought_id: string;
  vote_type: 'upvote' | 'downvote';
  created_at: string;
}

export interface Like {
  id: string;
  user_id: string;
  thought_id: string;
  created_at: string;
}

export interface CreateThoughtData {
  content: string;
  image_url?: string; // deprecated, use media instead
  media?: ThoughtMedia[];
  platform?: string;
  tags?: string[];
}

export interface VoteData {
  thought_id: string;
  vote_type: 'upvote' | 'downvote';
}

export interface LikeData {
  thought_id: string;
}
