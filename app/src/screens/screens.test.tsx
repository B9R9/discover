import { render, screen } from '@testing-library/react-native';

import { MapScreen } from './MapScreen';
import { PhotoScreen } from './PhotoScreen';
import { ProfileScreen } from './ProfileScreen';

test.each([
  ['MapScreen', MapScreen, 'Carte'],
  ['PhotoScreen', PhotoScreen, 'Photo'],
  ['ProfileScreen', ProfileScreen, 'Profil'],
])('%s shows its translated title', async (_name, Component, title) => {
  await render(<Component />);
  expect(screen.getByRole('header')).toHaveTextContent(title);
});
