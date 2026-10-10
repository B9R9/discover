import '@/features/location/backgroundTask';

import { Tabs } from 'expo-router';
import { SQLiteProvider, useSQLiteContext } from 'expo-sqlite';
import { useEffect, useState } from 'react';

import { DATABASE_NAME } from '@/db/database';
import { migrate } from '@/db/migrations';
import { getSetting } from '@/db/settings';
import type { Db } from '@/db/types';
import { seedTestPlaces } from '@/features/places/testPlaces';
import { t } from '@/lib/i18n/t';
import { OnboardingScreen } from '@/screens/OnboardingScreen';

async function initDatabase(db: Db) {
  await migrate(db);
  await seedTestPlaces(db);
}

export default function RootLayout() {
  return (
    <SQLiteProvider databaseName={DATABASE_NAME} onInit={initDatabase}>
      <App />
    </SQLiteProvider>
  );
}

function App() {
  const db = useSQLiteContext();
  const [onboardingDone, setOnboardingDone] = useState<boolean | null>(null);

  useEffect(() => {
    getSetting(db, 'onboardingDone').then(setOnboardingDone);
  }, [db]);

  if (onboardingDone === null) return null;
  if (!onboardingDone) return <OnboardingScreen onDone={() => setOnboardingDone(true)} />;
  return (
    // No icons until real ones are designed: without tabBarIcon, Expo Router renders a MissingIcon placeholder.
    <Tabs screenOptions={{ headerShown: false, tabBarIcon: () => null }}>
      <Tabs.Screen name="index" options={{ title: t('tabs.map') }} />
      <Tabs.Screen name="photo" options={{ title: t('tabs.photo') }} />
      <Tabs.Screen name="profile" options={{ title: t('tabs.profile') }} />
    </Tabs>
  );
}
