export type GameThemeId =
  | 'monochrome-magic'
  | 'light'
  | 'deep-sea'
  | 'vivid-nightfall'
  | 'light-steel'
  | 'gradient-blues'
  | 'palette';

export interface ThemeOption {
  id: GameThemeId;
  name: string;
  nameAr: string;
  icon: string;
  isLight?: boolean;
  previewColors: [string, string, string]; // [bg, card, accent]
  primaryButtonBg: string;
  primaryButtonText: string;
  primaryButtonHover: string;
  secondaryButtonBg?: string;
  secondaryButtonText?: string;
  accentColor: string;
  cardBg: string;
  textColor: string;
  textMutedColor: string;
  borderColor: string;
}

export const GAME_THEMES: ThemeOption[] = [
  {
    id: 'monochrome-magic',
    name: 'Monochrome Dark',
    nameAr: 'مونوكروم ليلي',
    icon: '🖤',
    previewColors: ['#121414', '#1f2020', '#ffffff'],
    primaryButtonBg: '#ffffff',
    primaryButtonText: '#0d0e0f',
    primaryButtonHover: '#e3e2e2',
    secondaryButtonBg: '#1f2020',
    secondaryButtonText: '#ffffff',
    accentColor: '#ffffff',
    cardBg: '#1b1c1c',
    textColor: '#e3e2e2',
    textMutedColor: '#c4c7c7',
    borderColor: '#343535',
  },
  {
    id: 'light',
    name: 'Proper Light',
    nameAr: 'نهاري ناصع',
    icon: '☀️',
    isLight: true,
    previewColors: ['#f8f9fa', '#ffffff', '#2563eb'],
    primaryButtonBg: '#2563eb',
    primaryButtonText: '#ffffff',
    primaryButtonHover: '#1d4ed8',
    secondaryButtonBg: '#ffffff',
    secondaryButtonText: '#0f172a',
    accentColor: '#2563eb',
    cardBg: '#ffffff',
    textColor: '#0f172a',
    textMutedColor: '#475569',
    borderColor: '#e2e8f0',
  },
  {
    id: 'deep-sea',
    name: 'Deep Sea',
    nameAr: 'أعماق البحار',
    icon: '🐋',
    previewColors: ['#031926', '#0b2d42', '#77aca2'],
    primaryButtonBg: '#77aca2',
    primaryButtonText: '#031926',
    primaryButtonHover: '#5e948a',
    secondaryButtonBg: '#0e354d',
    secondaryButtonText: '#f4f9e9',
    accentColor: '#77aca2',
    cardBg: '#0b2d42',
    textColor: '#f4f9e9',
    textMutedColor: '#9bb2be',
    borderColor: '#1e5270',
  },
  {
    id: 'vivid-nightfall',
    name: 'Vivid Nightfall',
    nameAr: 'شفق الليل الزاهي',
    icon: '🌌',
    previewColors: ['#0b091a', '#171233', '#c084fc'],
    primaryButtonBg: '#c084fc',
    primaryButtonText: '#0b091a',
    primaryButtonHover: '#a855f7',
    secondaryButtonBg: '#1e1742',
    secondaryButtonText: '#f8f6fc',
    accentColor: '#c084fc',
    cardBg: '#171233',
    textColor: '#f8f6fc',
    textMutedColor: '#b4a8d6',
    borderColor: '#3d2b78',
  },
  {
    id: 'light-steel',
    name: 'Light Steel',
    nameAr: 'صلب فاتح',
    icon: '⚙️',
    isLight: true,
    previewColors: ['#cbd5e1', '#e2e8f0', '#0284c7'],
    primaryButtonBg: '#0284c7',
    primaryButtonText: '#ffffff',
    primaryButtonHover: '#0369a1',
    secondaryButtonBg: '#e2e8f0',
    secondaryButtonText: '#0f172a',
    accentColor: '#0284c7',
    cardBg: '#f8fafc',
    textColor: '#0f172a',
    textMutedColor: '#475569',
    borderColor: '#94a3b8',
  },
  {
    id: 'gradient-blues',
    name: 'Gradient Blues',
    nameAr: 'تدرجات الأزرق',
    icon: '🌊',
    previewColors: ['#061226', '#0d2146', '#38bdf8'],
    primaryButtonBg: '#38bdf8',
    primaryButtonText: '#061226',
    primaryButtonHover: '#0ea5e9',
    secondaryButtonBg: '#112957',
    secondaryButtonText: '#f0f9ff',
    accentColor: '#38bdf8',
    cardBg: '#0d2146',
    textColor: '#f0f9ff',
    textMutedColor: '#93c5fd',
    borderColor: '#1e4a94',
  },
  {
    id: 'palette',
    name: 'Palette',
    nameAr: 'لوحة الألوان الزاهية',
    icon: '🎨',
    previewColors: ['#161623', '#202033', '#ff5964'],
    primaryButtonBg: '#ff5964',
    primaryButtonText: '#ffffff',
    primaryButtonHover: '#e04853',
    secondaryButtonBg: '#26263d',
    secondaryButtonText: '#ffffff',
    accentColor: '#ff5964',
    cardBg: '#202033',
    textColor: '#ffffff',
    textMutedColor: '#b0b0c8',
    borderColor: '#3e3e60',
  },
];
