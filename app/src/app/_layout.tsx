import { Tabs } from 'expo-router';

import { t } from '@/lib/i18n/t';

export default function RootLayout() {
  return (
    <Tabs screenOptions={{ headerShown: false }}>
      <Tabs.Screen name="index" options={{ title: t('tabs.map') }} />
      <Tabs.Screen name="photo" options={{ title: t('tabs.photo') }} />
      <Tabs.Screen name="profile" options={{ title: t('tabs.profile') }} />
    </Tabs>
  );
}
