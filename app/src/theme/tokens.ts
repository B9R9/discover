export const palette = {
  light: {
    background: '#F6F1E7',
    surface: '#FFFFFF',
    text: '#1F2A33',
    textMuted: '#5B6670',
    accent: '#F2A33A',
    onAccent: '#1F2A33',
    discovered: '#2F7F79',
    fog: '#D5D9DD',
    border: '#E3DCCB',
  },
  dark: {
    background: '#14191E',
    surface: '#1E262D',
    text: '#F2EEE4',
    textMuted: '#A3ADB5',
    accent: '#F2A33A',
    onAccent: '#1F2A33',
    discovered: '#5FB8B0',
    fog: '#2B343C',
    border: '#2F3A43',
  },
  state: {
    success: '#3E9B5F',
    error: '#C94B3B',
    info: '#3C7DB5',
  },
} as const;

export const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32, xxxl: 48 } as const;

export const radius = { sm: 8, md: 16, lg: 24, pill: 999 } as const;

export const font = {
  heading: 'Fraunces_600SemiBold',
  body: 'Inter_400Regular',
  bodyMedium: 'Inter_500Medium',
  bodyBold: 'Inter_600SemiBold',
} as const;
