import React, { useEffect, useRef, useState, useCallback } from 'react';
import jsQR from 'jsqr';

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
  const fileInputRef = useRef<HTMLInputElement | null>(null);
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

  // استخراج كود الغرفة سواء كان رابطاً كاملاً أو رمزاً مباشراً (٤ خانات)
  const parseRoomCode = (rawData: string): string => {
    const text = rawData.trim();
    const urlMatch = text.match(/[?&](?:join|room|code)=([A-Za-z0-9_-]{4,6})/i);
    if (urlMatch && urlMatch[1]) {
      return urlMatch[1].toUpperCase().slice(0, 4);
    }

    const pathMatch = text.match(/\/room\/([A-Za-z0-9_-]{4,6})/i);
    if (pathMatch && pathMatch[1]) {
      return pathMatch[1].toUpperCase().slice(0, 4);
    }

    const wordMatch = text.match(/\b([A-Za-z0-9]{4})\b/i);
    if (wordMatch && wordMatch[1]) {
      return wordMatch[1].toUpperCase();
    }

    return text.toUpperCase().slice(0, 4);
  };

  // بدء تشغيل الكاميرا مع دعم التراجع للخيارات الأبسط
  const startCamera = useCallback(async () => {
    stopCamera();
    setErrorMessage(null);
    setDetectedCode(null);

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('متصفحك يمنع البث الحي للكاميرا بدون اتصال آمن (HTTPS). استخدم زر (التقاط صورة للرمز) بالأسفل.');
      }

      let stream: MediaStream;
      try {
        // المحاولة الأولى: الكاميرا الخلفية بدقة جيدة
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: facingMode },
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
          audio: false,
        });
      } catch (firstErr) {
        // المحاولة الثانية: استعلام فيديو أساسي بدون قيود
        console.warn('Fallback to basic video constraints:', firstErr);
        stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: false,
        });
      }

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute('playsinline', 'true');
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
      let msg = 'تعذر تشغيل الكاميرا المباشرة. يمكنك استخدام زر "التقاط صورة للرمز" بالأسفل أو إدخال الرمز يدوياً.';
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        msg = 'تم رفض الإذن بالوصول للكاميرا. يمكنك التقاط صورة مباشرة أو تفعيل الإذن من إعدادات المتصفح.';
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        msg = 'لم يتم العثور على كاميرا في هذا الجهاز.';
      }
      setErrorMessage(msg);
      setIsScanning(false);
    }
  }, [facingMode, stopCamera]);

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

              try {
                if (navigator.vibrate) navigator.vibrate([40, 60, 40]);
              } catch (_) {}

              setTimeout(() => {
                onScan(parsed);
                onClose();
              }, 500);
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

  // قراءة صورة رمز QR من الملف أو الكاميرا المدمجة
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        ctx.drawImage(img, 0, 0, img.width, img.height);
        const imageData = ctx.getImageData(0, 0, img.width, img.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height, {
          inversionAttempts: 'attemptBoth',
        });

        if (code && code.data) {
          const parsed = parseRoomCode(code.data);
          if (parsed) {
            setDetectedCode(parsed);
            stopCamera();
            setTimeout(() => {
              onScan(parsed);
              onClose();
            }, 500);
            return;
          }
        }
        setErrorMessage('لم يتم العثور على رمز QR صالح في الصورة. يرجى تجربة التقاط صورة أوضح للرمز.');
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

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
    <div className="fixed inset-0 z-50 bg-black/95 flex flex-col items-center justify-between p-3 sm:p-5 backdrop-blur-md select-none animate-fadeIn">
      {/* input مخفي لاختيار أو تصوير صورة الرمز مباشرة */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileUpload}
        className="hidden"
      />

      {/* الترويسة العلوية */}
      <div className="w-full max-w-md flex items-center justify-between pt-1 pb-3 text-white">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-surface-container-high border border-outline-variant/60 rounded-xl text-white">
            <span className="material-symbols-outlined text-[20px]">qr_code_scanner</span>
          </div>
          <div>
            <h2 className="text-sm sm:text-base font-bold text-white">مسح رمز الغرفة (ESC)</h2>
            <p className="text-[11px] sm:text-xs text-on-surface-variant">وجّه الكاميرا نحو رمز QR على الشاشة</p>
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="p-2 rounded-full bg-surface-container-low hover:bg-surface-container text-on-surface-variant hover:text-white transition-all active:scale-95 border border-outline-variant/40"
          title="إغلاق"
        >
          <span className="material-symbols-outlined text-[20px]">close</span>
        </button>
      </div>

      {/* منطقة مسح الكاميرا */}
      <div className="relative w-full max-w-xs sm:max-w-sm aspect-square my-auto rounded-3xl overflow-hidden border border-outline-variant/60 bg-black shadow-2xl flex items-center justify-center">
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

        {/* شبكة التصويب */}
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
          <div className="relative w-3/4 h-3/4 rounded-2xl border-2 border-white/80 shadow-[0_0_20px_rgba(255,255,255,0.15)] overflow-hidden">
            <div className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-white rounded-tr-xl" />
            <div className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-white rounded-tl-xl" />
            <div className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-white rounded-br-xl" />
            <div className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-white rounded-bl-xl" />

            {/* خط الليزر الأبيض المتحرك */}
            {isScanning && !detectedCode && (
              <div className="absolute left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-white to-transparent opacity-80 animate-scan-laser" />
            )}

            {/* نجاح المسح */}
            {detectedCode && (
              <div className="absolute inset-0 bg-black/85 flex flex-col items-center justify-center p-3 text-center">
                <span className="material-symbols-outlined text-white text-4xl mb-2 animate-bounce">check_circle</span>
                <span className="text-white font-bold text-sm">تم مسح الغرفة بنجاح!</span>
                <span className="text-white font-mono font-black text-2xl tracking-widest mt-1">
                  {detectedCode}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* رسالة الخطأ أو قيود المتصفح */}
        {errorMessage && (
          <div className="absolute inset-0 bg-surface-container-low/95 p-5 flex flex-col items-center justify-center text-center">
            <span className="material-symbols-outlined text-amber-400 text-3xl mb-2">videocam_off</span>
            <p className="text-xs text-on-surface-variant font-medium mb-3.5 leading-relaxed">
              {errorMessage}
            </p>
            <div className="flex flex-col gap-2 w-full max-w-xs">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full py-2 px-3 bg-white text-surface-container-lowest hover:bg-neutral-200 rounded-xl text-xs font-bold shadow-md flex items-center justify-center gap-1.5 transition-all active:scale-95"
              >
                <span className="material-symbols-outlined text-[16px]">photo_camera</span>
                <span>التقاط صورة للرمز الآن</span>
              </button>
              <button
                type="button"
                onClick={startCamera}
                className="w-full py-2 px-3 bg-surface-container-high hover:bg-surface-container text-white rounded-xl text-xs font-semibold border border-outline-variant/50 transition-all active:scale-95"
              >
                إعادة تشغيل الكاميرا
              </button>
            </div>
          </div>
        )}
      </div>

      {/* شريط التحكم السفلي وخيارات البدائل */}
      <div className="w-full max-w-md flex flex-col items-center gap-2.5 pb-2">
        <div className="flex items-center justify-center gap-2.5 w-full">
          {/* زر التقاط / رفع صورة كبديل فوري ومضمون على أي هاتف */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex-1 py-2.5 px-3 rounded-xl bg-surface-container-high hover:bg-surface-container border border-outline-variant/60 text-white flex items-center justify-center gap-1.5 text-xs font-bold transition-all active:scale-95 shadow-sm"
          >
            <span className="material-symbols-outlined text-[18px]">photo_camera</span>
            <span>التقاط صورة الرمز</span>
          </button>

          {hasTorch && (
            <button
              type="button"
              onClick={toggleTorch}
              className={`p-2.5 rounded-xl border flex items-center justify-center transition-all shadow-sm active:scale-95 ${
                torchOn
                  ? 'bg-white text-surface-container-lowest border-white'
                  : 'bg-surface-container-low border-outline-variant/60 text-white hover:bg-surface-container'
              }`}
              title={torchOn ? 'إطفاء الفلاش' : 'تشغيل الفلاش'}
            >
              <span className="material-symbols-outlined text-[18px]">
                {torchOn ? 'flash_on' : 'flash_off'}
              </span>
            </button>
          )}

          <button
            type="button"
            onClick={toggleFacingMode}
            className="p-2.5 rounded-xl bg-surface-container-low border border-outline-variant/60 text-white hover:bg-surface-container transition-all active:scale-95 shadow-sm"
            title="تبديل الكاميرا الأمامية والخلفية"
          >
            <span className="material-symbols-outlined text-[18px]">flip_camera_ios</span>
          </button>
        </div>

        <p className="text-[10px] text-on-surface-variant text-center">
          يعمل مسح QR عبر البث المباشر أو التقاط صورة الرمز مباشرة بكاميرا هاتفك
        </p>
      </div>
    </div>
  );
};
