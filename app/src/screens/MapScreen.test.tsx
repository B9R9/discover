import { render, screen } from '@testing-library/react-native';

import { MapScreen } from './MapScreen';

test('MapScreen shows its translated title', async () => {
  await render(<MapScreen />);
  expect(screen.getByRole('header')).toHaveTextContent('Carte');
});
