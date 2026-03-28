import { useEffect, useState } from 'react';
import { Camera, RotateCcw, Check } from 'lucide-react';
import { useCamera } from '../../hooks/useCamera';

interface CameraCaptureProps {
  label: string;
  childName: string;
  onCapture: (dataUrl: string) => void;
  onCancel: () => void;
}

export function CameraCapture({ label, childName, onCapture, onCancel }: CameraCaptureProps) {
  const { videoRef, isActive, error, startCamera, stopCamera, capturePhoto } = useCamera();
  const [preview, setPreview] = useState<string | null>(null);

  useEffect(() => {
    startCamera();
    return () => stopCamera();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleCapture = () => {
    const photo = capturePhoto(label, childName);
    if (photo) {
      stopCamera();
      setPreview(photo);
    }
  };

  const handleRetake = () => {
    setPreview(null);
    startCamera();
  };

  const handleConfirm = () => {
    if (preview) onCapture(preview);
  };

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center">
        <Camera size={48} className="text-gray-300 mb-4" />
        <p className="text-red-600 font-medium mb-2">Camera unavailable</p>
        <p className="text-gray-500 text-sm mb-4">{error}</p>
        <button onClick={onCancel} className="btn-secondary">Cancel</button>
      </div>
    );
  }

  if (preview) {
    return (
      <div className="flex flex-col gap-4">
        <p className="text-sm font-medium text-gray-700 text-center">{label}</p>
        <img src={preview} className="w-full rounded-xl" alt="Captured proof" />
        <div className="flex gap-3">
          <button onClick={handleRetake} className="btn-secondary flex-1 flex items-center justify-center gap-2">
            <RotateCcw size={16} /> Retake
          </button>
          <button onClick={handleConfirm} className="btn-success flex-1 flex items-center justify-center gap-2">
            <Check size={16} /> Use Photo
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm font-medium text-gray-700 text-center">{label}</p>
      <div className="relative bg-black rounded-xl overflow-hidden aspect-video">
        <video ref={videoRef} className="w-full h-full object-cover" playsInline muted />
        {!isActive && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-white border-t-transparent" />
          </div>
        )}
      </div>
      <div className="flex gap-3">
        <button onClick={onCancel} className="btn-secondary flex-1">Cancel</button>
        <button onClick={handleCapture} disabled={!isActive} className="btn-primary flex-1 flex items-center justify-center gap-2">
          <Camera size={16} /> Take Photo
        </button>
      </div>
    </div>
  );
}
