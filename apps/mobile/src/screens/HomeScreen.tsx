import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ScrollView,
  Image,
  RefreshControl,
  Alert,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';
import type { CompositeNavigationProp } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { apiFetch, cacheGet, cacheSet } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useCity } from '../context/CityContext';
import {
  defaultEmergencyContacts,
  loadActivePlan,
  saveActivePlan,
  type EmergencyContacts,
} from '../offline/planCache';
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

type Favorite = { id: string; targetType: string; targetId: string };

type PlanPack = {
  id: string;
  title: string;
  summary?: string | null;
  code: string;
};

type PlanStep = {
  id: string;
  sortOrder: number;
  freeText?: string | null;
  placeId?: string | null;
  transportNote?: string | null;
  status?: string;
};

type ClientPlan = {
  id: string;
  title: string;
  status: string;
  tripStartsOn?: string | null;
  steps?: PlanStep[];
  offlinePayloadJson?: {
    trackingEnabled?: boolean;
    confirmed?: boolean;
  } | null;
};

type Nav = CompositeNavigationProp<
  BottomTabNavigationProp<MainTabParamList, 'HomeTab'>,
  NativeStackNavigationProp<RootStackParamList>
>;

export function HomeScreen() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { city, error, reload, locationGranted } = useCity();
  const navigation = useNavigation<Nav>();
  const [places, setPlaces] = useState<Place[]>([]);
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [packs, setPacks] = useState<PlanPack[]>([]);
  const [plans, setPlans] = useState<ClientPlan[]>([]);
  const [emergency, setEmergency] = useState<EmergencyContacts>(
    defaultEmergencyContacts(),
  );
  const [refreshing, setRefreshing] = useState(false);
  const [likeBusy, setLikeBusy] = useState<string | null>(null);

  const cacheActiveIfNeeded = useCallback(
    async (list: ClientPlan[]) => {
      if (!user?.id) return;
      const active = list.find((p) => p.status === 'ACTIVE');
      if (!active) return;
      const contacts = defaultEmergencyContacts();
      await saveActivePlan(user.id, active, contacts);
      setEmergency(contacts);
    },
    [user?.id],
  );

  const load = useCallback(async () => {
    if (!city) return;
    const cacheKey = `home:${city.id}`;
    const cached = await cacheGet<{ places: Place[] }>(cacheKey);
    if (cached) setPlaces(cached.places);

    try {
      let coords: { lat: number; lng: number } | null = null;
      if (locationGranted) {
        try {
          const last = await Location.getLastKnownPositionAsync();
          if (last) {
            coords = { lat: last.coords.latitude, lng: last.coords.longitude };
          }
        } catch {
          coords = null;
        }
      }
      const qs = new URLSearchParams({
        cityId: city.id,
        pageSize: '8',
        ...(coords
          ? { lat: String(coords.lat), lng: String(coords.lng) }
          : {}),
      });
      const [placesRes, packsRes, favsRes] = await Promise.all([
        apiFetch<{ data: Place[] }>(`/v1/places?${qs.toString()}`, {
          auth: false,
        }),
        apiFetch<PlanPack[]>(`/v1/me/plan-packs?cityId=${city.id}`).catch(
          () => [] as PlanPack[],
        ),
        apiFetch<Favorite[]>('/v1/me/favorites').catch(() => [] as Favorite[]),
      ]);
      setPlaces(placesRes.data);
      setPacks(packsRes);
      setFavorites(favsRes);
      await cacheSet(cacheKey, { places: placesRes.data });
    } catch {
      /* keep home place cache */
    }

    try {
      let plansRes = await apiFetch<ClientPlan[]>('/v1/me/plans');
      const today = new Date().toISOString().slice(0, 10);
      const due = plansRes.find((p) => {
        if (p.status === 'ACTIVE') return false;
        const payload = p.offlinePayloadJson;
        if (!payload?.trackingEnabled) return false;
        if (!p.tripStartsOn) return true;
        return p.tripStartsOn.slice(0, 10) <= today;
      });
      if (due) {
        try {
          await apiFetch(`/v1/me/plans/${due.id}/activate`, {
            method: 'POST',
          });
          plansRes = await apiFetch<ClientPlan[]>('/v1/me/plans');
        } catch {
          /* ignore activate race */
        }
      }
      setPlans(plansRes);
      await cacheActiveIfNeeded(plansRes);
    } catch {
      if (user?.id) {
        const offline = await loadActivePlan(user.id);
        if (offline?.plan) {
          setPlans([offline.plan as ClientPlan]);
          if (offline.emergency) setEmergency(offline.emergency);
        }
      }
    }
  }, [city, user?.id, cacheActiveIfNeeded, locationGranted]);

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

  const toggleLike = async (place: Place) => {
    const existing = favorites.find(
      (f) => f.targetType === 'PLACE' && f.targetId === place.id,
    );
    setLikeBusy(place.id);
    try {
      if (existing) {
        await apiFetch(`/v1/favorites/${existing.id}`, { method: 'DELETE' });
        setFavorites((prev) => prev.filter((f) => f.id !== existing.id));
      } else {
        const created = await apiFetch<Favorite>('/v1/favorites', {
          method: 'POST',
          body: JSON.stringify({ targetType: 'PLACE', targetId: place.id }),
        });
        setFavorites((prev) => [...prev, created]);
      }
    } catch (e) {
      Alert.alert(t('error'), e instanceof Error ? e.message : String(e));
    } finally {
      setLikeBusy(null);
    }
  };

  const activePlan = plans.find((p) => p.status === 'ACTIVE');

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {city ? <Text style={styles.citySub}>{city.name}</Text> : null}
      {error ? <Text style={styles.err}>{error}</Text> : null}

      {activePlan ? (
        <Pressable
          style={styles.activeCard}
          onPress={() =>
            navigation.navigate('PlanTimeline', { planId: activePlan.id })
          }
        >
          <View style={styles.activeBadgeRow}>
            <Ionicons name="navigate" size={14} color="#fff" />
            <Text style={styles.activeBadgeText}>{t('activePlan')}</Text>
          </View>
          <Text style={styles.activeTitle} numberOfLines={1}>
            {activePlan.title}
          </Text>
          <View style={styles.rowBetween}>
            <Text style={styles.activeSub}>
              {activePlan.steps?.length
                ? `${activePlan.steps.length} ${t('steps')}`
                : t('planStepGeneric')}
            </Text>
            <Text style={styles.activeContinue}>{t('openPlan')} →</Text>
          </View>
        </Pressable>
      ) : null}

      {packs.length > 0 ? (
        <View style={styles.sectionBlock}>
          <Text style={styles.section}>{t('forYou')}</Text>
          {packs.map((pack) => (
            <Pressable
              key={pack.id}
              style={styles.packCard}
              onPress={() =>
                navigation.navigate('PlanTimeline', { packId: pack.id })
              }
            >
              <View style={{ flex: 1 }}>
                <Text style={styles.cardTitle}>{pack.title}</Text>
                {pack.summary ? (
                  <Text style={styles.cardSub} numberOfLines={2}>
                    {pack.summary}
                  </Text>
                ) : null}
              </View>
              <View style={styles.smallBtn}>
                <Text style={styles.smallBtnText}>{t('openPlan')}</Text>
              </View>
            </Pressable>
          ))}
        </View>
      ) : null}

      <View style={styles.sectionBlock}>
        <View style={styles.rowBetween}>
          <Text style={styles.section}>{t('likedNearYou')}</Text>
          <Pressable onPress={() => navigation.navigate('Search', {})}>
            <Text style={styles.link}>{t('seeAll')}</Text>
          </Pressable>
        </View>
        {places.map((p) => {
          const liked = favorites.some(
            (f) => f.targetType === 'PLACE' && f.targetId === p.id,
          );
          return (
            <Pressable
              key={p.id}
              style={styles.card}
              onPress={() =>
                navigation.navigate('PlaceDetail', { placeId: p.id })
              }
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
              <Pressable
                hitSlop={10}
                disabled={likeBusy === p.id}
                style={styles.likeBtn}
                onPress={(e) => {
                  e.stopPropagation?.();
                  void toggleLike(p);
                }}
                accessibilityRole="button"
                accessibilityLabel={liked ? t('unlike') : t('like')}
              >
                <Ionicons
                  name={liked ? 'heart' : 'heart-outline'}
                  size={20}
                  color={liked ? colors.danger : colors.muted}
                />
              </Pressable>
            </Pressable>
          );
        })}
      </View>

      <View style={styles.emergency}>
        <Text style={styles.emergencyTitle}>{t('emergencyStrip')}</Text>
        <Text style={styles.emergencyText}>
          {t('emergencyPoliceNum', { num: emergency.police })} ·{' '}
          {t('emergencyHospitalNum', { num: emergency.hospital })}
          {emergency.fire
            ? ` · ${t('emergencyFireNum', { num: emergency.fire })}`
            : ''}
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { padding: 20, gap: 14, paddingBottom: 40 },
  citySub: { color: colors.muted, fontWeight: '600' },
  err: { color: colors.danger },
  sectionBlock: { gap: 10 },
  section: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.ink,
  },
  activeCard: {
    backgroundColor: colors.brandDark,
    borderRadius: 16,
    padding: 16,
    gap: 6,
  },
  activeBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  activeBadgeText: { color: '#fff', fontSize: 11, fontWeight: '800' },
  activeTitle: { color: '#fff', fontSize: 18, fontWeight: '800' },
  activeSub: { color: 'rgba(255,255,255,0.8)' },
  activeContinue: { color: '#fff', fontWeight: '700' },
  packCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.card,
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  smallBtn: {
    backgroundColor: colors.brand,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  smallBtnText: { color: '#fff', fontWeight: '700', fontSize: 12 },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  link: { color: colors.brand, fontWeight: '600' },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.card,
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  thumb: { width: 64, height: 64, borderRadius: 10 },
  thumbFallback: { backgroundColor: colors.border },
  cardTitle: { fontWeight: '700', color: colors.ink },
  cardSub: { color: colors.muted, marginTop: 4 },
  sponsored: { marginTop: 4, color: colors.brand, fontSize: 12 },
  likeBtn: {
    width: 34,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emergency: {
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fecaca',
    borderRadius: 12,
    padding: 12,
    gap: 4,
  },
  emergencyTitle: { fontWeight: '800', color: colors.danger, fontSize: 13 },
  emergencyText: { color: colors.ink, fontWeight: '600', fontSize: 13 },
});
