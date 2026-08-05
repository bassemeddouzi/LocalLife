import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { colors } from '../theme';

export type TipsStepId =
  | 'home'
  | 'plan'
  | 'avatar'
  | 'rate'
  | 'gps';

type Props = {
  onShowMe: (step: TipsStepId) => void;
  onTryPlan: () => void;
  onAskSomething: () => void;
  onBackMenu: () => void;
};

const STEPS: TipsStepId[] = ['home', 'plan', 'avatar', 'rate', 'gps'];

export function AppTipsTour({
  onShowMe,
  onTryPlan,
  onAskSomething,
  onBackMenu,
}: Props) {
  const { t } = useTranslation();
  const [index, setIndex] = useState(0);
  const step = STEPS[index];
  const last = index >= STEPS.length - 1;

  return (
    <View style={styles.card}>
      <Text style={styles.kicker}>
        {t('tipsStepOf', { n: index + 1, total: STEPS.length })}
      </Text>
      <Text style={styles.title}>{t(`tipsTitle_${step}`)}</Text>
      <Text style={styles.body}>{t(`tipsBody_${step}`)}</Text>
      <Pressable style={styles.primary} onPress={() => onShowMe(step)}>
        <Text style={styles.primaryText}>{t('tipsShowMe')}</Text>
      </Pressable>
      {!last ? (
        <Pressable style={styles.secondary} onPress={() => setIndex((i) => i + 1)}>
          <Text style={styles.secondaryText}>{t('tipsNext')}</Text>
        </Pressable>
      ) : (
        <View style={styles.endActions}>
          <Pressable style={styles.primary} onPress={onTryPlan}>
            <Text style={styles.primaryText}>{t('hubMenuPlan')}</Text>
          </Pressable>
          <Pressable style={styles.secondary} onPress={onAskSomething}>
            <Text style={styles.secondaryText}>{t('hubMenuInfo')}</Text>
          </Pressable>
          <Pressable onPress={onBackMenu}>
            <Text style={styles.link}>{t('hubBackMenu')}</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
    gap: 10,
  },
  kicker: { color: colors.muted, fontSize: 12, fontWeight: '700' },
  title: { color: colors.ink, fontSize: 18, fontWeight: '800' },
  body: { color: colors.muted, lineHeight: 20 },
  primary: {
    backgroundColor: colors.brand,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  primaryText: { color: '#fff', fontWeight: '800' },
  secondary: {
    borderWidth: 1,
    borderColor: colors.brand,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  secondaryText: { color: colors.brand, fontWeight: '800' },
  endActions: { gap: 8 },
  link: {
    color: colors.muted,
    fontWeight: '700',
    textAlign: 'center',
    marginTop: 4,
  },
});
