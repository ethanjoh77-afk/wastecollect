import { useEffect, useRef, useState } from 'react';
import { Modal } from '../common';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onDetected: (code: string) => void;
}

// BarcodeDetector ipo kwenye Chrome ya Android (haihitaji library ya ziada).
interface BarcodeDetectorLike {
  detect: (source: CanvasImageSource) => Promise<{ rawValue: string }[]>;
}
type BarcodeDetectorCtor = new (opts?: { formats: string[] }) => BarcodeDetectorLike;

export function isScannerSupported(): boolean {
  return typeof window !== 'undefined' && 'BarcodeDetector' in window && !!navigator.mediaDevices?.getUserMedia;
}

/** Inatoa code kutoka kwenye QR (inakubali pia URL yenye ?code=... au mwisho wa path). */
export function extractCode(raw: string): string {
  const text = raw.trim();
  try {
    const url = new URL(text);
    const q = url.searchParams.get('code');
    if (q) return q;
    const last = url.pathname.split('/').filter(Boolean).pop();
    if (last) return decodeURIComponent(last);
  } catch {
    // si URL — ni code yenyewe
  }
  return text;
}

export function QrScanner({ isOpen, onClose, onDetected }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    if (!isScannerSupported()) {
      setError('Kamera ya kuscan haipatikani kwenye kivinjari hiki. Andika code kwa mkono.');
      return;
    }

    let stream: MediaStream | null = null;
    let raf = 0;
    let stopped = false;
    setError(null);

    (async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: 'environment' } },
          audio: false,
        });
        const video = videoRef.current;
        if (!video || stopped) return;
        video.srcObject = stream;
        await video.play();

        const Detector = (window as unknown as { BarcodeDetector: BarcodeDetectorCtor }).BarcodeDetector;
        const detector = new Detector({ formats: ['qr_code'] });

        const tick = async () => {
          if (stopped) return;
          try {
            const found = await detector.detect(video);
            if (found.length > 0) {
              stopped = true;
              onDetected(extractCode(found[0].rawValue));
              return;
            }
          } catch {
            // fremu isiyo tayari — endelea
          }
          raf = requestAnimationFrame(tick);
        };
        raf = requestAnimationFrame(tick);
      } catch {
        setError('Imeshindikana kufungua kamera. Ruhusu kamera kwenye kivinjari, au andika code kwa mkono.');
      }
    })();

    return () => {
      stopped = true;
      cancelAnimationFrame(raf);
      stream?.getTracks().forEach((t) => t.stop());
    };
  }, [isOpen, onDetected]);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Scan QR ya kaya" size="sm">
      {error ? (
        <p className="text-sm text-error-600">{error}</p>
      ) : (
        <div className="relative overflow-hidden rounded-xl bg-black aspect-square">
          <video ref={videoRef} className="w-full h-full object-cover" playsInline muted />
          <div className="absolute inset-8 border-2 border-white/70 rounded-xl pointer-events-none" />
        </div>
      )}
      <p className="text-xs text-secondary-500 mt-3">Elekeza kamera kwenye sticker ya QR iliyobandikwa mlangoni.</p>
    </Modal>
  );
}
