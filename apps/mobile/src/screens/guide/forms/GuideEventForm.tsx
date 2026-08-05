import React, { useEffect, useState } from 'react';
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

type Props = NativeStackScreenProps<GuideAddStackParamList, 'EventForm'>;

type Category = { id: string; name: string };
type PlaceOpt = { id: string; name: string };

function toLocalInput(d: Date) {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function GuideEventForm({ navigation }: Props) {
  const { city } = useCity();
  const tomorrow = new Date(Date.now() + 86400000);
  tomorrow.setMinutes(0, 0, 0);
  const [title, setTitle] = useState('');
  const [summary, setSummary] = useState('');
  const [description, setDescription] = useState('');
  const [prerequisites, setPrerequisites] = useState('');
  const [startsAt, setStartsAt] = useState(toLocalInput(tomorrow));
  const [endsAt, setEndsAt] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [placeId, setPlaceId] = useState('');
  const [priceLevel, setPriceLevel] = useState('');
  const [categories, setCategories] = useState<Category[]>([]);
  const [places, setPlaces] = useState<PlaceOpt[]>([]);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    void apiFetch<
      Array<{ id: string; name: string; children?: Category[] }>
    >('/v1/categories', { auth: false })
      .then((rows) => {
        const flat: Category[] = [];
        for (const r of rows) {
          flat.push({ id: r.id, name: r.name });
          for (const c of r.children ?? []) {
            flat.push({ id: c.id, name: c.name });
          }
        }
        setCategories(flat);
      })
      .catch(() => setCategories([]));
  }, []);

  useEffect(() => {
    if (!city) return;
    void (async () => {
      try {
        const publicPlaces = await apiFetch<{
          data: PlaceOpt[];
        }>(`/v1/places?cityId=${city.id}&pageSize=50`, { auth: false });
        const mine = await apiFetch<{
          places: PlaceOpt[];
        }>('/v1/guides/me/submissions');
        const map = new Map<string, PlaceOpt>();
        for (const p of publicPlaces.data ?? []) {
          map.set(p.id, { id: p.id, name: p.name });
        }
        for (const p of mine.places ?? []) {
          map.set(p.id, { id: p.id, name: p.name });
        }
        setPlaces([...map.values()]);
      } catch {
        setPlaces([]);
      }
    })();
  }, [city]);

  const submit = async () => {
    if (!city) {
      Alert.alert('City', 'City not loaded');
      return;
    }
    if (!title.trim() || !summary.trim() || !startsAt) {
      Alert.alert('Validation', 'Title, summary, and start time are required.');
      return;
    }
    const startIso = new Date(startsAt).toISOString();
    if (Number.isNaN(Date.parse(startIso))) {
      Alert.alert('Validation', 'Start time must be YYYY-MM-DDTHH:mm');
      return;
    }
    setBusy(true);
    try {
      await apiFetch('/v1/guides/events', {
        method: 'POST',
        body: JSON.stringify({
          cityId: city.id,
          title: title.trim(),
          summary: summary.trim(),
          description: description.trim() || undefined,
          prerequisites: prerequisites.trim() || undefined,
          startsAt: startIso,
          endsAt: endsAt ? new Date(endsAt).toISOString() : undefined,
          categoryId: categoryId || undefined,
          placeId: placeId || undefined,
          priceLevel: priceLevel || undefined,
        }),
      });
      Alert.alert('Submitted', 'Event pending moderation');
      navigation.goBack();
    } catch (e) {
      Alert.alert('Error', e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={guideStyles.page} keyboardShouldPersistTaps="handled">
      <Text style={guideStyles.h1}>Submit event</Text>
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
        style={[guideStyles.input, { minHeight: 80 }]}
        placeholder="Prerequisites — tickets, booking, what to bring…"
        multiline
        value={prerequisites}
        onChangeText={setPrerequisites}
        placeholderTextColor={colors.muted}
      />
      <Text style={guideStyles.label}>Starts at (local)</Text>
      <TextInput
        style={guideStyles.input}
        placeholder="YYYY-MM-DDTHH:mm"
        value={startsAt}
        onChangeText={setStartsAt}
        placeholderTextColor={colors.muted}
        autoCapitalize="none"
      />
      <Text style={guideStyles.label}>Ends at (optional)</Text>
      <TextInput
        style={guideStyles.input}
        placeholder="YYYY-MM-DDTHH:mm"
        value={endsAt}
        onChangeText={setEndsAt}
        placeholderTextColor={colors.muted}
        autoCapitalize="none"
      />
      <Text style={guideStyles.label}>Category</Text>
      <View style={guideStyles.row}>
        {categories.map((c) => (
          <Pressable
            key={c.id}
            style={[guideStyles.chip, categoryId === c.id && guideStyles.chipOn]}
            onPress={() => setCategoryId(categoryId === c.id ? '' : c.id)}
          >
            <Text
              style={[
                guideStyles.chipText,
                categoryId === c.id && guideStyles.chipTextOn,
              ]}
            >
              {c.name}
            </Text>
          </Pressable>
        ))}
      </View>
      <Text style={guideStyles.label}>Linked place (optional)</Text>
      <View style={guideStyles.row}>
        {places.slice(0, 20).map((p) => (
          <Pressable
            key={p.id}
            style={[guideStyles.chip, placeId === p.id && guideStyles.chipOn]}
            onPress={() => setPlaceId(placeId === p.id ? '' : p.id)}
          >
            <Text
              style={[
                guideStyles.chipText,
                placeId === p.id && guideStyles.chipTextOn,
              ]}
            >
              {p.name}
            </Text>
          </Pressable>
        ))}
      </View>
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
      <Pressable
        style={[guideStyles.btn, busy && { opacity: 0.6 }]}
        onPress={() => void submit()}
        disabled={busy}
      >
        <Text style={guideStyles.btnText}>
          {busy ? 'Submitting…' : 'Submit event'}
        </Text>
      </Pressable>
    </ScrollView>
  );
}
