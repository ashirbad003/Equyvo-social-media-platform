import { useEffect, RefObject, useCallback } from 'react';

interface MediaSessionOptions {
  videoRef: RefObject<HTMLVideoElement | null>;
  isPlaying: boolean;
  setIsPlaying: (val: boolean) => void;
  title?: string;
  artist?: string;
  artwork?: { src: string; sizes: string; type: string }[];
  onNext?: () => void;
  onPrevious?: () => void;
}

const SEEK_TIME = 10;

export function useMediaSession({
  videoRef,
  isPlaying,
  setIsPlaying,
  title,
  artist,
  artwork,
  onNext,
  onPrevious,
}: MediaSessionOptions) {
  const updateMetadata = useCallback(() => {
    if (!('mediaSession' in navigator)) return;

    navigator.mediaSession.metadata = new MediaMetadata({
      title: title || 'Video',
      artist: artist || 'Equyvo',
      artwork: artwork || [
        { src: '/Equyvo_logo.png', sizes: '512x512', type: 'image/png' },
      ],
    });
  }, [title, artist, artwork]);

  useEffect(() => {
    if (!('mediaSession' in navigator)) return;

    updateMetadata();

    navigator.mediaSession.setActionHandler('play', () => {
      const video = videoRef.current;
      if (video && video.paused) {
        video.play().catch(() => {});
        setIsPlaying(true);
      }
    });

    navigator.mediaSession.setActionHandler('pause', () => {
      const video = videoRef.current;
      if (video && !video.paused) {
        video.pause();
        setIsPlaying(false);
      }
    });

    navigator.mediaSession.setActionHandler('seekbackward', () => {
      const video = videoRef.current;
      if (video) {
        video.currentTime = Math.max(0, video.currentTime - SEEK_TIME);
      }
    });

    navigator.mediaSession.setActionHandler('seekforward', () => {
      const video = videoRef.current;
      if (video) {
        video.currentTime = Math.min(
          video.duration || Infinity,
          video.currentTime + SEEK_TIME
        );
      }
    });

    navigator.mediaSession.setActionHandler('seekto', (details) => {
      const video = videoRef.current;
      if (video && details.seekTime != null) {
        video.currentTime = details.seekTime;
      }
    });

    if (onNext) {
      navigator.mediaSession.setActionHandler('nexttrack', () => onNext());
    }

    if (onPrevious) {
      navigator.mediaSession.setActionHandler('previoustrack', () => onPrevious());
    }

    return () => {
      if (!('mediaSession' in navigator)) return;
      navigator.mediaSession.setActionHandler('play', null);
      navigator.mediaSession.setActionHandler('pause', null);
      navigator.mediaSession.setActionHandler('seekbackward', null);
      navigator.mediaSession.setActionHandler('seekforward', null);
      navigator.mediaSession.setActionHandler('seekto', null);
      navigator.mediaSession.setActionHandler('nexttrack', null);
      navigator.mediaSession.setActionHandler('previoustrack', null);
    };
  }, [videoRef, isPlaying, setIsPlaying, updateMetadata, onNext, onPrevious]);

  useEffect(() => {
    if (!('mediaSession' in navigator)) return;

    if (isPlaying) {
      navigator.mediaSession.playbackState = 'playing';
    } else {
      navigator.mediaSession.playbackState = 'paused';
    }
  }, [isPlaying]);
}
