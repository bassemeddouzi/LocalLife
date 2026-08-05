import React, { useEffect, useState } from 'react';
import {
  Alert,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import * as Location from 'expo-location';
import { useTranslation } from 'react-i18next';
import { colors } from '../../../theme';
import { guideStyles } from './guideStyles';
import { MapPickView } from './MapPickView';
import {
  fetchGuideZone,
  GuideZone,
  pointInGuideZone,
  zoomForRadiusMeters,
} from './guideScope';

type Props = {
  latitude: string;
  longitude: string;
  onChange: (lat: string, lng: string) => void;
  mapToken?: string | null;
  center?: [number, number];
  /** When true (default), block picks outside Guide assignment circle. */
  enforceScope?: boolean;
};

export function LocationFields({
  latitude,
  longitude,
  onChange,
  mapToken,
  center,
  enforceScope = true,
}: Props) {
  const { t } = useTranslation();
  const [mapOpen, setMapOpen] = useState(false);
  const [locBusy, setLocBusy] = useState(false);
  const [zone, setZone] = useState<GuideZone | null>(null);

  useEffect(() => {
    if (!enforceScope) return;
    void fetchGuideZone()
      .then(setZone)
      .catch(() => setZone(null));
  }, [enforceScope]);

  const applyCoords = (lat: number, lng: number) => {
    if (enforceScope && zone && !pointInGuideZone(lat, lng, zone)) {
      Alert.alert(
        t('guideScopeOutsideTitle'),
        t('guideScopeOutsideBody', {
          level: zone.level,
          name: zone.name,
        }),
      );
      return false;
    }
    onChange(lat.toFixed(6), lng.toFixed(6));
    return true;
  };

  const useMyLocation = async () => {
    setLocBusy(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        return;
      }
      const pos = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      applyCoords(pos.coords.latitude, pos.coords.longitude);
    } finally {
      setLocBusy(false);
    }
  };

  const mapCenter =
    zone?.center ?? center ?? ([10.85, 33.81] as [number, number]);

  return (
    <View style={{ gap: 8 }}>
      <Text style={guideStyles.label}>{t('guideCoordsLabel')}</Text>
      {zone ? (
        <Text style={guideStyles.muted}>
          {t('guideScopeHint', {
            level: zone.level,
            name: zone.name,
          })}
        </Text>
      ) : null}
      <View style={guideStyles.row}>
        <TextInput
          style={[guideStyles.input, { flex: 1 }]}
          placeholder="Latitude"
          keyboardType="decimal-pad"
          value={latitude}
          onChangeText={(v) => onChange(v, longitude)}
          placeholderTextColor={colors.muted}
        />
        <TextInput
          style={[guideStyles.input, { flex: 1 }]}
          placeholder="Longitude"
          keyboardType="decimal-pad"
          value={longitude}
          onChangeText={(v) => onChange(latitude, v)}
          placeholderTextColor={colors.muted}
        />
      </View>
      <View style={guideStyles.row}>
        <Pressable
          style={[
            guideStyles.btnSecondary,
            { flex: 1 },
            locBusy && { opacity: 0.6 },
          ]}
          onPress={() => void useMyLocation()}
          disabled={locBusy}
        >
          <Text style={guideStyles.btnSecondaryText}>
            {locBusy ? t('guideLocating') : t('guideUseMyLocation')}
          </Text>
        </Pressable>
        <Pressable
          style={[guideStyles.btnSecondary, { flex: 1 }]}
          onPress={() => setMapOpen(true)}
        >
          <Text style={guideStyles.btnSecondaryText}>
            {t('guidePickOnMap')}
          </Text>
        </Pressable>
      </View>

      <Modal visible={mapOpen} animationType="slide">
        <View style={styles.modal}>
          <Text style={guideStyles.h1}>{t('guidePickOnMap')}</Text>
          <Text style={guideStyles.muted}>
            {t('guidePickOnMapHint')}
          </Text>
          <View style={styles.mapWrap}>
            <MapPickView
              token={mapToken}
              center={mapCenter}
              latitude={Number(latitude) || mapCenter[1]}
              longitude={Number(longitude) || mapCenter[0]}
              onPick={(lat, lng) => {
                applyCoords(lat, lng);
              }}
              polygon={zone?.circleGeoJson ?? null}
              polygonColor="#1a7f37"
              zoomLevel={
                zone ? zoomForRadiusMeters(zone.radiusMeters) : 11
              }
            />
          </View>
          <Text style={guideStyles.body}>
            {latitude || '—'}, {longitude || '—'}
          </Text>
          <Pressable style={guideStyles.btn} onPress={() => setMapOpen(false)}>
            <Text style={guideStyles.btnText}>{t('confirm')}</Text>
          </Pressable>
          <Pressable
            style={guideStyles.btnGhost}
            onPress={() => setMapOpen(false)}
          >
            <Text style={guideStyles.btnGhostText}>{t('cancel')}</Text>
          </Pressable>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  modal: {
    flex: 1,
    backgroundColor: colors.bg,
    padding: 20,
    paddingTop: 56,
    gap: 12,
  },
  mapWrap: {
    flex: 1,
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
    minHeight: 280,
  },
});
