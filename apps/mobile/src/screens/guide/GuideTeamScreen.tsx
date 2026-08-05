import React, { useCallback, useMemo, useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { apiFetch } from '../../api/client';
import { colors } from '../../theme';
import { guideStyles } from './shared/guideStyles';
import { MapPickView } from './shared/MapPickView';
import { StatusBadge } from './shared/StatusBadge';
import { getMapboxToken } from './shared/mapboxToken';
import {
  buildCircleGeoJson,
  fetchGuideZone,
  GuideZone,
  pointInGuideZone,
  zoomForRadiusMeters,
} from './shared/guideScope';

type SubGuideApp = {
  id: string;
  email: string;
  displayName: string;
  phone?: string | null;
  formationNote?: string | null;
  status: string;
  createdAt: string;
};

const RADIUS_PRESETS = [200, 400, 800, 1500] as const;

export function GuideTeamScreen() {
  const { t } = useTranslation();
  const [apps, setApps] = useState<SubGuideApp[]>([]);
  const [zone, setZone] = useState<GuideZone | null>(null);
  const [email, setEmail] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [phone, setPhone] = useState('');
  const [formationNote, setFormationNote] = useState('');
  const [centerLat, setCenterLat] = useState<number | null>(null);
  const [centerLng, setCenterLng] = useState<number | null>(null);
  const [radiusMeters, setRadiusMeters] = useState(400);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const token = getMapboxToken();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [list, z] = await Promise.all([
        apiFetch<SubGuideApp[]>('/v1/guides/me/subguides'),
        fetchGuideZone().catch(() => null),
      ]);
      setApps(list);
      if (z) {
        setZone(z);
        setCenterLat((prev) => prev ?? z.center[1]);
        setCenterLng((prev) => prev ?? z.center[0]);
      }
    } catch (e) {
      Alert.alert(t('error'), e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  const borderPolygon = useMemo(() => {
    if (centerLat == null || centerLng == null) return null;
    return buildCircleGeoJson([centerLng, centerLat], radiusMeters);
  }, [centerLat, centerLng, radiusMeters]);

  const onPickCenter = (lat: number, lng: number) => {
    if (zone && !pointInGuideZone(lat, lng, zone)) {
      Alert.alert(
        t('guideScopeOutsideTitle'),
        t('guideScopeOutsideBody', {
          level: zone.level,
          name: zone.name,
        }),
      );
      return;
    }
    setCenterLat(lat);
    setCenterLng(lng);
  };

  const submit = async () => {
    if (!email.trim() || !displayName.trim()) {
      Alert.alert(t('error'), t('guideTeamValidationRequired'));
      return;
    }
    if (centerLat == null || centerLng == null || !borderPolygon) {
      Alert.alert(t('error'), t('guideTeamValidationBorder'));
      return;
    }
    if (zone && !pointInGuideZone(centerLat, centerLng, zone)) {
      Alert.alert(
        t('guideScopeOutsideTitle'),
        t('guideScopeOutsideBody', {
          level: zone.level,
          name: zone.name,
        }),
      );
      return;
    }
    setBusy(true);
    try {
      await apiFetch('/v1/guides/me/subguides', {
        method: 'POST',
        body: JSON.stringify({
          email: email.trim(),
          displayName: displayName.trim(),
          phone: phone.trim() || undefined,
          formationNote: formationNote.trim() || undefined,
          borderGeoJson: borderPolygon,
        }),
      });
      setEmail('');
      setDisplayName('');
      setPhone('');
      setFormationNote('');
      setRadiusMeters(400);
      if (zone) {
        setCenterLat(zone.center[1]);
        setCenterLng(zone.center[0]);
      }
      Alert.alert(t('savedTitle'), t('guideTeamSubmitted'));
      await load();
    } catch (e) {
      Alert.alert(t('error'), e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };

  const mapCenter: [number, number] = zone?.center ?? [10.86, 33.81];
  const pickLat = centerLat ?? mapCenter[1];
  const pickLng = centerLng ?? mapCenter[0];

  return (
    <ScrollView
      contentContainerStyle={guideStyles.page}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={guideStyles.h1}>{t('guideTeamTitle')}</Text>
      <Text style={guideStyles.muted}>{t('guideTeamSubtitle')}</Text>

      <Text style={guideStyles.h2}>{t('guideTeamListTitle')}</Text>
      {loading ? (
        <Text style={guideStyles.muted}>{t('loading')}</Text>
      ) : apps.length === 0 ? (
        <Text style={guideStyles.muted}>{t('guideTeamEmpty')}</Text>
      ) : (
        apps.map((a) => (
          <View key={a.id} style={guideStyles.card}>
            <View style={styles.cardHead}>
              <Text style={guideStyles.cardTitle}>{a.displayName}</Text>
              <StatusBadge status={a.status} />
            </View>
            <Text style={guideStyles.muted}>{a.email}</Text>
            {a.phone ? (
              <Text style={guideStyles.muted}>{a.phone}</Text>
            ) : null}
            {a.formationNote ? (
              <Text style={guideStyles.body} numberOfLines={3}>
                {a.formationNote}
              </Text>
            ) : null}
          </View>
        ))
      )}

      <Text style={guideStyles.h2}>{t('guideTeamProposeTitle')}</Text>
      <Text style={guideStyles.label}>{t('email')}</Text>
      <TextInput
        style={guideStyles.input}
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
        placeholder={t('email')}
        placeholderTextColor={colors.muted}
      />
      <Text style={guideStyles.label}>{t('displayName')}</Text>
      <TextInput
        style={guideStyles.input}
        value={displayName}
        onChangeText={setDisplayName}
        placeholder={t('displayName')}
        placeholderTextColor={colors.muted}
      />
      <Text style={guideStyles.label}>{t('guideTeamPhone')}</Text>
      <TextInput
        style={guideStyles.input}
        value={phone}
        onChangeText={setPhone}
        keyboardType="phone-pad"
        placeholder={t('guideTeamPhone')}
        placeholderTextColor={colors.muted}
      />
      <Text style={guideStyles.label}>{t('guideTeamFormationNote')}</Text>
      <TextInput
        style={[guideStyles.input, { minHeight: 90 }]}
        multiline
        value={formationNote}
        onChangeText={setFormationNote}
        placeholder={t('guideTeamFormationNotePlaceholder')}
        placeholderTextColor={colors.muted}
      />

      <Text style={guideStyles.label}>{t('guideTeamBorderTitle')}</Text>
      <Text style={guideStyles.muted}>{t('guideTeamBorderHint')}</Text>
      <Text style={guideStyles.label}>{t('guideTeamRadius')}</Text>
      <View style={guideStyles.row}>
        {RADIUS_PRESETS.map((r) => (
          <Pressable
            key={r}
            style={[guideStyles.chip, radiusMeters === r && guideStyles.chipOn]}
            onPress={() => setRadiusMeters(r)}
          >
            <Text
              style={[
                guideStyles.chipText,
                radiusMeters === r && guideStyles.chipTextOn,
              ]}
            >
              {r} m
            </Text>
          </Pressable>
        ))}
      </View>
      <View style={styles.mapBox}>
        <MapPickView
          token={token}
          center={mapCenter}
          latitude={pickLat}
          longitude={pickLng}
          onPick={onPickCenter}
          polygon={borderPolygon}
          polygonColor="#1a7f37"
          zoomLevel={zoomForRadiusMeters(Math.max(radiusMeters * 2, 800))}
          interactive
          showPickPin
        />
      </View>
      <Text style={guideStyles.muted}>
        {t('guideCoordsLabel')}: {pickLat.toFixed(5)}, {pickLng.toFixed(5)} ·{' '}
        {radiusMeters} m
      </Text>

      <Pressable
        style={[guideStyles.btn, busy && { opacity: 0.6 }]}
        onPress={() => void submit()}
        disabled={busy}
      >
        <Text style={guideStyles.btnText}>
          {busy ? t('loading') : t('guideTeamSubmit')}
        </Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  cardHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  mapBox: {
    height: 260,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
  },
});
