import { Thought, Vote, Like, CreateThoughtData, VoteData, LikeData, ThoughtMedia } from '@/types/thoughts';
import { getAuthenticatedUser } from './auth';
import { MOCK_VIDEO_URLS } from './mock-constants';

// Mock video duration validation
export const validateVideoDuration = (file: File): Promise<{ valid: boolean; error?: string }> => {
  return new Promise((resolve) => {
    const video = document.createElement('video');
    video.preload = 'metadata';
    
    video.onloadedmetadata = () => {
      window.URL.revokeObjectURL(video.src);
      const duration = video.duration;
      
      // Max 5 minutes for thoughts
      const maxDuration = 300; // 5 minutes
      const minDuration = 1; // 1 second
      
      if (duration < minDuration) {
        resolve({ 
          valid: false, 
          error: 'Video must be at least 1 second long' 
        });
      } else if (duration > maxDuration) {
        resolve({ 
          valid: false, 
          error: `Video must be less than ${maxDuration} seconds long` 
        });
      } else {
        resolve({ valid: true });
      }
    };
    
    video.onerror = () => {
      window.URL.revokeObjectURL(video.src);
      resolve({ 
        valid: false, 
        error: 'Invalid video file' 
      });
    };
    
    video.src = URL.createObjectURL(file);
  });
};

// Mock data for development
const mockThoughts: Thought[] = [
  {
    id: '1',
    user_id: 'user1',
    platform: 'equyvo',
    content: 'Welcome to Equyvo Thoughts! Share your ideas with the community.',
    tags: [],
    comments_count: 0,
    shares_count: 0,
    retweets_count: 0,
    media: [
      {
        type: 'video',
        url: MOCK_VIDEO_URLS[0],
        thumbnail: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=400&h=300&fit=crop',
        duration: 60,
        width: 1920,
        height: 1080
      }
    ],
    likes_count: 15,
    created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    user_vote: null,
    user_has_liked: false
  },
  {
    id: '2',
    user_id: 'user2',
    content: 'Just implemented a new feature using React hooks. The composition API is game-changing!',
    platform: 'equyvo',
    tags: ['react', 'hooks', 'development'],
    comments_count: 0,
    shares_count: 0,
    retweets_count: 0,
    media: [
      {
        type: 'video',
        url: MOCK_VIDEO_URLS[1],
        thumbnail: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=400&h=300&fit=crop',
        duration: 45,
        width: 1920,
        height: 1080
      }
    ],
    likes_count: 42,
    created_at: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
    user_vote: null,
    user_has_liked: false
  }
];

// Thoughts API
export const getThoughts = async (limit = 20, offset = 0) => {
  if (!import.meta.env.DEV) return { data: [], error: null };
  try {
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const user = await getAuthenticatedUser();
    const thoughts = mockThoughts.slice(offset, offset + limit);
    
    const thoughtsWithVotes = thoughts.map(thought => ({
      ...thought,
      upvotes_count: Math.floor(Math.random() * 20),
      downvotes_count: Math.floor(Math.random() * 5),
      user_vote: user ? Math.random() > 0.5 ? 'upvote' : null : null,
      user_liked: user ? Math.random() > 0.7 : false
    }));
    
    return { data: thoughtsWithVotes, error: null };
  } catch (error) {
    return { data: [], error };
  }
};

export const createThought = async (thoughtData: CreateThoughtData) => {
  if (!import.meta.env.DEV) throw new Error('Not available in production');
  try {
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const user = await getAuthenticatedUser();
    
    if (!user) {
      throw new Error('User not authenticated');
    }

    if (thoughtData.media && thoughtData.media.length > 0) {
      const validTypes = ['image', 'video', 'gif'];
      const isValidMedia = thoughtData.media.every(media => 
        validTypes.includes(media.type) && media.url
      );
      
      if (!isValidMedia) {
        throw new Error('Invalid media format');
      }
    }

    const newThought: Thought = {
      id: Date.now().toString(),
      user_id: user.id,
      content: thoughtData.content,
platform: 'equyvo',
      tags: thoughtData.tags || [],
      comments_count: 0,
      shares_count: 0,
      retweets_count: 0,
      media: thoughtData.media || null,
      likes_count: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      user_vote: null,
      user_has_liked: false
    };

    mockThoughts.unshift(newThought);
    return newThought;
  } catch (error) {
    throw error;
  }
};

