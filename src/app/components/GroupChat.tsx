import { useState, useEffect, useRef } from 'react';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Label } from './ui/label';
import { Input } from './ui/input';
import { Hash, Plus, Send, Paperclip, ArrowLeft, X } from 'lucide-react';
import { storage } from '../utils/storage';
import { supabase } from '../utils/supabase';

interface GroupChatProps {
  groupId: string;
  currentUserId: string;
  currentUsername: string;
  isAdmin: boolean;
  groupMembers: string[];
}

export function GroupChat({ groupId, currentUserId, currentUsername, isAdmin, groupMembers }: GroupChatProps) {
  const [channels, setChannels] = useState<any[]>([]);
  const [selectedChannel, setSelectedChannel] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [messageInput, setMessageInput] = useState('');
  const [showMentions, setShowMentions] = useState(false);
  const [mentionSearch, setMentionSearch] = useState('');
  const [cursorPos, setCursorPos] = useState(0);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newChannelName, setNewChannelName] = useState('');
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({});
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Load channels from Supabase
  useEffect(() => {
    const loadChannels = async () => {
      const { data } = await supabase.from('group_channels').select('*').eq('group_id', groupId).order('created_at', { ascending: true });
      if (data && data.length > 0) {
        setChannels(data.map((c: any) => ({ id: c.id, name: c.name, description: c.description || '', isDefault: c.is_default })));
      } else {
        // Create default general channel
        const channelId = `ch_${Date.now()}`;
        await supabase.from('group_channels').insert({ id: channelId, group_id: groupId, name: 'general', description: 'General discussion', created_by: currentUserId, is_default: true });
        setChannels([{ id: channelId, name: 'general', description: 'General discussion', isDefault: true }]);
      }
    };
    loadChannels();
  }, [groupId]);

  // Load messages when channel selected
  useEffect(() => {
    if (!selectedChannel) return;
    const loadMessages = async () => {
      const { data } = await supabase.from('group_messages').select('*').eq('channel_id', selectedChannel.id).order('timestamp', { ascending: true }).limit(100);
      if (data) setMessages(data.map((m: any) => ({ id: m.id, userId: m.user_id, username: m.username, content: m.content, mentions: m.mentions || [], attachments: m.attachments || [], timestamp: m.timestamp })));
    };
    loadMessages();
    const interval = setInterval(loadMessages, 4000);
    return () => clearInterval(interval);
  }, [selectedChannel?.id]);

  useEffect(() => {
    setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
  }, [messages]);

  const handleSendMessage = () => {
    if (!messageInput.trim() || !selectedChannel) return;
    const text = messageInput.trim();

    // Extract mentions and notify
    const mentions: string[] = [];
    const mentionRegex = /@(\w+)/g;
    let match;
    while ((match = mentionRegex.exec(text)) !== null) {
      const uname = match[1];
      if (uname === 'everyone') {
        groupMembers.forEach(id => { if (id !== currentUserId) mentions.push(id); });
      } else {
        const user = storage.getAllUsers().find(u => u.username === uname);
        if (user && groupMembers.includes(user.id) && user.id !== currentUserId) mentions.push(user.id);
      }
    }
    mentions.forEach(uid => storage.addNotification({ userId: uid, type: 'dm', fromId: currentUserId, text: `@${currentUsername} in #${selectedChannel.name}: ${text.slice(0, 50)}` }));

    const msgId = `msg_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    const newMsg = { id: msgId, userId: currentUserId, username: currentUsername, content: text, mentions, attachments: [], timestamp: Date.now() };
    setMessages(prev => [...prev, newMsg]);
    setMessageInput('');
    setShowMentions(false);

    supabase.from('group_messages').insert({ id: msgId, channel_id: selectedChannel.id, group_id: groupId, user_id: currentUserId, username: currentUsername, content: text, mentions, attachments: [], timestamp: newMsg.timestamp });
    inputRef.current?.focus();
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedChannel) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      const msgId = `msg_${Date.now()}`;
      const attachment = { type: file.type.startsWith('image/') ? 'image' : 'file', url: reader.result as string, name: file.name, size: file.size };
      const newMsg = { id: msgId, userId: currentUserId, username: currentUsername, content: '', mentions: [], attachments: [attachment], timestamp: Date.now() };
      setMessages(prev => [...prev, newMsg]);
      supabase.from('group_messages').insert({ id: msgId, channel_id: selectedChannel.id, group_id: groupId, user_id: currentUserId, username: currentUsername, content: '', mentions: [], attachments: [attachment], timestamp: newMsg.timestamp });
    };
    reader.readAsDataURL(file);
  };

  const handleCreateChannel = async () => {
    if (!newChannelName.trim()) return;
    const channelId = `ch_${Date.now()}`;
    const chName = newChannelName.trim().toLowerCase().replace(/\s+/g, '-');
    await supabase.from('group_channels').insert({ id: channelId, group_id: groupId, name: chName, description: '', created_by: currentUserId, is_default: false });
    const ch = { id: channelId, name: chName, description: '', isDefault: false };
    setChannels(prev => [...prev, ch]);
    setNewChannelName('');
    setShowCreateModal(false);
  };

  const formatTime = (ts: number) => {
    const d = new Date(ts);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const renderContent = (content: string) => content.split(/(@\w+)/g).map((part, i) =>
    part.startsWith('@') ? <span key={i} className="text-blue-400 font-semibold">{part}</span> : <span key={i}>{part}</span>
  );

  const getMentionSuggestions = () => {
    const allUsers = storage.getAllUsers().filter(u => groupMembers.includes(u.id));
    const filtered = allUsers.filter(u => u.username.toLowerCase().includes(mentionSearch));
    return [{ id: '@everyone', username: 'everyone', name: 'Notify everyone' }, ...filtered.slice(0, 5)];
  };

  // CHANNEL LIST VIEW
  if (!selectedChannel) {
    return (
      <div className="flex flex-col h-full bg-background">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b bg-card">
          <h2 className="font-bold text-base">Channels</h2>
          {isAdmin && (
            <Button size="sm" variant="ghost" onClick={() => setShowCreateModal(true)}>
              <Plus className="w-4 h-4 mr-1" />Add Channel
            </Button>
          )}
        </div>

        {/* Channel List */}
        <div className="flex-1 overflow-y-auto">
          {channels.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground text-sm">No channels yet</div>
          ) : channels.map(ch => (
            <button key={ch.id} onClick={() => setSelectedChannel(ch)}
              className="w-full flex items-center gap-3 px-4 py-3.5 border-b hover:bg-muted transition-colors text-left">
              <div className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                <Hash className="w-4 h-4 text-muted-foreground" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm"># {ch.name}</p>
                {ch.description && <p className="text-xs text-muted-foreground truncate">{ch.description}</p>}
              </div>
              {(unreadCounts[ch.id] || 0) > 0 && (
                <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full flex-shrink-0">
                  {unreadCounts[ch.id] > 99 ? '99+' : unreadCounts[ch.id]}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Create Channel Modal */}
        <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
          <DialogContent className="max-w-sm">
            <DialogHeader><DialogTitle>Create Channel</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div><Label>Channel Name</Label><Input placeholder="e.g., trading-signals" value={newChannelName} onChange={e => setNewChannelName(e.target.value)} className="mt-1" /></div>
              <Button onClick={handleCreateChannel} className="w-full" disabled={!newChannelName.trim()}>Create Channel</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  // CHAT VIEW
  return (
    <div className="flex flex-col h-full bg-background">
      {/* Chat header */}
      <div className="flex items-center gap-2 px-3 py-2.5 border-b bg-card flex-shrink-0">
        <Button size="icon" variant="ghost" className="h-8 w-8 flex-shrink-0" onClick={() => setSelectedChannel(null)}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="w-7 h-7 rounded-md bg-muted flex items-center justify-center flex-shrink-0">
          <Hash className="w-3.5 h-3.5 text-muted-foreground" />
        </div>
        <span className="font-bold text-sm">{selectedChannel.name}</span>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-4 min-h-0">
        {messages.length === 0 ? (
          <div className="text-center text-muted-foreground py-12">
            <Hash className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="text-sm font-medium">Welcome to #{selectedChannel.name}</p>
            <p className="text-xs mt-1">Be the first to send a message!</p>
          </div>
        ) : messages.map((msg, i) => {
          const isOwn = msg.userId === currentUserId;
          const showHeader = i === 0 || messages[i - 1].userId !== msg.userId || (msg.timestamp - messages[i - 1].timestamp) > 300000;
          return (
            <div key={msg.id} className="flex gap-2.5">
              {showHeader ? (
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0 mt-0.5">
                  {msg.username[0].toUpperCase()}
                </div>
              ) : <div className="w-9 flex-shrink-0" />}
              <div className="flex-1 min-w-0">
                {showHeader && (
                  <div className="flex items-baseline gap-2 mb-0.5">
                    <span className={`font-bold text-sm ${isOwn ? 'text-blue-400' : ''}`}>{msg.username}</span>
                    <span className="text-xs text-muted-foreground">{formatTime(msg.timestamp)}</span>
                  </div>
                )}
                {msg.content && <p className="text-sm leading-relaxed break-words">{renderContent(msg.content)}</p>}
                {msg.attachments?.map((att: any, j: number) => (
                  <div key={j} className="mt-1">
                    {att.type === 'image' ? (
                      <img src={att.url} alt={att.name} className="max-w-xs rounded-xl border max-h-64 object-cover" />
                    ) : (
                      <div className="flex items-center gap-2 p-2 bg-muted rounded-lg text-xs max-w-xs">
                        <Paperclip className="w-3.5 h-3.5 flex-shrink-0" />
                        <span className="truncate">{att.name}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Message input */}
      <div className="px-3 py-3 border-t flex-shrink-0 bg-card">
        <input ref={fileInputRef} type="file" className="hidden" onChange={handleFileUpload} accept="image/*,.pdf,.doc,.txt" />

        {/* Mention suggestions */}
        {showMentions && (
          <div className="mb-2 bg-card border rounded-xl shadow-lg overflow-hidden">
            {getMentionSuggestions().map(s => (
              <button key={s.id} onClick={() => {
                const before = messageInput.slice(0, cursorPos);
                const atIdx = before.lastIndexOf('@');
                const newText = messageInput.slice(0, atIdx) + `@${s.username} ` + messageInput.slice(cursorPos);
                setMessageInput(newText);
                setShowMentions(false);
                inputRef.current?.focus();
              }} className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-muted text-left text-sm border-b last:border-0">
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                  {s.username[0].toUpperCase()}
                </div>
                <div>
                  <p className="font-semibold text-sm">@{s.username}</p>
                  <p className="text-xs text-muted-foreground">{s.name}</p>
                </div>
              </button>
            ))}
          </div>
        )}

        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="h-9 w-9 flex-shrink-0 rounded-full" onClick={() => fileInputRef.current?.click()}>
            <Plus className="w-5 h-5" />
          </Button>
          <input
            ref={inputRef}
            value={messageInput}
            onChange={e => {
              const val = e.target.value;
              const pos = e.target.selectionStart || 0;
              setMessageInput(val);
              setCursorPos(pos);
              const before = val.slice(0, pos);
              const atIdx = before.lastIndexOf('@');
              if (atIdx !== -1 && !before.slice(atIdx).includes(' ')) {
                setMentionSearch(before.slice(atIdx + 1).toLowerCase());
                setShowMentions(true);
              } else {
                setShowMentions(false);
              }
            }}
            onKeyDown={e => {
              if (e.key === 'Escape') setShowMentions(false);
              if (e.key === 'Enter') { e.preventDefault(); handleSendMessage(); }
            }}
            placeholder={`Message #${selectedChannel.name}`}
            className="flex-1 px-4 py-2 text-sm bg-muted rounded-full border-0 focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <Button size="icon" className="h-9 w-9 flex-shrink-0 rounded-full" onClick={handleSendMessage} disabled={!messageInput.trim()}>
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
