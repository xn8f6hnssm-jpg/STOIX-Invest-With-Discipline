import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router';
import { storage, getLeague } from '../utils/storage';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
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

  useEffect(() => {
    // Find user from all users
    const allUsers = storage.getAllUsers();
    const foundUser = allUsers.find(u => u.id === userId);
    if (foundUser) {
      setUser(foundUser);
      const userPosts = storage.getPosts().filter(p => p.userId === userId);
      setPosts(userPosts);
      setIsFollowing(storage.isFollowing(userId || ''));
    }
  }, [userId]);

  const handleDM = () => {
    if (user) {
      navigate(`/app/messages/${user.id}`);
    }
  };

  const handleFollowToggle = () => {
    if (!userId) return;
    
    if (isFollowing) {
      storage.unfollowUser(userId);
      setIsFollowing(false);
    } else {
      storage.followUser(userId);
      setIsFollowing(true);
    }
  };

  const handleEditToggle = () => {
    if (isEditing) {
      // Save changes
      if (user) {
        storage.updateUser(userId || '', {
          name: editedName || user.name,
          username: editedUsername || user.username,
        });
        // Update local user state
        setUser({
          ...user,
          name: editedName || user.name,
          username: editedUsername || user.username,
        });
      }
      setIsEditing(false);
    } else {
      // Set initial values for editing
      setEditedName(user.name || '');
      setEditedUsername(user.username || '');
      setIsEditing(true);
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditedName(user.name || '');
    setEditedUsername(user.username || '');
  };

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-6 max-w-2xl">
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">User not found</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const league = getLeague(user.totalPoints || 0);
  const isOwnProfile = currentUser?.id === user.id;

  const leagueGradients = {
    Bronze: 'from-amber-700 to-amber-900',
    Silver: 'from-slate-400 to-slate-600',
    Gold: 'from-yellow-400 to-yellow-600',
    Diamond: 'from-cyan-400 to-blue-600',
    Platinum: 'from-slate-200 to-slate-400',
  };

  return (
    <div className="container mx-auto px-4 py-6 max-w-2xl pb-24">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => navigate('/app/social')}
        className="mb-4"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Social
      </Button>

      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex items-start gap-4 mb-6">
            <Avatar className="w-20 h-20">
              <AvatarImage src={user.profilePicture} />
              <AvatarFallback className="text-2xl">
                {user.name?.[0] || user.username?.[0] || '?'}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h1 className="text-2xl font-bold">{user.name || user.username}</h1>
                {user.isVerified && (
                  <Badge className="bg-blue-500">✓ Verified</Badge>
                )}
              </div>
              <p className="text-muted-foreground mb-2">@{user.username}</p>
              
              {user.tradingStyle && (
                <p className="text-sm text-muted-foreground mb-3">
                  {user.tradingStyle}
                </p>
              )}

              {!isOwnProfile && (
                <Button onClick={handleDM} size="sm">
                  <MessageCircle className="w-4 h-4 mr-2" />
                  DM
                </Button>
              )}
            </div>
          </div>

          {/* League Badge */}
          <div className="mb-4">
            <div className={`w-full h-24 rounded-lg bg-gradient-to-r ${leagueGradients[league.name as keyof typeof leagueGradients]} flex items-center justify-center`}>
              <div className="text-center text-white">
                <Trophy className="w-8 h-8 mx-auto mb-2" />
                <h3 className="text-xl font-bold">{league.name} League</h3>
                <p className="text-sm opacity-90">{user.totalPoints || 0} Points</p>
              </div>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="flex items-center justify-center gap-1 text-green-500 mb-1">
                <Target className="w-4 h-4" />
                <span className="text-2xl font-bold">{user.cleanDays || 0}</span>
              </div>
              <p className="text-xs text-muted-foreground">Clean Days</p>
            </div>
            <div>
              <div className="flex items-center justify-center gap-1 text-red-500 mb-1">
                <XCircle className="w-4 h-4" />
                <span className="text-2xl font-bold">{user.forfeitDays || 0}</span>
              </div>
              <p className="text-xs text-muted-foreground">Forfeit Days</p>
            </div>
            <div>
              <div className="text-2xl font-bold text-blue-500 mb-1">
                {user.currentStreak || 0}
              </div>
              <p className="text-xs text-muted-foreground">Current Streak</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mt-4 text-center">
            <div>
              <div className="text-2xl font-bold">{user.followers || 0}</div>
              <p className="text-xs text-muted-foreground">Followers</p>
            </div>
            <div>
              <div className="text-2xl font-bold">{user.following || 0}</div>
              <p className="text-xs text-muted-foreground">Following</p>
            </div>
          </div>

          {!isOwnProfile && (
            <Button
              onClick={handleFollowToggle}
              size="sm"
              className="mt-4"
              variant={isFollowing ? 'secondary' : 'default'}
            >
              {isFollowing ? (
                <UserCheck className="w-4 h-4 mr-2" />
              ) : (
                <UserPlus className="w-4 h-4 mr-2" />
              )}
              {isFollowing ? 'Unfollow' : 'Follow'}
            </Button>
          )}

          {isOwnProfile && (
            <div className="mt-4">
              <Button
                onClick={handleEditToggle}
                size="sm"
                className="mr-2"
                variant={isEditing ? 'secondary' : 'default'}
              >
                {isEditing ? (
                  <Check className="w-4 h-4 mr-2" />
                ) : (
                  <Edit className="w-4 h-4 mr-2" />
                )}
                {isEditing ? 'Save' : 'Edit'}
              </Button>
              {isEditing && (
                <Button
                  onClick={handleCancelEdit}
                  size="sm"
                  className="mr-2"
                  variant="destructive"
                >
                  <X className="w-4 h-4 mr-2" />
                  Cancel
                </Button>
              )}
            </div>
          )}

          {isEditing && (
            <div className="mt-4">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={editedName}
                onChange={(e) => setEditedName(e.target.value)}
                className="mt-1"
              />
              <Label htmlFor="username" className="mt-2">Username</Label>
              <Input
                id="username"
                value={editedUsername}
                onChange={(e) => setEditedUsername(e.target.value)}
                className="mt-1"
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* User's Posts */}
      <h2 className="text-xl font-bold mb-4">Recent Posts</h2>
      {posts.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground">No posts yet</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {posts.map((post) => (
            <Card key={post.id} className="overflow-hidden cursor-pointer hover:shadow-md transition-shadow">
              <div className="aspect-square bg-muted relative">
                {post.photoUrl ? (
                  <img
                    src={post.photoUrl}
                    alt="Post"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs">
                    No image
                  </div>
                )}
                <Badge
                  className="absolute top-1 right-1 text-xs py-0"
                  variant={(post.type === 'clean' || post.type === 'general') ? 'default' : 'secondary'}
                >
                  {post.type === 'clean' ? '✓' : post.type === 'forfeit' ? '⚡' : '📝'}
                </Badge>
              </div>
              <CardContent className="p-2">
                <p className="text-xs truncate mb-1">{post.caption}</p>
                <div className="flex gap-3 text-xs text-muted-foreground">
                  <span>{post.likes} ♥</span>
                  <span>{post.comments?.length || 0} 💬</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}