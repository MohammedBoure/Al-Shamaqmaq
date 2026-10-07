const fs = require('fs');
const path = require('path');

const covers = {
  'space.svg': {
    title: 'الفلك والفضاء',
    gradient: ['#0f051d', '#3b0764', '#1e1b4b'],
    iconBg: '#4c1d95',
    svgArt: `
      <circle cx="75" cy="65" r="32" fill="#7c3aed" opacity="0.6"/>
      <ellipse cx="75" cy="65" rx="55" ry="12" fill="none" stroke="#f472b6" stroke-width="3" stroke-dasharray="4 2"/>
      <circle cx="110" cy="35" r="9" fill="#fbbf24"/>
      <circle cx="35" cy="85" r="5" fill="#38bdf8"/>
      <circle cx="95" cy="95" r="3" fill="#ffffff" opacity="0.8"/>
      <circle cx="50" cy="40" r="2" fill="#ffffff" opacity="0.8"/>
    `
  },
  'general_science.svg': {
    title: 'علوم',
    gradient: ['#042f2e', '#0f766e', '#115e59'],
    iconBg: '#0d9488',
    svgArt: `
      <path d="M60 40 L90 40 L105 85 L45 85 Z" fill="#14b8a6" opacity="0.7" stroke="#99f6e4" stroke-width="2"/>
      <circle cx="75" cy="72" r="8" fill="#2dd4bf"/>
      <circle cx="85" cy="60" r="5" fill="#5eead4"/>
      <circle cx="68" cy="55" r="4" fill="#a7f3d0"/>
    `
  },
  'physics.svg': {
    title: 'الفيزياء',
    gradient: ['#172554', '#1e40af', '#312e81'],
    iconBg: '#2563eb',
    svgArt: `
      <ellipse cx="75" cy="65" rx="46" ry="16" fill="none" stroke="#60a5fa" stroke-width="2.5" transform="rotate(30, 75, 65)"/>
      <ellipse cx="75" cy="65" rx="46" ry="16" fill="none" stroke="#c084fc" stroke-width="2.5" transform="rotate(-30, 75, 65)"/>
      <ellipse cx="75" cy="65" rx="46" ry="16" fill="none" stroke="#38bdf8" stroke-width="2.5" transform="rotate(90, 75, 65)"/>
      <circle cx="75" cy="65" r="10" fill="#f43f5e"/>
    `
  },
  'animals.svg': {
    title: 'حيوانات',
    gradient: ['#14532d', '#15803d', '#78350f'],
    iconBg: '#16a34a',
    svgArt: `
      <circle cx="75" cy="55" r="26" fill="#f59e0b"/>
      <polygon points="60,35 55,20 70,30" fill="#d97706"/>
      <polygon points="90,35 95,20 80,30" fill="#d97706"/>
      <circle cx="68" cy="52" r="3" fill="#1e293b"/>
      <circle cx="82" cy="52" r="3" fill="#1e293b"/>
      <polygon points="75,58 72,64 78,64" fill="#78350f"/>
    `
  },
  'biology.svg': {
    title: 'الأحياء',
    gradient: ['#022c22', '#065f46', '#047857'],
    iconBg: '#059669',
    svgArt: `
      <circle cx="75" cy="65" r="34" fill="#10b981" opacity="0.4" stroke="#34d399" stroke-width="3"/>
      <circle cx="63" cy="58" r="7" fill="#6ee7b7"/>
      <circle cx="87" cy="62" r="9" fill="#a7f3d0"/>
      <circle cx="72" cy="78" r="6" fill="#34d399"/>
    `
  },
  'mathematics.svg': {
    title: 'رياضيات',
    gradient: ['#0f172a', '#334155', '#1e293b'],
    iconBg: '#475569',
    svgArt: `
      <rect x="35" y="35" width="80" height="55" rx="8" fill="#0f172a" stroke="#94a3b8" stroke-width="2.5"/>
      <line x1="48" y1="55" x2="68" y2="55" stroke="#38bdf8" stroke-width="3" stroke-linecap="round"/>
      <line x1="58" y1="45" x2="58" y2="65" stroke="#38bdf8" stroke-width="3" stroke-linecap="round"/>
      <line x1="84" y1="48" x2="98" y2="62" stroke="#f43f5e" stroke-width="3" stroke-linecap="round"/>
      <line x1="98" y1="48" x2="84" y2="62" stroke="#f43f5e" stroke-width="3" stroke-linecap="round"/>
    `
  },
  'botany.svg': {
    title: 'نباتات',
    gradient: ['#052e16', '#14532d', '#166534'],
    iconBg: '#15803d',
    svgArt: `
      <path d="M75 90 Q40 60 45 35 Q75 45 75 90 Z" fill="#22c55e"/>
      <path d="M75 90 Q110 60 105 35 Q75 45 75 90 Z" fill="#4ade80"/>
      <rect x="73" y="60" width="4" height="35" fill="#78350f" rx="2"/>
    `
  },
  'anatomy_health.svg': {
    title: 'علم الجسم والصحة',
    gradient: ['#3b0764', '#581c87', '#7e22ce'],
    iconBg: '#9333ea',
    svgArt: `
      <circle cx="75" cy="40" r="14" fill="#fbcfe8"/>
      <path d="M60 58 C60 52 90 52 90 58 L85 90 C85 94 65 94 65 90 Z" fill="#ec4899"/>
      <circle cx="70" cy="65" r="4" fill="#ef4444"/>
    `
  },
  'medicine.svg': {
    title: 'طب عام',
    gradient: ['#082f49', '#0369a1', '#0284c7'],
    iconBg: '#0ea5e9',
    svgArt: `
      <rect x="45" y="38" width="60" height="55" rx="10" fill="#ffffff" opacity="0.95"/>
      <line x1="75" y1="48" x2="75" y2="83" stroke="#ef4444" stroke-width="8" stroke-linecap="round"/>
      <line x1="58" y1="65" x2="92" y2="65" stroke="#ef4444" stroke-width="8" stroke-linecap="round"/>
    `
  },
  'engineering.svg': {
    title: 'هندسة',
    gradient: ['#451a03', '#78350f', '#b45309'],
    iconBg: '#d97706',
    svgArt: `
      <path d="M45 70 C45 45 105 45 105 70 Z" fill="#fde047" stroke="#ca8a04" stroke-width="2"/>
      <rect x="40" y="68" width="70" height="8" rx="3" fill="#eab308"/>
    `
  },
  'medical_terms.svg': {
    title: 'مصطلحات طبية',
    gradient: ['#134e4a', '#0f766e', '#14b8a6'],
    iconBg: '#0d9488',
    svgArt: `
      <rect x="40" y="38" width="70" height="52" rx="8" fill="#f0fdfa" stroke="#0f766e" stroke-width="2"/>
      <line x1="50" y1="50" x2="90" y2="50" stroke="#0f766e" stroke-width="3" stroke-linecap="round"/>
      <line x1="50" y1="60" x2="85" y2="60" stroke="#0f766e" stroke-width="3" stroke-linecap="round"/>
      <line x1="50" y1="70" x2="75" y2="70" stroke="#0f766e" stroke-width="3" stroke-linecap="round"/>
    `
  },
  'math_puzzles.svg': {
    title: 'ألغاز رياضيات',
    gradient: ['#312e81', '#3730a3', '#4338ca'],
    iconBg: '#6366f1',
    svgArt: `
      <rect x="42" y="42" width="38" height="38" rx="8" fill="#818cf8" stroke="#c7d2fe" stroke-width="2" transform="rotate(15, 61, 61)"/>
      <rect x="74" y="36" width="34" height="34" rx="6" fill="#f43f5e" stroke="#fecdd3" stroke-width="2" transform="rotate(-12, 91, 53)"/>
      <text x="56" y="68" font-size="20" font-weight="900" fill="#fff" text-anchor="middle">?</text>
    `
  },
  'psychology.svg': {
    title: 'علم النفس',
    gradient: ['#1e1b4b', '#2e1065', '#3b0764'],
    iconBg: '#581c87',
    svgArt: `
      <path d="M52 75 C45 60 55 42 70 38 C85 34 98 46 95 65 C92 74 82 80 75 90" fill="none" stroke="#c084fc" stroke-width="4" stroke-linecap="round"/>
      <circle cx="75" cy="54" r="8" fill="#ec4899" opacity="0.8"/>
    `
  },
  'islamic_history.svg': {
    title: 'تاريخ وحضارة إسلامية',
    gradient: ['#064e3b', '#065f46', '#047857'],
    iconBg: '#059669',
    svgArt: `
      <path d="M75 32 C65 45 60 55 60 75 L90 75 C90 55 85 45 75 32 Z" fill="#fef08a" opacity="0.8"/>
      <circle cx="75" cy="26" r="4" fill="#facc15"/>
    `
  },
  'arabic_literature.svg': {
    title: 'لغة عربية وأدب',
    gradient: ['#7c2d12', '#9a3412', '#c2410c'],
    iconBg: '#ea580c',
    svgArt: `
      <path d="M50 42 Q75 55 100 42 L100 80 Q75 92 50 80 Z" fill="#ffedd5" stroke="#c2410c" stroke-width="2"/>
      <line x1="75" y1="50" x2="75" y2="86" stroke="#c2410c" stroke-width="2"/>
    `
  },
  'world_geography.svg': {
    title: 'جغرافيا وعجائب العالم',
    gradient: ['#0369a1', '#0284c7', '#0284c7'],
    iconBg: '#38bdf8',
    svgArt: `
      <circle cx="75" cy="60" r="32" fill="#0284c7" stroke="#bae6fd" stroke-width="2"/>
      <ellipse cx="75" cy="60" rx="32" ry="12" fill="none" stroke="#bae6fd" stroke-width="1.5"/>
      <line x1="75" y1="28" x2="75" y2="92" stroke="#bae6fd" stroke-width="1.5"/>
    `
  },
  'inventions.svg': {
    title: 'اختراعات واكتشافات مذهلة',
    gradient: ['#713f12', '#854d0e', '#a16207'],
    iconBg: '#ca8a04',
    svgArt: `
      <circle cx="75" cy="52" r="22" fill="#fef08a" stroke="#facc15" stroke-width="2"/>
      <rect x="66" y="74" width="18" height="12" fill="#94a3b8" rx="2"/>
    `
  },
  'riddles.svg': {
    title: 'ألغاز وفوازير شعبية',
    gradient: ['#581c87', '#6b21a8', '#7e22ce'],
    iconBg: '#a855f7',
    svgArt: `
      <circle cx="75" cy="55" r="28" fill="#6b21a8" stroke="#e9d5ff" stroke-width="2"/>
      <text x="75" y="72" font-size="40" font-weight="900" fill="#fbbf24" text-anchor="middle">؟</text>
    `
  },
  'celebrities.svg': {
    title: 'مشاهير وترند',
    gradient: ['#831843', '#9d174d', '#be185d'],
    iconBg: '#db2777',
    svgArt: `
      <polygon points="75,25 82,45 104,45 86,58 93,78 75,65 57,78 64,58 46,45 68,45" fill="#fde047" stroke="#eab308" stroke-width="2"/>
    `
  },
  'sports.svg': {
    title: 'رياضة وأبطال',
    gradient: ['#14532d', '#15803d', '#16a34a'],
    iconBg: '#22c55e',
    svgArt: `
      <circle cx="75" cy="60" r="30" fill="#ffffff" stroke="#15803d" stroke-width="2"/>
      <polygon points="75,50 82,55 80,63 70,63 68,55" fill="#1e293b"/>
    `
  },
  'ai_tech.svg': {
    title: 'ذكاء اصطناعي وتقنية',
    gradient: ['#09090b', '#18181b', '#27272a'],
    iconBg: '#3f3f46',
    svgArt: `
      <rect x="45" y="36" width="60" height="52" rx="12" fill="#18181b" stroke="#06b6d4" stroke-width="2"/>
      <circle cx="63" cy="54" r="5" fill="#06b6d4"/>
      <circle cx="87" cy="54" r="5" fill="#06b6d4"/>
      <path d="M63 70 Q75 78 87 70" stroke="#06b6d4" stroke-width="3" stroke-linecap="round" fill="none"/>
    `
  },
  'video_games.svg': {
    title: 'ألعاب فيديو وجيمينج',
    gradient: ['#4c0519', '#881337', '#9f1239'],
    iconBg: '#e11d48',
    svgArt: `
      <rect x="42" y="42" width="66" height="42" rx="14" fill="#1e1b4b" stroke="#fda4af" stroke-width="2"/>
      <circle cx="56" cy="63" r="5" fill="#38bdf8"/>
      <circle cx="94" cy="59" r="4" fill="#f43f5e"/>
      <circle cx="86" cy="67" r="4" fill="#facc15"/>
    `
  }
};

