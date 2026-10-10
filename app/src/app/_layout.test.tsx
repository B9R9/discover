import { fireEvent, screen } from '@testing-library/react-native';
import { renderRouter } from 'expo-router/testing-library';

import RootLayout from './_layout';
import Map from './index';
import Photo from './photo';
import Profile from './profile';

const routes = { _layout: RootLayout, index: Map, photo: Photo, profile: Profile };

// renderRouter returns RNTL 14's render promise with the router helpers attached to it,
// so awaiting it directly would drop getPathname.
async function renderApp() {
  const router = renderRouter(routes);
  await router;
  return { getPathname: () => router.getPathname() };
}

function getTab(label: string) {
  return screen.getByRole('button', { name: new RegExp(`^${label}, tab`) });
}

test('tab bar shows the three translated tabs', async () => {
  await renderApp();
  for (const label of ['Carte', 'Photo', 'Profil']) {
    expect(getTab(label)).toBeOnTheScreen();
  }
});

test('opens the map screen first', async () => {
  const router = await renderApp();
  expect(router.getPathname()).toBe('/');
  expect(screen.getByRole('header')).toHaveTextContent('Carte');
});

test.each([
  ['Photo', '/photo'],
  ['Profil', '/profile'],
])('pressing the %s tab opens its screen', async (label, path) => {
  const router = await renderApp();
  await fireEvent.press(getTab(label));
  expect(router.getPathname()).toBe(path);
  expect(screen.getByRole('header')).toHaveTextContent(label);
});
