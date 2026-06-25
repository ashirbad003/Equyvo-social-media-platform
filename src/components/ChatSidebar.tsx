import React, { useState, useEffect } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MessageCircle, Search, Send, Paperclip, X, Palette } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { showSuccess } from '@/utils/toast';
import { ChatThemeSelector } from './ChatThemeSelector';
import { useChatTheme } from '@/contexts/ChatThemeContext';
import { navigateToProfile, getUserId, getUsername } from '@/utils/profile-navigation';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'other';
  timestamp: string;
  type?: 'text' | 'image' | 'file';
  fileUrl?: string;
  fileName?: string;
}

interface Contact {
  id: string;
  name: string;
  avatar: string;
  lastMessage: string;
  timestamp: string;
  online: boolean;
  messages?: Message[];
}

const ChatSidebar = ({ isMobile = false }: { isMobile?: boolean }) => {
  const [activeChat, setActiveChat] = useState<Contact | null>(null);
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<{ [key: string]: Message[] }>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [attachedFile, setAttachedFile] = useState<File | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const { chatTheme } = useChatTheme();
  const navigate = useNavigate();

  // Mock Data with messages
  const contacts: Contact[] = [
    { 
      id: '1', 
      name: 'Alice Chen', 
      avatar: 'https://github.com/shadcn.png', 
      lastMessage: 'Hey! Did you see the new moment?', 
      timestamp: '10:30 AM', 
      online: true,
      messages: [
        { id: '1', text: 'Hey! How are you?', sender: 'other', timestamp: '10:00 AM' },
        { id: '2', text: "I'm doing great, thanks for asking!", sender: 'user', timestamp: '10:05 AM' },
        { id: '3', text: 'Hey! Did you see the new moment?', sender: 'other', timestamp: '10:30 AM' },
      ]
    },
    { 
      id: '2', 
      name: 'Bob Smith', 
      avatar: 'https://github.com/shadcn.png', 
      lastMessage: 'The design looks great!', 
      timestamp: 'Yesterday', 
      online: false,
      messages: [
        { id: '1', text: 'Can you review my design?', sender: 'other', timestamp: 'Yesterday' },
        { id: '2', text: 'The design looks great!', sender: 'user', timestamp: 'Yesterday' },
      ]
    },
    { 
      id: '3', 
      name: 'Emma Wilson', 
      avatar: 'https://github.com/shadcn.png', 
      lastMessage: 'Can we call later?', 
      timestamp: 'Mon', 
      online: true,
      messages: [
        { id: '1', text: 'Are you free for a call?', sender: 'other', timestamp: 'Mon' },
        { id: '2', text: 'Can we call later?', sender: 'user', timestamp: 'Mon' },
      ]
    },
    { 
      id: '4', 
      name: 'David Park', 
      avatar: 'https://github.com/shadcn.png', 
      lastMessage: 'Sent a photo', 
      timestamp: 'Sun', 
      online: false,
      messages: [
        { id: '1', text: 'Check out this photo!', sender: 'other', timestamp: 'Sun', type: 'image', fileUrl: 'https://github.com/shadcn.png' },
        { id: '2', text: 'Sent a photo', sender: 'user', timestamp: 'Sun' },
      ]
    },
  ];

  // Filter contacts based on search query
  const filteredContacts = contacts.filter(contact => 
    contact.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    contact.lastMessage.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Initialize messages from contacts data
  useEffect(() => {
    const initialMessages: { [key: string]: Message[] } = {};
    contacts.forEach(contact => {
      if (contact.messages) {
        initialMessages[contact.id] = contact.messages;
      }
    });
    setMessages(initialMessages);
  }, []);

  // Get chat background style
  const getChatBackgroundStyle = () => {
    if (chatTheme.type === 'color' && chatTheme.value) {
      return {
        backgroundColor: chatTheme.value,
        opacity: chatTheme.opacity || 1
      };
    } else if (chatTheme.type === 'image' && chatTheme.value) {
      return {
        backgroundImage: `url(${chatTheme.value})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        opacity: chatTheme.opacity || 1
      };
    }
    return {};
  };

  // Handle sending messages
  const handleSendMessage = () => {
    if ((!message.trim() && !attachedFile) || !activeChat) return;

    const newMessage: Message = {
      id: Date.now().toString(),
      text: message.trim(),
      sender: 'user',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      type: attachedFile ? (attachedFile.type.startsWith('image/') ? 'image' : 'file') : 'text',
      fileUrl: attachedFile ? URL.createObjectURL(attachedFile) : undefined,
      fileName: attachedFile ? attachedFile.name : undefined,
    };

    setMessages(prev => ({
      ...prev,
      [activeChat.id]: [...(prev[activeChat.id] || []), newMessage]
    }));

    setMessage('');
    setAttachedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    showSuccess('Message sent!');
  };

  // Handle file attachment
  const handleFileAttach = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Check file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        showSuccess('File size must be less than 10MB');
        return;
      }
      setAttachedFile(file);
      showSuccess(`${file.name} attached`);
    }
  };

  // Handle removing attached file
  const handleRemoveAttachment = () => {
    setAttachedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Handle Enter key to send message
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className={`${
      isMobile 
        ? 'h-full w-full flex flex-col bg-background' 
        : 'h-[calc(100vh-80px)] w-80 fixed right-4 top-24 bg-card/95 backdrop-blur-xl border border-border/50 rounded-2xl shadow-2xl overflow-hidden hidden lg:flex flex-col z-40'
    }`}>
      {/* Mobile Header */}
      {isMobile && (
        <div className="p-4 border-b border-border bg-muted/30">
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-lg flex items-center gap-2">
              <MessageCircle className="w-5 h-5 text-primary" /> Chats
            </h2>
            <ChatThemeSelector>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <Palette className="w-4 h-4" />
              </Button>
            </ChatThemeSelector>
          </div>
        </div>
      )}

      {/* Desktop Header - Only show on desktop */}
      {!isMobile && (
        <div className="p-4 border-b border-border bg-muted/30">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-lg flex items-center gap-2">
              <MessageCircle className="w-5 h-5 text-primary" /> Chats
            </h2>
            <ChatThemeSelector>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <Palette className="w-4 h-4" />
              </Button>
            </ChatThemeSelector>
          </div>
        </div>
      )}
        
      {/* Search bar */}
      <div className="relative p-4">
        <Search className="absolute left-6.5 top-6.5 h-4 w-4 text-muted-foreground" />
        <Input 
          placeholder="Search chats..." 
          className="pl-8 bg-background/50" 
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Chat List - Show for both mobile and desktop */}
      <ScrollArea className="flex-1">
        <div className="divide-y divide-border/20">
          {filteredContacts.length > 0 ? (
            filteredContacts.map((contact) => (
              <div
                key={contact.id}
                className="flex items-center gap-3 p-3 hover:bg-secondary/20 cursor-pointer transition-colors"
                onClick={() => {
                  if (!isMobile) {
                    setActiveChat(contact);
                  }
                }}
              >
                <div className="relative">
                  <Avatar 
                    className="cursor-pointer hover:ring-2 hover:ring-primary/50 transition-all duration-200"
                    onClick={() => {
                      // Navigate to user profile when avatar is clicked
                      navigateToProfile(navigate, contact.id, contact.name);
                    }}
                    title={`${contact.name}'s Profile`}
                  >
                    <AvatarImage src={contact.avatar} />
                    <AvatarFallback>{contact.name[0]}</AvatarFallback>
                  </Avatar>
                  {contact.online && (
                    <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-background" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-0.5">
                    <p className="font-medium text-sm truncate">{contact.name}</p>
                    <span className="text-xs text-muted-foreground">{contact.timestamp}</span>
                  </div>
                  <p className="text-xs text-muted-foreground truncate">{contact.lastMessage}</p>
                </div>
              </div>
            ))
          ) : (
            <div className="p-8 text-center text-muted-foreground">
              <MessageCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p className="text-sm font-medium">No chats found</p>
              <p className="text-xs mt-1">Try adjusting your search</p>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Desktop Active Chat View - Only show on desktop */}
      {!isMobile && activeChat && (
        <div className="absolute inset-0 bg-background z-10 flex flex-col">
          {/* Chat Header */}
          <div className="p-3 border-b flex items-center gap-3 bg-secondary/30 backdrop-blur-md sticky top-0 z-10">
            <Button variant="ghost" size="icon" className="h-8 w-8 -ml-1 mr-1" onClick={() => setActiveChat(null)}>
              <X className="w-4 h-4" />
            </Button>
            <Avatar className="h-8 w-8">
              <AvatarImage src={activeChat.avatar} />
              <AvatarFallback>{activeChat.name[0]}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm truncate">{activeChat.name}</p>
              <p className="text-xs text-muted-foreground">{activeChat.online ? 'Online' : 'Offline'}</p>
            </div>
          </div>

          {/* Messages Area */}
          <div className="flex-1 p-4 space-y-4 overflow-y-auto relative">
            {/* Chat Theme Background */}
            {chatTheme.type !== 'default' && (
              <div 
                className="absolute inset-0 pointer-events-none rounded-lg"
                style={getChatBackgroundStyle()}
              />
            )}
            
            <div className="relative z-10">
              {messages[activeChat.id]?.map((msg) => (
                <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] ${msg.sender === 'user' ? 'bg-primary text-primary-foreground' : 'bg-secondary'} p-3 rounded-2xl ${msg.sender === 'user' ? 'rounded-tr-none' : 'rounded-tl-none'} text-sm`}>
                    {msg.type === 'image' && msg.fileUrl ? (
                      <div className="space-y-2">
                        <img src={msg.fileUrl} alt="Shared image" className="max-w-full rounded-lg" />
                        {msg.text && <p>{msg.text}</p>}
                      </div>
                    ) : msg.type === 'file' && msg.fileUrl ? (
                      <div className="flex items-center gap-2">
                        <Paperclip className="w-4 h-4" />
                        <div>
                          <p className="font-medium">{msg.fileName}</p>
                          {msg.text && <p className="text-xs opacity-80">{msg.text}</p>}
                        </div>
                      </div>
                    ) : (
                      <p>{msg.text}</p>
                    )}
                    <p className={`text-xs mt-1 ${msg.sender === 'user' ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
                      {msg.timestamp}
                    </p>
                  </div>
                </div>
              )) || (
                <div className="text-center text-muted-foreground py-8">
                  <p className="text-sm">No messages yet. Start the conversation!</p>
                </div>
              )}
            </div>
          </div>

          {/* Input Area */}
          <div className="p-3 border-t bg-background/50 backdrop-blur-md">
            {/* File Attachment Preview */}
            {attachedFile && (
              <div className="mb-3 p-3 bg-secondary/50 rounded-lg border flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Paperclip className="w-4 h-4" />
                  <span className="text-sm truncate max-w-[200px]">{attachedFile.name}</span>
                  <span className="text-xs text-muted-foreground">
                    ({(attachedFile.size / 1024 / 1024).toFixed(2)} MB)
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={handleRemoveAttachment}
                >
                  <X className="w-3 h-3" />
                </Button>
              </div>
            )}
            
            <div className="flex gap-2">
              <div className="relative">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*,.pdf,.doc,.docx,.txt"
                  onChange={handleFileAttach}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                />
                <Button variant="ghost" size="icon" className="h-10 w-10 text-muted-foreground">
                  <Paperclip className="w-5 h-5" />
                </Button>
              </div>
              <Input
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type a message..."
                className="bg-secondary/50"
              />
              <Button 
                size="icon" 
                className="h-10 w-10" 
                onClick={handleSendMessage}
                disabled={!message.trim() && !attachedFile}
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatSidebar;
