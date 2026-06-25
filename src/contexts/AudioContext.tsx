import React, { createContext, useContext, useState, ReactNode } from 'react';

interface AudioContextType {
  isGloballyMuted: boolean;
  setGlobalMute: (muted: boolean) => void;
}

const AudioContext = createContext<AudioContextType | undefined>(undefined);

export const useAudio = () => {
  const context = useContext(AudioContext);
  if (context === undefined) {
    throw new Error('useAudio must be used within an AudioProvider');
  }
  return context;
};

interface AudioProviderProps {
  children: ReactNode;
}

export const AudioProvider: React.FC<AudioProviderProps> = ({ children }) => {
  const [isGloballyMuted, setGlobalMute] = useState(false);

  return (
    <AudioContext.Provider value={{ isGloballyMuted, setGlobalMute }}>
      {children}
    </AudioContext.Provider>
  );
};
