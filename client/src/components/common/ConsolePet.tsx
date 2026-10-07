import React from 'react';

export interface PetConfig {
  color: string;
  mask: string;
  glasses: string;
  expression?: string;
}

export const PET_COLORS: Record<string, { name: string; body: string; shadow: string; dpad: string; btn: string }> = {
  teal: { name: 'تركواز', body: '#36b69b', shadow: '#1f7a68', dpad: '#16574a', btn: '#16574a' },
  pink: { name: 'وردي', body: '#ff7fa2', shadow: '#c4486b', dpad: '#a02347', btn: '#a02347' },
  red: { name: 'أحمر', body: '#e63946', shadow: '#9b1b26', dpad: '#700f17', btn: '#700f17' },
  orange: { name: 'برتقالي', body: '#ff7900', shadow: '#b34e00', dpad: '#803600', btn: '#803600' },
  yellow: { name: 'أصفر', body: '#fbc02d', shadow: '#af830e', dpad: '#7a5a02', btn: '#7a5a02' },
  amber: { name: 'عسلي', body: '#f57c00', shadow: '#a34e00', dpad: '#6d3300', btn: '#6d3300' },
  green: { name: 'أخضر ليموني', body: '#4caf50', shadow: '#2e7d32', dpad: '#1b5e20', btn: '#1b5e20' },
  brightgreen: { name: 'أخضر فاقع', body: '#00e676', shadow: '#00a352', dpad: '#006c35', btn: '#006c35' },
  blue: { name: 'أزرق', body: '#2196f3', shadow: '#1565c0', dpad: '#0d47a1', btn: '#0d47a1' },
  magenta: { name: 'أرجواني', body: '#e91e63', shadow: '#ad1457', dpad: '#880e4f', btn: '#880e4f' },
  cyan: { name: 'سماوي', body: '#00e5ff', shadow: '#0097a7', dpad: '#006064', btn: '#006064' },
  lime: { name: 'ليموني', body: '#76ff03', shadow: '#52b202', dpad: '#33691e', btn: '#33691e' },
  dark: { name: 'رمادي داكن', body: '#2b2d42', shadow: '#1a1b29', dpad: '#10111a', btn: '#10111a' },
  purple: { name: 'بنفسجي', body: '#9c27b0', shadow: '#6a1b9a', dpad: '#4a148c', btn: '#4a148c' },
};

export const PET_MASKS: Record<string, { name: string; label: string }> = {
  bat: { name: 'قناع الوطواط', label: '🦇' },
  ninja: { name: 'عصابة النينجا', label: '🥷' },
  crown: { name: 'التاج الملكي', label: '👑' },
  horns: { name: 'القرون الشقية', label: '😈' },
  pirate: { name: 'قبعة القراصنة', label: '🏴‍☠️' },
  none: { name: 'بدون قناع', label: '🤖' },
};

export const PET_GLASSES: Record<string, { name: string; label: string }> = {
  none: { name: 'بدون نظارات', label: '👀' },
  cool: { name: 'نظارات البكسل', label: '🕶️' },
  goggles: { name: 'نظارات السايبر', label: '🥽' },
  star: { name: 'نظارات النجوم', label: '⭐' },
  nerd: { name: 'نظارات دائرية', label: '👓' },
};

export const DEFAULT_PET_CONFIG: PetConfig = {
  color: 'pink',
  mask: 'bat',
  glasses: 'none',
  expression: 'determined',
};

export function serializePet(config: PetConfig): string {
  return `pet:${config.color}:${config.mask}:${config.glasses}:${config.expression || 'determined'}`;
}

export function parsePet(avatarStr?: string): PetConfig {
  if (!avatarStr || !avatarStr.startsWith('pet:')) {
    // إذا كان إيموجي قديم نختار لونا متوافقا
    return { ...DEFAULT_PET_CONFIG };
  }
  const parts = avatarStr.split(':');
  return {
    color: PET_COLORS[parts[1]] ? parts[1] : DEFAULT_PET_CONFIG.color,
    mask: PET_MASKS[parts[2]] ? parts[2] : DEFAULT_PET_CONFIG.mask,
    glasses: PET_GLASSES[parts[3]] ? parts[3] : DEFAULT_PET_CONFIG.glasses,
    expression: parts[4] || 'determined',
  };
}

interface ConsolePetProps {
  avatar?: string;
  config?: PetConfig;
  size?: number | string;
  className?: string;
}

