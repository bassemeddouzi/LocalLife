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
import { guideStyles } from '../shared/guideStyles';
import { LocationFields } from '../shared/LocationFields';
import { PhotoField } from '../shared/PhotoField';
import { getMapboxToken } from '../shared/mapboxToken';
import {
  fetchGuideZone,
  pointInGuideZone,
} from '../shared/guideScope';
import type { GuideAddStackParamList } from '../GuideAddStack';

type Props = NativeStackScreenProps<GuideAddStackParamList, 'BusinessForm'>;

type District = { id: string; name: string };

export function GuideBusinessForm({ navigation }: Props) {
  const { city } = useCity();
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [note, setNote] = useState('');
  const [categoryKey, setCategoryKey] = useState('');
  const [districtId, setDistrictId] = useState('');
  const [districts, setDistricts] = useState<District[]>([]);
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');
  const [mapToken] = useState(getMapboxToken());
  const [zoneCenter, setZoneCenter] = useState<[number, number] | undefined>();
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!city) return;
    void apiFetch<District[]>(`/v1/cities/${city.id}/districts`, {
      auth: false,
    })
      .then((rows) => {
        setDistricts(rows);
        if (rows[0]) setDistrictId(rows[0].id);
      })
      .catch(() => setDistricts([]));
    void fetchGuideZone()
      .then((z) => setZoneCenter(z.center))
      .catch(() => undefined);
  }, [city]);

  const submit = async () => {
    if (!city) {
      Alert.alert('City', 'City not loaded');
      return;
    }
    if (!displayName.trim() || !email.trim() || !districtId) {
      Alert.alert('Validation', 'Name, email, and district are required.');
      return;
    }
    const lat = latitude ? Number(latitude) : undefined;
    const lng = longitude ? Number(longitude) : undefined;
    if (
      lat != null &&
      lng != null &&
      !Number.isNaN(lat) &&
      !Number.isNaN(lng)
    ) {
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
        /* server enforces */
      }
    }
    setBusy(true);
    try {
      await apiFetch('/v1/guides/business-applications', {
        method: 'POST',
        body: JSON.stringify({
          email: email.trim(),
          displayName: displayName.trim(),
          baseCityId: city.id,
          primaryDistrictId: districtId,
          phone: phone.trim() || undefined,
          addressText: address.trim() || undefined,
          note: note.trim() || undefined,
          categoryKey: categoryKey.trim() || undefined,
          photoUrl: photoUrl.trim() || undefined,
          latitude: lat != null && !Number.isNaN(lat) ? lat : undefined,
          longitude: lng != null && !Number.isNaN(lng) ? lng : undefined,
        }),
      });
      Alert.alert('Submitted', 'Business proposal pending Admin approval');
      navigation.goBack();
    } catch (e) {
      Alert.alert('Error', e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={guideStyles.page} keyboardShouldPersistTaps="handled">
      <Text style={guideStyles.h1}>Propose Business</Text>
      <Text style={guideStyles.muted}>
        Suggest a local business for Admin to onboard.
      </Text>
      <TextInput
        style={guideStyles.input}
        placeholder="Display name"
        value={displayName}
        onChangeText={setDisplayName}
        placeholderTextColor={colors.muted}
      />
      <TextInput
        style={guideStyles.input}
        placeholder="Email"
        autoCapitalize="none"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
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
      <Text style={guideStyles.label}>District</Text>
      <View style={guideStyles.row}>
        {districts.map((d) => (
          <Pressable
            key={d.id}
            style={[guideStyles.chip, districtId === d.id && guideStyles.chipOn]}
            onPress={() => setDistrictId(d.id)}
          >
            <Text
              style={[
                guideStyles.chipText,
                districtId === d.id && guideStyles.chipTextOn,
              ]}
            >
              {d.name}
            </Text>
          </Pressable>
        ))}
      </View>
      <TextInput
        style={guideStyles.input}
        placeholder="Address (optional)"
        value={address}
        onChangeText={setAddress}
        placeholderTextColor={colors.muted}
      />
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
        placeholder="Category key (optional)"
        value={categoryKey}
        onChangeText={setCategoryKey}
        placeholderTextColor={colors.muted}
        autoCapitalize="none"
      />
      <PhotoField value={photoUrl} onChange={setPhotoUrl} folder="business" />
      <TextInput
        style={[guideStyles.input, { minHeight: 80 }]}
        placeholder="Note for Admin (optional)"
        multiline
        value={note}
        onChangeText={setNote}
        placeholderTextColor={colors.muted}
      />
      <Pressable
        style={[guideStyles.btn, busy && { opacity: 0.6 }]}
        onPress={() => void submit()}
        disabled={busy}
      >
        <Text style={guideStyles.btnText}>
          {busy ? 'Submitting…' : 'Submit proposal'}
        </Text>
      </Pressable>
    </ScrollView>
  );
}
