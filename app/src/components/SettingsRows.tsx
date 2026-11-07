import { useMemo } from 'react';
import { Pressable, StyleSheet, Switch, Text, View } from 'react-native';

import { t } from '@/lib/i18n/t';
import { fonts, spacing, type ThemeColors } from '@/theme/tokens';
import { useTheme } from '@/theme/useTheme';

export function SectionLabel({ children }: { children: string }) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  return (
    <Text style={styles.section} accessibilityRole="header">
      {children.toUpperCase()}
    </Text>
  );
}

interface RowProps {
  label: string;
  hint?: string;
  /** Not built yet: shown greyed out with a "bientôt" mark, as the design lays it out. */
  soon?: boolean;
}

// A line of a settings list showing a value (language, units...).
export function ValueRow({ label, value, soon = false }: RowProps & { value?: string }) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  return (
    <View
      style={[styles.row, soon && styles.soon]}
      accessible
      accessibilityState={{ disabled: soon }}
      accessibilityLabel={[label, value, soon ? t('settings.soon') : ''].filter(Boolean).join(', ')}
    >
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{soon ? t('settings.soon') : value}</Text>
    </View>
  );
}

// A line of a list that opens another page.
export function LinkRow({ label, onPress }: { label: string; onPress: () => void }) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value} accessibilityElementsHidden>
        →
      </Text>
    </Pressable>
  );
}

// A line with a switch and, below the label, what it changes.
export function SwitchRow({
  label,
  hint,
  soon = false,
  value = false,
  onChange,
}: RowProps & { value?: boolean; onChange?: (value: boolean) => void }) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  return (
    <View style={[styles.row, soon && styles.soon]}>
      <View style={styles.texts}>
        <Text style={styles.label}>{label}</Text>
        {hint !== undefined && <Text style={styles.hint}>{hint}</Text>}
        {soon && <Text style={styles.value}>{t('settings.soon')}</Text>}
      </View>
      <Switch
        accessibilityLabel={label}
        disabled={soon}
        value={value}
        onValueChange={onChange}
        trackColor={{ true: colors.stamp, false: colors.kraft }}
      />
    </View>
  );
}

const createStyles = (c: ThemeColors) =>
  StyleSheet.create({
    section: {
      fontFamily: fonts.stamp,
      fontSize: 11,
      letterSpacing: 1.5,
      color: c.postalText,
      marginTop: spacing.xl,
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      minHeight: 56,
      paddingVertical: spacing.sm,
      borderTopWidth: StyleSheet.hairlineWidth * 2,
      borderTopColor: c.muted,
    },
    soon: { opacity: 0.5 },
    texts: { flex: 1 },
    label: { flex: 1, fontFamily: fonts.stamp, fontSize: 15, lineHeight: 22, color: c.ink },
    hint: { fontFamily: fonts.body, fontSize: 13, lineHeight: 18, color: c.ink },
    value: { fontFamily: fonts.body, fontSize: 14, lineHeight: 20, color: c.muted },
  });
