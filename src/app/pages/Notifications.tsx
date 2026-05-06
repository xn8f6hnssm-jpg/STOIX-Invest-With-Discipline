import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar';
import { Badge } from '../components/ui/badge';
import { Bell, Heart, MessageCircle, UserPlus, Trophy, CheckCircle, Check } from 'lucide-react';
import { storage } from '../utils/storage';
import { supabase } from '../utils/supabase';

const NOTIF_ICONS: Record<string, any> = {
  like:       { icon: Heart,         color: 'text-red-500',    bg: 'bg-red-500/10'    },
  comment:    { icon: MessageCircle, color: 'text-blue-500',   bg: 'bg-blue-500/10'   },
  follow:     { icon: UserPlus,      color: 'text-green-500',  bg: 'bg-green-500/10'  },
  dm:         { icon: MessageCircle, color: 'text-purple-500', bg: 'bg-purple-500/10' },
  achievement:{ icon: Trophy,        color: 'text-yellow-500', bg: 'bg-yellow-500/10' },
  clean_day:  { icon: CheckCircle,   color: 'text-green-500',  bg: 'bg-green-500/10'  },
};

const NOTIF_LABELS: Record<string, string> = {
  like:        'liked your post',
  comment:     'commented on your post',
  follow:      'started following you',
  dm:          'sent you a message',
  achievement: 'You earned an achievement!',
  clean_day:   'You completed a clean day! +25 pts',
};

export function Notifications() {
  const navigate = useNavigate();
  const currentUser = storage.getCurrentUser();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [userMap, setUserMap] = useState<Record<string, any>>({});

  useEffect(() => {
    if (currentUser) loadNotifications();
  }, []);

  const loadNotifications = async () => {
    if (!currentUser) return;

    // Load from Supabase first
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', currentUser.id)
      .order('timestamp', { ascending: false })
      .limit(50);

    let notifs: any[] = [];
    if (data && !error) {
      notifs = data.map((n: any) => ({
        id: n.id,
        userId: n.user_id,
        type: n.type,
        fromId: n.from_id,
        text: n.text,
        read: n.read || false,
        timestamp: n.timestamp,
      }));
    } else {
      // Fall back to localStorage
      notifs = storage.getNotifications(currentUser.id);
    }

    setNotifications(notifs);

    // Load user details for all fromIds
    const fromIds = [...new Set(notifs.map(n => n.fromId).filter(Boolean))];
    if (fromIds.length > 0) {
      const { data: users } = await supabase
        .from('users')
        .select('id, username, name, profile_picture')
        .in('id', fromIds);
      if (users) {
        const map: Record<string, any> = {};
        users.forEach((u: any) => { map[u.id] = u; });
        setUserMap(map);
      }
    }
  };

  const markAllRead = async () => {
    if (!currentUser) return;
    await supabase.from('notifications').update({ read: true }).eq('user_id', currentUser.id);
    storage.markNotificationsAsRead(currentUser.id);
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const handleNotifClick = async (notif: any) => {
    await supabase.from('notifications').update({ read: true }).eq('id', notif.id);
    setNotifications(prev => prev.map(n => n.id === notif.id ? { ...n, read: true } : n));

    if (notif.type === 'dm' && notif.fromId) navigate(`/app/messages/${notif.fromId}`);
    else if (notif.type === 'follow' && notif.fromId) navigate(`/app/profile/${notif.fromId}`);
    else if (notif.type === 'like' || notif.type === 'comment') navigate('/app/social');
    else if (notif.type === 'achievement') navigate('/app/achievements');
  };

  const formatTime = (ts: number) => {
    const diff = Date.now() - ts;
    if (diff < 60000) return 'just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return `${Math.floor(diff / 86400000)}d ago`;
  };

  const unreadCount = notifications.filter(n => !n.read).length;
  if (!currentUser) return null;

  return (
    <div className="container mx-auto px-4 py-6 max-w-2xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            Notifications
            {unreadCount > 0 && <Badge className="bg-primary text-primary-foreground">{unreadCount}</Badge>}
          </h1>
          <p className="text-muted-foreground text-sm mt-1">Your latest activity and updates</p>
        </div>
        {unreadCount > 0 && (
          <Button variant="outline" size="sm" onClick={markAllRead}>
            <Check className="w-4 h-4 mr-2" />Mark all read
          </Button>
        )}
      </div>

      {notifications.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <Bell className="w-14 h-14 mx-auto mb-4 text-muted-foreground opacity-40" />
            <p className="font-semibold text-lg mb-1">No notifications yet</p>
            <p className="text-sm text-muted-foreground">You'll see likes, comments, follows, and messages here</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {notifications.map(notif => {
            const config = NOTIF_ICONS[notif.type] || NOTIF_ICONS.like;
            const Icon = config.icon;
            const fromUser = notif.fromId ? userMap[notif.fromId] : null;
            const label = NOTIF_LABELS[notif.type] || 'New notification';

            return (
              <button key={notif.id} onClick={() => handleNotifClick(notif)}
                className={`w-full flex items-start gap-4 p-4 rounded-xl border transition-colors text-left hover:bg-muted ${
                  !notif.read ? 'bg-primary/5 border-primary/20' : 'bg-card border-transparent'
                }`}>
                <div className="relative flex-shrink-0">
                  {fromUser ? (
                    <Avatar className="w-11 h-11">
                      <AvatarImage src={fromUser.profile_picture} />
                      <AvatarFallback>{fromUser.name?.[0] || fromUser.username?.[0] || '?'}</AvatarFallback>
                    </Avatar>
                  ) : (
                    <div className={`w-11 h-11 rounded-full ${config.bg} flex items-center justify-center`}>
                      <Icon className={`w-5 h-5 ${config.color}`} />
                    </div>
                  )}
                  {fromUser && (
                    <div className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full ${config.bg} flex items-center justify-center border-2 border-background`}>
                      <Icon className={`w-3 h-3 ${config.color}`} />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm leading-snug">
                    {fromUser && <span className="font-semibold">{fromUser.name || fromUser.username} </span>}
                    <span className={!notif.read ? 'text-foreground' : 'text-muted-foreground'}>{label}</span>
                  </p>
                  {notif.text && notif.type === 'dm' && (
                    <p className="text-xs text-muted-foreground mt-1 truncate">"{notif.text}"</p>
                  )}
                  <p className="text-xs text-muted-foreground mt-1">{formatTime(notif.timestamp)}</p>
                </div>
                {!notif.read && <div className="w-2 h-2 rounded-full bg-primary flex-shrink-0 mt-2" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
