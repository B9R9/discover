import { fireEvent, render, screen } from '@testing-library/react-native';
import type { ComponentProps } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { TabBar } from './TabBar';

type Props = ComponentProps<typeof TabBar>;

const routes = [
  { key: 'index-1', name: 'index' },
  { key: 'photo-1', name: 'photo' },
  { key: 'profile-1', name: 'profile' },
];
const titles: Record<string, string> = {
  'index-1': 'Carte',
  'photo-1': 'Photo',
  'profile-1': 'Profil',
};

async function setup(focusedIndex = 0, defaultPrevented = false) {
  const navigation = {
    emit: jest.fn(() => ({ defaultPrevented })),
    navigate: jest.fn(),
  };
  const props = {
    state: { index: focusedIndex, routes },
    descriptors: Object.fromEntries(
      routes.map((r) => [r.key, { options: { title: titles[r.key] } }]),
    ),
    navigation,
    insets: { top: 0, bottom: 0, left: 0, right: 0 },
  } as unknown as Props;
  await render(
    <SafeAreaProvider
      initialMetrics={{
        frame: { x: 0, y: 0, width: 390, height: 844 },
        insets: { top: 0, bottom: 0, left: 0, right: 0 },
      }}
    >
      <TabBar {...props} />
    </SafeAreaProvider>,
  );
  return navigation;
}

describe('TabBar', () => {
  it('marks only the focused tab as selected', async () => {
    await setup(0);
    expect(screen.getByRole('button', { name: 'Carte' }).props.accessibilityState).toEqual({
      selected: true,
    });
    expect(screen.getByRole('button', { name: 'Profil' }).props.accessibilityState).toEqual({
      selected: false,
    });
  });

  it('opens another tab on press', async () => {
    const navigation = await setup(0);
    await fireEvent.press(screen.getByRole('button', { name: 'Profil' }));
    expect(navigation.navigate).toHaveBeenCalledWith('profile');
  });

  it('does not navigate when the tab is already focused', async () => {
    const focused = await setup(0);
    await fireEvent.press(screen.getByRole('button', { name: 'Carte' }));
    expect(focused.navigate).not.toHaveBeenCalled();
  });

  it('keeps the camera as a labelled button', async () => {
    const navigation = await setup(0);
    await fireEvent.press(screen.getByRole('button', { name: 'Photo' }));
    expect(navigation.navigate).toHaveBeenCalledWith('photo');
  });

  it('does not navigate when the press is prevented', async () => {
    const navigation = await setup(0, true);
    await fireEvent.press(screen.getByRole('button', { name: 'Profil' }));
    expect(navigation.navigate).not.toHaveBeenCalled();
  });
});
