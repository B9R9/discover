import { fireEvent, render, screen } from '@testing-library/react-native';

import { Button } from './Button';

describe('Button', () => {
  it('shows its label in capitals and calls onPress', async () => {
    const onPress = jest.fn();
    await render(<Button label="Recevoir un code" onPress={onPress} />);
    await fireEvent.press(screen.getByRole('button'));
    expect(screen.getByText('RECEVOIR UN CODE')).toBeTruthy();
    expect(onPress).toHaveBeenCalledTimes(1);
  });
});
