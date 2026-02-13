// Dark Theme Design System
// Inspired by premium crypto trading app design images

export const colors = {
  // Backgrounds
  background: '#0A0A0F',
  surface: '#14141F',
  card: '#1C1C2E',
  cardHover: '#24243A',
  elevated: '#252540',

  // Primary / Accent
  primary: '#5B7FFF',
  primaryLight: '#7B9AFF',
  primaryDark: '#3A5FE0',
  accent: '#FFD700',
  accentDim: '#B8981A',

  // Semantic
  success: '#00D68F',
  successDim: '#00A86B',
  successBg: 'rgba(0, 214, 143, 0.12)',
  danger: '#FF3B5C',
  dangerDim: '#CC2F4A',
  dangerBg: 'rgba(255, 59, 92, 0.12)',
  warning: '#FFAA00',
  warningBg: 'rgba(255, 170, 0, 0.12)',

  // Text
  textPrimary: '#FFFFFF',
  textSecondary: '#A0A0B8',
  textTertiary: '#6B6B80',
  textMuted: '#4A4A5E',

  // Borders
  border: '#2A2A40',
  borderLight: '#35354D',
  borderFocus: '#5B7FFF',

  // Tab / Pill
  tabBg: '#1C1C2E',
  tabActive: '#5B7FFF',
  tabText: '#6B6B80',
  tabActiveText: '#FFFFFF',

  // Misc
  overlay: 'rgba(0, 0, 0, 0.6)',
  shimmer: '#2A2A40',
  white: '#FFFFFF',
  black: '#000000',
  transparent: 'transparent',
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
};

export const borderRadius = {
  sm: 6,
  md: 10,
  lg: 14,
  xl: 20,
  pill: 50,
  full: 9999,
};

export const typography = {
  hero: {
    fontSize: 32,
    fontWeight: '800' as const,
    letterSpacing: -0.5,
    color: colors.textPrimary,
  },
  h1: {
    fontSize: 26,
    fontWeight: '700' as const,
    letterSpacing: -0.3,
    color: colors.textPrimary,
  },
  h2: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: colors.textPrimary,
  },
  h3: {
    fontSize: 17,
    fontWeight: '600' as const,
    color: colors.textPrimary,
  },
  body: {
    fontSize: 15,
    fontWeight: '400' as const,
    color: colors.textSecondary,
  },
  bodyBold: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: colors.textPrimary,
  },
  caption: {
    fontSize: 13,
    fontWeight: '400' as const,
    color: colors.textTertiary,
  },
  small: {
    fontSize: 11,
    fontWeight: '500' as const,
    color: colors.textTertiary,
  },
  mono: {
    fontSize: 15,
    fontWeight: '500' as const,
    fontFamily: undefined, // will use system mono
    color: colors.textPrimary,
  },
};

export const shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 8,
  },
  glow: (color: string) => ({
    shadowColor: color,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  }),
};

export default { colors, spacing, borderRadius, typography, shadows };
