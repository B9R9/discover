import '@/features/location/backgroundTask';

import { Tabs } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { SQLiteProvider, useSQLiteContext } from 'expo-sqlite';
import { useEffect, useState } from 'react';

import { DATABASE_NAME } from '@/db/database';
import { migrate } from '@/db/migrations';
import { getSetting } from '@/db/settings';
import { StoreProvider } from '@/features/purchases/StoreProvider';
import { t } from '@/lib/i18n/t';
import { TabBar } from '@/components/TabBar';
import { motion } from '@/theme/tokens';
import { OnboardingScreen } from '@/screens/OnboardingScreen';
import { useAppFonts } from '@/theme/useAppFonts';

// Keep the native splash up until fonts and the onboarding state are known, so the first frame is final.
SplashScreen.preventAutoHideAsync().catch(() => undefined);
const splashShownAt = Date.now();

export default function RootLayout() {
  const { ready } = useAppFonts();
  if (!ready) return null;
  return (
    <SQLiteProvider databaseName={DATABASE_NAME} onInit={migrate}>
      <StoreProvider>
        <App />
      </StoreProvider>
    </SQLiteProvider>
  );
}

function App() {
  const db = useSQLiteContext();
  const [onboardingDone, setOnboardingDone] = useState<boolean | null>(null);

  useEffect(() => {
    getSetting(db, 'onboardingDone').then(setOnboardingDone);
  }, [db]);

  useEffect(() => {
    if (onboardingDone === null) return;
    // Stay on the splash for at least motion.splash so the logo is actually seen.
    const wait = Math.max(0, motion.splash - (Date.now() - splashShownAt));
    const timer = setTimeout(() => SplashScreen.hideAsync().catch(() => undefined), wait);
    return () => clearTimeout(timer);
  }, [onboardingDone]);

  if (onboardingDone === null) return null;
  if (!onboardingDone) return <OnboardingScreen onDone={() => setOnboardingDone(true)} />;
  return (
    <Tabs tabBar={(props) => <TabBar {...props} />} screenOptions={{ headerShown: false }}>
      <Tabs.Screen name="index" options={{ title: t('tabs.map') }} />
      <Tabs.Screen name="outings" options={{ title: t('tabs.outings') }} />
      <Tabs.Screen name="photo" options={{ title: t('tabs.photo') }} />
      <Tabs.Screen name="circle" options={{ title: t('tabs.circle') }} />
      <Tabs.Screen name="profile" options={{ title: t('tabs.profile') }} />
    </Tabs>
  );
}
