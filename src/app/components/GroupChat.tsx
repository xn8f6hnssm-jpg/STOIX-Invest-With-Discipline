import { useState, useEffect, useRef } from 'react';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Label } from './ui/label';
import { Hash, Plus, Send, Paperclip, Image as ImageIcon, X, AtSign } from 'lucide-react';
import { storage } from '../utils/storage';

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
  const [showMentionSuggestions, setShowMentionSuggestions] = useState(false);
  const [mentionSearch, setMentionSearch] = useState('');
  const [cursorPosition, setCursorPosition] = useState(0);
  const [showCreateChannelModal, setShowCreateChannelModal] = useState(false);
  const [newChannelName, setNewChannelName] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Initialize default channel if none exist
  useEffect(() => {
    const existingChannels = storage.getGroupChannels(groupId);
    if (existingChannels.length === 0 && isAdmin) {
      // Create default "general" channel
      const defaultChannel = storage.addGroupChannel({
        groupId,
        name: 'general',
        description: 'General discussion',
        createdBy: currentUserId,
        isDefault: true,
      });
      setChannels([defaultChannel]);
      setSelectedChannelId(defaultChannel.id);
    } else {
      setChannels(existingChannels);
      if (!selectedChannelId && existingChannels.length > 0) {
        setSelectedChannelId(existingChannels[0].id);
      }
    }
  }, [groupId, isAdmin]);

  // Load messages when channel changes
  useEffect(() => {
    if (selectedChannelId) {
      const channelMessages = storage.getGroupMessages(selectedChannelId);
      setMessages(channelMessages);
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    }
  }, [selectedChannelId]);

  // Auto-scroll on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Handle message input change and detect @ mentions
  const handleMessageInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    const curPos = e.target.selectionStart;
    
    setMessageInput(value);
    setCursorPosition(curPos);

    // Check for @ mentions
    const textBeforeCursor = value.slice(0, curPos);
    const lastAtSymbol = textBeforeCursor.lastIndexOf('@');
    
    if (lastAtSymbol !== -1) {
      const textAfterAt = textBeforeCursor.slice(lastAtSymbol + 1);
      // Check if there's a space after @, if so, close suggestions
      if (!textAfterAt.includes(' ')) {
        setMentionSearch(textAfterAt.toLowerCase());
        setShowMentionSuggestions(true);
      } else {
        setShowMentionSuggestions(false);
      }
    } else {
      setShowMentionSuggestions(false);
    }
  };

  // Get member suggestions based on search
  const getMemberSuggestions = () => {
    const allUsers = storage.getAllUsers();
    const members = allUsers.filter(u => groupMembers.includes(u.id));
    
    const suggestions = members.filter(m => 
      m.username.toLowerCase().includes(mentionSearch) || 
      m.name.toLowerCase().includes(mentionSearch)
    ).slice(0, 5);

    // Add @everyone option
    if ('everyone'.includes(mentionSearch)) {
      return [{ id: '@everyone', username: 'everyone', name: 'Mention everyone' }, ...suggestions];
    }

    return suggestions;
  };

  // Insert mention into message
  const insertMention = (username: string, userId: string) => {
    const textBeforeCursor = messageInput.slice(0, cursorPosition);
    const lastAtSymbol = textBeforeCursor.lastIndexOf('@');
    const textAfterCursor = messageInput.slice(cursorPosition);
    
    const newMessage = messageInput.slice(0, lastAtSymbol) + `@${username} ` + textAfterCursor;
    setMessageInput(newMessage);
    setShowMentionSuggestions(false);
    
    // Focus back on textarea
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
        const newCursorPos = lastAtSymbol + username.length + 2; // +2 for @ and space
        textareaRef.current.setSelectionRange(newCursorPos, newCursorPos);
      }
    }, 0);
  };

  // Extract mentions from message
  const extractMentions = (text: string) => {
    const mentionRegex = /@(\w+)/g;
    const mentions: string[] = [];
    let match;

    while ((match = mentionRegex.exec(text)) !== null) {
      const username = match[1];
      if (username === 'everyone') {
        mentions.push('@everyone');
      } else {
        const user = storage.getAllUsers().find(u => u.username === username);
        if (user && groupMembers.includes(user.id)) {
          mentions.push(user.id);
        }
      }
    }

    return mentions;
  };

  // Send message
  const handleSendMessage = () => {
    if (!messageInput.trim() || !selectedChannelId) return;

    const mentions = extractMentions(messageInput);

    const newMessage = storage.addGroupMessage({
      channelId: selectedChannelId,
      groupId,
      userId: currentUserId,
      username: currentUsername,
      content: messageInput.trim(),
      mentions,
    });

    setMessages([...messages, newMessage]);
    setMessageInput('');
  };

  // Handle file upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0 || !selectedChannelId) return;

    const file = files[0];
    const reader = new FileReader();

    reader.onloadend = () => {
      const fileType = file.type.startsWith('image/') ? 'image' : 'file';
      
      const newMessage = storage.addGroupMessage({
        channelId: selectedChannelId,
        groupId,
        userId: currentUserId,
        username: currentUsername,
        content: `Shared a ${fileType}`,
        mentions: [],
        attachments: [{
          type: fileType,
          url: reader.result as string,
          name: file.name,
          size: file.size,
        }],
      });

      setMessages([...messages, newMessage]);
    };

    reader.readAsDataURL(file);
  };

  // Create new channel
  const handleCreateChannel = () => {
    if (!newChannelName.trim()) return;

    const newChannel = storage.addGroupChannel({
      groupId,
      name: newChannelName.trim().toLowerCase().replace(/\s+/g, '-'),
      description: `${newChannelName} discussion`,
      createdBy: currentUserId,
    });

    setChannels([...channels, newChannel]);
    setSelectedChannelId(newChannel.id);
    setNewChannelName('');
    setShowCreateChannelModal(false);
  };

  // Format timestamp
  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    }
  };

  // Render message with mentions highlighted
  const renderMessageContent = (content: string) => {
    const parts = content.split(/(@\w+)/g);
    return parts.map((part, index) => {
      if (part.startsWith('@')) {
        const username = part.slice(1);
        const isMentioningMe = username === currentUsername || username === 'everyone';
        return (
          <span
            key={index}
            className={`font-semibold ${isMentioningMe ? 'text-blue-500 bg-blue-500/10 px-1 rounded' : 'text-blue-500'}`}
          >
            {part}
          </span>
        );
      }
      return <span key={index}>{part}</span>;
    });
  };

  if (channels.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Hash className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground mb-4">No chat channels yet</p>
          {isAdmin && (
            <Button onClick={() => setShowCreateChannelModal(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Create First Channel
            </Button>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-[200px_1fr] gap-4 h-[600px]">
      {/* Channel List */}
      <Card className="flex flex-col">
        <CardContent className="p-4 flex-1 flex flex-col overflow-hidden">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-sm">Channels</h3>
            {isAdmin && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setShowCreateChannelModal(true)}
              >
                <Plus className="w-4 h-4" />
              </Button>
            )}
          </div>
          <div className="space-y-1 flex-1 overflow-y-auto">
            {channels.map(channel => (
              <button
                key={channel.id}
                onClick={() => setSelectedChannelId(channel.id)}
                className={`w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors ${
                  selectedChannelId === channel.id
                    ? 'bg-primary text-primary-foreground'
                    : 'hover:bg-muted'
                }`}
              >
                <Hash className="w-4 h-4" />
                {channel.name}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Chat Area */}
      <Card className="flex flex-col">
        <CardContent className="p-0 flex flex-col h-full">
          {/* Channel Header */}
          {selectedChannelId && (
            <div className="p-4 border-b">
              <div className="flex items-center gap-2">
                <Hash className="w-5 h-5" />
                <h2 className="font-semibold">
                  {channels.find(c => c.id === selectedChannelId)?.name}
                </h2>
              </div>
            </div>
          )}

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">
                <p>No messages yet. Start the conversation!</p>
              </div>
            ) : (
              messages.map(message => {
                const isOwnMessage = message.userId === currentUserId;
                const hasMention = message.mentions.includes(currentUserId) || message.mentions.includes('@everyone');

                return (
                  <div
                    key={message.id}
                    className={`flex gap-3 ${hasMention ? 'bg-blue-500/5 -mx-4 px-4 py-2' : ''}`}
                  >
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold flex-shrink-0">
                      {message.username[0].toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline gap-2 mb-1">
                        <span className="font-semibold text-sm">@{message.username}</span>
                        <span className="text-xs text-muted-foreground">
                          {formatTime(message.timestamp)}
                        </span>
                        {message.edited && (
                          <Badge variant="outline" className="text-xs">edited</Badge>
                        )}
                      </div>
                      <div className="text-sm break-words">
                        {renderMessageContent(message.content)}
                      </div>
                      {message.attachments && message.attachments.length > 0 && (
                        <div className="mt-2 space-y-2">
                          {message.attachments.map((attachment, index) => (
                            <div key={index}>
                              {attachment.type === 'image' ? (
                                <img
                                  src={attachment.url}
                                  alt={attachment.name}
                                  className="max-w-xs rounded-lg border"
                                />
                              ) : (
                                <div className="flex items-center gap-2 p-3 bg-muted rounded-lg max-w-xs">
                                  <Paperclip className="w-4 h-4" />
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium truncate">{attachment.name}</p>
                                    {attachment.size && (
                                      <p className="text-xs text-muted-foreground">
                                        {(attachment.size / 1024).toFixed(1)} KB
                                      </p>
                                    )}
                                  </div>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Message Input */}
          {selectedChannelId && (
            <div className="p-4 border-t relative">
              {/* Mention Suggestions */}
              {showMentionSuggestions && (
                <div className="absolute bottom-full left-4 right-4 mb-2 bg-card border rounded-lg shadow-lg max-h-48 overflow-y-auto z-10">
                  {getMemberSuggestions().map(member => (
                    <button
                      key={member.id}
                      onClick={() => insertMention(member.username, member.id)}
                      className="w-full flex items-center gap-3 px-4 py-2 hover:bg-muted text-left"
                    >
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold text-sm">
                        {member.username[0].toUpperCase()}
                      </div>
                      <div>
                        <p className="font-medium text-sm">@{member.username}</p>
                        {member.id !== '@everyone' && (
                          <p className="text-xs text-muted-foreground">{member.name}</p>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              )}

              <div className="flex gap-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  className="hidden"
                  onChange={handleFileUpload}
                  accept="image/*,.pdf,.doc,.docx,.txt"
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => fileInputRef.current?.click()}
                  title="Attach file"
                >
                  <Paperclip className="w-4 h-4" />
                </Button>
                <div className="flex-1 relative">
                  <textarea
                    ref={textareaRef}
                    value={messageInput}
                    onChange={handleMessageInputChange}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                    placeholder="Type a message... (use @ to mention)"
                    className="w-full px-3 py-2 pr-10 border rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-primary"
                    rows={1}
                  />
                  <Button
                    size="icon"
                    variant="ghost"
                    className="absolute right-1 top-1"
                    onClick={() => {
                      const curPos = textareaRef.current?.selectionStart || messageInput.length;
                      setMessageInput(messageInput.slice(0, curPos) + '@' + messageInput.slice(curPos));
                      setShowMentionSuggestions(true);
                      setMentionSearch('');
                      setTimeout(() => textareaRef.current?.focus(), 0);
                    }}
                    title="Insert mention"
                  >
                    <AtSign className="w-4 h-4" />
                  </Button>
                </div>
                <Button onClick={handleSendMessage} disabled={!messageInput.trim()}>
                  <Send className="w-4 h-4" />
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Press Enter to send, Shift+Enter for new line. Use @username or @everyone to mention.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Channel Modal */}
      <Dialog open={showCreateChannelModal} onOpenChange={setShowCreateChannelModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Create New Channel</DialogTitle>
            <DialogDescription>
              Add a new channel for specific topics or discussions
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Channel Name</Label>
              <Input
                placeholder="e.g., Trading Signals, Analysis"
                value={newChannelName}
                onChange={(e) => setNewChannelName(e.target.value)}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Will be formatted as: {newChannelName.trim().toLowerCase().replace(/\s+/g, '-') || 'channel-name'}
              </p>
            </div>
            <Button onClick={handleCreateChannel} className="w-full" disabled={!newChannelName.trim()}>
              <Plus className="w-4 h-4 mr-2" />
              Create Channel
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
