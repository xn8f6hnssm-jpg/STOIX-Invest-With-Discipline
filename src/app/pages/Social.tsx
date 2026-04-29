import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { storage, getLeague, getDisciplineRate } from '../utils/storage';
import { supabase } from '../utils/supabase';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../components/ui/dialog';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { Badge } from '../components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar';
import { Heart, MessageCircle, Plus, X, Image as ImageIcon, Trash2, Trophy, Send, TrendingUp, TrendingDown, Minus, UserPlus, UserCheck, Search } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { PremiumBadge } from '../components/PremiumBadge';

export function Social() {
  const navigate = useNavigate();
  const [posts, setPosts] = useState(storage.getPosts());
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});
  const [showComments, setShowComments] = useState<Record<string, boolean>>({});
  const [likedPosts, setLikedPosts] = useState<Set<string>>(new Set(storage.getLikedPosts()));
  const [leaderboardFilter, setLeaderboardFilter] = useState<'global' | 'friends' | 'weekly' | 'monthly'>('global');
  const [isCreatePostOpen, setIsCreatePostOpen] = useState(false);
  const [newPostText, setNewPostText] = useState('');
  const [newPostType, setNewPostType] = useState<'clean' | 'forfeit' | 'general'>('general');
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [expandedImage, setExpandedImage] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'recommended' | 'following' | 'leaderboard'>('recommended');
  const [followingUsers, setFollowingUsers] = useState<Set<string>>(new Set(storage.getFollowing()));
  const [searchQuery, setSearchQuery] = useState('');
  const currentUser = storage.getCurrentUser();

  const loadPostsFromSupabase = async () => {
    try {
      const { data, error } = await supabase
        .from('posts')
        .select('*')
        .order('timestamp', { ascending: false })
        .limit(50);

      if (data && !error) {
        // Also load comments separately
        const postIds = data.map((p: any) => p.id);
        const { data: commentsData } = await supabase
          .from('comments')
          .select('*')
          .in('post_id', postIds);

        const commentsByPost: Record<string, any[]> = {};
        (commentsData || []).forEach((c: any) => {
          if (!commentsByPost[c.post_id]) commentsByPost[c.post_id] = [];
          commentsByPost[c.post_id].push({
            id: c.id,
            userId: c.user_id,
            username: c.username,
            text: c.text,
            timestamp: c.timestamp,
          });
        });

        const mapped = data.map((p: any) => ({
          id: p.id,
          userId: p.user_id,
          username: p.username,
          avatarUrl: p.avatar_url || '',
          league: p.league || '0',
          isVerified: p.is_verified || false,
          type: p.type || 'general',
          photoUrl: p.photo_url || '',
          images: p.images || [],
          caption: p.caption || '',
          likes: p.likes || 0,
          comments: commentsByPost[p.id] || [],
          timestamp: p.timestamp || Date.now(),
          journalData: p.journal_data || null,
        }));
        setPosts(mapped);
        localStorage.setItem('tradeforge_posts', JSON.stringify(mapped));
      } else {
        setPosts(storage.getPosts());
      }
    } catch {
      setPosts(storage.getPosts());
    }
  };

  useEffect(() => {
    loadPostsFromSupabase();

    // Reload posts when tab becomes visible (user switches back)
    const handleVisibility = () => {
      if (!document.hidden) loadPostsFromSupabase();
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, []);

  const handleLike = (postId: string) => {
    if (likedPosts.has(postId)) {
      // Unlike — purely local
      setPosts(prev => prev.map(p =>
        p.id === postId ? { ...p, likes: Math.max(0, (p.likes || 0) - 1) } : p
      ));
      setLikedPosts(prev => { const s = new Set(prev); s.delete(postId); return s; });
    } else {
      // Like — update storage then sync local state
      storage.likePost(postId);
      setPosts(prev => prev.map(p =>
        p.id === postId ? { ...p, likes: (p.likes || 0) + 1 } : p
      ));
      setLikedPosts(prev => new Set([...prev, postId]));
      const post = posts.find(p => p.id === postId);
      if (post && post.userId !== currentUser?.id) {
        storage.addNotification({ userId: post.userId, type: 'like', fromId: currentUser?.id });
      }
    }
  };

  const handleComment = (postId: string) => {
    if (!currentUser || !commentInputs[postId]?.trim()) return;
    storage.addComment(postId, {
      userId: currentUser.id,
      username: currentUser.username,
      text: commentInputs[postId],
    });
    // Notify post owner
    const post = storage.getPosts().find(p => p.id === postId);
    if (post && post.userId !== currentUser.id) {
      storage.addNotification({ userId: post.userId, type: 'comment', fromId: currentUser.id, text: commentInputs[postId] });
    }
    setPosts(storage.getPosts());
    setCommentInputs({ ...commentInputs, [postId]: '' });
  };

  const toggleComments = (postId: string) => {
    setShowComments({
      ...showComments,
      [postId]: !showComments[postId],
    });
  };

  const formatTimeAgo = (timestamp: number) => {
    const seconds = Math.floor((Date.now() - timestamp) / 1000);
    if (seconds < 60) return 'just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
  };

  const handleCreatePost = () => {
    console.log('handleCreatePost called');
    console.log('currentUser:', currentUser);
    console.log('newPostText:', newPostText);
    console.log('selectedImages:', selectedImages);
    
    if (!currentUser) {
      console.log('No current user, returning');
      return;
    }
    
    // Must have either text or images
    if (!newPostText.trim() && selectedImages.length === 0) {
      console.log('No text or images, returning');
      return;
    }

    console.log('Creating post...');
    const league = getLeague(currentUser.totalPoints || 0);

    // FIX: Store real images from selectedImages
    const post = storage.addPost({
      userId: currentUser.id,
      username: currentUser.username,
      avatarUrl: currentUser.profilePicture,
      league: currentUser.totalPoints?.toString() || '0',
      isVerified: currentUser.isVerified || false,
      photoUrl: selectedImages[0] || '', // FIX: use first selected image
      images: selectedImages, // FIX: store all selected images
      caption: newPostText,
      type: newPostType,
    });

    console.log('Post created:', post);

    // Add activity
    let activityDescription = '';
    if (newPostType === 'clean') {
      activityDescription = '✓ Posted a clean day';
    } else if (newPostType === 'forfeit') {
      activityDescription = '⚡ Posted a forfeit day';
    } else {
      activityDescription = '📝 Shared a post';
    }
    
    storage.addActivity({
      userId: currentUser.id,
      type: 'post',
      description: activityDescription,
      relatedId: post.id,
    });

    console.log('Updating state and closing dialog');
    // Reload from Supabase to get the freshest data
    setTimeout(() => loadPostsFromSupabase(), 500);
    setIsCreatePostOpen(false);
    setNewPostText('');
    setNewPostType('general');
    setSelectedImages([]);
    // FIX: Removed demo alert - images now persist for real
  };

  const handleImageSelect = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.multiple = true;
    input.onchange = (e: any) => {
      const files = Array.from(e.target.files || []) as File[];
      if (files.length > 0) {
        const currentCount = selectedImages.length;
        const remainingSlots = 5 - currentCount;
        const filesToAdd = files.slice(0, remainingSlots);
        
        filesToAdd.forEach(file => {
          const reader = new FileReader();
          reader.onloadend = () => {
            setSelectedImages(prev => [...prev, reader.result as string]);
          };
          reader.readAsDataURL(file);
        });
      }
    };
    input.click();
  };

  const removeImage = (index: number) => {
    setSelectedImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleDeletePost = (postId: string) => {
    if (confirm('Are you sure you want to delete this post?')) {
      storage.deletePost(postId);
      setPosts(storage.getPosts());
    }
  };

  // NEW: Delete own comment
  const handleDeleteComment = (postId: string, commentId: string) => {
    if (confirm('Delete this comment?')) {
      storage.deleteComment(postId, commentId);
      setPosts(storage.getPosts());
    }
  };

  const initializeDemoData = () => {
    // Demo data initialization if needed
  };

  const getResultIcon = (result: string) => {
    switch (result) {
      case 'win':
        return <TrendingUp className="w-5 h-5 text-green-500" />;
      case 'loss':
        return <TrendingDown className="w-5 h-5 text-red-500" />;
      default:
        return <Minus className="w-5 h-5 text-yellow-500" />;
    }
  };

  const getResultBadge = (result: string) => {
    const colors = {
      win: 'bg-green-500/10 text-green-500 border-green-500/20',
      loss: 'bg-red-500/10 text-red-500 border-red-500/20',
      breakeven: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
    };
    return colors[result as keyof typeof colors] || colors.breakeven;
  };

  // Get leaderboard data
  const getLeaderboardData = () => {
    const allUsers = storage.getAllUsers();
    
    const uniqueUsers = Array.from(
      new Map(allUsers.map(user => [user.id, user])).values()
    );
    
    return uniqueUsers
      .map(user => {
        const totalDays = (user.cleanDays || 0) + (user.forfeitDays || 0);
        const disciplineRate = getDisciplineRate(user.cleanDays || 0, totalDays);
        const journalEntries = storage.getJournalEntries().filter(e => e.userId === user.id);
        const dailyCheckCount = (user.cleanDays || 0) + (user.forfeitDays || 0);
        
        return {
          ...user,
          disciplineRate,
          journalCount: journalEntries.length,
          dailyCheckCount,
        };
      })
      .sort((a, b) => {
        // Primary: discipline % DESC, Secondary: total points DESC
        if (b.disciplineRate !== a.disciplineRate) {
          return b.disciplineRate - a.disciplineRate;
        }
        return (b.totalPoints || 0) - (a.totalPoints || 0);
      });
  };

  const leaderboardData = getLeaderboardData();

  // Handle follow/unfollow
  const handleFollowToggle = (userId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (followingUsers.has(userId)) {
      storage.unfollowUser(userId);
      setFollowingUsers(prev => { const s = new Set(prev); s.delete(userId); return s; });
    } else {
      storage.followUser(userId);
      setFollowingUsers(prev => new Set([...prev, userId]));
      // Notify the user being followed
      if (currentUser) {
        storage.addNotification({ userId, type: 'follow', fromId: currentUser.id });
      }
    }
  };

  // Filter posts based on selected tab — following tab shows own posts + followed users, newest first
  const filteredPosts = activeTab === 'following'
    ? posts
        .filter(post => followingUsers.has(post.userId) || post.userId === currentUser?.id)
        .sort((a, b) => b.timestamp - a.timestamp)
    : posts.sort((a, b) => b.timestamp - a.timestamp);

  return (
    <div className="container mx-auto px-4 py-6 max-w-2xl pb-24">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-4">Social</h1>
        
        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search for people..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Show search results if there's a query */}
      {searchQuery.trim() && (
        <Card className="mb-6">
          <CardContent className="pt-4">
            <h3 className="font-semibold mb-3">Search Results</h3>
            <div className="space-y-2">
              {leaderboardData
                .filter(user => 
                  user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  user.name?.toLowerCase().includes(searchQuery.toLowerCase())
                )
                .slice(0, 5)
                .map(user => {
                  const league = getLeague(user.totalPoints || 0);
                  const isFollowing = followingUsers.has(user.id);
                  const isCurrentUser = currentUser?.id === user.id;

                  return (
                    <div key={user.id} className="flex items-center gap-3 p-2 hover:bg-muted rounded-lg transition-colors">
                      <Avatar 
                        className="w-10 h-10 cursor-pointer"
                        onClick={() => navigate(`/app/profile/${user.id}`)}
                      >
                        <AvatarImage src={user.profilePicture} />
                        <AvatarFallback>
                          {user.name?.[0] || user.username?.[0] || '?'}
                        </AvatarFallback>
                      </Avatar>
                      
                      <div 
                        className="flex-1 min-w-0 cursor-pointer"
                        onClick={() => navigate(`/app/profile/${user.id}`)}
                      >
                        <p className="font-semibold text-sm truncate">{user.username}</p>
                        <p className="text-xs text-muted-foreground">{league.name} League</p>
                      </div>

                      {!isCurrentUser && (
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={(e) => { e.stopPropagation(); navigate(`/app/messages/${user.id}`); }}
                            className="h-8 w-8 p-0"
                            title="Send DM"
                          >
                            <MessageCircle className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant={isFollowing ? "outline" : "default"}
                            onClick={(e) => handleFollowToggle(user.id, e)}
                            className="h-8"
                          >
                            {isFollowing ? (
                              <><UserCheck className="w-4 h-4 mr-1" />Following</>
                            ) : (
                              <><UserPlus className="w-4 h-4 mr-1" />Follow</>
                            )}
                          </Button>
                        </div>
                      )}
                    </div>
                  );
                })}
              {leaderboardData.filter(user => 
                user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
                user.name?.toLowerCase().includes(searchQuery.toLowerCase())
              ).length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">No users found</p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="recommended" className="w-full" value={activeTab} onValueChange={(v: any) => setActiveTab(v)}>
        <TabsList className="grid w-full grid-cols-3 mb-6">
          <TabsTrigger value="recommended">Recommended</TabsTrigger>
          <TabsTrigger value="following">Following</TabsTrigger>
          <TabsTrigger value="leaderboard">
            <Trophy className="w-4 h-4 mr-1" />
            Leaderboard
          </TabsTrigger>
        </TabsList>

        <TabsContent value="recommended">
          {posts.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground">No posts yet. Be the first to share your journey!</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {posts.map((post) => {
                const league = getLeague(parseInt(post.league) || 0);
                const leagueColor = {
                  Bronze: 'from-amber-700 to-amber-900',
                  Silver: 'from-slate-400 to-slate-600',
                  Gold: 'from-yellow-400 to-yellow-600',
                  Diamond: 'from-cyan-400 to-blue-600',
                  Platinum: 'from-slate-200 to-slate-400',
                }[league.name] || 'from-slate-400 to-slate-600';

                const isLiked = likedPosts.has(post.id);

                return (
                  <Card key={post.id} className="overflow-hidden group">
                    <CardContent className="p-3 space-y-3">
                      {/* Post Header - Compact */}
                      <div className="flex items-center gap-2">
                        <Avatar 
                          className="w-8 h-8 cursor-pointer" 
                          onClick={() => navigate(`/app/profile/${post.userId}`)}
                        >
                          <AvatarFallback className="text-xs">
                            {post.username.charAt(0).toUpperCase()}
                          </AvatarFallback>
                          <AvatarImage src={post.avatarUrl} />
                        </Avatar>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => navigate(`/app/profile/${post.userId}`)}
                              className="font-semibold text-sm hover:underline truncate"
                            >
                              {post.username}
                            </button>
                            {post.isVerified && (
                              <Badge variant="secondary" className="text-xs px-1 py-0">✓</Badge>
                            )}
                            {post.userId === currentUser?.id && storage.isPremium() && (
                              <PremiumBadge size="sm" />
                            )}
                            <div className={`px-1.5 py-0.5 rounded bg-gradient-to-br ${leagueColor} text-white text-xs font-semibold`}>
                              {league.name[0]}{league.roman}
                            </div>
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {formatTimeAgo(post.timestamp)}
                          </span>
                        </div>
                        
                        {/* Delete Post Button - Only visible on hover */}
                        {currentUser && currentUser.id === post.userId && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDeletePost(post.id)}
                            className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                        {currentUser && currentUser.id !== post.userId && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => navigate(`/app/messages/${post.userId}`)}
                            className="h-8 w-8 p-0 text-muted-foreground hover:text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity"
                            title="Send DM"
                          >
                            <MessageCircle className="w-4 h-4" />
                          </Button>
                        )}
                      </div>

                      {/* Journal Entry Layout */}
                      {post.type === 'journal' && post.journalData ? (
                        <div className="flex items-start gap-4">
                          <div className="flex-shrink-0">
                            <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                              {getResultIcon(post.journalData.result)}
                            </div>
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-2">
                              <Badge className="bg-purple-500/10 text-purple-500 border-purple-500/20 text-xs">
                                📊 Journal
                              </Badge>
                              <p className="font-semibold text-sm">
                                {new Date(post.journalData.date).toLocaleDateString('en-US', {
                                  weekday: 'short',
                                  year: 'numeric',
                                  month: 'short',
                                  day: 'numeric',
                                })}
                              </p>
                              {post.journalData.isNoTradeDay ? (
                                <Badge className="bg-blue-500/10 text-blue-500 border-blue-500/20">
                                  NO TRADE DAY
                                </Badge>
                              ) : (
                                <Badge className={getResultBadge(post.journalData.result)}>
                                  {post.journalData.result.toUpperCase()}
                                </Badge>
                              )}
                              {post.journalData.riskReward && post.journalData.riskReward > 0 && (
                                <Badge variant="outline" className="text-xs">
                                  R:R {post.journalData.riskReward}
                                </Badge>
                              )}
                            </div>
                            
                            {post.caption && (
                              <p className="text-sm text-muted-foreground whitespace-pre-wrap mb-2">
                                {post.caption}
                              </p>
                            )}

                            {post.images && post.images.length > 0 && (
                              <div className="grid grid-cols-3 gap-2 mb-2">
                                {post.images.map((img, i) => (
                                  <img 
                                    key={i} 
                                    src={img} 
                                    alt={`Screenshot ${i + 1}`} 
                                    className="w-full h-20 object-cover rounded cursor-pointer hover:opacity-80 transition-opacity" 
                                    onClick={() => setExpandedImage(img)}
                                  />
                                ))}
                              </div>
                            )}

                            {post.journalData.tags && post.journalData.tags.length > 0 && (
                              <div className="flex flex-wrap gap-1 mb-2">
                                {post.journalData.tags.map((tag, i) => (
                                  <Badge key={i} variant="secondary" className="text-xs">
                                    {tag}
                                  </Badge>
                                ))}
                              </div>
                            )}

                            {post.journalData.customFields && Object.keys(post.journalData.customFields).length > 0 && (
                              <div className="text-xs text-muted-foreground mb-2">
                                {Object.entries(post.journalData.customFields).map(([key, value]) => (
                                  <div key={key}>
                                    <span className="font-medium">{key}:</span> {String(value)}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      ) : (
                        <>
                          {/* Regular Post Image */}
                          {post.photoUrl && (
                            <div className="relative rounded-lg overflow-hidden bg-muted">
                              <img
                                src={post.photoUrl}
                                alt="Post"
                                className="w-full h-auto"
                                style={{ maxHeight: '500px', objectFit: 'contain' }}
                              />
                              <Badge
                                className="absolute top-2 right-2 text-xs"
                                variant={post.type === 'clean' ? 'default' : 'secondary'}
                              >
                                {post.type === 'clean' ? '✓ Clean' : '⚡ Forfeit'}
                              </Badge>
                            </div>
                          )}

                          {/* Regular Post Caption */}
                          <p className="text-sm">{post.caption}</p>
                        </>
                      )}

                      {/* Post Actions - Compact */}
                      <div className="flex items-center gap-4">
                        <button
                          onClick={() => handleLike(post.id)}
                          className={`flex items-center gap-1 text-sm transition-colors ${
                            isLiked ? 'text-red-500' : 'hover:text-red-500'
                          }`}
                          title={isLiked ? 'Unlike' : 'Like'}

                        >
                          <Heart className={`w-5 h-5 ${isLiked ? 'fill-current' : ''}`} />
                          <span>{post.likes}</span>
                        </button>
                        
                        <button
                          onClick={() => toggleComments(post.id)}
                          className="flex items-center gap-1 text-sm hover:text-blue-500 transition-colors"
                        >
                          <MessageCircle className="w-5 h-5" />
                          <span>{post.comments.length}</span>
                        </button>
                      </div>

                      {/* Comments Section */}
                      {post.comments.length > 0 && !showComments[post.id] && (
                        <button
                          onClick={() => toggleComments(post.id)}
                          className="text-xs text-muted-foreground hover:text-foreground"
                        >
                          View all {post.comments.length} comments
                        </button>
                      )}

                      {showComments[post.id] && (
                        <div className="space-y-2 pt-2 border-t">
                          {post.comments.map((comment) => (
                            <div key={comment.id} className="text-sm flex items-start justify-between gap-1 group/comment">
                              <div className="flex items-start gap-1 flex-1 min-w-0">
                                <span className="font-semibold flex-shrink-0">{comment.username}</span>
                                {comment.userId === currentUser?.id && storage.isPremium() && (
                                  <PremiumBadge size="sm" />
                                )}
                                <span className="break-words">{comment.text}</span>
                              </div>
                              {currentUser && comment.userId === currentUser.id && (
                                <button
                                  onClick={() => handleDeleteComment(post.id, comment.id)}
                                  className="opacity-0 group-hover/comment:opacity-100 transition-opacity text-muted-foreground hover:text-destructive flex-shrink-0 ml-1"
                                  title="Delete comment"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              )}
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Inline Comment Input */}
                      {currentUser && (
                        <div className="flex gap-2 pt-2 border-t">
                          <Input
                            placeholder="Add a comment..."
                            value={commentInputs[post.id] || ''}
                            onChange={(e) => setCommentInputs({ ...commentInputs, [post.id]: e.target.value })}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                handleComment(post.id);
                              }
                            }}
                            className="text-sm h-8"
                          />
                          <Button
                            size="sm"
                            onClick={() => handleComment(post.id)}
                            disabled={!commentInputs[post.id]?.trim()}
                            className="h-8 px-3"
                          >
                            <Send className="w-3 h-3" />
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="following">
          {filteredPosts.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground">
                  {followingUsers.size === 0 
                    ? "You're not following anyone yet. Start following traders to see their posts here!"
                    : "No posts from users you follow yet."}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {filteredPosts.map((post) => {
                const league = getLeague(parseInt(post.league) || 0);
                const leagueColor = {
                  Bronze: 'from-amber-700 to-amber-900',
                  Silver: 'from-slate-400 to-slate-600',
                  Gold: 'from-yellow-400 to-yellow-600',
                  Diamond: 'from-cyan-400 to-blue-600',
                  Platinum: 'from-slate-200 to-slate-400',
                }[league.name] || 'from-slate-400 to-slate-600';

                const isLiked = likedPosts.has(post.id);

                return (
                  <Card key={post.id} className="overflow-hidden group">
                    <CardContent className="p-3 space-y-3">
                      {/* Post Header - Compact */}
                      <div className="flex items-center gap-2">
                        <Avatar 
                          className="w-8 h-8 cursor-pointer" 
                          onClick={() => navigate(`/app/profile/${post.userId}`)}
                        >
                          <AvatarFallback className="text-xs">
                            {post.username.charAt(0).toUpperCase()}
                          </AvatarFallback>
                          <AvatarImage src={post.avatarUrl} />
                        </Avatar>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => navigate(`/app/profile/${post.userId}`)}
                              className="font-semibold text-sm hover:underline truncate"
                            >
                              {post.username}
                            </button>
                            {post.isVerified && (
                              <Badge variant="secondary" className="text-xs px-1 py-0">✓</Badge>
                            )}
                            {post.userId === currentUser?.id && storage.isPremium() && (
                              <PremiumBadge size="sm" />
                            )}
                            <div className={`px-1.5 py-0.5 rounded bg-gradient-to-br ${leagueColor} text-white text-xs font-semibold`}>
                              {league.name[0]}{league.roman}
                            </div>
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {formatTimeAgo(post.timestamp)}
                          </span>
                        </div>
                        
                        {/* Delete Post Button - Only visible on hover */}
                        {currentUser && currentUser.id === post.userId && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDeletePost(post.id)}
                            className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>

                      {/* Journal Entry Layout */}
                      {post.type === 'journal' && post.journalData ? (
                        <div className="flex items-start gap-4">
                          <div className="flex-shrink-0">
                            <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                              {getResultIcon(post.journalData.result)}
                            </div>
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-2">
                              <Badge className="bg-purple-500/10 text-purple-500 border-purple-500/20 text-xs">
                                📊 Journal
                              </Badge>
                              <p className="font-semibold text-sm">
                                {new Date(post.journalData.date).toLocaleDateString('en-US', {
                                  weekday: 'short',
                                  year: 'numeric',
                                  month: 'short',
                                  day: 'numeric',
                                })}
                              </p>
                              {post.journalData.isNoTradeDay ? (
                                <Badge className="bg-blue-500/10 text-blue-500 border-blue-500/20">
                                  NO TRADE DAY
                                </Badge>
                              ) : (
                                <Badge className={getResultBadge(post.journalData.result)}>
                                  {post.journalData.result.toUpperCase()}
                                </Badge>
                              )}
                              {post.journalData.riskReward && post.journalData.riskReward > 0 && (
                                <Badge variant="outline" className="text-xs">
                                  R:R {post.journalData.riskReward}
                                </Badge>
                              )}
                            </div>
                            
                            {post.caption && (
                              <p className="text-sm text-muted-foreground whitespace-pre-wrap mb-2">
                                {post.caption}
                              </p>
                            )}

                            {post.images && post.images.length > 0 && (
                              <div className="grid grid-cols-3 gap-2 mb-2">
                                {post.images.map((img, i) => (
                                  <img 
                                    key={i} 
                                    src={img} 
                                    alt={`Screenshot ${i + 1}`} 
                                    className="w-full h-20 object-cover rounded cursor-pointer hover:opacity-80 transition-opacity" 
                                    onClick={() => setExpandedImage(img)}
                                  />
                                ))}
                              </div>
                            )}

                            {post.journalData.tags && post.journalData.tags.length > 0 && (
                              <div className="flex flex-wrap gap-1 mb-2">
                                {post.journalData.tags.map((tag, i) => (
                                  <Badge key={i} variant="secondary" className="text-xs">
                                    {tag}
                                  </Badge>
                                ))}
                              </div>
                            )}

                            {post.journalData.customFields && Object.keys(post.journalData.customFields).length > 0 && (
                              <div className="text-xs text-muted-foreground mb-2">
                                {Object.entries(post.journalData.customFields).map(([key, value]) => (
                                  <div key={key}>
                                    <span className="font-medium">{key}:</span> {String(value)}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      ) : (
                        <>
                          {/* Regular Post Image */}
                          {post.photoUrl && (
                            <div className="relative rounded-lg overflow-hidden bg-muted">
                              <img
                                src={post.photoUrl}
                                alt="Post"
                                className="w-full h-auto"
                                style={{ maxHeight: '500px', objectFit: 'contain' }}
                              />
                              <Badge
                                className="absolute top-2 right-2 text-xs"
                                variant={post.type === 'clean' ? 'default' : 'secondary'}
                              >
                                {post.type === 'clean' ? '✓ Clean' : '⚡ Forfeit'}
                              </Badge>
                            </div>
                          )}

                          {/* Regular Post Caption */}
                          <p className="text-sm">{post.caption}</p>
                        </>
                      )}

                      {/* Post Actions - Compact */}
                      <div className="flex items-center gap-4">
                        <button
                          onClick={() => handleLike(post.id)}
                          className={`flex items-center gap-1 text-sm transition-colors ${
                            isLiked ? 'text-red-500' : 'hover:text-red-500'
                          }`}
                          title={isLiked ? 'Unlike' : 'Like'}

                        >
                          <Heart className={`w-5 h-5 ${isLiked ? 'fill-current' : ''}`} />
                          <span>{post.likes}</span>
                        </button>
                        
                        <button
                          onClick={() => toggleComments(post.id)}
                          className="flex items-center gap-1 text-sm hover:text-blue-500 transition-colors"
                        >
                          <MessageCircle className="w-5 h-5" />
                          <span>{post.comments.length}</span>
                        </button>
                      </div>

                      {/* Comments Section */}
                      {post.comments.length > 0 && !showComments[post.id] && (
                        <button
                          onClick={() => toggleComments(post.id)}
                          className="text-xs text-muted-foreground hover:text-foreground"
                        >
                          View all {post.comments.length} comments
                        </button>
                      )}

                      {showComments[post.id] && (
                        <div className="space-y-2 pt-2 border-t">
                          {post.comments.map((comment) => (
                            <div key={comment.id} className="text-sm flex items-start justify-between gap-1 group/comment">
                              <div className="flex items-start gap-1 flex-1 min-w-0">
                                <span className="font-semibold flex-shrink-0">{comment.username}</span>
                                {comment.userId === currentUser?.id && storage.isPremium() && (
                                  <PremiumBadge size="sm" />
                                )}
                                <span className="break-words">{comment.text}</span>
                              </div>
                              {currentUser && comment.userId === currentUser.id && (
                                <button
                                  onClick={() => handleDeleteComment(post.id, comment.id)}
                                  className="opacity-0 group-hover/comment:opacity-100 transition-opacity text-muted-foreground hover:text-destructive flex-shrink-0 ml-1"
                                  title="Delete comment"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              )}
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Inline Comment Input */}
                      {currentUser && (
                        <div className="flex gap-2 pt-2 border-t">
                          <Input
                            placeholder="Add a comment..."
                            value={commentInputs[post.id] || ''}
                            onChange={(e) => setCommentInputs({ ...commentInputs, [post.id]: e.target.value })}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                handleComment(post.id);
                              }
                            }}
                            className="text-sm h-8"
                          />
                          <Button
                            size="sm"
                            onClick={() => handleComment(post.id)}
                            disabled={!commentInputs[post.id]?.trim()}
                            className="h-8 px-3"
                          >
                            <Send className="w-3 h-3" />
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="leaderboard">
          <div className="space-y-4">
            {/* Filters */}
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">Filter:</span>
                  <Select value={leaderboardFilter} onValueChange={(v: any) => setLeaderboardFilter(v)}>
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="global">Global</SelectItem>
                      <SelectItem value="friends">Friends</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Leaderboard List */}
            <div className="space-y-2">
              {leaderboardData.map((user, index) => {
                const league = getLeague(user.totalPoints || 0);
                const rankColors = ['text-yellow-500', 'text-slate-400', 'text-amber-700'];
                const rankColor = index < 3 ? rankColors[index] : 'text-muted-foreground';

                return (
                  <Card 
                    key={user.id} 
                    className="cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => navigate(`/app/profile/${user.id}`)}
                  >
                    <CardContent className="p-3">
                      <div className="flex items-center gap-3">
                        {/* Rank */}
                        <div className={`text-xl font-bold w-7 text-center flex-shrink-0 ${rankColor}`}>
                          {index === 0 && '🥇'}
                          {index === 1 && '🥈'}
                          {index === 2 && '🥉'}
                          {index > 2 && `#${index + 1}`}
                        </div>

                        {/* Avatar */}
                        <Avatar className="w-10 h-10 flex-shrink-0">
                          <AvatarImage src={user.profilePicture} />
                          <AvatarFallback className="text-sm">
                            {user.name?.[0] || user.username?.[0] || '?'}
                          </AvatarFallback>
                        </Avatar>

                        {/* Left: name + league + daily checks */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 mb-0.5">
                            <p className="font-semibold text-sm truncate">{user.username}</p>
                            {user.isVerified && (
                              <Badge className="bg-blue-500 text-white text-xs px-1 py-0 h-4">✓</Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <span className="font-medium">{league.name}{league.roman ? ` ${league.roman}` : ''}</span>
                            <span>·</span>
                            <span>{user.dailyCheckCount} check-ins</span>
                          </div>
                        </div>

                        {/* Right: discipline % (primary) + points (secondary) */}
                        <div className="text-right flex-shrink-0">
                          <div className={`text-xl font-bold ${
                            user.disciplineRate >= 80 ? 'text-green-500' :
                            user.disciplineRate >= 60 ? 'text-yellow-500' : 'text-red-500'
                          }`}>
                            {user.disciplineRate}%
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {(user.totalPoints || 0).toLocaleString()} pts
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {leaderboardData.length === 0 && (
              <Card>
                <CardContent className="py-12 text-center">
                  <Trophy className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground">No traders on the leaderboard yet</p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Floating Add Post Button */}
      <Button
        onClick={() => setIsCreatePostOpen(true)}
        size="lg"
        className="fixed bottom-24 right-8 w-14 h-14 rounded-full shadow-lg z-10"
      >
        <Plus className="w-6 h-6" />
      </Button>

      {/* Create Post Dialog */}
      <Dialog open={isCreatePostOpen} onOpenChange={setIsCreatePostOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Create a New Post</DialogTitle>
            <DialogDescription>
              Share your journey with the community!
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Textarea
              placeholder="What's happening?"
              value={newPostText}
              onChange={(e) => setNewPostText(e.target.value)}
              className="h-20"
            />
            
            {/* Image Previews */}
            {selectedImages.length > 0 && (
              <div className="grid grid-cols-3 gap-2">
                {selectedImages.map((url, index) => (
                  <div key={index} className="relative aspect-square">
                    <img
                      src={url}
                      alt={`Selected ${index + 1}`}
                      className="w-full h-full object-cover rounded"
                    />
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => removeImage(index)}
                      className="absolute top-1 right-1 h-6 w-6 p-0 rounded-full"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}

            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={handleImageSelect}
                disabled={selectedImages.length >= 5}
                className="h-9"
              >
                <ImageIcon className="w-4 h-4 mr-2" />
                Add Photos ({selectedImages.length}/5)
              </Button>

              <Select value={newPostType} onValueChange={(v: any) => setNewPostType(v)}>
                <SelectTrigger className="w-[180px] h-9">
                  <SelectValue placeholder="Post type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="general">📝 General</SelectItem>
                  <SelectItem value="clean">✓ Clean Day</SelectItem>
                  <SelectItem value="forfeit">⚡ Forfeit Day</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <Button
            size="lg"
            onClick={handleCreatePost}
            disabled={!newPostText.trim() && selectedImages.length === 0}
            className="mt-4 w-full"
          >
            Post
          </Button>
        </DialogContent>
      </Dialog>

      {/* Image Expansion Dialog */}
      <Dialog open={!!expandedImage} onOpenChange={() => setExpandedImage(null)}>
        <DialogContent className="sm:max-w-4xl">
          <DialogHeader>
            <DialogTitle>Image Preview</DialogTitle>
            <DialogDescription>Expanded view of the selected image</DialogDescription>
          </DialogHeader>
          <img src={expandedImage || ''} alt="Expanded view" className="w-full h-auto" />
        </DialogContent>
      </Dialog>
    </div>
  );
}
