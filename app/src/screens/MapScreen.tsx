import { Screen } from '@/components/Screen';
import { ScreenTitle } from '@/components/ScreenTitle';
import { t } from '@/lib/i18n/t';

export function MapScreen() {
  return (
    <Screen>
      <ScreenTitle>{t('map.title')}</ScreenTitle>
    </Screen>
  );
}
