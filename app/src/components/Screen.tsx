import type { ReactNode } from 'react';
import { StyleSheet } from 'react-native';
import { SafeAreaView, type Edge } from 'react-native-safe-area-context';

const ALL_EDGES: readonly Edge[] = ['top', 'right', 'bottom', 'left'];

// Inside the tabs, pass edges without 'bottom': the tab bar already keeps clear of the system bar.
export function Screen({
  children,
  edges = ALL_EDGES,
}: {
  children: ReactNode;
  edges?: readonly Edge[];
}) {
  return (
    <SafeAreaView style={styles.container} edges={edges}>
      {children}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
});
