import React, { useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { apiFetch } from '../../../api/client';
import { useCity } from '../../../context/CityContext';
import { colors } from '../../../theme';
import { guideStyles } from '../shared/guideStyles';
import type { GuideAddStackParamList } from '../GuideAddStack';

type Props = NativeStackScreenProps<GuideAddStackParamList, 'ZoneSafetyForm'>;

const TIME_CONTEXTS = ['DAY', 'NIGHT', 'WEEKEND', 'ANY'] as const;
const SAFETY_LEVELS = [
  'VERY_DANGER',
  'DANGER',
  'MEDIUM',
  'GOOD',
  'VERY_GOOD',
] as const;
const ZONE_CHARS = [
  'INDUSTRIAL',
  'TOURIST',
  'RESIDENTIAL',
  'MIXED',
] as const;

export function GuideZoneSafetyForm({ navigation }: Props) {
  const { t } = useTranslation();
  const { city } = useCity();
  const [timeContext, setTimeContext] =
    useState<(typeof TIME_CONTEXTS)[number]>('DAY');
  const [safetyLevel, setSafetyLevel] =
    useState<(typeof SAFETY_LEVELS)[number]>('GOOD');
  const [zoneCharacter, setZoneCharacter] = useState<
    (typeof ZONE_CHARS)[number] | null
  >('MIXED');
  const [reason, setReason] = useState('');
  const [guideComment, setGuideComment] = useState('');
  const [howToArrive, setHowToArrive] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (!reason.trim()) {
      Alert.alert(t('error'), t('guideZoneSafetyReasonRequired'));
      return;
    }
    setBusy(true);
    try {
      await apiFetch('/v1/guides/zone-safety', {
        method: 'POST',
        body: JSON.stringify({
          cityId: city?.id,
          timeContext,
          safetyLevel,
          reason: reason.trim(),
          guideComment: guideComment.trim() || undefined,
          zoneCharacter: zoneCharacter ?? undefined,
          howToArrive: howToArrive.trim() || undefined,
        }),
      });
      Alert.alert(t('savedTitle'), t('guideZoneSafetySubmitted'));
      navigation.goBack();
    } catch (e) {
      Alert.alert(t('error'), e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={guideStyles.page} keyboardShouldPersistTaps="handled">
      <Text style={guideStyles.h1}>{t('guideZoneSafetyTitle')}</Text>
      <Text style={guideStyles.muted}>{t('guideZoneSafetyHint')}</Text>

      <Text style={guideStyles.label}>{t('guideZoneSafetyTime')}</Text>
      <View style={guideStyles.row}>
        {TIME_CONTEXTS.map((key) => (
          <Pressable
            key={key}
            style={[guideStyles.chip, timeContext === key && guideStyles.chipOn]}
            onPress={() => setTimeContext(key)}
          >
            <Text
              style={[
                guideStyles.chipText,
                timeContext === key && guideStyles.chipTextOn,
              ]}
            >
              {key}
            </Text>
          </Pressable>
        ))}
      </View>

      <Text style={guideStyles.label}>{t('guideZoneSafetyLevel')}</Text>
      <View style={guideStyles.row}>
        {SAFETY_LEVELS.map((key) => (
          <Pressable
            key={key}
            style={[guideStyles.chip, safetyLevel === key && guideStyles.chipOn]}
            onPress={() => setSafetyLevel(key)}
          >
            <Text
              style={[
                guideStyles.chipText,
                safetyLevel === key && guideStyles.chipTextOn,
              ]}
            >
              {key.replace('_', ' ')}
            </Text>
          </Pressable>
        ))}
      </View>

      <Text style={guideStyles.label}>{t('guideZoneSafetyCharacter')}</Text>
      <View style={guideStyles.row}>
        {ZONE_CHARS.map((key) => (
          <Pressable
            key={key}
            style={[
              guideStyles.chip,
              zoneCharacter === key && guideStyles.chipOn,
            ]}
            onPress={() => setZoneCharacter(key)}
          >
            <Text
              style={[
                guideStyles.chipText,
                zoneCharacter === key && guideStyles.chipTextOn,
              ]}
            >
              {key}
            </Text>
          </Pressable>
        ))}
      </View>

      <TextInput
        style={[guideStyles.input, { minHeight: 90 }]}
        placeholder={t('guideZoneSafetyReason')}
        multiline
        value={reason}
        onChangeText={setReason}
        placeholderTextColor={colors.muted}
      />
      <TextInput
        style={[guideStyles.input, { minHeight: 70 }]}
        placeholder={t('guideZoneSafetyComment')}
        multiline
        value={guideComment}
        onChangeText={setGuideComment}
        placeholderTextColor={colors.muted}
      />
      <TextInput
        style={[guideStyles.input, { minHeight: 70 }]}
        placeholder={t('guideZoneSafetyArrive')}
        multiline
        value={howToArrive}
        onChangeText={setHowToArrive}
        placeholderTextColor={colors.muted}
      />

      <Pressable
        style={[guideStyles.btn, busy && { opacity: 0.6 }]}
        onPress={() => void submit()}
        disabled={busy}
      >
        <Text style={guideStyles.btnText}>
          {busy ? t('submitting') : t('guideZoneSafetySubmit')}
        </Text>
      </Pressable>
    </ScrollView>
  );
}
