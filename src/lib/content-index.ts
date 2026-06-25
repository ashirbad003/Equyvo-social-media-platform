export interface ContentIndexItem {
  id: string;
  title: string;
  description: string;
  type: 'video' | 'photo' | 'post' | 'thought' | 'moment' | 'story';
  creator: string;
  creatorAvatar?: string;
  views: string;
  thumbnail: string;
  videoUrl?: string;
  imageUrl?: string;
  category: string;
  tags: string[];
  duration?: string;
  publishedAt: string;
  content?: string;
  likes?: number;
  comments?: number;
}

const allContent: ContentIndexItem[] = [
  // Photography
  {
    id: 'c1',
    title: 'Amazing Sunset Photography Tips',
    description: 'Learn how to capture stunning sunset photos with professional techniques. Master your camera settings for golden hour.',
    type: 'video',
    creator: 'PhotoPro',
    creatorAvatar: 'https://github.com/shadcn.png',
    views: '125K',
    thumbnail: 'https://picsum.photos/seed/sunset1/300/200',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
    category: 'Photography',
    tags: ['photography', 'sunset', 'tips', 'camera', 'golden hour', 'landscape', 'nature'],
    duration: '10:24',
    publishedAt: '2 days ago',
    content: 'Learn how to capture stunning sunset photos with professional techniques. Master your camera settings for golden hour photography.',
    likes: 12500,
    comments: 890
  },
  {
    id: 'c2',
    title: 'Street Photography Guide for Beginners',
    description: 'Explore the art of street photography with these essential tips and techniques for capturing urban life.',
    type: 'photo',
    creator: 'UrbanShooter',
    creatorAvatar: 'https://github.com/shadcn.png',
    views: '67K',
    thumbnail: 'https://picsum.photos/seed/street1/300/200',
    imageUrl: 'https://picsum.photos/seed/street1/800/600',
    category: 'Photography',
    tags: ['photography', 'street', 'urban', 'beginner', 'guide'],
    publishedAt: '5 days ago',
    content: 'Explore the art of street photography with these essential tips and techniques for capturing urban life.',
    likes: 8900,
    comments: 450
  },

  // Food & Cooking
  {
    id: 'c3',
    title: 'Quick & Easy Dinner Recipes',
    description: 'Delicious recipes you can make in under 30 minutes. Perfect for busy weeknights.',
    type: 'photo',
    creator: 'FoodieLife',
    creatorAvatar: 'https://github.com/shadcn.png',
    views: '89K',
    thumbnail: 'https://picsum.photos/seed/food1/300/200',
    imageUrl: 'https://picsum.photos/seed/food1/800/600',
    category: 'Food',
    tags: ['food', 'recipes', 'dinner', 'cooking', 'quick', 'easy'],
    publishedAt: '1 day ago',
    content: 'Delicious recipes you can make in under 30 minutes. Perfect for busy weeknights. Learn to cook amazing meals fast.',
    likes: 8900,
    comments: 670
  },
  {
    id: 'c4',
    title: 'How to Bake a Perfect Cake from Scratch',
    description: 'Step-by-step tutorial on baking a moist and delicious cake. From mixing to frosting, learn it all.',
    type: 'video',
    creator: 'BakingMaster',
    creatorAvatar: 'https://github.com/shadcn.png',
    views: '234K',
    thumbnail: 'https://picsum.photos/seed/cake1/300/200',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
    category: 'Food',
    tags: ['food', 'baking', 'cake', 'recipe', 'dessert', 'cooking', 'tutorial'],
    duration: '15:30',
    publishedAt: '3 days ago',
    content: 'Step-by-step tutorial on baking a moist and delicious cake from scratch. From mixing to frosting, learn it all.',
    likes: 34000,
    comments: 2100
  },
  {
    id: 'c5',
    title: 'Secret Pasta Recipe Revealed',
    description: 'You have to try this incredible homemade pasta recipe. Simple ingredients, amazing flavors.',
    type: 'video',
    creator: 'culinary_wizard',
    creatorAvatar: 'https://github.com/shadcn.png',
    views: '45K',
    thumbnail: 'https://images.unsplash.com/photo-1563379091339-03246963d278?w=400&h=700&fit=crop&auto=format&dpr=2',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
    category: 'Food',
    tags: ['food', 'pasta', 'recipe', 'cooking', 'italian', 'homemade'],
    duration: '8:45',
    publishedAt: '4 hours ago',
    content: 'Secret pasta recipe revealed! You have to try this. Simple ingredients, amazing flavor. Perfect for dinner.',
    likes: 8900,
    comments: 567
  },

  // Fitness & Health
  {
    id: 'c6',
    title: 'Morning Yoga Flow for Beginners',
    description: 'Start your day with this gentle yoga sequence designed for beginners. Improve flexibility and mindfulness.',
    type: 'video',
    creator: 'YogaGuru',
    creatorAvatar: 'https://github.com/shadcn.png',
    views: '234K',
    thumbnail: 'https://picsum.photos/seed/yoga1/300/200',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
    category: 'Fitness',
    tags: ['yoga', 'fitness', 'morning', 'wellness', 'meditation', 'stretching', 'beginner'],
    duration: '15:30',
    publishedAt: '3 days ago',
    content: 'Start your day with this gentle yoga sequence designed for beginners. Improve flexibility, balance, and mindfulness.',
    likes: 34000,
    comments: 2100
  },
  {
    id: 'c7',
    title: 'No Excuses Full Body Workout',
    description: 'Get fit with this intense full body workout. No equipment needed, just determination.',
    type: 'video',
    creator: 'fitness_pro',
    creatorAvatar: 'https://github.com/shadcn.png',
    views: '78K',
    thumbnail: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=700&fit=crop&auto=format&dpr=2',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4',
    category: 'Fitness',
    tags: ['fitness', 'workout', 'gym', 'exercise', 'health', 'strength', 'cardio'],
    duration: '20:00',
    publishedAt: '6 hours ago',
    content: 'No excuses. Get it done. Full body workout that builds strength and endurance. No equipment needed.',
    likes: 22100,
    comments: 1200
  },
  {
    id: 'c8',
    title: 'Healthy Nutrition Tips for Busy People',
    description: 'Simple nutrition advice to stay healthy even with a hectic schedule. Eat better, feel better.',
    type: 'post',
    creator: 'HealthCoach',
    creatorAvatar: 'https://github.com/shadcn.png',
    views: '56K',
    thumbnail: 'https://picsum.photos/seed/health1/300/200',
    imageUrl: 'https://picsum.photos/seed/health1/800/600',
    category: 'Fitness',
    tags: ['health', 'nutrition', 'tips', 'diet', 'wellness', 'healthy eating'],
    publishedAt: '1 week ago',
    content: 'Simple nutrition advice to stay healthy even with a hectic schedule. Learn to eat better and feel better every day.',
    likes: 15000,
    comments: 980
  },

  // Technology
  {
    id: 'c9',
    title: 'Latest AI Trends and Developments',
    description: 'Stay updated with the newest breakthroughs in artificial intelligence and machine learning.',
    type: 'thought',
    creator: 'Tech Enthusiast',
    creatorAvatar: 'https://github.com/shadcn.png',
    views: '245K',
    thumbnail: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=300&h=200&fit=crop',
    imageUrl: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=800&fit=crop',
    category: 'Technology',
    tags: ['AI', 'technology', 'machine learning', 'future', 'innovation', 'artificial intelligence', 'tech'],
    publishedAt: '1 hour ago',
    content: 'The future of AI is here! What are your thoughts on the latest developments in artificial intelligence and machine learning?',
    likes: 245,
    comments: 67
  },
  {
    id: 'c10',
    title: 'Web Development with React Hooks',
    description: 'Learn modern React development with hooks. From useState to custom hooks, master the fundamentals.',
    type: 'thought',
    creator: 'DevMaster',
    creatorAvatar: 'https://github.com/shadcn.png',
    views: '42K',
    thumbnail: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=300&h=200&fit=crop',
    imageUrl: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&fit=crop',
    category: 'Technology',
    tags: ['react', 'hooks', 'development', 'coding', 'programming', 'web', 'javascript'],
    publishedAt: '4 hours ago',
    content: 'Just implemented a new feature using React hooks. The composition API is game-changing! Learn modern React development.',
    likes: 42,
    comments: 12
  },
  {
    id: 'c11',
    title: 'Best Coding Tutorials for Beginners',
    description: 'Start your programming journey with these hand-picked coding tutorials. From Python to JavaScript.',
    type: 'video',
    creator: 'CodeAcademy',
    creatorAvatar: 'https://github.com/shadcn.png',
    views: '156K',
    thumbnail: 'https://picsum.photos/seed/coding1/300/200',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4',
    category: 'Technology',
    tags: ['coding', 'programming', 'tutorial', 'beginner', 'learn', 'software', 'developer'],
    duration: '25:00',
    publishedAt: '2 weeks ago',
    content: 'Start your programming journey with these hand-picked coding tutorials. Learn Python, JavaScript, and more.',
    likes: 28000,
    comments: 1800
  },

  // Travel
  {
    id: 'c12',
    title: 'Budget Travel Tips for 2024',
    description: 'Explore the world without breaking the bank. Smart travel hacks and budget-friendly destination guides.',
    type: 'post',
    creator: 'Wanderlust',
    creatorAvatar: 'https://github.com/shadcn.png',
    views: '78K',
    thumbnail: 'https://picsum.photos/seed/travel1/300/200',
    imageUrl: 'https://picsum.photos/seed/travel1/800/600',
    category: 'Travel',
    tags: ['travel', 'budget', 'tips', 'vacation', 'explore', 'adventure', 'hacks'],
    publishedAt: '4 days ago',
    content: 'Explore the world without breaking the bank. Smart travel hacks, budget-friendly destination guides, and money-saving tips.',
    likes: 19000,
    comments: 1400
  },
  {
    id: 'c13',
    title: 'Hidden Gems Around the World',
    description: 'Discover the most beautiful hidden travel spots that most tourists dont know about.',
    type: 'video',
    creator: 'alex_adventures',
    creatorAvatar: 'https://github.com/shadcn.png',
    views: '230K',
    thumbnail: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=700&fit=crop&auto=format&dpr=2',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    category: 'Travel',
    tags: ['travel', 'hidden gems', 'adventure', 'explore', 'nature', 'destination', 'vacation'],
    duration: '12:15',
    publishedAt: '2 hours ago',
    content: 'The view from the top is absolutely breathtaking! Discover hidden gems and beautiful places around the world.',
    likes: 15400,
    comments: 892
  },

  // Fashion
  {
    id: 'c14',
    title: 'Latest Fashion Trends This Season',
    description: 'Stay ahead of the curve with the hottest fashion trends, outfit ideas, and styling tips.',
    type: 'photo',
    creator: 'StyleIcon',
    creatorAvatar: 'https://github.com/shadcn.png',
    views: '92K',
    thumbnail: 'https://picsum.photos/seed/fashion1/300/200',
    imageUrl: 'https://picsum.photos/seed/fashion1/800/600',
    category: 'Fashion',
    tags: ['fashion', 'style', 'trends', 'outfit', 'clothing', 'designer', 'seasonal'],
    publishedAt: '1 day ago',
    content: 'Stay ahead of the curve with the hottest fashion trends this season. Outfit ideas, styling tips, and designer picks.',
    likes: 12000,
    comments: 850
  },
  {
    id: 'c15',
    title: 'How to Tie a Tie: Easy Step-by-Step Guide',
    description: 'Learn multiple ways to tie a tie including Windsor, Half-Windsor, and Four-in-Hand knots.',
    type: 'video',
    creator: 'StyleIcon',
    creatorAvatar: 'https://github.com/shadcn.png',
    views: '1.2M',
    thumbnail: 'https://picsum.photos/seed/tie1/300/200',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
    category: 'Fashion',
    tags: ['fashion', 'tie', 'how to', 'style', 'tutorial', 'windsor knot', 'formal'],
    duration: '6:30',
    publishedAt: '1 week ago',
    content: 'Learn multiple ways to tie a tie including Windsor, Half-Windsor, and Four-in-Hand knots. Easy step-by-step guide.',
    likes: 45000,
    comments: 3200
  },

  // Art & Design
  {
    id: 'c16',
    title: 'Digital Art Tutorial for Beginners',
    description: 'Start creating digital art with these easy-to-follow tutorials. Learn Procreate, Photoshop, and more.',
    type: 'video',
    creator: 'ArtStudio',
    creatorAvatar: 'https://github.com/shadcn.png',
    views: '167K',
    thumbnail: 'https://picsum.photos/seed/art1/300/200',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4',
    category: 'Art',
    tags: ['art', 'digital art', 'drawing', 'painting', 'creative', 'design', 'tutorial', 'procreate'],
    duration: '18:45',
    publishedAt: '2 days ago',
    content: 'Start creating digital art with these easy-to-follow tutorials. Learn Procreate, Photoshop, and digital painting techniques.',
    likes: 32000,
    comments: 2100
  },
  {
    id: 'c17',
    title: 'Creative DIY Projects to Try at Home',
    description: 'Fun and creative DIY projects that will unleash your inner artist. Easy crafts for everyone.',
    type: 'post',
    creator: 'CreativeMind',
    creatorAvatar: 'https://github.com/shadcn.png',
    views: '45K',
    thumbnail: 'https://picsum.photos/seed/diy1/300/200',
    imageUrl: 'https://picsum.photos/seed/diy1/800/600',
    category: 'Art',
    tags: ['art', 'creative', 'diy', 'crafts', 'home', 'projects', 'inspiration'],
    publishedAt: '6 days ago',
    content: 'Fun and creative DIY projects that will unleash your inner artist. Easy crafts for everyone to try at home.',
    likes: 8900,
    comments: 560
  },

  // Gaming
  {
    id: 'c18',
    title: 'Top Gaming Moments Compilation',
    description: 'The best gaming highlights, epic wins, and funny moments from the biggest games.',
    type: 'video',
    creator: 'GameZone',
    creatorAvatar: 'https://github.com/shadcn.png',
    views: '890K',
    thumbnail: 'https://picsum.photos/seed/gaming1/300/200',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4',
    category: 'Gaming',
    tags: ['gaming', 'games', 'esports', 'highlights', 'funny', 'moments', 'play'],
    duration: '22:10',
    publishedAt: '5 hours ago',
    content: 'The best gaming highlights, epic wins, and funny moments from the biggest games. Top gaming compilation.',
    likes: 67000,
    comments: 4500
  },
  {
    id: 'c19',
    title: 'New Game Reviews and Recommendations',
    description: 'Honest reviews of the latest game releases. Find your next favorite game.',
    type: 'post',
    creator: 'GameZone',
    creatorAvatar: 'https://github.com/shadcn.png',
    views: '34K',
    thumbnail: 'https://picsum.photos/seed/game2/300/200',
    imageUrl: 'https://picsum.photos/seed/game2/800/600',
    category: 'Gaming',
    tags: ['gaming', 'games', 'review', 'recommendations', 'esports', 'steam', 'console'],
    publishedAt: '3 days ago',
    content: 'Honest reviews of the latest game releases. Find your next favorite game. New releases and classic recommendations.',
    likes: 5600,
    comments: 340
  },

  // Music
  {
    id: 'c20',
    title: 'Music Production Tips for Beginners',
    description: 'Learn music production from scratch. Beat making, mixing, mastering, and sound design tutorials.',
    type: 'video',
    creator: 'BeatMaker',
    creatorAvatar: 'https://github.com/shadcn.png',
    views: '198K',
    thumbnail: 'https://picsum.photos/seed/music1/300/200',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4',
    category: 'Music',
    tags: ['music', 'production', 'beat', 'audio', 'mixing', 'tutorial', 'sound'],
    duration: '14:20',
    publishedAt: '2 hours ago',
    content: 'Learn music production from scratch. Beat making, mixing, mastering, and sound design tutorials for beginners.',
    likes: 23000,
    comments: 1500
  },
  {
    id: 'c21',
    title: 'Trending Songs and Music Videos',
    description: 'Check out the latest trending songs, music videos, and viral audio clips.',
    type: 'video',
    creator: 'MusicVibes',
    creatorAvatar: 'https://github.com/shadcn.png',
    views: '567K',
    thumbnail: 'https://picsum.photos/seed/music2/300/200',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    category: 'Music',
    tags: ['music', 'songs', 'trending', 'viral', 'audio', 'playlist', 'vibes'],
    duration: '3:45',
    publishedAt: '1 hour ago',
    content: 'Check out the latest trending songs, music videos, and viral audio clips. Updated daily with fresh content.',
    likes: 89000,
    comments: 6700
  },

  // Lifestyle & Moments
  {
    id: 'c22',
    title: 'Vibing in the City Nightlife',
    description: 'Urban dance and city vibes. Watch amazing street performances and nightlife moments.',
    type: 'video',
    creator: 'urban_dancer',
    creatorAvatar: 'https://github.com/shadcn.png',
    views: '78K',
    thumbnail: 'https://images.unsplash.com/photo-1516373363238-71c1eee6e0c5?w=400&h=700&fit=crop&auto=format&dpr=2',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4',
    category: 'Lifestyle',
    tags: ['lifestyle', 'dance', 'city', 'nightlife', 'vibes', 'street', 'urban'],
    duration: '1:30',
    publishedAt: '8 hours ago',
    content: 'Vibing in the city nightlife scene. Amazing street dance performances and urban entertainment.',
    likes: 45600,
    comments: 2300
  },
  {
    id: 'c23',
    title: 'Beautiful Sunset Moments',
    description: 'Sometimes you need to pause and appreciate the little things. Stunning sunset captures.',
    type: 'post',
    creator: 'jane_smith',
    creatorAvatar: 'https://github.com/vercel.png',
    views: '128K',
    thumbnail: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=600&fit=crop',
    imageUrl: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=600&fit=crop',
    category: 'Lifestyle',
    tags: ['nature', 'sunset', 'moments', 'lifestyle', 'beautiful', 'peaceful'],
    publishedAt: '5 hours ago',
    content: 'Beautiful sunset today! Sometimes you need to pause and appreciate the little things in life. Nature never fails to amaze.',
    likes: 128,
    comments: 18
  },
  {
    id: 'c24',
    title: 'Live Today: Latest Trends and Updates',
    description: 'Stay informed with what is happening live right now. Breaking news, trending topics, and live events.',
    type: 'video',
    creator: 'NewsHub',
    creatorAvatar: 'https://github.com/shadcn.png',
    views: '1.5M',
    thumbnail: 'https://picsum.photos/seed/live1/300/200',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4',
    category: 'Lifestyle',
    tags: ['live', 'trending', 'news', 'today', 'updates', 'breaking', 'current events'],
    duration: 'Live',
    publishedAt: 'Just now',
    content: 'Stay informed with what is happening live right now. Breaking news, trending topics, and live events coverage.',
    likes: 95000,
    comments: 12000
  },
  {
    id: 'c25',
    title: 'New App Launch: Development Journey',
    description: 'Just launched my new app! Behind the scenes of building and shipping a product.',
    type: 'post',
    creator: 'john_doe',
    creatorAvatar: 'https://github.com/shadcn.png',
    views: '42K',
    thumbnail: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&h=400&fit=crop',
    imageUrl: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&h=400&fit=crop',
    category: 'Technology',
    tags: ['development', 'react', 'launch', 'coding', 'startup', 'tech', 'app'],
    publishedAt: '2 hours ago',
    content: 'Just launched my new app! Check it out and let me know what you think. Built with React and modern tech stack.',
    likes: 42,
    comments: 12
  },
  {
    id: 'c26',
    title: 'Welcome to Equyvo Community',
    description: 'Join our growing community. Share your thoughts, moments, and connect with like-minded people.',
    type: 'post',
    creator: 'Equyvo Official',
    creatorAvatar: 'https://github.com/shadcn.png',
    views: '120K',
    thumbnail: 'https://picsum.photos/seed/welcome1/300/200',
    imageUrl: 'https://picsum.photos/seed/welcome1/800/600',
    category: 'Lifestyle',
    tags: ['community', 'welcome', 'social', 'equyvo', 'connect', 'share'],
    publishedAt: '2 hours ago',
    content: 'Welcome to Equyvo! We are excited to build this community with you. Share your first thought and connect with others.',
    likes: 120,
    comments: 15
  },
  {
    id: 'c27',
    title: 'Live Streaming: Gaming Session',
    description: 'Watch live gaming streams with interactive chat. Join the community and play together.',
    type: 'video',
    creator: 'GameZone',
    creatorAvatar: 'https://github.com/shadcn.png',
    views: '45K',
    thumbnail: 'https://picsum.photos/seed/stream1/300/200',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4',
    category: 'Gaming',
    tags: ['gaming', 'live', 'stream', 'esports', 'games', 'multiplayer'],
    duration: 'Live',
    publishedAt: 'Just now',
    content: 'Live gaming session! Watch, chat, and play together with the community. Interactive gaming experience.',
    likes: 12000,
    comments: 3400
  },
  {
    id: 'c28',
    title: 'How to Make Healthy Smoothies',
    description: 'Learn to make delicious and nutritious smoothies. Perfect for breakfast or post-workout.',
    type: 'video',
    creator: 'HealthCoach',
    creatorAvatar: 'https://github.com/shadcn.png',
    views: '67K',
    thumbnail: 'https://picsum.photos/seed/smoothie1/300/200',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
    category: 'Food',
    tags: ['food', 'smoothie', 'healthy', 'recipe', 'nutrition', 'breakfast', 'drink'],
    duration: '5:20',
    publishedAt: '2 days ago',
    content: 'Learn to make delicious and nutritious smoothies. Perfect for breakfast, post-workout, or a healthy snack.',
    likes: 18000,
    comments: 1100
  },
  {
    id: 'c29',
    title: 'Fashion Week Highlights',
    description: 'Best moments from fashion week. Runway shows, designer collections, and celebrity appearances.',
    type: 'photo',
    creator: 'StyleIcon',
    creatorAvatar: 'https://github.com/shadcn.png',
    views: '345K',
    thumbnail: 'https://picsum.photos/seed/fashion2/300/200',
    imageUrl: 'https://picsum.photos/seed/fashion2/800/600',
    category: 'Fashion',
    tags: ['fashion', 'runway', 'designer', 'fashion week', 'style', 'trends', 'celebrity'],
    publishedAt: '1 week ago',
    content: 'Best moments from fashion week. Runway shows, designer collections, celebrity appearances, and backstage access.',
    likes: 56000,
    comments: 3400
  },
  {
    id: 'c30',
    title: 'Tech Reviews: Latest Gadgets 2024',
    description: 'In-depth reviews of the newest tech gadgets, smartphones, and smart home devices.',
    type: 'video',
    creator: 'TechReviewer',
    creatorAvatar: 'https://github.com/shadcn.png',
    views: '456K',
    thumbnail: 'https://picsum.photos/seed/tech1/300/200',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4',
    category: 'Technology',
    tags: ['tech', 'reviews', 'gadgets', 'smartphone', 'innovation', 'devices', 'unboxing'],
    duration: '12:30',
    publishedAt: '2 days ago',
    content: 'In-depth reviews of the newest tech gadgets, smartphones, smart home devices, and innovative technology products.',
    likes: 34000,
    comments: 2800
  },
  {
    id: 'c31',
    title: 'Viral Challenges Compilation',
    description: 'Watch the best viral challenges and trends sweeping the internet right now.',
    type: 'video',
    creator: 'TrendSetter',
    creatorAvatar: 'https://github.com/shadcn.png',
    views: '2.1M',
    thumbnail: 'https://picsum.photos/seed/viral1/300/200',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4',
    category: 'Entertainment',
    tags: ['viral', 'challenges', 'trending', 'funny', 'entertainment', 'internet', 'popular'],
    duration: '8:15',
    publishedAt: '3 hours ago',
    content: 'Watch the best viral challenges and trends sweeping the internet right now. Funniest and most creative challenges.',
    likes: 156000,
    comments: 12000
  },
  {
    id: 'c32',
    title: 'Meditation and Mindfulness for Beginners',
    description: 'Learn the basics of meditation and mindfulness. Reduce stress and improve focus.',
    type: 'video',
    creator: 'WellnessPro',
    creatorAvatar: 'https://github.com/shadcn.png',
    views: '89K',
    thumbnail: 'https://picsum.photos/seed/meditate1/300/200',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
    category: 'Fitness',
    tags: ['meditation', 'mindfulness', 'wellness', 'health', 'stress', 'relaxation', 'mental health'],
    duration: '10:00',
    publishedAt: '4 days ago',
    content: 'Learn the basics of meditation and mindfulness. Reduce stress, improve focus, and find inner peace.',
    likes: 29000,
    comments: 1800
  },
];

