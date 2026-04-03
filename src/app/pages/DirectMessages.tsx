import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router';
import { Card, CardContent } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar';
import { Badge } from '../components/ui/badge';
import { MessageCircle, Search, Send, ArrowLeft, Image as ImageIcon, Crown, X } from 'lucide-react';
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
  const imageInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const isPremium = storage.isPremium();

  useEffect(() => {
    if (!currentUser) return;
    loadConversations();
  }, []);

  useEffect(() => {
    if (paramUserId && paramUserId !== activePartnerId) {
      setActivePartnerId(paramUserId);
    }
  }, [paramUserId]);

  useEffect(() => {
    if (!activePartnerId || !currentUser) return;
    const allUsers = storage.getAllUsers();
    const partner = allUsers.find(u => u.id === activePartnerId);
    setActivePartner(partner || null);
    const msgs = storage.getDMConversation(currentUser.id, activePartnerId);
    setMessages(msgs);
    storage.markDMsAsRead(currentUser.id, activePartnerId);
    loadConversations();
  }, [activePartnerId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const loadConversations = () => {
    if (!currentUser) return;
    const convos = storage.getDMConversations(currentUser.id);
    setConversations(convos);
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (!query.trim()) { setSearchResults([]); return; }
    const allUsers = storage.getAllUsers();
    const results = allUsers.filter(u =>
      u.id !== currentUser?.id &&
      (u.username.toLowerCase().includes(query.toLowerCase()) ||
       u.name?.toLowerCase().includes(query.toLowerCase()))
    ).slice(0, 8);
    setSearchResults(results);
  };

  const openConversation = (partnerId: string) => {
    setActivePartnerId(partnerId);
    setSearchQuery('');
    setSearchResults([]);
    navigate(`/app/messages/${partnerId}`, { replace: true });
  };

  const sendMessage = async () => {
    if (!newMessage.trim() && !imagePreview) return;
    if (!currentUser || !activePartnerId) return;

    let uploadedUrl: string | undefined;
    if (imagePreview) {
      // Upload image via storage helper
      uploadedUrl = await storage.uploadImage(imagePreview, currentUser.id, undefined, 'dm_img');
    }

    storage.sendDirectMessage(currentUser.id, activePartnerId, newMessage.trim(), uploadedUrl);
    setNewMessage('');
    setImagePreview(null);
    const msgs = storage.getDMConversation(currentUser.id, activePartnerId);
    setMessages(msgs);
    loadConversations();
  };

  const handleImageSelect = () => {
    if (!isPremium) {
      navigate('/app/upgrade');
      return;
    }
    imageInputRef.current?.click();
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { alert('Max image size is 5MB'); return; }
    const reader = new FileReader();
    reader.onloadend = () => setImagePreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const formatTime = (ts: number) => {
    const d = new Date(ts);
    const now = new Date();
    const diff = now.getTime() - ts;
    if (diff < 60000) return 'just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    return d.toLocaleDateString();
  };

  if (!currentUser) return null;

  return (
    <div className="container mx-auto px-0 py-0 max-w-4xl h-[calc(100vh-120px)]">
      <div className="flex h-full border rounded-xl overflow-hidden">

        {/* ── Sidebar ── */}
        <div className={`w-full md:w-80 flex-shrink-0 border-r flex flex-col ${activePartnerId ? 'hidden md:flex' : 'flex'}`}>
          {/* Header */}
          <div className="p-4 border-b">
            <h1 className="text-xl font-bold mb-3">Messages</h1>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search users..."
                className="pl-10"
                value={searchQuery}
                onChange={e => handleSearch(e.target.value)}
              />
            </div>
          </div>

          {/* Search Results */}
          {searchResults.length > 0 && (
            <div className="border-b">
              <p className="text-xs text-muted-foreground px-4 pt-2 pb-1 font-medium">Users</p>
              {searchResults.map(user => (
                <button
                  key={user.id}
                  onClick={() => openConversation(user.id)}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-muted transition-colors text-left"
                >
                  <Avatar className="w-9 h-9">
                    <AvatarImage src={user.profilePicture} />
                    <AvatarFallback>{user.name?.[0] || user.username?.[0]}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-semibold text-sm">{user.name || user.username}</p>
                    <p className="text-xs text-muted-foreground">@{user.username}</p>
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Conversations */}
          <div className="flex-1 overflow-y-auto">
            {conversations.length === 0 && !searchQuery && (
              <div className="flex flex-col items-center justify-center h-full text-center p-6">
                <MessageCircle className="w-12 h-12 text-muted-foreground mb-3" />
                <p className="text-sm text-muted-foreground">No conversations yet</p>
                <p className="text-xs text-muted-foreground mt-1">Search for a trader to start a DM</p>
              </div>
            )}
            {conversations.map(conv => (
              <button
                key={conv.partnerId}
                onClick={() => openConversation(conv.partnerId)}
                className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-muted transition-colors text-left border-b ${
                  activePartnerId === conv.partnerId ? 'bg-muted' : ''
                }`}
              >
                <div className="relative">
                  <Avatar className="w-10 h-10">
                    <AvatarImage src={conv.partner?.profilePicture} />
                    <AvatarFallback>{conv.partner?.name?.[0] || conv.partner?.username?.[0] || '?'}</AvatarFallback>
                  </Avatar>
                  {conv.unreadCount > 0 && (
                    <div className="absolute -top-1 -right-1 w-5 h-5 bg-primary rounded-full flex items-center justify-center">
                      <span className="text-xs text-primary-foreground font-bold">{conv.unreadCount}</span>
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="font-semibold text-sm truncate">{conv.partner?.name || conv.partner?.username || 'Unknown'}</p>
                    {conv.lastMessage && (
                      <p className="text-xs text-muted-foreground flex-shrink-0 ml-2">{formatTime(conv.lastMessage.timestamp)}</p>
                    )}
                  </div>
                  {conv.lastMessage && (
                    <p className={`text-xs truncate mt-0.5 ${conv.unreadCount > 0 ? 'font-medium text-foreground' : 'text-muted-foreground'}`}>
                      {conv.lastMessage.fromId === currentUser.id ? 'You: ' : ''}{conv.lastMessage.text}
                    </p>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* ── Chat Area ── */}
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
                <Avatar className="w-9 h-9">
                  <AvatarImage src={activePartner?.profilePicture} />
                  <AvatarFallback>{activePartner?.name?.[0] || activePartner?.username?.[0] || '?'}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-semibold">{activePartner?.name || activePartner?.username || 'Unknown'}</p>
                  <p className="text-xs text-muted-foreground">@{activePartner?.username}</p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="ml-auto"
                  onClick={() => navigate(`/app/profile/${activePartnerId}`)}
                >
                  View Profile
                </Button>
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
                      {showTime && (
                        <p className="text-xs text-muted-foreground text-center my-2">{formatTime(msg.timestamp)}</p>
                      )}
                      <div className={`flex ${isMe ? 'justify-end' : 'justify-start'} gap-2`}>
                        {!isMe && (
                          <Avatar className="w-7 h-7 flex-shrink-0 mt-1">
                            <AvatarImage src={activePartner?.profilePicture} />
                            <AvatarFallback className="text-xs">{activePartner?.name?.[0] || '?'}</AvatarFallback>
                          </Avatar>
                        )}
                        <div className={`max-w-[70%] rounded-2xl text-sm ${
                          isMe
                            ? 'bg-primary text-primary-foreground rounded-br-sm'
                            : 'bg-muted rounded-bl-sm'
                        } ${msg.imageUrl ? 'overflow-hidden p-0' : 'px-4 py-2'}`}>
                          {msg.imageUrl && (
                            <img
                              src={msg.imageUrl}
                              alt="Shared image"
                              className="max-w-[240px] max-h-[240px] object-cover rounded-2xl"
                              loading="lazy"
                            />
                          )}
                          {msg.text && (
                            <p className={msg.imageUrl ? 'px-3 py-2 text-sm' : ''}>{msg.text}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <div className="p-4 border-t">
                {/* Image preview */}
                {imagePreview && (
                  <div className="relative inline-block mb-2">
                    <img src={imagePreview} alt="Preview" className="h-20 rounded-lg border object-cover" />
                    <button
                      onClick={() => setImagePreview(null)}
                      className="absolute -top-1 -right-1 w-5 h-5 bg-destructive text-white rounded-full flex items-center justify-center text-xs"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                )}
                <div className="flex gap-2">
                  {/* Image button — premium only */}
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleImageSelect}
                    title={isPremium ? 'Send image' : 'Premium feature'}
                    className={isPremium ? 'text-blue-500' : 'text-muted-foreground'}
                  >
                    {isPremium ? <ImageIcon className="w-5 h-5" /> : <Crown className="w-4 h-4" />}
                  </Button>
                  <input
                    ref={imageInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                  />
                  <Input
                    placeholder="Type a message..."
                    value={newMessage}
                    onChange={e => setNewMessage(e.target.value)}
                    onKeyDown={handleKeyDown}
                    className="flex-1"
                  />
                  <Button onClick={sendMessage} disabled={!newMessage.trim() && !imagePreview} size="icon">
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
