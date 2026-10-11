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
  detective: { name: 'قبعة المحقق', label: '🕵️' },
  sheikh: { name: 'الشماغ والعقال', label: '👳' },
  bat: { name: 'قناع الوطواط', label: '🦇' },
  ninja: { name: 'عصابة النينجا', label: '🥷' },
  crown: { name: 'التاج الملكي', label: '👑' },
  horns: { name: 'القرون الشقية', label: '😈' },
  pirate: { name: 'قبعة القراصنة', label: '🏴‍☠️' },
  wizard: { name: 'قبعة الساحر', label: '🧙' },
  party: { name: 'طربوش الحفلة', label: '🥳' },
  cat: { name: 'أذنا القطة', label: '🐱' },
  none: { name: 'بدون قناع', label: '🤖' },
};

export const PET_GLASSES: Record<string, { name: string; label: string }> = {
  none: { name: 'بدون نظارات', label: '👀' },
  mustache: { name: 'شارب المخادع', label: '🥸' },
  monocle: { name: 'عدسة المحقق', label: '🧐' },
  cool: { name: 'نظارات البكسل', label: '🕶️' },
  goggles: { name: 'نظارات السايبر', label: '🥽' },
  star: { name: 'نظارات النجوم', label: '⭐' },
  nerd: { name: 'نظارات دائرية', label: '👓' },
};

export const PET_EXPRESSIONS: Record<string, { name: string; label: string }> = {
  determined: { name: 'متحدّي', label: '😼' },
  smug: { name: 'مخادع ماكر', label: '😏' },
  wink: { name: 'غمزة ذكية', label: '😉' },
  surprised: { name: 'مصدوم', label: '😲' },
  happy: { name: 'مرح وضاحك', label: '😄' },
};

export const DEFAULT_PET_CONFIG: PetConfig = {
  color: 'teal',
  mask: 'detective',
  glasses: 'mustache',
  expression: 'smug',
};

export function serializePet(config: PetConfig): string {
  return `pet:${config.color}:${config.mask}:${config.glasses}:${config.expression || 'determined'}`;
}