function wordSimilarity(a: string, b: string): number {
  const aLower = a.toLowerCase();
  const bLower = b.toLowerCase();
  if (aLower === bLower) return 1;
  if (aLower.includes(bLower) || bLower.includes(aLower)) return 0.9;
  const aWords = aLower.split(/\s+/);
  const bWords = bLower.split(/\s+/);
  let matchCount = 0;
  for (const w of aWords) {
    if (w.length < 2) continue;
    if (bWords.some(bw => bw.includes(w) || w.includes(bw))) matchCount++;
  }
  const maxLen = Math.max(aWords.length, bWords.length);
  if (maxLen === 0) return 0;
  return matchCount / maxLen;
}

function characterFuzzyScore(query: string, text: string): number {
  const q = query.toLowerCase();
  const t = text.toLowerCase();
  let score = 0;
  let qIdx = 0;
  for (let tIdx = 0; tIdx < t.length && qIdx < q.length; tIdx++) {
    if (t[tIdx] === q[qIdx]) {
      score++;
      qIdx++;
    }
  }
  if (qIdx === 0) return 0;
  const coverage = score / q.length;
  const density = score / Math.max(t.length, 1);
  return coverage * 0.7 + density * 0.3;
}

export function searchContent(query: string): {
  results: ContentIndexItem[];
  totalCount: number;
  isAiRecommended: boolean;
} {
  const trimmed = query.trim().toLowerCase();
  if (!trimmed) {
    return {
      results: allContent.slice(0, 12),
      totalCount: allContent.length,
      isAiRecommended: true
    };
  }

  const scored = allContent.map(item => {
    let score = 0;

    const searchableText = [
      item.title,
      item.description,
      item.content,
      item.category,
      item.creator,
      ...item.tags
    ].filter(Boolean).join(' ').toLowerCase();

    const directMatch = searchableText.includes(trimmed);
    if (directMatch) score += 100;

    const titleMatch = item.title.toLowerCase().includes(trimmed);
    if (titleMatch) score += 50;

    const descMatch = item.description.toLowerCase().includes(trimmed);
    if (descMatch) score += 30;

    const contentMatch = item.content?.toLowerCase().includes(trimmed);
    if (contentMatch) score += 25;

    const categoryMatch = item.category.toLowerCase().includes(trimmed);
    if (categoryMatch) score += 40;

    const creatorMatch = item.creator.toLowerCase().includes(trimmed);
    if (creatorMatch) score += 35;

    const tagMatches = item.tags.filter(t => t.toLowerCase().includes(trimmed)).length;
    score += tagMatches * 20;

    const words = trimmed.split(/\s+/).filter(w => w.length > 1);
    for (const word of words) {
      if (searchableText.includes(word)) score += 5;
      const titleSim = wordSimilarity(item.title, word);
      if (titleSim > 0.5) score += titleSim * 15;
      const descSim = wordSimilarity(item.description, word);
      if (descSim > 0.5) score += descSim * 10;
      const tagWordMatches = item.tags.filter(t => {
        const tLower = t.toLowerCase();
        return tLower.includes(word) || word.includes(tLower);
      }).length;
      score += tagWordMatches * 8;
    }

    const fuzzyCharScore = characterFuzzyScore(trimmed, searchableText);
    if (fuzzyCharScore > 0.3) score += fuzzyCharScore * 20;

    const views = parseInt(item.views.replace(/[K,M]/g, match => match === 'K' ? '000' : '000000'));
    score += Math.log2(views + 1) * 0.5;

    return { item, score };
  });

  const threshold = 2;
  const matching = scored.filter(s => s.score >= threshold);
  matching.sort((a, b) => b.score - a.score);

  const isAiRecommended = matching.length === 0;

  if (matching.length === 0) {
    const sorted = [...scored].sort((a, b) => b.score - a.score);
    return {
      results: sorted.slice(0, 12).map(s => s.item),
      totalCount: allContent.length,
      isAiRecommended: true
    };
  }

  return {
    results: matching.slice(0, 20).map(s => s.item),
    totalCount: matching.length,
    isAiRecommended: false
  };
}

export function getContentByCategory(category: string): ContentIndexItem[] {
  return allContent.filter(c => c.category.toLowerCase() === category.toLowerCase());
}

export function getTrendingContent(): ContentIndexItem[] {
  return [...allContent]
    .sort((a, b) => {
      const aViews = parseInt(a.views.replace(/[K,M]/g, m => m === 'K' ? '000' : '000000'));
      const bViews = parseInt(b.views.replace(/[K,M]/g, m => m === 'K' ? '000' : '000000'));
      return bViews - aViews;
    })
    .slice(0, 10);
}

export function getContentById(id: string): ContentIndexItem | undefined {
  return allContent.find(c => c.id === id);
}

export function getAllContent(): ContentIndexItem[] {
  return allContent;
}

export function getAiRecommendations(query: string): ContentIndexItem[] {
  const trimmed = query.trim().toLowerCase();
  if (!trimmed) return getTrendingContent();
  const { results } = searchContent(trimmed);
  if (results.length > 0) return results.slice(0, 8);
  return getTrendingContent().slice(0, 8);
}
