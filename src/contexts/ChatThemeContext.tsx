import React, { createContext, useContext, useState, useEffect } from 'react';

export interface ChatTheme {
  type: 'default' | 'image' | 'color';
  value?: string; // For image URL or color hex
  opacity?: number; // For background opacity
}

interface ChatThemeContextType {
  chatTheme: ChatTheme;
  setChatTheme: (theme: ChatTheme) => void;
  resetChatTheme: () => void;
}

const defaultChatTheme: ChatTheme = {
  type: 'default',
  opacity: 1
};

const ChatThemeContext = createContext<ChatThemeContextType | undefined>(undefined);

export function ChatThemeProvider({ children }: { children: React.ReactNode }) {
  const [chatTheme, setChatThemeState] = useState<ChatTheme>(defaultChatTheme);

  useEffect(() => {
    const savedTheme = localStorage.getItem('chat-theme');
    if (savedTheme) {
      try {
        setChatThemeState(JSON.parse(savedTheme));
      } catch {
      }
    }
  }, []);

  const setChatTheme = (theme: ChatTheme) => {
    setChatThemeState(theme);
    localStorage.setItem('chat-theme', JSON.stringify(theme));
  };

  const resetChatTheme = () => {
    setChatTheme(defaultChatTheme);
  };

  return (
    <ChatThemeContext.Provider value={{ chatTheme, setChatTheme, resetChatTheme }}>
      {children}
    </ChatThemeContext.Provider>
  );
}

export const useChatTheme = () => {
  const context = useContext(ChatThemeContext);
  if (context === undefined) {
    throw new Error('useChatTheme must be used within a ChatThemeProvider');
  }
  return context;
};
