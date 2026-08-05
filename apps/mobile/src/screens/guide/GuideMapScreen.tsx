import React, { useCallback, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { colors } from '../../theme';
import { MapPickView } from './shared/MapPickView';
import { guideStyles, statusColors } from './shared/guideStyles';
import { getMapboxToken } from './shared/mapboxToken';
import {
  fetchGuideZone,
  GuideZone,
  zoomForRadiusMeters,
} from './shared/guideScope';

export function GuideMapScreen() {
  const { t } = useTranslation();
  const [zone, setZone] = useState<GuideZone | null>(null);
  const [error, setError] = useState('');
  const token = getMapboxToken();

  const load = useCallback(async () => {
    try {
      const z = await fetchGuideZone();
      setZone(z);
      setError('');
    } catch (e) {
      setZone(null);
      setError(e instanceof Error ? e.message : String(e));
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  const center = zone?.center ?? ([10.86, 33.81] as [number, number]);
  const pins = (zone?.pins ?? []).map((p) => ({
    id: p.id,
    latitude: p.latitude,
    longitude: p.longitude,
    title: p.title,
    color: statusColors(p.status).fg,
  }));
  const label = zone
    ? `${zone.level} · ${zone.name}`
    : t('guideMapNoZone');

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <Text style={guideStyles.h1}>{t('guideMapTitle')}</Text>
        <Text style={guideStyles.muted}>
          {error
            ? error
            : t('guideMapSubtitle', { zone: label })}
        </Text>
      </View>
      <View style={styles.map}>
        <MapPickView
          token={token}
          center={center}
          latitude={center[1]}
          longitude={center[0]}
          onPick={() => undefined}
          polygon={zone?.circleGeoJson ?? null}
          polygonColor="#1a7f37"
          zoomLevel={
            zone ? zoomForRadiusMeters(zone.radiusMeters) : 11
          }
          pins={pins}
          interactive={false}
          showPickPin={false}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  header: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8, gap: 4 },
  map: { flex: 1 },
});
