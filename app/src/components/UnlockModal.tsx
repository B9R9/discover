import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { t, type TranslationKey } from '@/lib/i18n/t';
import { fonts, spacing, type ThemeColors } from '@/theme/tokens';
import { useTheme } from '@/theme/useTheme';

import { Button } from './Button';
import { SubpageModal } from './SubpageModal';

export interface UnlockChoice {
  productId: string;
  name: string;
  description: string;
  price: string;
}

interface UnlockModalProps {
  visible: boolean;
  choices: UnlockChoice[];
  message: TranslationKey | null;
  onBuy: (productId: string) => void;
  onClose: () => void;
}

// Pick one locked map among those the store sells, then a single button buys it.
export function UnlockModal({ visible, choices, message, onBuy, onClose }: UnlockModalProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [pickedId, setPickedId] = useState<string | null>(null);
  const picked = choices.find((choice) => choice.productId === pickedId) ?? choices[0];

  return (
    <SubpageModal
      visible={visible}
      kicker={t('unlock.kicker')}
      title={t('unlock.title')}
      onClose={onClose}
    >
      <Text style={styles.hand}>{t('unlock.tagline')}</Text>
      {choices.length === 0 && <Text style={styles.note}>{t('unlock.none')}</Text>}
      <View accessibilityRole="radiogroup" style={styles.list}>
        {choices.map((choice, index) => {
          const selected = choice.productId === picked?.productId;
          return (
            <Pressable
              key={choice.productId}
              accessibilityRole="radio"
              accessibilityState={{ checked: selected }}
              onPress={() => setPickedId(choice.productId)}
              style={[
                styles.card,
                selected ? styles.cardPicked : styles.cardOther,
                { transform: [{ rotate: `${index % 2 === 0 ? -0.5 : 0.5}deg` }] },
              ]}
            >
              <View style={styles.texts}>
                <Text style={styles.name} numberOfLines={1}>
                  {choice.name}
                </Text>
                <Text style={styles.description}>{choice.description}</Text>
              </View>
              <Text style={[styles.price, selected && styles.pricePicked]}>{choice.price}</Text>
              {selected && (
                <View style={styles.check} accessibilityElementsHidden>
                  <Text style={styles.checkGlyph}>✓</Text>
                </View>
              )}
            </Pressable>
          );
        })}
      </View>
      {choices.length > 0 && <Text style={styles.hand}>{t('unlock.chapter')}</Text>}
      {message && <Text style={styles.note}>{t(message)}</Text>}
      {picked && (
        <View style={styles.cta}>
          <Button
            label={t('unlock.cta', { map: picked.name, price: picked.price })}
            onPress={() => onBuy(picked.productId)}
          />
        </View>
      )}
    </SubpageModal>
  );
}

const createStyles = (c: ThemeColors) =>
  StyleSheet.create({
    hand: {
      fontFamily: fonts.hand,
      fontSize: 24,
      lineHeight: 28,
      color: c.ink,
      marginTop: spacing.sm,
    },
    note: {
      fontFamily: fonts.body,
      fontSize: 14,
      lineHeight: 20,
      color: c.muted,
      marginTop: spacing.sm,
    },
    list: { gap: spacing.md, marginTop: spacing.lg },
    card: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, minHeight: 72, padding: spacing.md },
    cardPicked: {
      backgroundColor: c.paperWhite,
      borderWidth: 3,
      borderColor: c.stamp,
      shadowColor: c.ink,
      shadowOpacity: 0.22,
      shadowRadius: 6,
      elevation: 3,
    },
    cardOther: {
      backgroundColor: c.paperLight,
      borderWidth: 2,
      borderStyle: 'dashed',
      borderColor: c.muted,
    },
    texts: { flex: 1 },
    name: { fontFamily: fonts.title, fontSize: 24, lineHeight: 28, color: c.ink },
    description: { fontFamily: fonts.stamp, fontSize: 12, lineHeight: 16, color: c.ink },
    price: { fontFamily: fonts.stamp, fontSize: 15, color: c.ink },
    pricePicked: { color: c.stamp },
    check: {
      position: 'absolute',
      right: -8,
      top: -12,
      width: 44,
      height: 44,
      borderRadius: 22,
      borderWidth: 3,
      borderColor: c.stamp,
      backgroundColor: c.paperWhite,
      alignItems: 'center',
      justifyContent: 'center',
      transform: [{ rotate: '-12deg' }],
    },
    checkGlyph: { fontFamily: fonts.stamp, fontSize: 20, color: c.stamp },
    cta: { marginTop: spacing.lg },
  });
