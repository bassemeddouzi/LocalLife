import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  Image,
  Linking,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import { apiFetch } from '../api/client';
import { colors } from '../theme';
import type { RootStackParamList } from '../navigation/types';

type PlaceDetail = {
  id: string;
  name: string;
  summary: string;
  description?: string | null;
  latitude: number;
  longitude: number;
  addressText?: string | null;
  phone?: string | null;
  isSponsored?: boolean;
  photos?: Array<{ url: string; caption?: string | null }>;
  hours?: Array<{
    dayOfWeek: number;
    opensAt?: string | null;
    closesAt?: string | null;
    isClosed: boolean;
  }>;
  primaryCategory?: { name: string } | null;
};

export function PlaceDetailScreen() {
  const { t } = useTranslation();
  const route = useRoute<RouteProp<RootStackParamList, 'PlaceDetail'>>();
  const [place, setPlace] = useState<PlaceDetail | null>(null);
  const [reviews, setReviews] = useState<
    Array<{ id: string; rating: number; body?: string | null }>
  >([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void (async () => {
      try {
        const [p, r] = await Promise.all([
          apiFetch<PlaceDetail>(`/v1/places/${route.params.placeId}`, {
            auth: false,
          }),
          apiFetch<{ data: Array<{ id: string; rating: number; body?: string | null }> }>(
            `/v1/places/${route.params.placeId}/reviews`,
            { auth: false },
          ),
        ]);
        setPlace(p);
        setReviews(r.data);
      } catch (e) {
        Alert.alert(t('error'), e instanceof Error ? e.message : String(e));
      } finally {
        setLoading(false);
      }
    })();
  }, [route.params.placeId, t]);

  const save = async () => {
    try {
      await apiFetch('/v1/favorites', {
        method: 'POST',
        body: JSON.stringify({
          targetType: 'PLACE',
          targetId: route.params.placeId,
        }),
      });
      Alert.alert(t('savedOk'));
    } catch (e) {
      Alert.alert(t('error'), e instanceof Error ? e.message : String(e));
    }
  };

  const openMaps = async () => {
    if (!place) return;
    const url = `https://www.google.com/maps/search/?api=1&query=${place.latitude},${place.longitude}`;
    await Linking.openURL(url);
  };

  if (loading || !place) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.brand} />
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.content}>
      {place.photos?.[0]?.url ? (
        <Image source={{ uri: place.photos[0].url }} style={styles.hero} />
      ) : null}
      <Text style={styles.title}>{place.name}</Text>
      {place.isSponsored ? (
        <Text style={styles.sponsored}>{t('sponsored')}</Text>
      ) : null}
      <Text style={styles.summary}>{place.summary}</Text>
      {place.description ? (
        <Text style={styles.body}>{place.description}</Text>
      ) : null}
      {place.addressText ? (
        <Text style={styles.meta}>{place.addressText}</Text>
      ) : null}
      {place.phone ? <Text style={styles.meta}>{place.phone}</Text> : null}

      <View style={styles.actions}>
        <Pressable style={styles.btn} onPress={openMaps}>
          <Text style={styles.btnText}>{t('openMaps')}</Text>
        </Pressable>
        <Pressable style={styles.btnSecondary} onPress={save}>
          <Text style={styles.btnSecondaryText}>{t('save')}</Text>
        </Pressable>
      </View>

      <Text style={styles.section}>{t('reviews')}</Text>
      {reviews.length === 0 ? (
        <Text style={styles.meta}>{t('empty')}</Text>
      ) : (
        reviews.map((r) => (
          <View key={r.id} style={styles.review}>
            <Text style={styles.rating}>★ {r.rating}</Text>
            <Text style={styles.meta}>{r.body}</Text>
          </View>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  content: { padding: 20, gap: 10, backgroundColor: colors.bg },
  hero: { width: '100%', height: 180, borderRadius: 14 },
  title: { fontSize: 24, fontWeight: '800', color: colors.ink },
  sponsored: { color: colors.brand, fontWeight: '700' },
  summary: { color: colors.ink, fontSize: 16 },
  body: { color: colors.muted },
  meta: { color: colors.muted },
  actions: { flexDirection: 'row', gap: 10, marginTop: 8 },
  btn: {
    flex: 1,
    backgroundColor: colors.brand,
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  btnText: { color: '#fff', fontWeight: '700' },
  btnSecondary: {
    flex: 1,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.brand,
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  btnSecondaryText: { color: colors.brand, fontWeight: '700' },
  section: { marginTop: 16, fontWeight: '800', fontSize: 18, color: colors.ink },
  review: {
    backgroundColor: colors.card,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  rating: { fontWeight: '700', color: colors.ink },
});
