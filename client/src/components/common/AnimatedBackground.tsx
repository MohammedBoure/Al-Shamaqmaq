import React from 'react';

/**
 * خلفية مونوكروم هادئة تحاكي طاولة اللعب الليلية (Monochrome Minimalist Table Canvas)
 * بدون أي ألوان نيون أو توهج مشتت، خفيفة جداً ومحسنة للأداء
 */
export const AnimatedBackground: React.FC = () => {
  return (
    <div
      aria-hidden="true"
      className="fixed inset-0 pointer-events-none overflow-hidden -z-10 select-none table-canvas-dark"
    >
      {/* شبكة نقاط مونوكروم فائقة النعومة */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: 'radial-gradient(#ffffff 1px, transparent 1px)',
          backgroundSize: '32px 32px',
        }}
      />
    </div>
  );
};
