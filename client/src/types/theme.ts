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
}

export const GAME_THEMES: ThemeOption[] = [
  {
    id: 'monochrome-magic',
    name: 'Monochrome Dark',
    nameAr: 'مونوكروم ليلي',
    icon: '🖤',
    previewColors: ['#121414', '#1f2020', '#ffffff'],
  },
  {
    id: 'light',
    name: 'Proper Light',
    nameAr: 'نهاري ناصع',
    icon: '☀️',
    isLight: true,
    previewColors: ['#f8f9fa', '#ffffff', '#2563eb'],
  },
  {
    id: 'deep-sea',
    name: 'Deep Sea',
    nameAr: 'أعماق البحار',
    icon: '🐋',
    previewColors: ['#031926', '#0b2d42', '#77aca2'],
  },
  {
    id: 'vivid-nightfall',
    name: 'Vivid Nightfall',
    nameAr: 'شفق الليل الزاهي',
    icon: '🌌',
    previewColors: ['#0b091a', '#171233', '#c084fc'],
  },
  {
    id: 'light-steel',
    name: 'Light Steel',
    nameAr: 'صلب فاتح',
    icon: '⚙️',
    isLight: true,
    previewColors: ['#e2e8f0', '#ffffff', '#0284c7'],
  },
  {
    id: 'gradient-blues',
    name: 'Gradient Blues',
    nameAr: 'تدرجات الأزرق',
    icon: '🌊',
    previewColors: ['#061226', '#0d2146', '#38bdf8'],
  },
  {
    id: 'palette',
    name: 'Palette',
    nameAr: 'لوحة الألوان الزاهية',
    icon: '🎨',
    previewColors: ['#161623', '#202033', '#ff5964'],
  },
];
