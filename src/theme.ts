export type AppTheme = 'teal' | 'pink';

export interface ThemeColors {
  primary: string;
  primaryHover: string;
  primaryBg: string;
  primaryBgHover: string;
  text: string;
  textDark: string;
  textLight: string;
  bgLight: string;
  bgLightHover: string;
  borderLight: string;
  focusRing: string;
  shadowPrimary: string;
  activeTabBorder: string;
  badgeBg: string;
  accentColor: 'teal' | 'pink';
  headerBg: string;
}

export const themeStyles: Record<AppTheme, ThemeColors> = {
  teal: {
    primary: 'teal-600',
    primaryHover: 'teal-700',
    primaryBg: 'bg-teal-600',
    primaryBgHover: 'hover:bg-teal-700',
    text: 'text-teal-700',
    textDark: 'text-teal-800',
    textLight: 'text-teal-600',
    bgLight: 'bg-teal-50',
    bgLightHover: 'hover:bg-teal-100',
    borderLight: 'border-teal-100',
    focusRing: 'focus:ring-teal-500',
    shadowPrimary: 'shadow-teal-600/10',
    activeTabBorder: 'border-teal-600 text-teal-600',
    badgeBg: 'bg-teal-50 text-teal-700 border-teal-100',
    accentColor: 'teal',
    headerBg: 'bg-white',
  },
  pink: {
    primary: 'pink-500',
    primaryHover: 'pink-600',
    primaryBg: 'bg-[#FF5B8C]',
    primaryBgHover: 'hover:bg-[#E04D79]',
    text: 'text-[#FF5B8C]',
    textDark: 'text-pink-800',
    textLight: 'text-[#FF5B8C]',
    bgLight: 'bg-pink-50',
    bgLightHover: 'hover:bg-pink-100',
    borderLight: 'border-pink-100',
    focusRing: 'focus:ring-pink-400',
    shadowPrimary: 'shadow-pink-500/10',
    activeTabBorder: 'border-[#FF5B8C] text-[#FF5B8C]',
    badgeBg: 'bg-pink-50 text-pink-600 border-pink-100',
    accentColor: 'pink',
    headerBg: 'bg-[#FFF0F4]',
  }
};
