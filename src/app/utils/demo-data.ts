import { storage } from './storage';

export function initializeDemoData() {
  // Check if demo data already exists
  if (storage.getPosts().length > 0) {
    return;
  }

  // Create some demo posts from other users
  const demoPosts = [
    {
      userId: 'demo1',
      username: 'TraderMike',
      league: '3500',
      isVerified: false,
      type: 'clean' as const,
      photoUrl: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=800&q=80',
      caption: 'Followed all my rules today! Took only high probability setups and stuck to my risk management. Feeling proud! 💪',
    },
    {
      userId: 'demo2',
      username: 'SarahTrades',
      league: '5200',
      isVerified: true,
      type: 'forfeit' as const,
      photoUrl: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800&q=80',
      caption: 'Broke my rule about max trades per day. Completed 100 pushups as my forfeit. Lesson learned - stick to the plan! 🔥',
    },
    {
      userId: 'demo3',
      username: 'AlexFutures',
      league: '4100',
      isVerified: false,
      type: 'clean' as const,
      photoUrl: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&q=80',
      caption: 'Clean day on NQ! Waited for my setups and managed emotions perfectly. This discipline thing actually works!',
    },
    {
      userId: 'demo4',
      username: 'DayTraderJen',
      league: '2800',
      isVerified: false,
      type: 'clean' as const,
      photoUrl: 'https://images.unsplash.com/photo-1504868584819-f8e8b4b6d7e3?w=800&q=80',
      caption: 'Stuck to my trading plan and took only A+ setups. Progress over perfection! 📊',
    },
  ];

  demoPosts.forEach((post, index) => {
    const newPost = storage.addPost(post);
    
    // Add some comments to first post
    if (index === 0) {
      storage.addComment(newPost.id, {
        userId: 'demo2',
        username: 'SarahTrades',
        text: 'Great job! Keep it up! 🚀',
      });
      storage.addComment(newPost.id, {
        userId: 'demo3',
        username: 'AlexFutures',
        text: 'Inspiring! This is the way.',
      });
    }
    
    // Add some likes
    for (let i = 0; i < Math.floor(Math.random() * 20) + 5; i++) {
      storage.likePost(newPost.id);
    }
  });
}