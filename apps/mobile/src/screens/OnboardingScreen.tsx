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

const PERSONAS = [
  'TOURIST',
  'STUDENT',
  'EXPAT',
  'LOCAL',
  'BUSINESS',
  'WORKER',
  'VISITING',
  'TREATMENT',
  'FAMILY',
  'SOLO',
  'ADVENTURE',
] as const;
const BUDGETS = ['LOW', 'MEDIUM', 'HIGH'] as const;
const CONSERVATISM = [
  'OPEN',
  'MODERATE',
  'CONSERVATIVE',
  'STRICT',
] as const;
const VIBES = ['ADVENTURE', 'CLASSY', 'CALM'] as const;
const SETTINGS = ['COUNTRYSIDE', 'CITY', 'MIDDLE'] as const;
const GROUP_SIZES = ['SOLO', 'COUPLE', 'FRIENDS', 'FAMILY_KIDS'] as const;

export function OnboardingScreen() {
  const { t, i18n } = useTranslation();
  const { completeOnboarding, refreshMe } = useAuth();
  const { city } = useCity();
  const [step, setStep] = useState<1 | 2>(1);
  const [persona, setPersona] =
    useState<(typeof PERSONAS)[number]>('TOURIST');
  const [budget, setBudget] = useState<(typeof BUDGETS)[number]>('MEDIUM');
  const [consentAnalytics, setConsentAnalytics] = useState(false);
  const [consentPersonalization, setConsentPersonalization] = useState(true);
  const [consentPush, setConsentPush] = useState(false);
  const [conservatismLevel, setConservatismLevel] =
    useState<(typeof CONSERVATISM)[number]>('MODERATE');
  const [walksOk, setWalksOk] = useState(true);
  const [hasVehicle, setHasVehicle] = useState(false);
  const [vibe, setVibe] = useState<(typeof VIBES)[number]>('CALM');
  const [settingPref, setSettingPref] =
    useState<(typeof SETTINGS)[number]>('MIDDLE');
  const [groupSize, setGroupSize] =
    useState<(typeof GROUP_SIZES)[number]>('SOLO');
  const [busy, setBusy] = useState(false);

  const save = async (includeLifestyle: boolean) => {
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
          onboardingCompleted: true,
          ...(includeLifestyle
            ? {
                conservatismLevel,
                walksOk,
                hasVehicle,
                vibe,
                settingPref,
                groupSize,
              }
            : {}),
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
      <Text style={styles.stepHint}>
        {t('onboardingStep', { step, total: 2 })}
      </Text>

      {step === 1 ? (
        <>
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
            <Switch
              value={consentAnalytics}
              onValueChange={setConsentAnalytics}
            />
          </View>
          <View style={styles.switchRow}>
            <Text style={styles.switchLabel}>
              {t('consentPersonalization')}
            </Text>
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
            onPress={() => setStep(2)}
            disabled={busy}
          >
            <Text style={styles.btnText}>{t('continue')}</Text>
          </Pressable>
        </>
      ) : (
        <>
          <Text style={styles.subtitle}>{t('onboardingLifestyle')}</Text>
          <Text style={styles.muted}>{t('onboardingLifestyleHint')}</Text>

          <Text style={styles.label}>{t('conservatismLevel')}</Text>
          <View style={styles.row}>
            {CONSERVATISM.map((c) => (
              <Pressable
                key={c}
                style={[
                  styles.chip,
                  conservatismLevel === c && styles.chipOn,
                ]}
                onPress={() => setConservatismLevel(c)}
              >
                <Text style={styles.chipText}>
                  {t(`conservatism_${c.toLowerCase()}` as 'conservatism_open')}
                </Text>
              </Pressable>
            ))}
          </View>

          <View style={styles.switchRow}>
            <Text style={styles.switchLabel}>{t('walksOk')}</Text>
            <Switch value={walksOk} onValueChange={setWalksOk} />
          </View>
          <View style={styles.switchRow}>
            <Text style={styles.switchLabel}>{t('hasVehicle')}</Text>
            <Switch value={hasVehicle} onValueChange={setHasVehicle} />
          </View>

          <Text style={styles.label}>{t('vibe')}</Text>
          <View style={styles.row}>
            {VIBES.map((v) => (
              <Pressable
                key={v}
                style={[styles.chip, vibe === v && styles.chipOn]}
                onPress={() => setVibe(v)}
              >
                <Text style={styles.chipText}>
                  {t(`vibe_${v.toLowerCase()}` as 'vibe_calm')}
                </Text>
              </Pressable>
            ))}
          </View>

          <Text style={styles.label}>{t('settingPref')}</Text>
          <View style={styles.row}>
            {SETTINGS.map((s) => (
              <Pressable
                key={s}
                style={[styles.chip, settingPref === s && styles.chipOn]}
                onPress={() => setSettingPref(s)}
              >
                <Text style={styles.chipText}>
                  {t(`setting_${s.toLowerCase()}` as 'setting_city')}
                </Text>
              </Pressable>
            ))}
          </View>

          <Text style={styles.label}>{t('groupSize')}</Text>
          <View style={styles.row}>
            {GROUP_SIZES.map((g) => (
              <Pressable
                key={g}
                style={[styles.chip, groupSize === g && styles.chipOn]}
                onPress={() => setGroupSize(g)}
              >
                <Text style={styles.chipText}>
                  {t(
                    `group_${g.toLowerCase()}` as 'group_solo',
                  )}
                </Text>
              </Pressable>
            ))}
          </View>

          <Pressable
            style={[styles.btn, busy && { opacity: 0.6 }]}
            onPress={() => void save(true)}
            disabled={busy}
          >
            <Text style={styles.btnText}>
              {busy ? t('loading') : t('finishSetup')}
            </Text>
          </Pressable>
          <Pressable
            style={[styles.btnSecondary, busy && { opacity: 0.6 }]}
            onPress={() => void save(false)}
            disabled={busy}
          >
            <Text style={styles.btnSecondaryText}>{t('skipLifestyle')}</Text>
          </Pressable>
          <Pressable onPress={() => setStep(1)} disabled={busy}>
            <Text style={styles.backLink}>{t('back')}</Text>
          </Pressable>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 24, gap: 12, backgroundColor: colors.bg },
  title: { fontSize: 28, fontWeight: '800', color: colors.ink, marginBottom: 4 },
  stepHint: { color: colors.muted, marginBottom: 8 },
  subtitle: { fontWeight: '700', fontSize: 18, color: colors.ink },
  muted: { color: colors.muted, marginBottom: 4 },
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
  switchLabel: { color: colors.ink, flex: 1, paddingRight: 12 },
  btn: {
    marginTop: 16,
    backgroundColor: colors.brand,
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  btnText: { color: '#fff', fontWeight: '700' },
  btnSecondary: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.brand,
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  btnSecondaryText: { color: colors.brand, fontWeight: '700' },
  backLink: {
    textAlign: 'center',
    color: colors.muted,
    fontWeight: '600',
    marginTop: 8,
    marginBottom: 24,
  },
});
