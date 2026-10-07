import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';

interface QRCodeViewProps {
  value: string;
  size?: number;
  className?: string;
}

export const QRCodeView: React.FC<QRCodeViewProps> = ({
  value,
  size = 200,
  className = '',
}) => {
  const [dataUrl, setDataUrl] = useState<string>('');
  const [hasError, setHasError] = useState<boolean>(false);

  useEffect(() => {
    if (!value) return;

    let isMounted = true;
    setHasError(false);

    QRCode.toDataURL(value, {
      width: size * 2, // 2x for sharp rendering on retina screens
      margin: 1,
      color: {
        dark: '#000000',
        light: '#ffffff',
      },
      errorCorrectionLevel: 'M',
    })
      .then((url) => {
        if (isMounted) setDataUrl(url);
      })
      .catch((err) => {
        console.error('Failed to generate QR code:', err);
        if (isMounted) setHasError(true);
      });

    return () => {
      isMounted = false;
    };
  }, [value, size]);

  if (hasError) {
    return (
      <div
        style={{ width: size, height: size }}
        className={`bg-white rounded-2xl flex items-center justify-center p-4 text-center text-xs text-gray-600 font-bold ${className}`}
      >
        تعذر توليد الرمز
      </div>
    );
  }

  if (!dataUrl) {
    return (
      <div
        style={{ width: size, height: size }}
        className={`bg-white/80 rounded-2xl flex items-center justify-center animate-pulse ${className}`}
      >
        <span className="text-xs text-gray-500 font-bold">جارٍ التوليد...</span>
      </div>
    );
  }

  return (
    <div
      style={{ width: size, height: size }}
      className={`bg-white rounded-2xl p-2 border-2 border-black flex items-center justify-center shadow-md overflow-hidden ${className}`}
    >
      <img
        src={dataUrl}
        alt="رمز QR للانضمام للغرفة"
        className="w-full h-full object-contain pointer-events-none select-none"
      />
    </div>
  );
};
