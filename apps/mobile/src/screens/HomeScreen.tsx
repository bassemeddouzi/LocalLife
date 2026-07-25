import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ScrollView,
  Image,
  RefreshControl,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';
import type { CompositeNavigationProp } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { apiFetch, cacheGet, cacheSet } from '../api/client';
import { useCity } from '../context/CityContext';
import { colors } from '../theme';
import type { MainTabParamList, RootStackParamList } from '../navigation/types';

type Place = {
  id: string;
  name: string;
  summary: string;
  isSponsored?: boolean;
  photos?: Array<{ url: string }>;
  primaryCategory?: { key: string; name: string } | null;
};

type Category = { id: string; key: string; name: string; icon?: string | null };

type Nav = CompositeNavigationProp<
  BottomTabNavigationProp<MainTabParamList, 'HomeTab'>,
  NativeStackNavigationProp<RootStackParamList>
>;

export function HomeScreen() {
  const { t } = useTranslation();
  const { city, error, reload } = useCity();
  const navigation = useNavigation<Nav>();
  const [places, setPlaces] = useState<Place[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    if (!city) return;
    const cacheKey = `home:${city.id}`;
    const cached = await cacheGet<{ places: Place[]; categories: Category[] }>(
      cacheKey,
    );
    if (cached) {
      setPlaces(cached.places);
      setCategories(cached.categories);
    }

    const [placesRes, cats] = await Promise.all([
      apiFetch<{ data: Place[] }>(
        `/v1/places?cityId=${city.id}&pageSize=8`,
        { auth: false },
      ),
      apiFetch<Category[]>('/v1/categories', { auth: false }),
    ]);
    setPlaces(placesRes.data);
    setCategories(cats.slice(0, 8));
    await cacheSet(cacheKey, {
      places: placesRes.data,
      categories: cats.slice(0, 8),
    });
  }, [city]);

  useEffect(() => {
    void load().catch(() => undefined);
  }, [load]);

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await reload();
      await load();
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <Text style={styles.h1}>LocalLife</Text>
      <Text style={styles.sub}>
        {city ? `${city.name}` : t('loading')}
        {city?.contentPackVersion
          ? ` · ${city.contentPackVersion}`
          : ''}
      </Text>
      {error ? <Text style={styles.err}>{error}</Text> : null}

      <Pressable
        style={styles.heroBtn}
        onPress={() => navigation.navigate('ChatTab')}
      >
        <Text style={styles.heroTitle}>{t('askAi')}</Text>
        <Text style={styles.heroSub}>{t('welcomeSub')}</Text>
      </Pressable>

      <Pressable
        style={styles.arrival}
        onPress={() =>
          navigation.navigate('ChatTab', {
            preset: t('arrivalCta'),
          })
        }
      >
        <Text style={styles.arrivalText}>{t('arrivalCta')}</Text>
      </Pressable>

      <Text style={styles.section}>{t('categories')}</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={styles.chips}>
          {categories.map((c) => (
            <Pressable
              key={c.id}
              style={styles.chip}
              onPress={() =>
                navigation.navigate('ExploreTab', { categoryId: c.id })
              }
            >
              <Text style={styles.chipText}>{c.name}</Text>
            </Pressable>
          ))}
        </View>
      </ScrollView>

      <View style={styles.rowBetween}>
        <Text style={styles.section}>{t('nearby')}</Text>
        <Pressable onPress={() => navigation.navigate('ExploreTab', {})}>
          <Text style={styles.link}>{t('seeAll')}</Text>
        </Pressable>
      </View>

      {places.map((p) => (
        <Pressable
          key={p.id}
          style={styles.card}
          onPress={() => navigation.navigate('PlaceDetail', { placeId: p.id })}
        >
          {p.photos?.[0]?.url ? (
            <Image source={{ uri: p.photos[0].url }} style={styles.thumb} />
          ) : (
            <View style={[styles.thumb, styles.thumbFallback]} />
          )}
          <View style={{ flex: 1 }}>
            <Text style={styles.cardTitle}>{p.name}</Text>
            <Text style={styles.cardSub} numberOfLines={2}>
              {p.summary}
            </Text>
            {p.isSponsored ? (
              <Text style={styles.sponsored}>{t('sponsored')}</Text>
            ) : null}
          </View>
        </Pressable>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { padding: 20, gap: 12, paddingBottom: 40 },
  h1: { fontSize: 30, fontWeight: '800', color: colors.brandDark },
  sub: { color: colors.muted, marginBottom: 4 },
  err: { color: colors.danger },
  heroBtn: {
    backgroundColor: colors.brand,
    borderRadius: 16,
    padding: 18,
    gap: 6,
  },
  heroTitle: { color: '#fff', fontSize: 20, fontWeight: '800' },
  heroSub: { color: '#ecfeff' },
  arrival: {
    backgroundColor: colors.chip,
    borderRadius: 12,
    padding: 14,
  },
  arrivalText: { color: colors.brandDark, fontWeight: '700' },
  section: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.ink,
    marginTop: 8,
  },
  chips: { flexDirection: 'row', gap: 8, paddingVertical: 4 },
  chip: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  chipText: { fontWeight: '600', color: colors.ink },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  link: { color: colors.brand, fontWeight: '600' },
  card: {
    flexDirection: 'row',
    gap: 12,
    backgroundColor: colors.card,
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  thumb: { width: 72, height: 72, borderRadius: 10 },
  thumbFallback: { backgroundColor: colors.border },
  cardTitle: { fontWeight: '700', color: colors.ink },
  cardSub: { color: colors.muted, marginTop: 4 },
  sponsored: { marginTop: 4, color: colors.brand, fontSize: 12 },
});
