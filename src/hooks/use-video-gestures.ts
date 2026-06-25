import { useRef, useCallback, useEffect } from 'react';

interface UseVideoGesturesOptions {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  seekTime?: number;
  onSingleTap?: () => void;
  enabled?: boolean;
}

export function useVideoGestures({
  videoRef,
  seekTime = 10,
  onSingleTap,
  enabled = true,
}: UseVideoGesturesOptions) {
  const lastTapRef = useRef(0);
  const tapTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleClick = useCallback((e: React.MouseEvent) => {
    if (!enabled) return;

    const now = Date.now();
    const timeSinceLastTap = now - lastTapRef.current;
    lastTapRef.current = now;

    if (timeSinceLastTap < 400) {
      if (tapTimerRef.current) {
        clearTimeout(tapTimerRef.current);
        tapTimerRef.current = null;
      }

      const video = videoRef.current;
      if (!video) return;

      const rect = e.currentTarget.getBoundingClientRect();
      const x = e.clientX - rect.left;
      if (x > rect.width / 2) {
        video.currentTime = Math.min(video.duration || Infinity, video.currentTime + seekTime);
      } else {
        video.currentTime = Math.max(0, video.currentTime - seekTime);
      }
      return;
    }

    tapTimerRef.current = setTimeout(() => {
      tapTimerRef.current = null;
      onSingleTap?.();
    }, 400);
  }, [enabled, videoRef, seekTime, onSingleTap]);

  useEffect(() => {
    return () => {
      if (tapTimerRef.current) {
        clearTimeout(tapTimerRef.current);
      }
    };
  }, []);

  return { handleClick };
}
