import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router';
import { storage, getLeague } from '../utils/storage';
import { supabase } from '../utils/supabase';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { ArrowLeft, MessageCircle, Trophy, Target, XCircle, UserPlus, UserCheck, Edit, Check, X } from 'lucide-react';

export function UserProfile() {
  const { userId } = useParams();
  const navigate = useNavigate();
  const currentUser = storage.getCurrentUser();
  const [user, setUser] = useState<any>(null);
  const [posts, setPosts] = useState<any[]>([]);
  const [isFollowing, setIsFollowing] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedName, setEditedName] = useState('');
  const [editedUsername, setEditedUsername] = useState('');
  const [followersList, setFollowersList] = useState<any[]>([]);
  const [followingList, setFollowingList] = useState<any[]>([]);
  const [showFollowers, setShowFollowers] = useState(false);
  const [showFollowing, setShowFollowing] = useState(false);
  const [followerCount, setFollowerCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);

  useEffect(() => {
    loadProfile();
  }, [userId]);

  const loadProfile = async () => {
    if (!userId) return;

    // Load user from Supabase first, fall back to localStorage
    const { data: supabaseUser } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (supabaseUser) {
      const mapped = {
        id: supabaseUser.id,
        email: supabaseUser.email,
        username: supabaseUser.username,
        name: supabaseUser.name,
        tradingStyle: supabaseUser.trading_style,
        totalPoints: supabaseUser.total_points || 0,
        cleanDays: supabaseUser.clean_days || 0,
        forfeitDays: supabaseUser.forfeit_days || 0,
        currentStreak: supabaseUser.current_streak || 0,
        isVerified: supabaseUser.is_verified || false,
        isPremium: supabaseUser.is_premium || false,
        profilePicture: supabaseUser.profile_picture || '',
      };
      setUser(mapped);
    } else {
      const allUsers = storage.getAllUsers();
      const found = allUsers.find(u => u.id === userId);
      if (found) setUser(found);
    }

    // Load posts from Supabase
    const { data: postsData } = await supabase
      .from('posts')
      .select('*')
      .eq('user_id', userId)
      .order('timestamp', { ascending: false })
      .limit(20);

    if (postsData) {
      setPosts(postsData.map((p: any) => ({
        id: p.id, userId: p.user_id, username: p.username,
        photoUrl: p.photo_url || '', images: p.images || [],
        caption: p.caption || '', likes: p.likes || 0,
        comments: [], type: p.type || 'general', timestamp: p.timestamp,
      })));
    }

    // Load follower/following counts from Supabase following table
    const [{ data: followers }, { data: following }, { data: isFollowingData }] = await Promise.all([
      supabase.from('following').select('follower_id').eq('following_id', userId),
      supabase.from('following').select('following_id').eq('follower_id', userId),
      currentUser ? supabase.from('following').select('id').eq('follower_id', currentUser.id).eq('following_id', userId).maybeSingle() : Promise.resolve({ data: null }),
    ]);

    setFollowerCount(followers?.length || 0);
    setFollowingCount(following?.length || 0);
    setIsFollowing(!!isFollowingData);
  };

  const loadFollowersList = async () => {
    if (!userId) return;
    const { data } = await supabase
      .from('following')
      .select('follower_id')
      .eq('following_id', userId);

    const ids = (data || []).map((r: any) => r.follower_id);
    if (ids.length > 0) {
      const { data: users } = await supabase
        .from('users')
        .select('id, username, name, profile_picture, total_points')
        .in('id', ids);
      setFollowersList(users || []);
    } else {
      setFollowersList([]);
    }
    setShowFollowers(true);
  };

  const loadFollowingList = async () => {
    if (!userId) return;
    const { data } = await supabase
      .from('following')
      .select('following_id')
      .eq('follower_id', userId);

    const ids = (data || []).map((r: any) => r.following_id);
    if (ids.length > 0) {
      const { data: users } = await supabase
        .from('users')
        .select('id, username, name, profile_picture, total_points')
        .in('id', ids);
      setFollowingList(users || []);
    } else {
      setFollowingList([]);
    }
    setShowFollowing(true);
  };

  const [followLoading, setFollowLoading] = useState(false);

  const handleFollowToggle = async () => {
    if (!userId || !currentUser || followLoading) return;
    setFollowLoading(true);

    if (isFollowing) {
      // Optimistic update first
      setIsFollowing(false);
      setFollowerCount(prev => Math.max(0, prev - 1));
      storage.unfollowUser(userId);
      try {
        await supabase.from('following')
          .delete()
          .eq('follower_id', currentUser.id)
          .eq('following_id', userId);
      } catch (err) {
        // Revert on error
        setIsFollowing(true);
        setFollowerCount(prev => prev + 1);
        console.error('Unfollow error:', err);
      }
    } else {
      // Optimistic update first
      setIsFollowing(true);
      setFollowerCount(prev => prev + 1);
      storage.followUser(userId);
      try {
        // Check if already exists first to avoid duplicate error
        const { data: existing } = await supabase
          .from('following')
          .select('id')
          .eq('follower_id', currentUser.id)
          .eq('following_id', userId)
          .maybeSingle();

        if (!existing) {
          await supabase.from('following').insert({
            follower_id: currentUser.id,
            following_id: userId,
          });
        }
        storage.addNotification({ userId, type: 'follow', fromId: currentUser.id });
      } catch (err) {
        // Revert on error
        setIsFollowing(false);
        setFollowerCount(prev => Math.max(0, prev - 1));
        console.error('Follow error:', err);
      }
    }
    setFollowLoading(false);
  };

  const handleEditToggle = () => {
    if (isEditing) {
      if (user) {
        storage.updateUser(userId || '', {
          name: editedName || user.name,
          username: editedUsername || user.username,
        });
        setUser({ ...user, name: editedName || user.name, username: editedUsername || user.username });
      }
      setIsEditing(false);
    } else {
      setEditedName(user.name || '');
      setEditedUsername(user.username || '');
      setIsEditing(true);
    }
  };

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-6 max-w-2xl">
        <Card><CardContent className="py-12 text-center">
          <p className="text-muted-foreground">Loading profile...</p>
        </CardContent></Card>
      </div>
    );
  }

  const league = getLeague(user.totalPoints || 0);
  const isOwnProfile = currentUser?.id === user.id;

  const leagueGradients: Record<string, string> = {
    Bronze: 'from-amber-700 to-amber-900',
    Silver: 'from-slate-400 to-slate-600',
    Gold: 'from-yellow-400 to-yellow-600',
    Diamond: 'from-cyan-400 to-blue-600',
    Platinum: 'from-slate-200 to-slate-400',
  };

  const UserListItem = ({ u }: { u: any }) => (
    <div className="flex items-center gap-3 p-2 hover:bg-muted rounded-lg cursor-pointer"
      onClick={() => { setShowFollowers(false); setShowFollowing(false); navigate(`/app/profile/${u.id}`); }}>
      <Avatar className="w-10 h-10">
        <AvatarImage src={u.profile_picture} />
        <AvatarFallback>{u.name?.[0] || u.username?.[0] || '?'}</AvatarFallback>
      </Avatar>
      <div>
        <p className="font-semibold text-sm">{u.name || u.username}</p>
        <p className="text-xs text-muted-foreground">@{u.username}</p>
      </div>
    </div>
  );

  return (
    <div className="container mx-auto px-4 py-6 max-w-2xl pb-24">
      <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="mb-4">
        <ArrowLeft className="w-4 h-4 mr-2" />Back
      </Button>

      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex items-start gap-4 mb-6">
            <Avatar className="w-20 h-20">
              <AvatarImage src={user.profilePicture} />
              <AvatarFallback className="text-2xl">{user.name?.[0] || user.username?.[0] || '?'}</AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h1 className="text-xl font-bold">{user.name || user.username}</h1>
                {user.isVerified && <Badge className="bg-blue-500">✓</Badge>}
              </div>
              <p className="text-muted-foreground text-sm mb-2">@{user.username}</p>
              {user.tradingStyle && <p className="text-sm text-muted-foreground mb-3">{user.tradingStyle}</p>}
              {!isOwnProfile && (
                <Button onClick={() => navigate(`/app/messages/${user.id}`)} size="sm" variant="outline">
                  <MessageCircle className="w-4 h-4 mr-2" />DM
                </Button>
              )}
            </div>
          </div>

          {/* League */}
          <div className={`w-full h-20 rounded-lg bg-gradient-to-r ${leagueGradients[league.name] || 'from-slate-400 to-slate-600'} flex items-center justify-center mb-4`}>
            <div className="text-center text-white">
              <Trophy className="w-6 h-6 mx-auto mb-1" />
              <h3 className="text-lg font-bold">{league.name} League</h3>
              <p className="text-xs opacity-90">{user.totalPoints || 0} Points</p>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 text-center mb-4">
            <div>
              <div className="text-2xl font-bold text-green-500">{user.cleanDays || 0}</div>
              <p className="text-xs text-muted-foreground">Clean Days</p>
            </div>
            <div>
              <div className="text-2xl font-bold text-red-500">{user.forfeitDays || 0}</div>
              <p className="text-xs text-muted-foreground">Forfeit Days</p>
            </div>
            <div>
              <div className="text-2xl font-bold text-blue-500">{user.currentStreak || 0}</div>
              <p className="text-xs text-muted-foreground">Streak</p>
            </div>
          </div>

          {/* Followers / Following — clickable */}
          <div className="grid grid-cols-2 gap-4 text-center mb-4">
            <button onClick={loadFollowersList} className="p-3 rounded-lg bg-muted hover:bg-muted/80 transition-colors">
              <div className="text-2xl font-bold">{followerCount}</div>
              <p className="text-xs text-muted-foreground">Followers</p>
            </button>
            <button onClick={loadFollowingList} className="p-3 rounded-lg bg-muted hover:bg-muted/80 transition-colors">
              <div className="text-2xl font-bold">{followingCount}</div>
              <p className="text-xs text-muted-foreground">Following</p>
            </button>
          </div>

          {/* Actions */}
          {!isOwnProfile && (
            <Button onClick={handleFollowToggle} size="sm" variant={isFollowing ? 'secondary' : 'default'} className="w-full" disabled={followLoading}>
              {followLoading ? 'Please wait...' : isFollowing ? <><UserCheck className="w-4 h-4 mr-2" />Following</> : <><UserPlus className="w-4 h-4 mr-2" />Follow</>}
            </Button>
          )}

          {isOwnProfile && (
            <div className="space-y-3">
              <div className="flex gap-2">
                <Button onClick={handleEditToggle} size="sm" variant={isEditing ? 'secondary' : 'default'}>
                  {isEditing ? <><Check className="w-4 h-4 mr-2" />Save</> : <><Edit className="w-4 h-4 mr-2" />Edit Profile</>}
                </Button>
                {isEditing && (
                  <Button onClick={() => setIsEditing(false)} size="sm" variant="outline">
                    <X className="w-4 h-4 mr-2" />Cancel
                  </Button>
                )}
              </div>
              {isEditing && (
                <div className="space-y-3">
                  <div><Label>Name</Label><Input value={editedName} onChange={e => setEditedName(e.target.value)} className="mt-1" /></div>
                  <div><Label>Username</Label><Input value={editedUsername} onChange={e => setEditedUsername(e.target.value)} className="mt-1" /></div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Posts grid */}
      <h2 className="text-lg font-bold mb-3">Posts</h2>
      {posts.length === 0 ? (
        <Card><CardContent className="py-8 text-center"><p className="text-muted-foreground text-sm">No posts yet</p></CardContent></Card>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          {posts.map(post => (
            <Card key={post.id} className="overflow-hidden cursor-pointer hover:shadow-md transition-shadow">
              <div className="aspect-square bg-muted relative">
                {post.photoUrl ? (
                  <img src={post.photoUrl} alt="Post" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs p-2 text-center">{post.caption?.substring(0, 40) || 'No image'}</div>
                )}
                <Badge className="absolute top-1 right-1 text-xs py-0" variant={post.type === 'clean' || post.type === 'general' ? 'default' : 'secondary'}>
                  {post.type === 'clean' ? '✓' : post.type === 'forfeit' ? '⚡' : '📝'}
                </Badge>
              </div>
              <CardContent className="p-2">
                <p className="text-xs truncate">{post.caption}</p>
                <div className="flex gap-2 text-xs text-muted-foreground mt-1">
                  <span>{post.likes} ♥</span>
                  <span>{post.comments?.length || 0} 💬</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Followers Dialog */}
      <Dialog open={showFollowers} onOpenChange={setShowFollowers}>
        <DialogContent className="max-w-sm max-h-[70vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Followers ({followerCount})</DialogTitle></DialogHeader>
          <div className="space-y-1 pt-2">
            {followersList.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">No followers yet</p>
            ) : followersList.map(u => <UserListItem key={u.id} u={u} />)}
          </div>
        </DialogContent>
      </Dialog>

      {/* Following Dialog */}
      <Dialog open={showFollowing} onOpenChange={setShowFollowing}>
        <DialogContent className="max-w-sm max-h-[70vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Following ({followingCount})</DialogTitle></DialogHeader>
          <div className="space-y-1 pt-2">
            {followingList.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">Not following anyone yet</p>
            ) : followingList.map(u => <UserListItem key={u.id} u={u} />)}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
