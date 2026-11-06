// Source of truth: docs/design.md. Never hard-code a color, size or font in a component.

export const colors = {
  paper: '#EFE4CC',
  paperLight: '#FBF6E8',
  paperWhite: '#FFFDF6',
  kraft: '#D9C39A',
  fog: '#E2D2AE',
  ink: '#2A2630',
  stamp: '#B13F2C',
  lantern: '#E3A33B',
  sage: '#6F8660',
  postal: '#38577A',
  muted: '#5E5866',
  tabBar: '#2A2630',
  postalText: '#38577A',
  brownStamp: '#6F5A2A',
  onStamp: '#FFFDF6',
} as const;

export type ThemeColors = { [K in keyof typeof colors]: string };

export const colorsDark: ThemeColors = {
  ...colors,
  paper: '#1C1A21',
  paperLight: '#26232C',
  paperWhite: '#2F2B36',
  kraft: '#3A3641',
  fog: '#2B2832',
  ink: '#EFE4CC',
  stamp: '#E8765F',
  muted: '#B3AAA0',
  tabBar: '#121017',
  postalText: '#7FA3CC',
  brownStamp: '#C9A860',
  onStamp: '#1C1A21',
};

export const fonts = {
  title: 'Fraunces_700Bold_Italic',
  hand: 'Caveat_700Bold',
  stamp: 'SpecialElite_400Regular',
  body: 'DMSans_400Regular',
  bodyMedium: 'DMSans_500Medium',
  bodyBold: 'DMSans_700Bold',
} as const;

export const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32, xxxl: 48 } as const;

export const radius = {
  card: 4,
  pill: 26,
  round: 999,
  /** @deprecated old scale, removed once the screens are redone (roadmap R3, R4). */
  sm: 8,
  /** @deprecated */
  photo: 12,
  /** @deprecated */
  md: 16,
  /** @deprecated */
  lg: 24,
} as const;

export const motion = { tab: 320, polaroid: 450, stamp: 140, fog: 900, splash: 3500 } as const;

/**
 * @deprecated Old light/dark palette, kept so the screens not yet redone still compile and
 * already take the new colors. Use `useTheme().colors` in new code (roadmap R3, R4).
 */
export const palette = {
  light: {
    background: colors.paper,
    surface: colors.paperWhite,
    text: colors.ink,
    textMuted: colors.muted,
    accent: colors.lantern,
    onAccent: colors.ink,
    discovered: colors.sage,
    fog: colors.fog,
    border: colors.kraft,
  },
  dark: {
    background: colorsDark.paper,
    surface: colorsDark.paperWhite,
    text: colorsDark.ink,
    textMuted: colorsDark.muted,
    accent: colorsDark.lantern,
    onAccent: '#1C1A21',
    discovered: colorsDark.sage,
    fog: colorsDark.fog,
    border: colorsDark.kraft,
  },
  state: {
    success: colors.sage,
    error: colors.stamp,
    info: colors.postal,
  },
} as const;

/** @deprecated Use `fonts`. */
export const font = {
  heading: fonts.title,
  body: fonts.body,
  bodyMedium: fonts.bodyMedium,
  bodyBold: fonts.bodyBold,
} as const;
