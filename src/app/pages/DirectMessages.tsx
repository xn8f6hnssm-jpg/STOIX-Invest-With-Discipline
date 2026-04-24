import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar';
import { MessageCircle, Search, Send, ArrowLeft, Image as ImageIcon, Crown, X, Trash2 } from 'lucide-react';
import { storage } from '../utils/storage';

export function DirectMessages() {
  const { userId: paramUserId } = useParams<{ userId?: string }>();
  const navigate = useNavigate();
  const currentUser = storage.getCurrentUser();
  const [conversations, setConversations] = useState<any[]>([]);
  const [activePartnerId, setActivePartnerId] = useState<string | null>(paramUserId || null);
  const [activePartner, setActivePartner] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [hoveredMsgId, setHoveredMsgId] = useState<string | null>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const isPremium = storage.isPremium();

  useEffect(() => { if (currentUser) loadConversations(); }, []);
  useEffect(() => { if (paramUserId && paramUserId !== activePartnerId) setActivePartnerId(paramUserId); }, [paramUserId]);
  useEffect(() => {
    if (!activePartnerId || !currentUser) return;
    const allUsers = storage.getAllUsers();
    setActivePartner(allUsers.find(u => u.id === activePartnerId) || null);
    const msgs = storage.getDMConversation(currentUser.id, activePartnerId);
    setMessages(msgs);
    storage.markDMsAsRead(currentUser.id, activePartnerId);
    loadConversations();
  }, [activePartnerId]);
  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const loadConversations = () => {
    if (!currentUser) return;
    setConversations(storage.getDMConversations(currentUser.id));
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (!query.trim()) { setSearchResults([]); return; }
    const results = storage.getAllUsers().filter(u =>
      u.id !== currentUser?.id &&
      (u.username.toLowerCase().includes(query.toLowerCase()) || u.name?.toLowerCase().includes(query.toLowerCase()))
    ).slice(0, 8);
    setSearchResults(results);
  };

  const openConversation = (partnerId: string) => {
    setActivePartnerId(partnerId);
    setSearchQuery(''); setSearchResults([]);
    navigate(`/app/messages/${partnerId}`, { replace: true });
  };

  const sendMessage = async () => {
    if (!newMessage.trim() && !imagePreview) return;
    if (!currentUser || !activePartnerId) return;
    let uploadedUrl: string | undefined;
    if (imagePreview) uploadedUrl = await storage.uploadImage(imagePreview, currentUser.id, undefined, 'dm_img');
    storage.sendDirectMessage(currentUser.id, activePartnerId, newMessage.trim(), uploadedUrl);
    setNewMessage(''); setImagePreview(null);
    setMessages(storage.getDMConversation(currentUser.id, activePartnerId));
    loadConversations();
  };

  const handleDeleteMessage = (msgId: string) => {
    if (!currentUser || !activePartnerId) return;
    // Delete from storage
    if (storage.deleteDMMessage) {
      storage.deleteDMMessage(msgId, currentUser.id, activePartnerId);
    } else {
      // Fallback: filter from localStorage directly
      const key = `dm_${[currentUser.id, activePartnerId].sort().join('_')}`;
      try {
        const msgs = JSON.parse(localStorage.getItem(key) || '[]');
        const updated = msgs.filter((m: any) => m.id !== msgId);
        localStorage.setItem(key, JSON.stringify(updated));
      } catch {}
    }
    setMessages(storage.getDMConversation(currentUser.id, activePartnerId));
    loadConversations();
  };

  const handleDeleteConversation = (partnerId: string) => {
    if (!currentUser) return;
    if (!confirm('Delete this entire conversation? This cannot be undone.')) return;
    const key = `dm_${[currentUser.id, partnerId].sort().join('_')}`;
    localStorage.removeItem(key);
    if (activePartnerId === partnerId) {
      setActivePartnerId(null);
      setMessages([]);
      navigate('/app/messages', { replace: true });
    }
    loadConversations();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  const formatTime = (ts: number) => {
    const d = new Date(ts), now = new Date(), diff = now.getTime() - ts;
    if (diff < 60000) return 'just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    return d.toLocaleDateString();
  };

  if (!currentUser) return null;

  return (
    <div className="container mx-auto px-0 py-0 max-w-4xl h-[calc(100vh-120px)]">
      <div className="flex h-full border rounded-xl overflow-hidden">

        {/* Sidebar */}
        <div className={`w-full md:w-80 flex-shrink-0 border-r flex flex-col ${activePartnerId ? 'hidden md:flex' : 'flex'}`}>
          <div className="p-4 border-b">
            <h1 className="text-xl font-bold mb-3">Messages</h1>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder="Search users..." className="pl-10" value={searchQuery} onChange={e => handleSearch(e.target.value)} />
            </div>
          </div>

          {searchResults.length > 0 && (
            <div className="border-b">
              <p className="text-xs text-muted-foreground px-4 pt-2 pb-1 font-medium">Users</p>
              {searchResults.map(user => (
                <button key={user.id} onClick={() => openConversation(user.id)} className="w-full flex items-center gap-3 px-4 py-3 hover:bg-muted transition-colors text-left">
                  <Avatar className="w-9 h-9"><AvatarImage src={user.profilePicture} /><AvatarFallback>{user.name?.[0] || user.username?.[0]}</AvatarFallback></Avatar>
                  <div><p className="font-semibold text-sm">{user.name || user.username}</p><p className="text-xs text-muted-foreground">@{user.username}</p></div>
                </button>
              ))}
            </div>
          )}

          <div className="flex-1 overflow-y-auto">
            {conversations.length === 0 && !searchQuery && (
              <div className="flex flex-col items-center justify-center h-full text-center p-6">
                <MessageCircle className="w-12 h-12 text-muted-foreground mb-3" />
                <p className="text-sm text-muted-foreground">No conversations yet</p>
              </div>
            )}
            {conversations.map(conv => (
              <div key={conv.partnerId} className={`group flex items-center gap-0 border-b ${activePartnerId === conv.partnerId ? 'bg-muted' : ''}`}>
                <button onClick={() => openConversation(conv.partnerId)} className="flex-1 flex items-center gap-3 px-4 py-3 hover:bg-muted transition-colors text-left">
                  <div className="relative">
                    <Avatar className="w-10 h-10"><AvatarImage src={conv.partner?.profilePicture} /><AvatarFallback>{conv.partner?.name?.[0] || '?'}</AvatarFallback></Avatar>
                    {conv.unreadCount > 0 && (
                      <div className="absolute -top-1 -right-1 w-5 h-5 bg-primary rounded-full flex items-center justify-center">
                        <span className="text-xs text-primary-foreground font-bold">{conv.unreadCount}</span>
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="font-semibold text-sm truncate">{conv.partner?.name || conv.partner?.username || 'Unknown'}</p>
                      {conv.lastMessage && <p className="text-xs text-muted-foreground flex-shrink-0 ml-2">{formatTime(conv.lastMessage.timestamp)}</p>}
                    </div>
                    {conv.lastMessage && (
                      <p className={`text-xs truncate mt-0.5 ${conv.unreadCount > 0 ? 'font-medium text-foreground' : 'text-muted-foreground'}`}>
                        {conv.lastMessage.fromId === currentUser.id ? 'You: ' : ''}{conv.lastMessage.text}
                      </p>
                    )}
                  </div>
                </button>
                {/* Delete conversation button */}
                <button onClick={() => handleDeleteConversation(conv.partnerId)} className="px-2 py-3 text-muted-foreground hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all" title="Delete conversation">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Chat Area */}
        <div className={`flex-1 flex flex-col ${!activePartnerId ? 'hidden md:flex' : 'flex'}`}>
          {!activePartnerId ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-6">
              <MessageCircle className="w-16 h-16 text-muted-foreground mb-4" />
              <h2 className="text-xl font-bold mb-2">Your Messages</h2>
              <p className="text-sm text-muted-foreground">Select a conversation or search for a trader to message</p>
            </div>
          ) : (
            <>
              {/* Chat Header */}
              <div className="flex items-center gap-3 p-4 border-b">
                <Button variant="ghost" size="icon" className="md:hidden" onClick={() => { setActivePartnerId(null); navigate('/app/messages', { replace: true }); }}>
                  <ArrowLeft className="w-5 h-5" />
                </Button>
                <Avatar className="w-9 h-9"><AvatarImage src={activePartner?.profilePicture} /><AvatarFallback>{activePartner?.name?.[0] || '?'}</AvatarFallback></Avatar>
                <div>
                  <p className="font-semibold">{activePartner?.name || activePartner?.username || 'Unknown'}</p>
                  <p className="text-xs text-muted-foreground">@{activePartner?.username}</p>
                </div>
                <Button variant="ghost" size="sm" className="ml-auto" onClick={() => navigate(`/app/profile/${activePartnerId}`)}>View Profile</Button>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {messages.length === 0 && (
                  <div className="flex flex-col items-center justify-center h-full text-center">
                    <p className="text-muted-foreground text-sm">No messages yet. Say hello! 👋</p>
                  </div>
                )}
                {messages.map((msg, i) => {
                  const isMe = msg.fromId === currentUser.id;
                  const showTime = i === 0 || (msg.timestamp - messages[i - 1].timestamp) > 300000;
                  return (
                    <div key={msg.id}>
                      {showTime && <p className="text-xs text-muted-foreground text-center my-2">{formatTime(msg.timestamp)}</p>}
                      <div
                        className={`flex ${isMe ? 'justify-end' : 'justify-start'} gap-2 group`}
                        onMouseEnter={() => setHoveredMsgId(msg.id)}
                        onMouseLeave={() => setHoveredMsgId(null)}
                      >
                        {!isMe && (
                          <Avatar className="w-7 h-7 flex-shrink-0 mt-1"><AvatarImage src={activePartner?.profilePicture} /><AvatarFallback className="text-xs">{activePartner?.name?.[0] || '?'}</AvatarFallback></Avatar>
                        )}
                        <div className={`max-w-[70%] rounded-2xl text-sm ${isMe ? 'bg-primary text-primary-foreground rounded-br-sm' : 'bg-muted rounded-bl-sm'} ${msg.imageUrl ? 'overflow-hidden p-0' : 'px-4 py-2'}`}>
                          {msg.imageUrl && <img src={msg.imageUrl} alt="Shared image" className="max-w-[240px] max-h-[240px] object-cover rounded-2xl" loading="lazy" />}
                          {msg.text && <p className={msg.imageUrl ? 'px-3 py-2 text-sm' : ''}>{msg.text}</p>}
                        </div>
                        {/* Delete button — only for sender's messages */}
                        {isMe && hoveredMsgId === msg.id && (
                          <button
                            onClick={() => handleDeleteMessage(msg.id)}
                            className="self-center text-muted-foreground hover:text-red-500 transition-colors p-1 rounded"
                            title="Delete message"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <div className="p-4 border-t">
                {imagePreview && (
                  <div className="relative inline-block mb-2">
                    <img src={imagePreview} alt="Preview" className="h-20 rounded-lg border object-cover" />
                    <button onClick={() => setImagePreview(null)} className="absolute -top-1 -right-1 w-5 h-5 bg-destructive text-white rounded-full flex items-center justify-center text-xs">
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                )}
                <div className="flex gap-2">
                  <Button variant="ghost" size="icon" onClick={() => { if (!isPremium) { navigate('/app/upgrade'); return; } imageInputRef.current?.click(); }} title={isPremium ? 'Send image' : 'Premium feature'} className={isPremium ? 'text-blue-500' : 'text-muted-foreground'}>
                    {isPremium ? <ImageIcon className="w-5 h-5" /> : <Crown className="w-4 h-4" />}
                  </Button>
                  <input ref={imageInputRef} type="file" accept="image/*" onChange={e => { const file = e.target.files?.[0]; if (!file) return; if (file.size > 5*1024*1024) { alert('Max 5MB'); return; } const r = new FileReader(); r.onloadend = () => setImagePreview(r.result as string); r.readAsDataURL(file); }} className="hidden" />
                  <Input placeholder="Type a message..." value={newMessage} onChange={e => setNewMessage(e.target.value)} onKeyDown={handleKeyDown} className="flex-1" />
                  <Button onClick={sendMessage} disabled={!newMessage.trim() && !imagePreview} size="icon"><Send className="w-4 h-4" /></Button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