export const ConsolePet: React.FC<ConsolePetProps> = ({
  avatar,
  config: propConfig,
  size = 120,
  className = '',
}) => {
  const cfg = propConfig || parsePet(avatar);
  const colorScheme = PET_COLORS[cfg.color] || PET_COLORS.pink;

  return (
    <div
      style={{ width: size, height: size }}
      className={`relative inline-flex items-center justify-center select-none ${className}`}
    >
      <svg
        viewBox="0 0 200 200"
        className="w-full h-full drop-shadow-md"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* الجسم الأساسي للكونسول */}
        <g id="console-body">
          {/* خلفية وظل الكونسول */}
          <rect
            x="32"
            y="90"
            width="136"
            height="86"
            rx="22"
            fill={colorScheme.shadow}
            stroke="#000000"
            strokeWidth="6"
            strokeLinejoin="round"
          />
          {/* واجهة الكونسول الملونة */}
          <rect
            x="32"
            y="86"
            width="136"
            height="82"
            rx="22"
            fill={colorScheme.body}
            stroke="#000000"
            strokeWidth="6"
            strokeLinejoin="round"
          />

          {/* لوحة التحكم اليسرى - D-Pad */}
          <g id="dpad" fill={colorScheme.dpad} stroke="#000000" strokeWidth="2.5">
            {/* صليب أسهم الكونسول */}
            <path
              d="M 52 118 h 10 v -10 h 10 v 10 h 10 v 10 h -10 v 10 h -10 v -10 h -10 z"
              fill={colorScheme.dpad}
            />
            {/* تفاصيل الأسهم الصغيرة */}
            <circle cx="67" cy="123" r="2" fill="#ffffff" opacity="0.6" stroke="none" />
          </g>

          {/* أزرار التشغيل بالوسط */}
          <g id="center-buttons" fill={colorScheme.dpad}>
            <ellipse cx="94" cy="138" rx="4" ry="2" transform="rotate(-25 94 138)" />
            <ellipse cx="106" cy="138" rx="4" ry="2" transform="rotate(-25 106 138)" />
          </g>

          {/* فتحات مكبر الصوت بالأسفل */}
          <g id="speaker-slits" stroke={colorScheme.dpad} strokeWidth="2" strokeLinecap="round">
            <line x1="88" y1="156" x2="96" y2="156" />
            <line x1="104" y1="156" x2="112" y2="156" />
          </g>

          {/* أزرار التحكم اليمنى - Action Buttons */}
          <g id="action-buttons" stroke="#000000" strokeWidth="2.5">
            {/* زر B */}
            <circle cx="132" cy="128" r="6" fill={colorScheme.btn} />
            {/* زر A */}
            <circle cx="148" cy="118" r="6" fill={colorScheme.btn} />
            <circle cx="133" cy="127" r="1.5" fill="#ffffff" opacity="0.7" stroke="none" />
            <circle cx="149" cy="117" r="1.5" fill="#ffffff" opacity="0.7" stroke="none" />
          </g>
        </g>

        {/* رأس الشخصية / القناع */}
        <g id="head-mask">
          {/* قناع الوطواط الافتراضي في الصورة المرجعية */}
          {cfg.mask === 'bat' && (
            <g id="bat-mask">
              {/* خوذة الوطواط السوداء مع الأذنين المدببتين */}
              <path
                d="M 32 102 
                   L 32 46 
                   L 60 70 
                   L 140 70 
                   L 168 46 
                   L 168 102 
                   Z"
                fill="#12131a"
                stroke="#000000"
                strokeWidth="6"
                strokeLinejoin="round"
              />
              {/* تفاصيل ظل الخوذة العلوية */}
              <path
                d="M 36 54 L 60 74 L 140 74 L 164 54"
                stroke="#2a2c3d"
                strokeWidth="3"
                strokeLinecap="round"
              />
            </g>
          )}

          {/* قناع النينجا */}
          {cfg.mask === 'ninja' && (
            <g id="ninja-mask">
              <rect x="34" y="60" width="132" height="42" rx="14" fill="#d90429" stroke="#000" strokeWidth="6" />
              {/* ذيل العصابة */}
              <path d="M 166 75 L 188 68 L 184 85 Z" fill="#d90429" stroke="#000" strokeWidth="4" />
              <circle cx="100" cy="80" r="10" fill="#ffffff" stroke="#000" strokeWidth="3" />
              <circle cx="100" cy="80" r="5" fill="#d90429" />
            </g>
          )}

          {/* التاج الملكي */}
          {cfg.mask === 'crown' && (
            <g id="crown-mask">
              <path
                d="M 40 102 L 40 50 L 70 70 L 100 40 L 130 70 L 160 50 L 160 102 Z"
                fill="#ffb703"
                stroke="#000"
                strokeWidth="6"
                strokeLinejoin="round"
              />
              <circle cx="100" cy="40" r="4" fill="#e63946" stroke="#000" strokeWidth="2" />
              <circle cx="40" cy="50" r="3" fill="#e63946" stroke="#000" strokeWidth="2" />
              <circle cx="160" cy="50" r="3" fill="#e63946" stroke="#000" strokeWidth="2" />
            </g>
          )}

          {/* القرون الشقية */}
          {cfg.mask === 'horns' && (
            <g id="horns-mask">
              <path d="M 45 95 C 35 60 55 35 65 30 C 65 50 55 75 55 95 Z" fill="#d90429" stroke="#000" strokeWidth="5" />
              <path d="M 155 95 C 165 60 145 35 135 30 C 135 50 145 75 145 95 Z" fill="#d90429" stroke="#000" strokeWidth="5" />
            </g>
          )}

          {/* قبعة القرصان */}
          {cfg.mask === 'pirate' && (
            <g id="pirate-mask">
              <path d="M 30 92 Q 100 40 170 92 Q 100 70 30 92 Z" fill="#1b1b1e" stroke="#000" strokeWidth="6" />
              <circle cx="100" cy="74" r="7" fill="#ffffff" stroke="#000" strokeWidth="2" />
              <text x="100" y="78" fontSize="9" textAnchor="middle" fill="#000" fontWeight="bold">☠</text>
            </g>
          )}

          {/* بدون قناع (رأس كونسول لطيف مع هوائي) */}
          {cfg.mask === 'none' && (
            <g id="none-mask">
              <circle cx="100" cy="45" r="8" fill="#ffd166" stroke="#000" strokeWidth="4" />
              <line x1="100" y1="53" x2="100" y2="86" stroke="#000" strokeWidth="5" />
            </g>
          )}
        </g>

        {/* عيون الشخصية وملامح الوجه المرحة */}
        <g id="face-features">
          {/* العيون الحادة الكرتونية الكبيرة */}
          <g id="eyes" stroke="#000000" strokeWidth="4">
            {/* العين اليسرى */}
            <path
              d="M 52 88 
                 C 54 75, 78 75, 84 88 
                 C 78 98, 56 98, 52 88 Z"
              fill="#ffffff"
            />
            {/* بؤبؤ العين اليسرى */}
            <circle cx="70" cy="87" r="5" fill="#000000" stroke="none" />
            <circle cx="68" cy="85" r="1.5" fill="#ffffff" stroke="none" />

            {/* العين اليمنى */}
            <path
              d="M 148 88 
                 C 146 75, 122 75, 116 88 
                 C 122 98, 144 98, 148 88 Z"
              fill="#ffffff"
            />
            {/* بؤبؤ العين اليمنى */}
            <circle cx="130" cy="87" r="5" fill="#000000" stroke="none" />
            <circle cx="132" cy="85" r="1.5" fill="#ffffff" stroke="none" />
          </g>

          {/* الأنف والشارب الكرتوني */}
          <ellipse cx="100" cy="94" rx="4.5" ry="3" fill="#000000" />

          {/* الفم واللسان الشقي (المطابق للصورة الأصلية) */}
          <g id="mouth">
            <path
              d="M 88 100 
                 Q 100 118 112 100 
                 Z"
              fill="#c1121f"
              stroke="#000000"
              strokeWidth="3.5"
              strokeLinejoin="round"
            />
            {/* لسان زهري صغير ظريف */}
            <path
              d="M 94 105 
                 Q 100 117 106 105 
                 Z"
              fill="#ff758f"
            />
            {/* خط الفم العلوي */}
            <path d="M 86 99 Q 100 102 114 99" stroke="#000000" strokeWidth="3.5" strokeLinecap="round" />
          </g>
        </g>

        {/* النظارات والإكسسوارات الإضافية */}
        <g id="glasses">
          {/* نظارات البكسل السوداء */}
          {cfg.glasses === 'cool' && (
            <g id="glasses-cool">
              <rect x="46" y="78" width="46" height="20" rx="3" fill="#000000" stroke="#000000" strokeWidth="3" />
              <rect x="108" y="78" width="46" height="20" rx="3" fill="#000000" stroke="#000000" strokeWidth="3" />
              <rect x="92" y="84" width="16" height="6" fill="#000000" />
              {/* لمعة النظارة */}
              <line x1="52" y1="83" x2="62" y2="83" stroke="#ffffff" strokeWidth="3" strokeLinecap="round" />
              <line x1="114" y1="83" x2="124" y2="83" stroke="#ffffff" strokeWidth="3" strokeLinecap="round" />
            </g>
          )}

          {/* نظارات السايبر التكنولوجية */}
          {cfg.glasses === 'goggles' && (
            <g id="glasses-goggles">
              <rect x="44" y="76" width="112" height="22" rx="10" fill="#00f5d4" opacity="0.85" stroke="#000000" strokeWidth="4" />
              <line x1="50" y1="82" x2="150" y2="82" stroke="#ffffff" strokeWidth="2.5" opacity="0.7" />
            </g>
          )}

          {/* نظارات النجوم المرحة */}
          {cfg.glasses === 'star' && (
            <g id="glasses-star" fill="#ffd166" stroke="#000000" strokeWidth="3">
              <polygon points="68,72 73,84 86,84 75,92 79,104 68,96 57,104 61,92 50,84 63,84" />
              <polygon points="132,72 137,84 150,84 139,92 143,104 132,96 121,104 125,92 114,84 127,84" />
              <line x1="86" y1="86" x2="114" y2="86" stroke="#000" strokeWidth="4" />
            </g>
          )}

          {/* نظارات دائرية نيرد */}
          {cfg.glasses === 'nerd' && (
            <g id="glasses-nerd" stroke="#000000" strokeWidth="4" fill="none">
              <circle cx="68" cy="87" r="14" fill="#ffffff" fillOpacity="0.2" />
              <circle cx="132" cy="87" r="14" fill="#ffffff" fillOpacity="0.2" />
              <line x1="82" y1="87" x2="118" y2="87" />
            </g>
          )}
        </g>
      </svg>
    </div>
  );
};
