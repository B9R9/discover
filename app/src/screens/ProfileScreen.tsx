import { Screen } from '@/components/Screen';
import { ScreenTitle } from '@/components/ScreenTitle';
import { t } from '@/lib/i18n/t';

export function ProfileScreen() {
  return (
    <Screen>
      <ScreenTitle>{t('profile.title')}</ScreenTitle>
    </Screen>
  );
}
