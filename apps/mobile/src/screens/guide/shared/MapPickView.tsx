import React, { useEffect, useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors } from '../../../theme';
import { guideStyles } from './guideStyles';

type Props = {
  token?: string | null;
  center?: [number, number];
  latitude: number;
  longitude: number;
  onPick: (lat: number, lng: number) => void;
  polygon?: {
    type: 'Polygon';
    coordinates: [number, number][][];
  } | null;
  /** Fill/stroke for zone circle — green for Guide assignment scope. */
  polygonColor?: string;
  zoomLevel?: number;
  pins?: Array<{
    id: string;
    latitude: number;
    longitude: number;
    title?: string;
    color?: string;
  }>;
  interactive?: boolean;
  showPickPin?: boolean;
};

type MapboxMaps = typeof import('@rnmapbox/maps');

let MapboxModule: MapboxMaps | null = null;
try {
  // Native module — requires a development build with Mapbox plugin.
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  MapboxModule = require('@rnmapbox/maps');
} catch {
  MapboxModule = null;
}

export function MapPickView({
  token,
  center,
  latitude,
  longitude,
  onPick,
  polygon,
  polygonColor = '#1a7f37',
  zoomLevel = 11,
  pins,
  interactive = true,
  showPickPin = true,
}: Props) {
  const [ready, setReady] = useState(false);
  const Mapbox = MapboxModule;

  useEffect(() => {
    if (!Mapbox || !token) return;
    Mapbox.setAccessToken(token);
    setReady(true);
  }, [Mapbox, token]);

  const camCenter = useMemo(
    () => center ?? ([longitude, latitude] as [number, number]),
    [center, latitude, longitude],
  );

  if (!token) {
    return (
      <View style={styles.fallback}>
        <Text style={guideStyles.muted}>
          Set EXPO_PUBLIC_MAPBOX_TOKEN and rebuild the app to enable the map.
        </Text>
        <Text style={guideStyles.body}>
          Current: {latitude.toFixed(5)}, {longitude.toFixed(5)}
        </Text>
      </View>
    );
  }

  if (!Mapbox || !ready) {
    return (
      <View style={styles.fallback}>
        <Text style={guideStyles.muted}>
          Mapbox native module not linked. Run a development build
          (expo run:android) after installing @rnmapbox/maps.
        </Text>
      </View>
    );
  }

  const { MapView, Camera, PointAnnotation, ShapeSource, FillLayer, LineLayer } =
    Mapbox;

  return (
    <MapView
      style={StyleSheet.absoluteFill}
      styleURL={Mapbox.StyleURL.Light}
      compassEnabled
      scaleBarEnabled={false}
      onPress={
        interactive
          ? (e) => {
              const coords = e.geometry?.coordinates;
              if (Array.isArray(coords) && coords.length >= 2) {
                onPick(Number(coords[1]), Number(coords[0]));
              }
            }
          : undefined
      }
    >
      <Camera
        zoomLevel={zoomLevel}
        centerCoordinate={camCenter}
        animationMode="none"
      />
      {polygon ? (
        <ShapeSource id="zone" shape={polygon}>
          <FillLayer
            id="zone-fill"
            style={{ fillColor: polygonColor, fillOpacity: 0.18 }}
          />
          <LineLayer
            id="zone-line"
            style={{ lineColor: polygonColor, lineWidth: 2.5 }}
          />
        </ShapeSource>
      ) : null}
      {showPickPin ? (
        <PointAnnotation
          id="pick"
          coordinate={[longitude, latitude]}
          title="Selected"
        >
          <View style={styles.pin} />
        </PointAnnotation>
      ) : null}
      {(pins ?? []).map((p) => (
        <PointAnnotation
          key={p.id}
          id={p.id}
          coordinate={[p.longitude, p.latitude]}
          title={p.title}
        >
          <View
            style={[
              styles.pinSmall,
              { backgroundColor: p.color ?? colors.brand },
            ]}
          />
        </PointAnnotation>
      ))}
    </MapView>
  );
}

const styles = StyleSheet.create({
  fallback: {
    flex: 1,
    backgroundColor: colors.brandSoft,
    padding: 16,
    justifyContent: 'center',
    gap: 8,
  },
  pin: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: colors.brand,
    borderWidth: 2,
    borderColor: '#fff',
  },
  pinSmall: {
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#fff',
  },
});
