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

type Props = NativeStackScreenProps<
  GuideAddStackParamList,
  'TransportScenarioForm'
>;

/** UI label METER maps to API PricingType.METERED */
const PRICING_CHIPS: Array<{ label: string; value: 'FIXED' | 'METERED' }> = [
  { label: 'FIXED', value: 'FIXED' },
  { label: 'METER', value: 'METERED' },
];

export function GuideTransportScenarioForm({ navigation }: Props) {
  const { t } = useTranslation();
  const { city } = useCity();
  const [fromLabel, setFromLabel] = useState('');
  const [toLabel, setToLabel] = useState('');
  const [estCostMin, setEstCostMin] = useState('');
  const [estCostMax, setEstCostMax] = useState('');
  const [estMinutes, setEstMinutes] = useState('');
  const [guideComment, setGuideComment] = useState('');
  const [pricingModes, setPricingModes] = useState<Array<'FIXED' | 'METERED'>>(
    [],
  );
  const [busy, setBusy] = useState(false);

  const toggleMode = (value: 'FIXED' | 'METERED') => {
    setPricingModes((prev) =>
      prev.includes(value) ? prev.filter((m) => m !== value) : [...prev, value],
    );
  };

  const submit = async () => {
    if (!fromLabel.trim() || !toLabel.trim()) {
      Alert.alert(t('error'), t('guideTransportFromToRequired'));
      return;
    }
    setBusy(true);
    try {
      const min = estCostMin.trim() ? Number(estCostMin) : undefined;
      const max = estCostMax.trim() ? Number(estCostMax) : undefined;
      const minutes = estMinutes.trim() ? Number(estMinutes) : undefined;
      await apiFetch('/v1/guides/transport-scenarios', {
        method: 'POST',
        body: JSON.stringify({
          cityId: city?.id,
          fromLabel: fromLabel.trim(),
          toLabel: toLabel.trim(),
          estCostMin: Number.isFinite(min) ? min : undefined,
          estCostMax: Number.isFinite(max) ? max : undefined,
          estMinutes: Number.isFinite(minutes) ? minutes : undefined,
          pricingModes,
          guideComment: guideComment.trim() || undefined,
          stepsJson: [
            {
              order: 0,
              label: `${fromLabel.trim()} → ${toLabel.trim()}`,
            },
          ],
        }),
      });
      Alert.alert(t('savedTitle'), t('guideTransportScenarioSubmitted'));
      navigation.goBack();
    } catch (e) {
      Alert.alert(t('error'), e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={guideStyles.page} keyboardShouldPersistTaps="handled">
      <Text style={guideStyles.h1}>{t('guideTransportScenarioTitle')}</Text>
      <Text style={guideStyles.muted}>{t('guideTransportScenarioHint')}</Text>

      <TextInput
        style={guideStyles.input}
        placeholder={t('guideTransportFrom')}
        value={fromLabel}
        onChangeText={setFromLabel}
        placeholderTextColor={colors.muted}
      />
      <TextInput
        style={guideStyles.input}
        placeholder={t('guideTransportTo')}
        value={toLabel}
        onChangeText={setToLabel}
        placeholderTextColor={colors.muted}
      />

      <Text style={guideStyles.label}>{t('guideTransportPricing')}</Text>
      <View style={guideStyles.row}>
        {PRICING_CHIPS.map((chip) => {
          const on = pricingModes.includes(chip.value);
          return (
            <Pressable
              key={chip.value}
              style={[guideStyles.chip, on && guideStyles.chipOn]}
              onPress={() => toggleMode(chip.value)}
            >
              <Text
                style={[guideStyles.chipText, on && guideStyles.chipTextOn]}
              >
                {chip.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <TextInput
        style={guideStyles.input}
        placeholder={t('guideTransportCostMin')}
        keyboardType="decimal-pad"
        value={estCostMin}
        onChangeText={setEstCostMin}
        placeholderTextColor={colors.muted}
      />
      <TextInput
        style={guideStyles.input}
        placeholder={t('guideTransportCostMax')}
        keyboardType="decimal-pad"
        value={estCostMax}
        onChangeText={setEstCostMax}
        placeholderTextColor={colors.muted}
      />
      <TextInput
        style={guideStyles.input}
        placeholder={t('guideTransportMinutes')}
        keyboardType="number-pad"
        value={estMinutes}
        onChangeText={setEstMinutes}
        placeholderTextColor={colors.muted}
      />
      <TextInput
        style={[guideStyles.input, { minHeight: 80 }]}
        placeholder={t('guideTransportComment')}
        multiline
        value={guideComment}
        onChangeText={setGuideComment}
        placeholderTextColor={colors.muted}
      />

      <Pressable
        style={[guideStyles.btn, busy && { opacity: 0.6 }]}
        onPress={() => void submit()}
        disabled={busy}
      >
        <Text style={guideStyles.btnText}>
          {busy ? t('submitting') : t('guideTransportScenarioSubmit')}
        </Text>
      </Pressable>
    </ScrollView>
  );
}
