import { useState, useEffect, useRef } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Label } from './ui/label';
import { Hash, Plus, Send, Paperclip, X, ChevronLeft, ChevronRight } from 'lucide-react';
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
  const [channels, setChannels] = useState(storage.getGroupChannels(groupId));
  const [selectedChannelId, setSelectedChannelId] = useState<string>('');
  const [messages, setMessages] = useState<any[]>([]);
  const [messageInput, setMessageInput] = useState('');
  const [showSidebar, setShowSidebar] = useState(false); // collapsed by default on mobile
  const [showCreateChannelModal, setShowCreateChannelModal] = useState(false);
  const [newChannelName, setNewChannelName] = useState('');
  const [showMentions, setShowMentions] = useState(false);
  const [mentionSearch, setMentionSearch] = useState('');
  const [cursorPos, setCursorPos] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const loadChannels = async () => {
      // Load from Supabase
      const { data } = await supabase.from('group_channels').select('*').eq('group_id', groupId).order('created_at', { ascending: true });
      if (data && data.length > 0) {
        const mapped = data.map((c: any) => ({ id: c.id, groupId: c.group_id, name: c.name, description: c.description || '', createdBy: c.created_by, isDefault: c.is_default }));
        setChannels(mapped);
        setSelectedChannelId(mapped[0].id);
      } else {
        // Create default general channel
        const channelId = `ch_${Date.now()}`;
        const { data: newCh } = await supabase.from('group_channels').insert({ id: channelId, group_id: groupId, name: 'general', description: 'General discussion', created_by: currentUserId, is_default: true }).select().maybeSingle();
        if (newCh) {
          const ch = { id: newCh.id, groupId: newCh.group_id, name: newCh.name, description: newCh.description || '', createdBy: newCh.created_by, isDefault: newCh.is_default };
          setChannels([ch]);
          setSelectedChannelId(ch.id);
        }
      }
    };
    loadChannels();
  }, [groupId]);

  useEffect(() => {
    if (!selectedChannelId) return;
    const loadMessages = async () => {
      const { data } = await supabase.from('group_messages').select('*').eq('channel_id', selectedChannelId).order('timestamp', { ascending: true }).limit(100);
      if (data) {
        setMessages(data.map((m: any) => ({ id: m.id, channelId: m.channel_id, groupId: m.group_id, userId: m.user_id, username: m.username, content: m.content, mentions: m.mentions || [], attachments: m.attachments || [], timestamp: m.timestamp })));
      }
    };
    loadMessages();
    // Poll every 4 seconds for new messages
    const interval = setInterval(loadMessages, 4000);
    return () => clearInterval(interval);
  }, [selectedChannelId]);

  useEffect(() => {
    setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
  }, [messages]);

  const handleSendMessage = () => {
    if (!messageInput.trim() || !selectedChannelId) return;
    const text = messageInput.trim();
    // Extract mentions
    const mentionRegex = /@(\w+)/g;
    const mentions: string[] = [];
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
    // Send notifications
    mentions.forEach(uid => {
      storage.addNotification({ userId: uid, type: 'dm', fromId: currentUserId, text: `@${currentUsername}: ${text.slice(0, 50)}` });
    });
    const msgId = `msg_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    const newMsg = { id: msgId, channelId: selectedChannelId, groupId, userId: currentUserId, username: currentUsername, content: text, mentions, attachments: [], timestamp: Date.now() };
    setMessages(prev => [...prev, newMsg]);
    // Save to Supabase
    supabase.from('group_messages').insert({ id: msgId, channel_id: selectedChannelId, group_id: groupId, user_id: currentUserId, username: currentUsername, content: text, mentions, attachments: [], timestamp: newMsg.timestamp }).then(({ error }) => { if (error) console.error('Message save error:', error); });
    setMessageInput('');
    setShowMentions(false);
    inputRef.current?.focus();
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedChannelId) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      const newMsg = storage.addGroupMessage({
        channelId: selectedChannelId, groupId,
        userId: currentUserId, username: currentUsername,
        content: `Shared a file`, mentions: [],
        attachments: [{ type: file.type.startsWith('image/') ? 'image' : 'file', url: reader.result as string, name: file.name, size: file.size }],
      });
      setMessages(prev => [...prev, newMsg]);
    };
    reader.readAsDataURL(file);
  };

  const handleCreateChannel = async () => {
    if (!newChannelName.trim()) return;
    const channelId = `ch_${Date.now()}`;
    const chName = newChannelName.trim().toLowerCase().replace(/\s+/g, '-');
    const { data } = await supabase.from('group_channels').insert({ id: channelId, group_id: groupId, name: chName, description: '', created_by: currentUserId, is_default: false }).select().maybeSingle();
    if (data) {
      const ch = { id: data.id, groupId: data.group_id, name: data.name, description: '', createdBy: data.created_by, isDefault: false };
      setChannels(prev => [...prev, ch]);
      setSelectedChannelId(ch.id);
    }
    setNewChannelName('');
    setShowCreateChannelModal(false);
    setShowSidebar(false);
  };

  const selectChannel = (channelId: string) => {
    setSelectedChannelId(channelId);
    setShowSidebar(false); // auto-close sidebar on mobile after selection
  };

  const formatTime = (ts: number) => {
    const d = new Date(ts), now = new Date(), diff = now.getTime() - ts;
    if (diff < 86400000) return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  const renderContent = (content: string) => content.split(/(@\w+)/g).map((part, i) =>
    part.startsWith('@') ? <span key={i} className="text-blue-500 font-semibold">{part}</span> : <span key={i}>{part}</span>
  );

  const selectedChannel = channels.find(c => c.id === selectedChannelId);

  return (
    <div className="flex h-full relative overflow-hidden" style={{ height: 'calc(100dvh - 130px)' }}>

      {/* Channel sidebar — slides in from left as overlay */}
      {showSidebar && (
        <>
          {/* Backdrop */}
          <div className="absolute inset-0 z-20 bg-black/40" onClick={() => setShowSidebar(false)} />
          {/* Sidebar panel */}
          <div className="absolute left-0 top-0 bottom-0 z-30 w-56 bg-card border-r flex flex-col shadow-2xl">
            <div className="flex items-center justify-between px-3 py-3 border-b">
              <span className="font-bold text-sm">Channels</span>
              <div className="flex items-center gap-1">
                {isAdmin && (
                  <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setShowCreateChannelModal(true)}>
                    <Plus className="w-4 h-4" />
                  </Button>
                )}
                <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setShowSidebar(false)}>
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
              {channels.map(ch => (
                <button key={ch.id} onClick={() => { setSelectedChannelId(ch.id); setShowSidebar(false); }}
                  className={`w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm transition-colors text-left ${selectedChannelId === ch.id ? 'bg-primary text-primary-foreground font-semibold' : 'hover:bg-muted text-muted-foreground hover:text-foreground'}`}>
                  <Hash className="w-4 h-4 flex-shrink-0" />
                  <span className="truncate">{ch.name}</span>
                </button>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Main chat area — full width */}
      <div className="flex-1 flex flex-col min-w-0 w-full">
        {/* Channel header with arrow to open sidebar */}
        <div className="flex items-center gap-2 px-3 py-2 border-b bg-card flex-shrink-0">
          <Button size="icon" variant="ghost" className="h-8 w-8 flex-shrink-0" onClick={() => setShowSidebar(true)}>
            <ChevronRight className="w-5 h-5" />
          </Button>
          <Hash className="w-4 h-4 text-muted-foreground flex-shrink-0" />
          <span className="font-semibold text-sm truncate">{selectedChannel?.name || 'general'}</span>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-3 space-y-3 min-h-0">
          {messages.length === 0 ? (
            <div className="text-center text-muted-foreground py-12">
              <Hash className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p className="text-sm">No messages yet. Say hello!</p>
            </div>
          ) : messages.map((msg, i) => {
            const isOwn = msg.userId === currentUserId;
            const showUsername = i === 0 || messages[i - 1].userId !== msg.userId;
            return (
              <div key={msg.id} className="flex gap-2.5">
                {showUsername ? (
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold text-xs flex-shrink-0 mt-0.5">
                    {msg.username[0].toUpperCase()}
                  </div>
                ) : (
                  <div className="w-8 flex-shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  {showUsername && (
                    <div className="flex items-baseline gap-2 mb-0.5">
                      <span className={`font-semibold text-xs ${isOwn ? 'text-primary' : ''}`}>@{msg.username}</span>
                      <span className="text-xs text-muted-foreground">{formatTime(msg.timestamp)}</span>
                    </div>
                  )}
                  <p className="text-sm break-words leading-relaxed">{renderContent(msg.content)}</p>
                  {msg.attachments?.map((att: any, j: number) => (
                    <div key={j} className="mt-1">
                      {att.type === 'image' ? (
                        <img src={att.url} alt={att.name} className="max-w-xs rounded-lg border max-h-48 object-cover" />
                      ) : (
                        <div className="flex items-center gap-2 p-2 bg-muted rounded text-xs max-w-xs">
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

        {/* Input */}
        <div className="p-3 border-t flex-shrink-0 bg-card">
          <input ref={fileInputRef} type="file" className="hidden" onChange={handleFileUpload} accept="image/*,.pdf,.doc,.txt" />
          <div className="flex gap-2">
            <Button variant="ghost" size="icon" className="h-9 w-9 flex-shrink-0" onClick={() => fileInputRef.current?.click()}>
              <Paperclip className="w-4 h-4" />
            </Button>
            <div className="flex-1 relative">
              {showMentions && (() => {
                const allUsers = storage.getAllUsers();
                const members = allUsers.filter(u => groupMembers.includes(u.id));
                const suggestions = [
                  { id: '@everyone', username: 'everyone', name: 'Notify everyone' },
                  ...members.filter(m => m.username.toLowerCase().includes(mentionSearch) || (m.name || '').toLowerCase().includes(mentionSearch)).slice(0, 5)
                ];
                return (
                  <div className="absolute bottom-full left-0 right-0 mb-1 bg-card border rounded-lg shadow-lg overflow-hidden z-30">
                    {suggestions.map(s => (
                      <button key={s.id} onClick={() => {
                        const text = messageInput;
                        const before = text.slice(0, cursorPos);
                        const atIdx = before.lastIndexOf('@');
                        const newText = text.slice(0, atIdx) + `@${s.username} ` + text.slice(cursorPos);
                        setMessageInput(newText);
                        setShowMentions(false);
                        inputRef.current?.focus();
                      }} className="w-full flex items-center gap-3 px-3 py-2 hover:bg-muted text-left text-sm">
                        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                          {s.username[0].toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium">@{s.username}</p>
                          <p className="text-xs text-muted-foreground">{s.name}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                );
              })()}
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
                  if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage(); }
                }}
                placeholder={`Message #${selectedChannel?.name || 'general'} — use @ to mention`}
                className="w-full px-3 py-2 text-sm border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <Button size="icon" className="h-9 w-9 flex-shrink-0" onClick={handleSendMessage} disabled={!messageInput.trim()}>
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Create Channel Modal */}
      <Dialog open={showCreateChannelModal} onOpenChange={setShowCreateChannelModal}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Create Channel</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Channel Name</Label>
              <Input placeholder="e.g., trading-signals" value={newChannelName} onChange={e => setNewChannelName(e.target.value)} className="mt-1" />
            </div>
            <Button onClick={handleCreateChannel} className="w-full" disabled={!newChannelName.trim()}>Create Channel</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
