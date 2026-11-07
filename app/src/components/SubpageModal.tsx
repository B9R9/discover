import { useMemo, type ReactNode } from 'react';
import { KeyboardAvoidingView, Modal, ScrollView, StyleSheet, Text, View } from 'react-native';

import { t } from '@/lib/i18n/t';
import { fonts, spacing, type ThemeColors } from '@/theme/tokens';
import { useTheme } from '@/theme/useTheme';

import { RoundButton } from './RoundButton';
import { Screen } from './Screen';

interface SubpageModalProps {
  visible: boolean;
  kicker: string;
  title: string;
  onClose: () => void;
  children: ReactNode;
}

// A page opened from a list of links: back button and kicker on top, the title, then the content.
export function SubpageModal({ visible, kicker, title, onClose, children }: SubpageModalProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <Screen>
        <View style={styles.top}>
          <RoundButton glyph="‹" label={t('subpage.back')} onPress={onClose} />
          <Text style={styles.kicker}>{kicker.toUpperCase()}</Text>
        </View>
        {/* Android edge-to-edge does not shrink the screen for the keyboard (the account form has fields). */}
        <KeyboardAvoidingView behavior="padding" style={styles.keyboard}>
          <ScrollView keyboardShouldPersistTaps="handled">
            <Text style={styles.title} accessibilityRole="header">
              {title}
            </Text>
            {children}
          </ScrollView>
        </KeyboardAvoidingView>
      </Screen>
    </Modal>
  );
}

const createStyles = (c: ThemeColors) =>
  StyleSheet.create({
    keyboard: { flex: 1 },
    top: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    kicker: { fontFamily: fonts.stamp, fontSize: 12, letterSpacing: 1.9, color: c.stamp },
    title: {
      fontFamily: fonts.title,
      fontSize: 36,
      lineHeight: 40,
      color: c.ink,
      marginTop: spacing.md,
    },
  });
