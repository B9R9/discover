import { Caveat_700Bold } from '@expo-google-fonts/caveat';
import { DMSans_400Regular, DMSans_500Medium, DMSans_700Bold } from '@expo-google-fonts/dm-sans';
import { Fraunces_700Bold_Italic } from '@expo-google-fonts/fraunces';
import { SpecialElite_400Regular } from '@expo-google-fonts/special-elite';
import { useFonts } from 'expo-font';

import { fonts } from './tokens';

// Keys come from `fonts` so a renamed token cannot silently stop matching its file.
export function useAppFonts(): { ready: boolean } {
  const [loaded, error] = useFonts({
    [fonts.title]: Fraunces_700Bold_Italic,
    [fonts.hand]: Caveat_700Bold,
    [fonts.stamp]: SpecialElite_400Regular,
    [fonts.body]: DMSans_400Regular,
    [fonts.bodyMedium]: DMSans_500Medium,
    [fonts.bodyBold]: DMSans_700Bold,
  });
  // On error we still start: the system font is a fine fallback, a blocked launch is not.
  return { ready: loaded || error !== null };
}
