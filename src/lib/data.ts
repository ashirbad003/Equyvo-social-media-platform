import { Post, Moment, Story } from '@/types';

// Mock data for development when AWS is not configured
const mockPosts: Post[] = [
  {
    id: '1',
    user: 'john_doe',
    avatar: 'https://github.com/shadcn.png',
    time: '2 hours ago',
    content: 'Just launched my new app! Check it out and let me know what you think. #development #react',
    image: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&h=400&fit=crop',
    likes: 42,
    reacts: 8,
    comments: 12,
    shares: 3,
    type: 'post',
    tags: ['development', 'react'],
    categories: ['tech'],
    userId: 'user1',
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
  },
  {
    id: '2',
    user: 'jane_smith',
    avatar: 'https://github.com/vercel.png',
    time: '5 hours ago',
    content: 'Beautiful sunset today! Sometimes you need to pause and appreciate the little things. 🌅',
    image: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=600&fit=crop',
    likes: 128,
    reacts: 24,
    comments: 18,
    shares: 7,
    type: 'post',
    tags: ['nature', 'sunset'],
    categories: ['lifestyle'],
    userId: 'user2',
    createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString()
  }
];

const mockMoments: Moment[] = [
  {
    id: '1',
    user: 'mike_wilson',
    content: 'Quick coding session update',
    media: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    thumbnail: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=400&h=700&fit=crop&auto=format&dpr=2',
    mediaType: 'video',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    likes: 89,
    comments: 15,
    views: 342,
    time: '1 hour ago',
    userId: 'user3',
    createdAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString()
  },
  {
    id: '2',
    user: 'sarah_creative',
    content: 'Morning inspiration!',
    media: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
    thumbnail: 'https://images.unsplash.com/photo-1490730141103-6cac27aaab94?w=400&h=700&fit=crop&auto=format&dpr=2',
    mediaType: 'video',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
    likes: 234,
    comments: 42,
    views: 1024,
    time: '3 hours ago',
    userId: 'user4',
    createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString()
  },
  {
    id: '3',
    user: 'alex_adventures',
    content: 'City vibes!',
    media: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4',
    thumbnail: 'https://images.unsplash.com/photo-1516373363238-71c1eee6e0c5?w=400&h=700&fit=crop&auto=format&dpr=2',
    mediaType: 'video',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4',
    likes: 567,
    comments: 89,
    views: 2341,
    time: '5 hours ago',
    userId: 'user5',
    createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString()
  }
];

const mockStories: Story[] = [
  {
    id: '1',
    user: 'alex_jones',
    avatar: 'https://github.com/tailwindlabs.png',
    image: 'https://images.unsplash.com/photo-1559526324-59b1a3440d8b?w=400&h=600&fit=crop',
    time: '30 minutes ago',
    type: 'image',
    userId: 'user4',
    createdAt: new Date(Date.now() - 30 * 60 * 1000).toISOString()
  },
  {
    id: '2',
    user: 'sarah_creative',
    avatar: 'https://github.com/vercel.png',
    image: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400&h=600&fit=crop',
    video: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    time: '1 hour ago',
    type: 'video',
    userId: 'user5',
    createdAt: new Date(Date.now() - 60 * 60 * 1000).toISOString()
  },
  {
    id: '3',
    user: 'mike_adventures',
    avatar: 'https://github.com/reactjs.png',
    image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=600&fit=crop',
    time: '2 hours ago',
    type: 'image',
    userId: 'user6',
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
  },
];

// Fetch posts (using mock data for development only)
export const fetchPosts = async (userId?: string, limit = 50): Promise<Post[]> => {
  if (!import.meta.env.DEV) return [];
  try {
    await new Promise(resolve => setTimeout(resolve, 500));
    return mockPosts.slice(0, limit);
  } catch {
    return [];
  }
};

// Fetch moments (using mock data for development only)
export const fetchMoments = async (limit = 20): Promise<Moment[]> => {
  if (!import.meta.env.DEV) return [];
  try {
    await new Promise(resolve => setTimeout(resolve, 300));
    return mockMoments.slice(0, limit);
  } catch {
    return [];
  }
};

// Fetch stories (using mock data for development only)
export const fetchStories = async (limit = 20): Promise<Story[]> => {
  if (!import.meta.env.DEV) return [];
  try {
    await new Promise(resolve => setTimeout(resolve, 200));
    return mockStories.slice(0, limit);
  } catch {
    return [];
  }
};

// Create a new post (mock implementation for development only)
export const createPost = async (postData: {
  content: string;
  image_url?: string;
  type?: 'post' | 'thought';
  tags?: string[];
  categories?: string[];
}): Promise<{ success: boolean; post?: Post; error?: string }> => {
  if (!import.meta.env.DEV) return { success: false, error: 'Not available in production' };
  try {
    await new Promise(resolve => setTimeout(resolve, 1000));
    const newPost: Post = {
      id: Date.now().toString(),
      user: 'current_user',
      avatar: 'https://github.com/shadcn.png',
      time: 'just now',
      content: postData.content,
      image: postData.image_url,
      likes: 0,
      reacts: 0,
      comments: 0,
      shares: 0,
      type: postData.type || 'post',
      tags: postData.tags || [],
      categories: postData.categories || [],
      userId: 'current_user_id',
      createdAt: new Date().toISOString()
    };

    mockPosts.unshift(newPost);
    return { success: true, post: newPost };
  } catch {
    return { success: false, error: 'Failed to create post' };
  }
};

// Get user profile data (mock implementation for development only)
export const getUserProfile = async (userId: string) => {
  if (!import.meta.env.DEV) return null;
  try {
    await new Promise(resolve => setTimeout(resolve, 300));
    const mockProfile = {
      id: userId,
      username: `user_${userId}`,
      full_name: 'Demo User',
      avatar_url: 'https://github.com/shadcn.png',
      bio: 'This is a demo user profile',
      created_at: new Date().toISOString()
    };
    return mockProfile;
  } catch {
    return null;
  }
};
