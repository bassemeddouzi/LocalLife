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
import { useTranslation } from 'react-i18next';
import { apiFetch } from '../../../api/client';
import { useCity } from '../../../context/CityContext';
import { colors } from '../../../theme';
import { PRICE_LEVELS } from '../shared/constants';
import { guideStyles } from '../shared/guideStyles';
import { LocationFields } from '../shared/LocationFields';
import { PhotoField } from '../shared/PhotoField';
import { getMapboxToken } from '../shared/mapboxToken';
import {
  fetchGuideZone,
  pointInGuideZone,
} from '../shared/guideScope';
import type { GuideAddStackParamList } from '../GuideAddStack';

type Props = NativeStackScreenProps<GuideAddStackParamList, 'PlaceForm'>;

type Category = { id: string; key: string; name: string };

export function GuidePlaceForm({ navigation }: Props) {
  const { t } = useTranslation();
  const { city } = useCity();
  const [name, setName] = useState('');
  const [summary, setSummary] = useState('');
  const [description, setDescription] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [latitude, setLatitude] = useState('33.810000');
  const [longitude, setLongitude] = useState('10.850000');
  const [categoryKey, setCategoryKey] = useState('');
  const [priceLevel, setPriceLevel] = useState<string>('');
  const [photoUrl, setPhotoUrl] = useState('');
  const [guideComment, setGuideComment] = useState('');
  const [typicalDurationMin, setTypicalDurationMin] = useState('');
  const [categories, setCategories] = useState<Category[]>([]);
  const [mapToken, setMapToken] = useState<string | null>(getMapboxToken());
  const [zoneCenter, setZoneCenter] = useState<[number, number] | undefined>();
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    void apiFetch<
      Array<{ id: string; key: string; name: string; children?: Category[] }>
    >('/v1/categories', { auth: false })
      .then((rows) => {
        const flat: Category[] = [];
        for (const r of rows) {
          flat.push({ id: r.id, key: r.key, name: r.name });
          for (const c of r.children ?? []) {
            flat.push({ id: c.id, key: c.key, name: c.name });
          }
        }
        setCategories(flat);
      })
      .catch(() => setCategories([]));
  }, []);

  useEffect(() => {
    void fetchGuideZone()
      .then((z) => {
        setZoneCenter(z.center);
        setLatitude(z.center[1].toFixed(6));
        setLongitude(z.center[0].toFixed(6));
      })
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    setMapToken(getMapboxToken());
  }, []);

  const submit = async () => {
    if (!city) {
      Alert.alert('City', 'City not loaded');
      return;
    }
    const lat = Number(latitude);
    const lng = Number(longitude);
    if (!name.trim() || !summary.trim() || Number.isNaN(lat) || Number.isNaN(lng)) {
      Alert.alert('Validation', 'Name, summary, and valid coordinates are required.');
      return;
    }
    if (!categoryKey) {
      Alert.alert('Validation', 'Pick a category.');
      return;
    }
    try {
      const zone = await fetchGuideZone();
      if (!pointInGuideZone(lat, lng, zone)) {
        Alert.alert(
          'Outside zone',
          `Location must be inside your ${zone.level} · ${zone.name} circle.`,
        );
        return;
      }
    } catch {
      /* server enforces on submit */
    }
    setBusy(true);
    try {
      const duration = Number(typicalDurationMin);
      const place = await apiFetch<{ id: string }>('/v1/places', {
        method: 'POST',
        body: JSON.stringify({
          cityId: city.id,
          name: name.trim(),
          summary: summary.trim(),
          description: description.trim() || undefined,
          latitude: lat,
          longitude: lng,
          addressText: address.trim() || undefined,
          phone: phone.trim() || undefined,
          categoryKey,
          priceLevel: priceLevel || undefined,
          guideComment: guideComment.trim() || undefined,
          typicalDurationMin:
            typicalDurationMin.trim() && !Number.isNaN(duration) && duration > 0
              ? Math.round(duration)
              : undefined,
        }),
      });
      if (photoUrl.trim()) {
        await apiFetch(`/v1/places/${place.id}/photos`, {
          method: 'POST',
          body: JSON.stringify({ url: photoUrl.trim() }),
        });
      }
      Alert.alert('Submitted', 'Place pending moderation');
      navigation.goBack();
    } catch (e) {
      Alert.alert('Error', e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={guideStyles.page} keyboardShouldPersistTaps="handled">
      <Text style={guideStyles.h1}>Submit place</Text>
      <Text style={guideStyles.muted}>
        Local spot with map pin after Admin approval.
      </Text>
      <TextInput
        style={guideStyles.input}
        placeholder="Name"
        value={name}
        onChangeText={setName}
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
        style={[guideStyles.input, { minHeight: 100 }]}
        placeholder="Description (optional)"
        multiline
        value={description}
        onChangeText={setDescription}
        placeholderTextColor={colors.muted}
      />
      <Text style={guideStyles.label}>Category</Text>
      <View style={guideStyles.row}>
        {categories.map((c) => (
          <Pressable
            key={c.id}
            style={[guideStyles.chip, categoryKey === c.key && guideStyles.chipOn]}
            onPress={() => setCategoryKey(c.key)}
          >
            <Text
              style={[
                guideStyles.chipText,
                categoryKey === c.key && guideStyles.chipTextOn,
              ]}
            >
              {c.name}
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
      <LocationFields
        latitude={latitude}
        longitude={longitude}
        onChange={(lat, lng) => {
          setLatitude(lat);
          setLongitude(lng);
        }}
        mapToken={mapToken}
        center={zoneCenter}
      />
      <TextInput
        style={guideStyles.input}
        placeholder="Address (optional)"
        value={address}
        onChangeText={setAddress}
        placeholderTextColor={colors.muted}
      />
      <TextInput
        style={guideStyles.input}
        placeholder="Phone (optional)"
        keyboardType="phone-pad"
        value={phone}
        onChangeText={setPhone}
        placeholderTextColor={colors.muted}
      />
      <TextInput
        style={[guideStyles.input, { minHeight: 80 }]}
        placeholder={t('guidePlaceComment')}
        multiline
        value={guideComment}
        onChangeText={setGuideComment}
        placeholderTextColor={colors.muted}
      />
      <TextInput
        style={guideStyles.input}
        placeholder={t('guidePlaceDuration')}
        keyboardType="number-pad"
        value={typicalDurationMin}
        onChangeText={setTypicalDurationMin}
        placeholderTextColor={colors.muted}
      />
      <PhotoField value={photoUrl} onChange={setPhotoUrl} folder="places" />
      <Pressable
        style={[guideStyles.btn, busy && { opacity: 0.6 }]}
        onPress={() => void submit()}
        disabled={busy}
      >
        <Text style={guideStyles.btnText}>
          {busy ? 'Submitting…' : 'Submit for review'}
        </Text>
      </Pressable>
    </ScrollView>
  );
}