export function parsePet(avatarStr?: string): PetConfig {
  if (!avatarStr || !avatarStr.startsWith('pet:')) {
    return { ...DEFAULT_PET_CONFIG };
  }
  const parts = avatarStr.split(':');
  return {
    color: PET_COLORS[parts[1]] ? parts[1] : DEFAULT_PET_CONFIG.color,
    mask: PET_MASKS[parts[2]] ? parts[2] : DEFAULT_PET_CONFIG.mask,
    glasses: PET_GLASSES[parts[3]] ? parts[3] : DEFAULT_PET_CONFIG.glasses,
    expression: PET_EXPRESSIONS[parts[4]] ? parts[4] : DEFAULT_PET_CONFIG.expression,
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

        {/* رأس الشخصية / القناع / القبعة */}
        <g id="head-mask">
          {/* قبعة المحقق (خداع وتخمين) */}
          {cfg.mask === 'detective' && (
            <g id="detective-hat">
              {/* حافة القبعة */}
              <ellipse cx="100" cy="80" rx="72" ry="14" fill="#6c584c" stroke="#000000" strokeWidth="5" />
              {/* تاج القبعة */}
              <path
                d="M 52 78 C 50 35, 150 35, 148 78 Z"
                fill="#8d7361"
                stroke="#000000"
                strokeWidth="6"
                strokeLinejoin="round"
              />
              {/* شريط القبعة المنقوش */}
              <path d="M 55 72 C 75 66, 125 66, 145 72" stroke="#12131a" strokeWidth="9" />
              <circle cx="100" cy="69" r="4" fill="#ffb703" />
            </g>
          )}

          {/* الشماغ والعقال العربي */}
          {cfg.mask === 'sheikh' && (
            <g id="sheikh-keffiyeh">
              {/* قماش الشماغ المنسدل */}
              <path
                d="M 30 96 C 26 45, 60 30, 100 30 C 140 30, 174 45, 170 96 C 176 130, 164 150, 156 160 L 146 110 C 125 106, 75 106, 54 110 L 44 160 C 36 150, 24 130, 30 96 Z"
                fill="#f8f9fa"
                stroke="#000000"
                strokeWidth="6"
                strokeLinejoin="round"
              />
              {/* نقوش الشماغ الحمراء */}
              <path d="M 60 52 L 140 52 M 50 66 L 150 66 M 46 80 L 154 80" stroke="#d90429" strokeWidth="3" strokeDasharray="5,4" />
              {/* العقال الأسود المزدوج */}
              <ellipse cx="100" cy="52" rx="46" ry="10" fill="none" stroke="#000000" strokeWidth="7" />
              <ellipse cx="100" cy="57" rx="44" ry="9" fill="none" stroke="#2b2d42" strokeWidth="5" />
            </g>
          )}

          {/* قناع الوطواط */}
          {cfg.mask === 'bat' && (
            <g id="bat-mask">
              <path
                d="M 32 102 L 32 46 L 60 70 L 140 70 L 168 46 L 168 102 Z"
                fill="#12131a"
                stroke="#000000"
                strokeWidth="6"
                strokeLinejoin="round"
              />
              <path d="M 36 54 L 60 74 L 140 74 L 164 54" stroke="#2a2c3d" strokeWidth="3" strokeLinecap="round" />
            </g>
          )}

          {/* قناع النينجا */}
          {cfg.mask === 'ninja' && (
            <g id="ninja-mask">
              <rect x="34" y="60" width="132" height="42" rx="14" fill="#d90429" stroke="#000" strokeWidth="6" />
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

          {/* قبعة الساحر */}
          {cfg.mask === 'wizard' && (
            <g id="wizard-hat">
              <ellipse cx="100" cy="84" rx="65" ry="12" fill="#3a0ca3" stroke="#000" strokeWidth="5" />
              <path d="M 60 82 L 100 24 L 140 82 Z" fill="#4361ee" stroke="#000" strokeWidth="5" strokeLinejoin="round" />
              <polygon points="100,42 103,50 111,50 105,55 107,63 100,58 93,63 95,55 89,50 97,50" fill="#ffd166" />
            </g>
          )}

          {/* طربوش الحفلة */}
          {cfg.mask === 'party' && (
            <g id="party-hat">
              <path d="M 75 84 L 100 32 L 125 84 Z" fill="#ff006e" stroke="#000" strokeWidth="5" strokeLinejoin="round" />
              <path d="M 83 70 L 117 70" stroke="#ffbe0b" strokeWidth="4" />
              <path d="M 91 54 L 109 54" stroke="#3a86ff" strokeWidth="4" />
              <circle cx="100" cy="30" r="7" fill="#ffbe0b" stroke="#000" strokeWidth="3" />
            </g>
          )}

          {/* أذنا القطة */}
          {cfg.mask === 'cat' && (
            <g id="cat-ears">
              <polygon points="40,86 52,44 76,78" fill="#1b1b1e" stroke="#000" strokeWidth="5" strokeLinejoin="round" />
              <polygon points="46,80 54,54 70,75" fill="#ff758f" />
              <polygon points="160,86 148,44 124,78" fill="#1b1b1e" stroke="#000" strokeWidth="5" strokeLinejoin="round" />
              <polygon points="154,80 146,54 130,75" fill="#ff758f" />
            </g>
          )}

          {/* بدون قناع (هوائي الكونسول اللطيف) */}
          {cfg.mask === 'none' && (
            <g id="none-mask">
              <circle cx="100" cy="45" r="8" fill="#ffd166" stroke="#000" strokeWidth="4" />
              <line x1="100" y1="53" x2="100" y2="86" stroke="#000" strokeWidth="5" />
            </g>
          )}
        </g>

        {/* عيون وملامح الوجه التعبيرية */}
        <g id="face-features">
          {/* تعبير الغمزة الذكية */}
          {cfg.expression === 'wink' ? (
            <g id="eyes-wink" stroke="#000000" strokeWidth="4">
              {/* عين مفتوحة ذكية */}
              <ellipse cx="68" cy="87" rx="14" ry="10" fill="#ffffff" />
              <circle cx="70" cy="87" r="5" fill="#000000" stroke="none" />
              <circle cx="68" cy="85" r="1.5" fill="#ffffff" stroke="none" />
              {/* عين مغمضة بغمزة */}
              <path d="M 118 88 Q 132 80 146 88" fill="none" strokeWidth="4.5" strokeLinecap="round" />
            </g>
          ) : cfg.expression === 'smug' ? (
            /* تعبير المخادع الماكر */
            <g id="eyes-smug" stroke="#000000" strokeWidth="3.5">
              <path d="M 54 84 Q 68 76 82 84 Q 68 96 54 84 Z" fill="#ffffff" />
              <circle cx="72" cy="84" r="4.5" fill="#000000" stroke="none" />
              <path d="M 118 84 Q 132 76 146 84 Q 132 96 118 84 Z" fill="#ffffff" />
              <circle cx="128" cy="84" r="4.5" fill="#000000" stroke="none" />
            </g>
          ) : cfg.expression === 'surprised' ? (
            /* تعبير المصدوم */
            <g id="eyes-surprised" stroke="#000000" strokeWidth="4">
              <circle cx="68" cy="86" r="12" fill="#ffffff" />
              <circle cx="68" cy="86" r="5.5" fill="#000000" stroke="none" />
              <circle cx="66" cy="84" r="2" fill="#ffffff" stroke="none" />
              <circle cx="132" cy="86" r="12" fill="#ffffff" />
              <circle cx="132" cy="86" r="5.5" fill="#000000" stroke="none" />
              <circle cx="130" cy="84" r="2" fill="#ffffff" stroke="none" />
            </g>
          ) : cfg.expression === 'happy' ? (
            /* تعبير السعيد والضاحك */
            <g id="eyes-happy" stroke="#000000" strokeWidth="4.5" fill="none">
              <path d="M 56 89 Q 68 76 80 89" strokeLinecap="round" />
              <path d="M 120 89 Q 132 76 144 89" strokeLinecap="round" />
            </g>
          ) : (
            /* التعبير الافتراضي المتحدي */
            <g id="eyes-determined" stroke="#000000" strokeWidth="4">
              <path d="M 52 88 C 54 75, 78 75, 84 88 C 78 98, 56 98, 52 88 Z" fill="#ffffff" />
              <circle cx="70" cy="87" r="5" fill="#000000" stroke="none" />
              <circle cx="68" cy="85" r="1.5" fill="#ffffff" stroke="none" />
              <path d="M 148 88 C 146 75, 122 75, 116 88 C 122 98, 144 98, 148 88 Z" fill="#ffffff" />
              <circle cx="130" cy="87" r="5" fill="#000000" stroke="none" />
              <circle cx="132" cy="85" r="1.5" fill="#ffffff" stroke="none" />
            </g>
          )}

          {/* الأنف الكرتوني */}
          <ellipse cx="100" cy="94" rx="4.5" ry="3" fill="#000000" />

          {/* الفم حسب التعبير */}
          {cfg.expression === 'smug' ? (
            /* ابتسامة ماكرة جانبية */
            <g id="mouth-smug">
              <path d="M 92 101 Q 106 108 116 97" stroke="#000000" strokeWidth="3.5" strokeLinecap="round" fill="none" />
            </g>
          ) : cfg.expression === 'surprised' ? (
            /* فم مصدوم دائري */
            <g id="mouth-surprised">
              <ellipse cx="100" cy="107" rx="7" ry="9" fill="#c1121f" stroke="#000" strokeWidth="3" />
            </g>
          ) : cfg.expression === 'happy' ? (
            /* فم ضاحك عريض */
            <g id="mouth-happy">
              <path d="M 85 99 Q 100 120 115 99 Z" fill="#c1121f" stroke="#000" strokeWidth="3.5" />
              <path d="M 92 106 Q 100 119 108 106 Z" fill="#ff758f" />
            </g>
          ) : (
            /* الفم الافتراضي مع اللسان */
            <g id="mouth-default">
              <path d="M 88 100 Q 100 118 112 100 Z" fill="#c1121f" stroke="#000000" strokeWidth="3.5" strokeLinejoin="round" />
              <path d="M 94 105 Q 100 117 106 105 Z" fill="#ff758f" />
              <path d="M 86 99 Q 100 102 114 99" stroke="#000000" strokeWidth="3.5" strokeLinecap="round" />
            </g>
          )}
        </g>

        {/* النظارات والإكسسوارات الإضافية */}
        <g id="glasses">
          {/* شارب الخداع والتنكر الشهير في كلك */}
          {cfg.glasses === 'mustache' && (
            <g id="glasses-mustache">
              {/* شارب كلاسيكي مبروم */}
              <path
                d="M 100 96 
                   C 94 92, 78 88, 70 98 
                   C 76 105, 90 102, 100 98 
                   C 110 102, 124 105, 130 98 
                   C 122 88, 106 92, 100 96 Z"
                fill="#12131a"
                stroke="#000000"
                strokeWidth="3.5"
                strokeLinejoin="round"
              />
              <circle cx="100" cy="95" r="2.5" fill="#c1121f" />
            </g>
          )}

          {/* مونوكل عدسة المحقق */}
          {cfg.glasses === 'monocle' && (
            <g id="glasses-monocle">
              {/* عدسة ذهبية على العين اليسرى */}
              <circle cx="70" cy="87" r="14" fill="#ffffff" fillOpacity="0.25" stroke="#ffb703" strokeWidth="4" />
              {/* سلسلة متدلية */}
              <path d="M 84 89 Q 95 110 90 130" stroke="#ffb703" strokeWidth="2.5" fill="none" strokeDasharray="3,3" />
            </g>
          )}

          {/* نظارات البكسل السوداء */}
          {cfg.glasses === 'cool' && (
            <g id="glasses-cool">
              <rect x="46" y="78" width="46" height="20" rx="3" fill="#000000" stroke="#000000" strokeWidth="3" />
              <rect x="108" y="78" width="46" height="20" rx="3" fill="#000000" stroke="#000000" strokeWidth="3" />
              <rect x="92" y="84" width="16" height="6" fill="#000000" />
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
