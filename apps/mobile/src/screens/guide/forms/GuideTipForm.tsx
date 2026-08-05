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
import { TIP_CATEGORY_KEYS } from '../shared/constants';
import { guideStyles } from '../shared/guideStyles';
import type { GuideAddStackParamList } from '../GuideAddStack';

type Props = NativeStackScreenProps<GuideAddStackParamList, 'TipForm'>;

export function GuideTipForm({ navigation, route }: Props) {
  const { city } = useCity();
  const initialCategory = route.params?.categoryKey ?? 'local_tip';
  const [title, setTitle] = useState('');
  const [summary, setSummary] = useState('');
  const [categoryKey, setCategoryKey] = useState(initialCategory);
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (!title.trim() || !summary.trim()) {
      Alert.alert('Validation', 'Title and summary are required.');
      return;
    }
    setBusy(true);
    try {
      await apiFetch('/v1/guides/tips', {
        method: 'POST',
        body: JSON.stringify({
          cityId: city?.id,
          title: title.trim(),
          summary: summary.trim(),
          categoryKey,
        }),
      });
      Alert.alert('Submitted', 'Tip pending moderation');
      navigation.goBack();
    } catch (e) {
      Alert.alert('Error', e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={guideStyles.page} keyboardShouldPersistTaps="handled">
      <Text style={guideStyles.h1}>Submit tip</Text>
      <Text style={guideStyles.muted}>
        Zone knowledge for travelers — not a Tripadvisor-style review of a venue.
        Use tips for transport, safety, money, camping, and similar local know-how.
      </Text>
      <Text style={guideStyles.label}>Category</Text>
      <View style={guideStyles.row}>
        {TIP_CATEGORY_KEYS.map((key) => (
          <Pressable
            key={key}
            style={[guideStyles.chip, categoryKey === key && guideStyles.chipOn]}
            onPress={() => setCategoryKey(key)}
          >
            <Text
              style={[
                guideStyles.chipText,
                categoryKey === key && guideStyles.chipTextOn,
              ]}
            >
              {key.replace('_', ' ')}
            </Text>
          </Pressable>
        ))}
      </View>
      <TextInput
        style={guideStyles.input}
        placeholder="Title"
        value={title}
        onChangeText={setTitle}
        placeholderTextColor={colors.muted}
      />
      <TextInput
        style={[guideStyles.input, { minHeight: 120 }]}
        placeholder="Summary — what should a traveler know?"
        multiline
        value={summary}
        onChangeText={setSummary}
        placeholderTextColor={colors.muted}
      />
      <Pressable
        style={[guideStyles.btn, busy && { opacity: 0.6 }]}
        onPress={() => void submit()}
        disabled={busy}
      >
        <Text style={guideStyles.btnText}>{busy ? 'Submitting…' : 'Submit tip'}</Text>
      </Pressable>
    </ScrollView>
  );
}
