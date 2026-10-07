import React, { useEffect, useRef, useState, useCallback } from 'react';
import jsQR from 'jsqr';
import { Camera, X, RefreshCw, Zap, AlertCircle, CheckCircle2 } from 'lucide-react';

interface CameraQRScannerProps {
  isOpen: boolean;
  onClose: () => void;
  onScan: (roomCode: string) => void;
}

export const CameraQRScanner: React.FC<CameraQRScannerProps> = ({
  isOpen,
  onClose,
  onScan,
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [torchOn, setTorchOn] = useState<boolean>(false);
  const [hasTorch, setHasTorch] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [detectedCode, setDetectedCode] = useState<string | null>(null);

  // إيقاف بث الكاميرا وتنظيف الموارد
  const stopCamera = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setIsScanning(false);
  }, []);

  // بدء تشغيل الكاميرا
  const startCamera = useCallback(async () => {
    stopCamera();
    setErrorMessage(null);
    setDetectedCode(null);

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('متصفحك لا يدعم الوصول للكاميرا المباشرة.');
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: facingMode },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute('playsinline', 'true'); // For iOS Safari
        await videoRef.current.play();
        setIsScanning(true);
      }

      // التحقق من دعم الفلاش (Torch)
      const track = stream.getVideoTracks()[0];
      const capabilities = (track.getCapabilities?.() || {}) as any;
      if (capabilities && 'torch' in capabilities) {
        setHasTorch(true);
      } else {
        setHasTorch(false);
      }
    } catch (err: any) {
      console.error('Camera access error:', err);
      let msg = 'تعذر تشغيل الكاميرا. يرجى التأكد من منح الإذن لاستخدام الكاميرا.';
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        msg = 'تم رفض الإذن بالوصول للكاميرا. يرجى تفعيل إذن الكاميرا من إعدادات المتصفح.';
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        msg = 'لم يتم العثور على كاميرا في هذا الجهاز.';
      }
      setErrorMessage(msg);
      setIsScanning(false);
    }
  }, [facingMode, stopCamera]);

  // استخراج كود الغرفة سواء كان رابطاً كاملاً أو رمزاً مباشراً
  const parseRoomCode = (rawData: string): string => {
    const text = rawData.trim();
    // البحث عن معلمات الرابط join أو room أو code
    const urlMatch = text.match(/[?&](?:join|room|code)=([A-Za-z0-9_-]+)/i);
    if (urlMatch && urlMatch[1]) {
      return urlMatch[1].toUpperCase();
    }

    // إذا كان الرابط ينتهي برمز الغرفة مثل /room/ABCD
    const pathMatch = text.match(/\/room\/([A-Za-z0-9_-]+)/i);
    if (pathMatch && pathMatch[1]) {
      return pathMatch[1].toUpperCase();
    }

    // إذا كان نصاً مباشراً للرمز
    return text.toUpperCase();
  };

  // حلقة معالجة إطارات الفيديو والبحث عن رمز QR
  useEffect(() => {
    if (!isScanning) return;

    const scanFrame = () => {
      const video = videoRef.current;
      const canvas = canvasRef.current;

      if (video && canvas && video.readyState === video.HAVE_ENOUGH_DATA) {
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        if (ctx) {
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const code = jsQR(imageData.data, imageData.width, imageData.height, {
            inversionAttempts: 'dontInvert',
          });

          if (code && code.data) {
            const parsed = parseRoomCode(code.data);
            if (parsed) {
              setDetectedCode(parsed);
              stopCamera();

              // تشغيل صوت نجاح واهتزاز إن توفر
              try {
                if (navigator.vibrate) navigator.vibrate([40, 60, 40]);
              } catch (_) {}

              setTimeout(() => {
                onScan(parsed);
                onClose();
              }, 600);
              return;
            }
          }
        }
      }

      animationFrameRef.current = requestAnimationFrame(scanFrame);
    };

    animationFrameRef.current = requestAnimationFrame(scanFrame);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isScanning, onScan, onClose, stopCamera]);

  // تشغيل / إيقاف الفلاش
  const toggleTorch = async () => {
    if (!streamRef.current || !hasTorch) return;
    try {
      const track = streamRef.current.getVideoTracks()[0];
      const nextTorch = !torchOn;
      await (track as any).applyConstraints({
        advanced: [{ torch: nextTorch }],
      });
      setTorchOn(nextTorch);
    } catch (e) {
      console.warn('Torch failed:', e);
    }
  };

  // تبديل اتجاه الكاميرا (أمامية / خلفية)
  const toggleFacingMode = () => {
    setFacingMode((prev) => (prev === 'environment' ? 'user' : 'environment'));
  };

  useEffect(() => {
    if (isOpen) {
      startCamera();
    } else {
      stopCamera();
    }
    return () => {
      stopCamera();
    };
  }, [isOpen, startCamera, stopCamera]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/95 flex flex-col items-center justify-between p-4 backdrop-blur-md select-none animate-fadeIn">
      {/* الترويسة العلوية */}
      <div className="w-full max-w-md flex items-center justify-between pt-2 pb-4 text-white">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-arcade-cyan/20 border border-arcade-cyan rounded-xl text-arcade-cyan">
            <Camera className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h2 className="text-base font-black text-stroke-sm">سكان رمز الغرفة 📷</h2>
            <p className="text-[11px] text-gray-300">وجّه الكاميرا نحو رمز QR على شاشة صديقك</p>
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-all active:scale-95 border border-white/20"
          title="إغلاق"
        >
          <X className="w-6 h-6" />
        </button>
      </div>

      {/* منطقة مسح الكاميرا مع الإطار الكرتوني */}
      <div className="relative w-full max-w-sm aspect-square my-auto rounded-3xl overflow-hidden border-4 border-black bg-black shadow-[0_8px_0_#000] flex items-center justify-center">
        {/* الفيديو المباشر */}
        <video
          ref={videoRef}
          className="w-full h-full object-cover"
          playsInline
          muted
          autoPlay
        />

        {/* الكانفاس المخفي للتحليل */}
        <canvas ref={canvasRef} className="hidden" />

        {/* شبكة التصويب والأركيد */}
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
          {/* إطار المسح المستطيل */}
          <div className="relative w-3/4 h-3/4 rounded-2xl border-2 border-arcade-cyan/80 shadow-[0_0_20px_rgba(0,240,255,0.4)] overflow-hidden">
            {/* زوايا الإطار السميكة */}
            <div className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-arcade-cyan rounded-tr-xl" />
            <div className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-arcade-cyan rounded-tl-xl" />
            <div className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-arcade-cyan rounded-br-xl" />
            <div className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-arcade-cyan rounded-bl-xl" />

            {/* خط الليزر المتحرك صعوداً وهبوطاً */}
            {isScanning && !detectedCode && (
              <div className="absolute left-0 right-0 h-1 bg-gradient-to-r from-transparent via-arcade-cyan to-transparent shadow-[0_0_12px_#00f0ff] animate-scan-laser" />
            )}

            {/* نجاح المسح */}
            {detectedCode && (
              <div className="absolute inset-0 bg-emerald-500/30 flex flex-col items-center justify-center p-3 text-center animate-bounce-subtle">
                <CheckCircle2 className="w-12 h-12 text-arcade-green drop-shadow-md mb-2" />
                <span className="text-white font-black text-sm text-stroke-sm">
                  تم اكتشاف الرمز بنجاح!
                </span>
                <span className="text-arcade-yellow font-black text-xl tracking-widest mt-1">
                  {detectedCode}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* رسالة الخطأ إن تعذر تشغيل الكاميرا */}
        {errorMessage && (
          <div className="absolute inset-0 bg-black/85 p-6 flex flex-col items-center justify-center text-center">
            <AlertCircle className="w-10 h-10 text-rose-500 mb-2" />
            <p className="text-xs text-rose-200 font-bold mb-4 leading-relaxed">
              {errorMessage}
            </p>
            <button
              type="button"
              onClick={startCamera}
              className="px-4 py-2 bg-arcade-btn-blue text-white rounded-xl text-xs font-black shadow-md"
            >
              إعادة المحاولة
            </button>
          </div>
        )}
      </div>

      {/* شريط التحكم السفلي بالكاميرا */}
      <div className="w-full max-w-md flex items-center justify-center gap-4 pb-4">
        {hasTorch && (
          <button
            type="button"
            onClick={toggleTorch}
            className={`p-3 rounded-2xl border-2 border-black flex items-center gap-2 text-xs font-black transition-all shadow-[0_4px_0_#000] active:translate-y-1 ${
              torchOn
                ? 'bg-arcade-yellow text-black'
                : 'bg-white/10 text-white hover:bg-white/20'
            }`}
          >
            <Zap className="w-4 h-4" />
            <span>{torchOn ? 'إطفاء الفلاش' : 'تشغيل الفلاش'}</span>
          </button>
        )}

        <button
          type="button"
          onClick={toggleFacingMode}
          className="p-3 rounded-2xl bg-white/10 hover:bg-white/20 border-2 border-black text-white flex items-center gap-2 text-xs font-black transition-all shadow-[0_4px_0_#000] active:translate-y-1"
        >
          <RefreshCw className="w-4 h-4" />
          <span>تبديل الكاميرا</span>
        </button>
      </div>
    </div>
  );
};
