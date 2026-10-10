import { StyleSheet, Text } from 'react-native';

export function ScreenTitle({ children }: { children: string }) {
  return (
    <Text accessibilityRole="header" style={styles.title}>
      {children}
    </Text>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 28, fontWeight: '700' },
});
