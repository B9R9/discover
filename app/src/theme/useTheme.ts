import { useColorScheme } from 'react-native';

import { colors, colorsDark, type ThemeColors } from './tokens';

export type Theme = { scheme: 'light' | 'dark'; colors: ThemeColors };

export function useTheme(): Theme {
  const scheme = useColorScheme() === 'dark' ? 'dark' : 'light';
  return { scheme, colors: scheme === 'dark' ? colorsDark : colors };
}
