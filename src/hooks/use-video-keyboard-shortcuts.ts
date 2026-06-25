import { useEffect, RefObject, useCallback } from 'react';

interface UseVideoKeyboardShortcutsOptions {
  videoRef: RefObject<HTMLVideoElement | null>;
  isPlaying: boolean;
  setIsPlaying: (val: boolean) => void;
  isMuted: boolean;
  setIsMuted: (val: boolean) => void;
  volume: number;
  setVolume: (val: number) => void;
  playbackRate?: number;
  setPlaybackRate?: (val: number) => void;
  onToggleFullscreen?: () => void;
}

export function useVideoKeyboardShortcuts({
  videoRef,
  isPlaying,
  setIsPlaying,
  isMuted,
  setIsMuted,
  volume,
  setVolume,
  playbackRate,
  setPlaybackRate,
  onToggleFullscreen,
}: UseVideoKeyboardShortcutsOptions) {
  const togglePlay = useCallback((video: HTMLVideoElement) => {
    if (video.paused) {
      video.play().catch(() => {});
      setIsPlaying(true);
    } else {
      video.pause();
      setIsPlaying(false);
    }
  }, [setIsPlaying]);

  const seekTo = useCallback((video: HTMLVideoElement, time: number) => {
    try {
      video.currentTime = Math.max(0, Math.min(time, video.duration || Infinity));
    } catch {
      // Silently handle cases where video metadata hasn't loaded
    }
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) return;

      const video = videoRef.current;
      if (!video) return;

      switch (e.key) {
        case ' ':
        case 'k':
        case 'K':
          e.preventDefault();
          togglePlay(video);
          break;
        case 'ArrowLeft':
          e.preventDefault();
          seekTo(video, video.currentTime - 5);
          break;
        case 'ArrowRight':
          e.preventDefault();
          seekTo(video, video.currentTime + 5);
          break;
        case 'j':
        case 'J':
          e.preventDefault();
          seekTo(video, video.currentTime - 10);
          break;
        case 'l':
        case 'L':
          e.preventDefault();
          seekTo(video, video.currentTime + 10);
          break;
        case 'ArrowUp':
          e.preventDefault();
          {
            const newVolume = Math.min(1, volume + 0.1);
            video.volume = newVolume;
            setVolume(newVolume);
            if (video.muted) {
              video.muted = false;
              setIsMuted(false);
            }
          }
          break;
        case 'ArrowDown':
          e.preventDefault();
          {
            const newVolume = Math.max(0, volume - 0.1);
            video.volume = newVolume;
            setVolume(newVolume);
            if (newVolume === 0) {
              video.muted = true;
              setIsMuted(true);
            }
          }
          break;
        case 'm':
        case 'M':
          e.preventDefault();
          video.muted = !isMuted;
          setIsMuted(!isMuted);
          break;
        case 'f':
        case 'F':
          e.preventDefault();
          onToggleFullscreen?.();
          break;
        case ',':
          e.preventDefault();
          seekTo(video, video.currentTime - 1 / 30);
          break;
        case '.':
          e.preventDefault();
          seekTo(video, video.currentTime + 1 / 30);
          break;
        case '[':
          e.preventDefault();
          if (setPlaybackRate) {
            const newRate = Math.max(0.25, (playbackRate || 1) - 0.25);
            video.playbackRate = newRate;
            setPlaybackRate(newRate);
          }
          break;
        case ']':
          e.preventDefault();
          if (setPlaybackRate) {
            const newRate = Math.min(16, (playbackRate || 1) + 0.25);
            video.playbackRate = newRate;
            setPlaybackRate(newRate);
          }
          break;
        case '\\':
          e.preventDefault();
          if (setPlaybackRate) {
            video.playbackRate = 1;
            setPlaybackRate(1);
          }
          break;
      }

      if (e.key >= '0' && e.key <= '9' && !e.ctrlKey && !e.metaKey && !e.altKey) {
        e.preventDefault();
        seekTo(video, (video.duration || 0) * (parseInt(e.key) / 10));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [videoRef, isPlaying, setIsPlaying, isMuted, setIsMuted, volume, setVolume, playbackRate, setPlaybackRate, onToggleFullscreen, togglePlay, seekTo]);
}
