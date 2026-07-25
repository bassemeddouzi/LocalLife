import React, { useState } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Switch,
  ScrollView,
  Alert,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { apiFetch } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useCity } from '../context/CityContext';
import { colors } from '../theme';

const PERSONAS = ['TOURIST', 'STUDENT', 'EXPAT', 'LOCAL', 'BUSINESS'] as const;
const BUDGETS = ['LOW', 'MEDIUM', 'HIGH'] as const;

export function OnboardingScreen() {
  const { t, i18n } = useTranslation();
  const { completeOnboarding, refreshMe } = useAuth();
  const { city } = useCity();
  const [persona, setPersona] =
    useState<(typeof PERSONAS)[number]>('TOURIST');
  const [budget, setBudget] = useState<(typeof BUDGETS)[number]>('MEDIUM');
  const [consentAnalytics, setConsentAnalytics] = useState(false);
  const [consentPersonalization, setConsentPersonalization] = useState(true);
  const [consentPush, setConsentPush] = useState(false);
  const [busy, setBusy] = useState(false);

  const save = async () => {
    setBusy(true);
    try {
      await apiFetch('/v1/auth/me/preferences', {
        method: 'PATCH',
        body: JSON.stringify({
          personaType: persona,
          budgetBand: budget,
          locale: i18n.language,
          homeCityId: city?.id,
          consentAnalytics,
          consentPersonalization,
          consentPush,
          consentMarketing: false,
        }),
      });
      await refreshMe();
      await completeOnboarding();
    } catch (e) {
      Alert.alert(t('error'), e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>{t('onboardingTitle')}</Text>

      <Text style={styles.label}>{t('persona')}</Text>
      <View style={styles.row}>
        {PERSONAS.map((p) => (
          <Pressable
            key={p}
            style={[styles.chip, persona === p && styles.chipOn]}
            onPress={() => setPersona(p)}
          >
            <Text style={styles.chipText}>
              {t(p.toLowerCase() as 'tourist')}
            </Text>
          </Pressable>
        ))}
      </View>

      <Text style={styles.label}>{t('budget')}</Text>
      <View style={styles.row}>
        {BUDGETS.map((b) => (
          <Pressable
            key={b}
            style={[styles.chip, budget === b && styles.chipOn]}
            onPress={() => setBudget(b)}
          >
            <Text style={styles.chipText}>
              {t(b.toLowerCase() as 'low')}
            </Text>
          </Pressable>
        ))}
      </View>

      <Text style={styles.label}>{t('consents')}</Text>
      <View style={styles.switchRow}>
        <Text style={styles.switchLabel}>{t('consentAnalytics')}</Text>
        <Switch value={consentAnalytics} onValueChange={setConsentAnalytics} />
      </View>
      <View style={styles.switchRow}>
        <Text style={styles.switchLabel}>{t('consentPersonalization')}</Text>
        <Switch
          value={consentPersonalization}
          onValueChange={setConsentPersonalization}
        />
      </View>
      <View style={styles.switchRow}>
        <Text style={styles.switchLabel}>{t('consentPush')}</Text>
        <Switch value={consentPush} onValueChange={setConsentPush} />
      </View>

      <Pressable
        style={[styles.btn, busy && { opacity: 0.6 }]}
        onPress={save}
        disabled={busy}
      >
        <Text style={styles.btnText}>
          {busy ? t('loading') : t('continue')}
        </Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 24, gap: 12, backgroundColor: colors.bg },
  title: { fontSize: 28, fontWeight: '800', color: colors.ink, marginBottom: 8 },
  label: { fontWeight: '700', color: colors.ink, marginTop: 8 },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipOn: { backgroundColor: colors.chip, borderColor: colors.brand },
  chipText: { color: colors.ink, fontWeight: '600' },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.card,
    padding: 14,
    borderRadius: 12,
  },
  switchLabel: { color: colors.ink },
  btn: {
    marginTop: 16,
    backgroundColor: colors.brand,
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  btnText: { color: '#fff', fontWeight: '700' },
});
