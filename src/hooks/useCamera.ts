import { useRef, useState, useCallback } from 'react';

export interface CameraHook {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  isActive: boolean;
  error: string | null;
  startCamera: () => Promise<void>;
  stopCamera: () => void;
  capturePhoto: (label: string, childName: string) => string | null;
}

export function useCamera(): CameraHook {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [isActive, setIsActive] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const startCamera = useCallback(async () => {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { max: 1280 }, height: { max: 960 } },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setIsActive(true);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Camera access denied';
      setError(message);
    }
  }, []);

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    setIsActive(false);
  }, []);

  const capturePhoto = useCallback((label: string, childName: string): string | null => {
    const video = videoRef.current;
    if (!video) return null;

    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    // Draw video frame
    ctx.drawImage(video, 0, 0);

    // Timestamp overlay
    const now = new Date();
    const timestamp = now.toLocaleString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric',
      hour: 'numeric', minute: '2-digit', second: '2-digit',
    });
    const overlayText = `${childName} • ${label} • ${timestamp}`;

    const padding = 8;
    const fontSize = Math.max(14, canvas.width * 0.018);
    ctx.font = `bold ${fontSize}px monospace`;
    const textWidth = ctx.measureText(overlayText).width;
    const boxH = fontSize + padding * 2;
    const boxW = textWidth + padding * 2;
    const x = canvas.width - boxW - 10;
    const y = canvas.height - boxH - 10;

    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.beginPath();
    ctx.roundRect(x, y, boxW, boxH, 6);
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.fillText(overlayText, x + padding, y + padding + fontSize - 2);

    return canvas.toDataURL('image/jpeg', 0.72);
  }, []);

  return { videoRef, isActive, error, startCamera, stopCamera, capturePhoto };
}
