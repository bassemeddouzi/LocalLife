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
import { apiFetch } from '../../../api/client';
import { useCity } from '../../../context/CityContext';
import { colors } from '../../../theme';
import { PRICE_LEVELS } from '../shared/constants';
import { guideStyles } from '../shared/guideStyles';
import type { GuideAddStackParamList } from '../GuideAddStack';

type Props = NativeStackScreenProps<GuideAddStackParamList, 'ExperienceForm'>;

export function GuideExperienceForm({ navigation }: Props) {
  const { city } = useCity();
  const [title, setTitle] = useState('');
  const [summary, setSummary] = useState('');
  const [description, setDescription] = useState('');
  const [audience, setAudience] = useState('');
  const [priceLevel, setPriceLevel] = useState('');
  const [step1, setStep1] = useState('');
  const [step2, setStep2] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (!city) {
      Alert.alert('City', 'City not loaded');
      return;
    }
    if (!title.trim() || !summary.trim()) {
      Alert.alert('Validation', 'Title and summary are required.');
      return;
    }
    setBusy(true);
    try {
      const steps = [step1, step2]
        .map((t) => t.trim())
        .filter(Boolean)
        .map((t) => ({ title: t }));
      await apiFetch('/v1/guides/experiences', {
        method: 'POST',
        body: JSON.stringify({
          cityId: city.id,
          title: title.trim(),
          summary: summary.trim(),
          description: description.trim() || undefined,
          audience: audience.trim() || undefined,
          priceLevel: priceLevel || undefined,
          steps: steps.length ? steps : undefined,
        }),
      });
      Alert.alert('Submitted', 'Experience pending moderation');
      navigation.goBack();
    } catch (e) {
      Alert.alert('Error', e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={guideStyles.page} keyboardShouldPersistTaps="handled">
      <Text style={guideStyles.h1}>Submit experience</Text>
      <Text style={guideStyles.muted}>
        A curated multi-step local experience for travelers.
      </Text>
      <TextInput
        style={guideStyles.input}
        placeholder="Title"
        value={title}
        onChangeText={setTitle}
        placeholderTextColor={colors.muted}
      />
      <TextInput
        style={[guideStyles.input, { minHeight: 80 }]}
        placeholder="Summary"
        multiline
        value={summary}
        onChangeText={setSummary}
        placeholderTextColor={colors.muted}
      />
      <TextInput
        style={[guideStyles.input, { minHeight: 90 }]}
        placeholder="Description (optional)"
        multiline
        value={description}
        onChangeText={setDescription}
        placeholderTextColor={colors.muted}
      />
      <TextInput
        style={guideStyles.input}
        placeholder="Audience (e.g. families, couples)"
        value={audience}
        onChangeText={setAudience}
        placeholderTextColor={colors.muted}
      />
      <Text style={guideStyles.label}>Price level</Text>
      <View style={guideStyles.row}>
        {PRICE_LEVELS.map((p) => (
          <Pressable
            key={p}
            style={[guideStyles.chip, priceLevel === p && guideStyles.chipOn]}
            onPress={() => setPriceLevel(priceLevel === p ? '' : p)}
          >
            <Text
              style={[
                guideStyles.chipText,
                priceLevel === p && guideStyles.chipTextOn,
              ]}
            >
              {p}
            </Text>
          </Pressable>
        ))}
      </View>
      <Text style={guideStyles.label}>Steps (optional)</Text>
      <TextInput
        style={guideStyles.input}
        placeholder="Step 1"
        value={step1}
        onChangeText={setStep1}
        placeholderTextColor={colors.muted}
      />
      <TextInput
        style={guideStyles.input}
        placeholder="Step 2"
        value={step2}
        onChangeText={setStep2}
        placeholderTextColor={colors.muted}
      />
      <Pressable
        style={[guideStyles.btn, busy && { opacity: 0.6 }]}
        onPress={() => void submit()}
        disabled={busy}
      >
        <Text style={guideStyles.btnText}>
          {busy ? 'Submitting…' : 'Submit experience'}
        </Text>
      </Pressable>
    </ScrollView>
  );
}
