import { Screen } from '@/components/Screen';
import { ScreenTitle } from '@/components/ScreenTitle';
import { t } from '@/lib/i18n/t';

export function PhotoScreen() {
  return (
    <Screen>
      <ScreenTitle>{t('photo.title')}</ScreenTitle>
    </Screen>
  );
}