export const deleteThought = async (thoughtId: string) => {
  if (!import.meta.env.DEV) throw new Error('Not available in production');
  try {
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const user = await getAuthenticatedUser();
    
    if (!user) {
      throw new Error('User not authenticated');
    }

    const index = mockThoughts.findIndex(t => t.id === thoughtId);
    if (index === -1) {
      throw new Error('Thought not found');
    }

    if (mockThoughts[index].user_id !== user.id) {
      throw new Error('Not authorized to delete this thought');
    }

    mockThoughts.splice(index, 1);
    return true;
  } catch (error) {
    throw error;
  }
};

// Votes API
export const voteOnThought = async (voteData: VoteData) => {
  if (!import.meta.env.DEV) throw new Error('Not available in production');
  try {
    await new Promise(resolve => setTimeout(resolve, 200));
    
    const user = await getAuthenticatedUser();
    
    if (!user) {
      throw new Error('User not authenticated');
    }

    const thought = mockThoughts.find(t => t.id === voteData.thought_id);
    if (!thought) {
      throw new Error('Thought not found');
    }
    
    return {
      success: true,
      upvotes_count: Math.floor(Math.random() * 20),
      downvotes_count: Math.floor(Math.random() * 5),
      user_vote: voteData.vote_type
    };
  } catch (error) {
    throw error;
  }
};

export const getThoughtVotes = async (thoughtId: string) => {
  if (!import.meta.env.DEV) return { upvotes_count: 0, downvotes_count: 0, user_vote: null };
  try {
    await new Promise(resolve => setTimeout(resolve, 200));
    
    const user = await getAuthenticatedUser();
    
    const upvotes_count = Math.floor(Math.random() * 20);
    const downvotes_count = Math.floor(Math.random() * 5);
    
    return {
      upvotes_count,
      downvotes_count,
      user_vote: user ? (Math.random() > 0.5 ? 'upvote' : null) : null
    };
  } catch (error) {
    return {
      upvotes_count: 0,
      downvotes_count: 0,
      user_vote: null
    };
  }
};

// Likes API
export const likeThought = async (likeData: LikeData) => {
  if (!import.meta.env.DEV) throw new Error('Not available in production');
  try {
    await new Promise(resolve => setTimeout(resolve, 200));
    
    const user = await getAuthenticatedUser();
    
    if (!user) {
      throw new Error('User not authenticated');
    }

    const thought = mockThoughts.find(t => t.id === likeData.thought_id);
    if (!thought) {
      throw new Error('Thought not found');
    }

    const liked = Math.random() > 0.5;
    
    if (liked) {
      thought.likes_count += 1;
    } else {
      thought.likes_count = Math.max(0, thought.likes_count - 1);
    }

    return {
      liked,
      likes_count: thought.likes_count
    };
  } catch (error) {
    throw error;
  }
};

export const getThoughtLikes = async (thoughtId: string) => {
  if (!import.meta.env.DEV) return { likes_count: 0, user_has_liked: false };
  try {
    await new Promise(resolve => setTimeout(resolve, 200));
    
    const user = await getAuthenticatedUser();
    
    const thought = mockThoughts.find(t => t.id === thoughtId);
    if (!thought) {
      throw new Error('Thought not found');
    }

    return {
      likes_count: thought.likes_count,
      user_has_liked: user ? Math.random() > 0.7 : false
    };
  } catch (error) {
    return {
      likes_count: 0,
      user_has_liked: false
    };
  }
};
