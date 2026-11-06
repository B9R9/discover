import { ScrollView } from 'react-native';

import { Screen } from '@/components/Screen';
import { ScreenTitle } from '@/components/ScreenTitle';
import { WalksSection } from '@/components/WalksSection';
import { useSession } from '@/features/account/useSession';
import { t } from '@/lib/i18n/t';

// The walks made by Détour are open to everyone; drawing and friends' walks need an account.
export function WalksScreen() {
  const session = useSession();
  return (
    <Screen edges={['top', 'right', 'left']}>
      <ScrollView>
        <ScreenTitle>{t('tabs.walks')}</ScreenTitle>
        <WalksSection signedIn={Boolean(session)} />
      </ScrollView>
    </Screen>
  );
}
