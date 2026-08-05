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
import { useNavigation, useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { apiFetch } from '../api/client';
import { useCity } from '../context/CityContext';
import { ClientRatingForm } from '../components/ClientRatingForm';
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
  const { city } = useCity();
  const route = useRoute<RouteProp<RootStackParamList, 'PlaceDetail'>>();
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [place, setPlace] = useState<PlaceDetail | null>(null);
  const [reviews, setReviews] = useState<
    Array<{ id: string; rating: number; body?: string | null; user?: { displayName?: string } }>
  >([]);
  const [avg, setAvg] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  const loadReviews = async () => {
    const r = await apiFetch<{
      data: Array<{
        id: string;
        rating: number;
        body?: string | null;
        user?: { displayName?: string };
      }>;
      summary?: { average: number | null; count: number };
    }>(`/v1/places/${route.params.placeId}/reviews`, { auth: false });
    setReviews(r.data);
    setAvg(r.summary?.average ?? null);
  };

  useEffect(() => {
    void (async () => {
      try {
        const p = await apiFetch<PlaceDetail>(
          `/v1/places/${route.params.placeId}`,
          { auth: false },
        );
        setPlace(p);
        await loadReviews();
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

  const reportPlace = async () => {
    try {
      await apiFetch('/v1/reports', {
        method: 'POST',
        body: JSON.stringify({
          targetType: 'PLACE',
          targetId: route.params.placeId,
          reason: 'inaccurate info',
        }),
      });
      Alert.alert(t('reportPlaceOk'));
    } catch (e) {
      Alert.alert(t('error'), e instanceof Error ? e.message : String(e));
    }
  };

  const askAbout = () => {
    if (!place) return;
    navigation.navigate('Tabs', {
      screen: 'ChatTab',
      params: {
        mode: 'info',
        placeId: place.id,
        placeName: place.name,
        preset: t('askAboutPlacePreset', { name: place.name }),
      },
    });
  };

  const addToPlan = async () => {
    if (!place) return;
    try {
      await apiFetch('/v1/me/plans', {
        method: 'POST',
        body: JSON.stringify({
          title: place.name,
          cityId: city?.id,
          source: 'MANUAL',
          steps: [
            {
              placeId: place.id,
              freeText: place.summary?.slice(0, 500) || place.name,
              sortOrder: 0,
            },
          ],
        }),
      });
      Alert.alert(t('planCreated'));
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

      <View style={styles.actions}>
        <Pressable style={styles.btnSecondary} onPress={askAbout}>
          <Text style={styles.btnSecondaryText}>{t('askAboutPlace')}</Text>
        </Pressable>
        <Pressable style={styles.btnSecondary} onPress={() => void addToPlan()}>
          <Text style={styles.btnSecondaryText}>{t('addToPlan')}</Text>
        </Pressable>
      </View>

      <Pressable style={styles.reportBtn} onPress={() => void reportPlace()}>
        <Text style={styles.reportText}>{t('reportPlace')}</Text>
      </Pressable>

      <Text style={styles.section}>{t('reviews')}</Text>
      {avg != null ? (
        <Text style={styles.meta}>
          ★ {avg} · {reviews.length} {t('reviews')}
        </Text>
      ) : null}
      <ClientRatingForm
        targetType="PLACE"
        targetId={route.params.placeId}
        onSaved={() => void loadReviews()}
      />
      {reviews.length === 0 ? (
        <Text style={styles.meta}>{t('noRatingsYet')}</Text>
      ) : (
        reviews.map((r) => (
          <View key={r.id} style={styles.review}>
            <Text style={styles.rating}>
              ★ {r.rating}
              {r.user?.displayName ? ` · ${r.user.displayName}` : ''}
            </Text>
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
  btnSecondaryText: { color: colors.brand, fontWeight: '700', textAlign: 'center' },
  reportBtn: { alignSelf: 'flex-start', paddingVertical: 4 },
  reportText: { color: colors.danger, fontWeight: '600' },
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