const targetDir = path.resolve(__dirname, '../public/covers');
if (!fs.existsSync(targetDir)) {
  fs.mkdirSync(targetDir, { recursive: true });
}

for (const [filename, item] of Object.entries(covers)) {
  const gId = 'grad_' + filename.replace(/[^a-zA-Z0-9]/g, '_');
  const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 150 190" width="100%" height="100%">
  <defs>
    <linearGradient id="${gId}" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="${item.gradient[0]}" />
      <stop offset="60%" stop-color="${item.gradient[1]}" />
      <stop offset="100%" stop-color="${item.gradient[2]}" />
    </linearGradient>
    <radialGradient id="glow_${gId}" cx="50%" cy="40%" r="50%">
      <stop offset="0%" stop-color="#ffffff" stop-opacity="0.2"/>
      <stop offset="100%" stop-color="#ffffff" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="150" height="190" rx="18" fill="url(#${gId})" />
  <rect width="150" height="190" rx="18" fill="url(#glow_${gId})" />
  <g>${item.svgArt}</g>
  <rect x="0" y="130" width="150" height="60" fill="#000000" fill-opacity="0.65" rx="0" />
  <text x="75" y="162" font-family="'Cairo', 'Readex Pro', sans-serif" font-weight="900" font-size="14" fill="#ffffff" text-anchor="middle" stroke="#000000" stroke-width="2.5" paint-order="stroke fill">${item.title}</text>
</svg>`;

  fs.writeFileSync(path.join(targetDir, filename), svgContent.trim(), 'utf-8');
}

console.log('Generated ' + Object.keys(covers).length + ' SVG covers.');
