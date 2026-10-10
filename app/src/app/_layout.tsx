import { Tabs } from 'expo-router';
import { SQLiteProvider } from 'expo-sqlite';

import { migrate } from '@/db/migrations';
import { t } from '@/lib/i18n/t';

export default function RootLayout() {
  return (
    <SQLiteProvider databaseName="discover.db" onInit={migrate}>
      {/* No icons until real ones are designed: without tabBarIcon, Expo Router renders a MissingIcon placeholder. */}
      <Tabs screenOptions={{ headerShown: false, tabBarIcon: () => null }}>
        <Tabs.Screen name="index" options={{ title: t('tabs.map') }} />
        <Tabs.Screen name="photo" options={{ title: t('tabs.photo') }} />
        <Tabs.Screen name="profile" options={{ title: t('tabs.profile') }} />
      </Tabs>
    </SQLiteProvider>
  );
}
