import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  Image,
  ActivityIndicator,
  Alert,
  Modal,
  TextInput,
  Switch,
} from 'react-native';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { apiFetch } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useCity } from '../context/CityContext';
import { colors } from '../theme';
import { BottomSheet } from '../components/BottomSheet';
import type { RootStackParamList } from '../navigation/types';

export type PlanStepPlace = {
  id: string;
  name: string;
  summary: string;
  latitude?: number | string | null;
  longitude?: number | string | null;
  photos?: Array<{ url: string }>;
  primaryCategory?: { key: string; name: string } | null;
};

export type LegInfo = {
  mode?: string;
  name?: string;
  estMinutes?: number;
  estCostMin?: number;
  estCostMax?: number;
  distanceKm?: number;
  currency?: string;
  systemId?: string;
};

export type PlanStepView = {
  id: string;
  sortOrder: number;
  dayIndex?: number;
  startsAt?: string | null;
  freeText?: string | null;
  transportNote?: string | null;
  durationMin?: number | null;
  placeId?: string | null;
  kind?: string | null;
  status?: string;
  whyJson?: {
    reason?: string;
    kind?: string;
    leg?: LegInfo | null;
    isReturnHome?: boolean;
    weatherLabel?: string;
    dayIndex?: number;
  } | null;
  place?: PlanStepPlace | null;
};

type PlanView = {
  id?: string;
  title: string;
  summary?: string | null;
  status?: string;
  tripStartsOn?: string | null;
  tripEndsOn?: string | null;
  dailyStartLocal?: string | null;
  dailyEndLocal?: string | null;
  cityId?: string | null;
  steps: PlanStepView[];
  offlinePayloadJson?: Record<string, unknown> | null;
};

type TransportOption = {
  systemId: string;
  mode: string;
  name: string;
  estMinutes: number;
  estCostMin: number;
  estCostMax: number;
  currency: string;
  recommended?: boolean;
  reason?: string;
};

type LegResponse = {
  distanceKm: number;
  toLabel: string;
  toLat: number;
  toLng: number;
  options: TransportOption[];
  recommended: TransportOption | null;
};

type Nav = NativeStackNavigationProp<RootStackParamList, 'PlanTimeline'>;

type ContextField = 'groupType' | 'mood' | 'budgetBand';

const FALLBACK_LAT = 33.875;
const FALLBACK_LNG = 10.857;

const GROUP_OPTS = ['SOLO', 'COUPLE', 'FRIENDS', 'FAMILY_KIDS'] as const;
const MOOD_OPTS = ['CALM', 'ADVENTURE', 'CLASSY'] as const;
const BUDGET_OPTS = ['LOW', 'MEDIUM', 'HIGH'] as const;

const CONTEXT_FIELDS: Record<
  ContextField,
  { titleKey: string; prefix: string; options: readonly string[] }
> = {
  groupType: { titleKey: 'planBriefGroup', prefix: 'group', options: GROUP_OPTS },
  mood: { titleKey: 'planBriefMood', prefix: 'mood', options: MOOD_OPTS },
  budgetBand: { titleKey: 'planBriefBudget', prefix: 'budget', options: BUDGET_OPTS },
};

function stepKind(step: PlanStepView): string {
  if (step.whyJson?.isReturnHome || step.kind === 'RETURN') return 'RETURN';
  if (step.kind) return step.kind;
  if (step.whyJson?.kind) return String(step.whyJson.kind);
  return 'PLACE';
}

function kindIcon(
  kind: string,
): React.ComponentProps<typeof Ionicons>['name'] {
  if (kind === 'RETURN') return 'home-outline';
  if (kind === 'FOOD' || kind === 'RESTAURANT') return 'restaurant-outline';
  if (kind === 'BEACH') return 'sunny-outline';
  if (kind === 'MUSEUM' || kind === 'CULTURE') return 'business-outline';
  if (kind === 'TRANSPORT') return 'bus-outline';
  return 'location-outline';
}

function transportIcon(
  mode?: string,
): React.ComponentProps<typeof Ionicons>['name'] {
  switch (mode) {
    case 'WALK':
      return 'walk-outline';
    case 'BIKE':
    case 'SCOOTER':
      return 'bicycle-outline';
    case 'TAXI':
    case 'RIDE_HAILING':
    case 'SHARED_TAXI':
      return 'car-outline';
    case 'BUS':
    case 'AIRPORT_SHUTTLE':
      return 'bus-outline';
    case 'CAR_RENTAL':
      return 'car-sport-outline';
    case 'FERRY':
    case 'BOAT':
      return 'boat-outline';
    default:
      return 'navigate-outline';
  }
}

function toNum(v: unknown): number | null {
  if (v == null) return null;
  const n = typeof v === 'number' ? v : Number(v);
  return Number.isFinite(n) ? n : null;
}

export function PlanTimelineScreen() {
  const { t } = useTranslation();
  const { city } = useCity();
  const { refreshMe } = useAuth();
  const route = useRoute<RouteProp<RootStackParamList, 'PlanTimeline'>>();
  const navigation = useNavigation<Nav>();

  const [plan, setPlan] = useState<PlanView | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [askTransport, setAskTransport] = useState(false);
  const [legPicker, setLegPicker] = useState<{
    index: number;
    options: TransportOption[];
  } | null>(null);
  const [tripContext, setTripContext] = useState<Record<string, unknown> | null>(
    null,
  );
  const [pickerField, setPickerField] = useState<ContextField | null>(null);
  const [weatherByDate, setWeatherByDate] = useState<
    Record<string, { label: string; tempMaxC: number }>
  >({});

  const [showConfirmSheet, setShowConfirmSheet] = useState(false);
  const [enableTracking, setEnableTracking] = useState(true);
  const [confirmBusy, setConfirmBusy] = useState(false);

  const [replaceIndex, setReplaceIndex] = useState<number | null>(null);
  const [replaceQuery, setReplaceQuery] = useState('');
  const [replaceResults, setReplaceResults] = useState<PlanStepPlace[]>([]);
  const [replaceBusy, setReplaceBusy] = useState(false);

  const loadTripContext = useCallback(async () => {
    try {
      const res = await apiFetch<{ effective: Record<string, unknown> }>(
        `/v1/me/plans/session-context?planId=${route.params?.planId ?? ''}`,
      );
      setTripContext(res.effective ?? null);
    } catch {
      setTripContext(null);
    }
  }, [route.params?.planId]);

  useEffect(() => {
    void loadTripContext();
  }, [loadTripContext]);

  useEffect(() => {
    if (!plan) return;
    const payload = plan.offlinePayloadJson as
      | { trackingEnabled?: boolean }
      | null
      | undefined;
    if (typeof payload?.trackingEnabled === 'boolean') {
      setEnableTracking(payload.trackingEnabled);
    }
  }, [plan]);

  const getGps = useCallback(async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== Location.PermissionStatus.GRANTED) {
        return { lat: FALLBACK_LAT, lng: FALLBACK_LNG, approx: true };
      }
      const pos = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      return {
        lat: pos.coords.latitude,
        lng: pos.coords.longitude,
        approx: false,
      };
    } catch {
      return { lat: FALLBACK_LAT, lng: FALLBACK_LNG, approx: true };
    }
  }, []);

  const fetchLeg = useCallback(
    async (
      fromLat: number,
      fromLng: number,
      toPlaceId: string | null | undefined,
      toLat: number | null,
      toLng: number | null,
      hasPrivate: boolean,
    ) => {
      if (!city?.id) return null;
      const body: Record<string, unknown> = {
        cityId: city.id,
        fromLat,
        fromLng,
        hasPrivateTransport: hasPrivate,
      };
      if (toPlaceId) body.toPlaceId = toPlaceId;
      else if (toLat != null && toLng != null) {
        body.toLat = toLat;
        body.toLng = toLng;
      } else return null;
      return apiFetch<LegResponse>('/v1/me/plans/leg-options', {
        method: 'POST',
        body: JSON.stringify(body),
      });
    },
    [city?.id],
  );

  const attachLegs = useCallback(
    async (
      steps: PlanStepView[],
      origin: { lat: number; lng: number },
      hasPrivate: boolean,
      home: { lat: number; lng: number },
    ) => {
      let lat = origin.lat;
      let lng = origin.lng;
      const built: PlanStepView[] = [];
      const stationSteps = steps.filter(
        (s) => stepKind(s) !== 'RETURN' && !s.whyJson?.isReturnHome,
      );

      for (let i = 0; i < stationSteps.length; i++) {
        const step = stationSteps[i];
        const placeLat = toNum(step.place?.latitude);
        const placeLng = toNum(step.place?.longitude);
        const legRes = await fetchLeg(
          lat,
          lng,
          step.placeId,
          placeLat,
          placeLng,
          hasPrivate,
        );
        const rec = legRes?.recommended;
        const leg: LegInfo | null = rec
          ? {
              mode: rec.mode,
              name: rec.name,
              estMinutes: rec.estMinutes,
              estCostMin: rec.estCostMin,
              estCostMax: rec.estCostMax,
              distanceKm: legRes?.distanceKm,
              currency: rec.currency,
              systemId: rec.systemId,
            }
          : null;
        if (legRes) {
          lat = legRes.toLat;
          lng = legRes.toLng;
        } else if (placeLat != null && placeLng != null) {
          lat = placeLat;
          lng = placeLng;
        }
        built.push({
          ...step,
          id: step.id?.startsWith('pack-') ? `step-${i}` : step.id,
          sortOrder: i,
          transportNote: leg
            ? `${leg.name} · ~${leg.estMinutes} min · ${leg.estCostMin}–${leg.estCostMax} ${leg.currency ?? 'TND'}`
            : step.transportNote,
          whyJson: {
            ...(typeof step.whyJson === 'object' && step.whyJson
              ? step.whyJson
              : {}),
            kind: step.kind ?? step.whyJson?.kind ?? 'PLACE',
            leg,
          },
        });
      }

      const back = await fetchLeg(lat, lng, null, home.lat, home.lng, hasPrivate);
      const backLeg = back?.recommended
        ? {
            mode: back.recommended.mode,
            name: back.recommended.name,
            estMinutes: back.recommended.estMinutes,
            estCostMin: back.recommended.estCostMin,
            estCostMax: back.recommended.estCostMax,
            distanceKm: back.distanceKm,
            currency: back.recommended.currency,
            systemId: back.recommended.systemId,
          }
        : null;
      built.push({
        id: `return-${Date.now()}`,
        sortOrder: built.length,
        freeText: t('returnHomeStep'),
        durationMin: 0,
        kind: 'RETURN',
        transportNote: backLeg
          ? `${backLeg.name} · ~${backLeg.estMinutes} min · ${backLeg.estCostMin}–${backLeg.estCostMax} ${backLeg.currency ?? 'TND'}`
          : t('returnHomeHint'),
        whyJson: { kind: 'RETURN', isReturnHome: true, leg: backLeg },
        place: null,
        placeId: null,
      });
      return built;
    },
    [fetchLeg, t],
  );

  const persistSteps = useCallback(
    async (planId: string, steps: PlanStepView[], payload?: Record<string, unknown>) => {
      const body = {
        steps: steps.map((s, i) => ({
          sortOrder: i,
          placeId: s.placeId || undefined,
          freeText: s.freeText || undefined,
          durationMin: s.durationMin ?? undefined,
          transportNote: s.transportNote || undefined,
          whyJson: s.whyJson ?? undefined,
        })),
        offlinePayloadJson: payload,
      };
      return apiFetch<PlanView>(`/v1/me/plans/${planId}/steps`, {
        method: 'PUT',
        body: JSON.stringify(body),
      });
    },
    [],
  );

  const buildFromPack = useCallback(
    async (hasPrivate: boolean) => {
      if (!route.params.packId || !city?.id) return;
      setBusy(true);
      try {
        await apiFetch('/v1/auth/me/preferences', {
          method: 'PATCH',
          body: JSON.stringify({ hasVehicle: hasPrivate }),
        });
        await refreshMe();
        const pack = await apiFetch<PlanView>(
          `/v1/me/plan-packs/${route.params.packId}`,
        );
        const gps = await getGps();
        const withLegs = await attachLegs(
          pack.steps ?? [],
          gps,
          hasPrivate,
          { lat: gps.lat, lng: gps.lng },
        );
        const created = await apiFetch<PlanView & { id: string }>('/v1/me/plans', {
          method: 'POST',
          body: JSON.stringify({
            title: pack.title,
            cityId: city.id,
            source: 'PACK',
            planPackId: route.params.packId,
            steps: withLegs.map((s, i) => ({
              sortOrder: i,
              placeId: s.placeId || undefined,
              freeText: s.freeText || undefined,
              durationMin: s.durationMin ?? undefined,
              transportNote: s.transportNote || undefined,
              whyJson: s.whyJson ?? undefined,
            })),
            offlinePayloadJson: {
              hasPrivateTransport: hasPrivate,
              origin: gps,
              gpsApprox: gps.approx,
            },
          }),
        });
        await apiFetch(`/v1/me/plans/${created.id}/activate`, {
          method: 'POST',
        });
        setAskTransport(false);
        navigation.replace('PlanTimeline', { planId: created.id });
      } catch (e) {
        Alert.alert(t('error'), e instanceof Error ? e.message : String(e));
      } finally {
        setBusy(false);
      }
    },
    [route.params.packId, city?.id, refreshMe, getGps, attachLegs, navigation, t],
  );

  const load = useCallback(async () => {
    setLoading(true);
    try {
      if (route.params.planId) {
        let res = await apiFetch<PlanView>(
          `/v1/me/plans/${route.params.planId}`,
        );
        const payload = res.offlinePayloadJson as
          | { trackingEnabled?: boolean }
          | null
          | undefined;
        if (payload?.trackingEnabled && res.status !== 'ACTIVE') {
          const startsOn = res.tripStartsOn ? new Date(res.tripStartsOn) : null;
          const now = new Date();
          const todayStart = Date.UTC(
            now.getUTCFullYear(),
            now.getUTCMonth(),
            now.getUTCDate(),
          );
          const reached =
            !startsOn ||
            Date.UTC(
              startsOn.getUTCFullYear(),
              startsOn.getUTCMonth(),
              startsOn.getUTCDate(),
            ) <= todayStart;
          if (reached) {
            try {
              res = await apiFetch<PlanView>(
                `/v1/me/plans/${route.params.planId}/activate`,
                { method: 'POST' },
              );
            } catch {
              /* keep unactivated plan if activation fails */
            }
          }
        }
        setPlan(res);
        setAskTransport(false);
        const weatherCityId = res.cityId ?? city?.id;
        if (weatherCityId) {
          try {
            const wx = await apiFetch<{
              daily?: Array<{
                date: string;
                label: string;
                tempMaxC: number;
              }>;
            }>(`/v1/cities/${weatherCityId}/weather?days=14`);
            const map: Record<string, { label: string; tempMaxC: number }> = {};
            for (const d of wx.daily ?? []) {
              map[d.date] = { label: d.label, tempMaxC: d.tempMaxC };
            }
            setWeatherByDate(map);
          } catch {
            setWeatherByDate({});
          }
        }
        return;
      }
      if (route.params.packId) {
        const res = await apiFetch<PlanView>(
          `/v1/me/plan-packs/${route.params.packId}`,
        );
        setPlan(res);
        setAskTransport(true);
      }
    } catch (e) {
      Alert.alert(t('error'), e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, [route.params.planId, route.params.packId, t, city?.id]);

  useEffect(() => {
    void load();
  }, [load]);

  const openLegPicker = async (index: number) => {
    if (!plan || !city?.id) return;
    const step = plan.steps[index];
    const payload = (plan.offlinePayloadJson ?? {}) as {
      hasPrivateTransport?: boolean;
      origin?: { lat: number; lng: number };
    };
    let fromLat = payload.origin?.lat ?? FALLBACK_LAT;
    let fromLng = payload.origin?.lng ?? FALLBACK_LNG;
    if (index > 0) {
      const prev = plan.steps[index - 1];
      fromLat = toNum(prev.place?.latitude) ?? fromLat;
      fromLng = toNum(prev.place?.longitude) ?? fromLng;
    }
    try {
      const isReturn = stepKind(step) === 'RETURN';
      const home = payload.origin ?? { lat: FALLBACK_LAT, lng: FALLBACK_LNG };
      const res = await fetchLeg(
        fromLat,
        fromLng,
        isReturn ? null : step.placeId,
        isReturn ? home.lat : toNum(step.place?.latitude),
        isReturn ? home.lng : toNum(step.place?.longitude),
        Boolean(payload.hasPrivateTransport),
      );
      if (!res?.options?.length) {
        Alert.alert(t('error'), t('noTransportOptions'));
        return;
      }
      setLegPicker({ index, options: res.options });
    } catch (e) {
      Alert.alert(t('error'), e instanceof Error ? e.message : String(e));
    }
  };

  const applyLegOption = async (opt: TransportOption) => {
    if (!plan?.id || !legPicker) return;
    const idx = legPicker.index;
    const steps = [...plan.steps];
    const step = steps[idx];
    const leg: LegInfo = {
      mode: opt.mode,
      name: opt.name,
      estMinutes: opt.estMinutes,
      estCostMin: opt.estCostMin,
      estCostMax: opt.estCostMax,
      currency: opt.currency,
      systemId: opt.systemId,
    };
    steps[idx] = {
      ...step,
      transportNote: `${opt.name} · ~${opt.estMinutes} min · ${opt.estCostMin}–${opt.estCostMax} ${opt.currency}`,
      whyJson: {
        ...(step.whyJson ?? {}),
        leg,
      },
    };
    setLegPicker(null);
    setBusy(true);
    try {
      const saved = await persistSteps(
        plan.id,
        steps,
        plan.offlinePayloadJson ?? undefined,
      );
      setPlan(saved);
    } catch (e) {
      Alert.alert(t('error'), e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };

  const applyContextField = async (field: ContextField, value: string) => {
    setPickerField(null);
    try {
      await apiFetch('/v1/me/plans/session-context', {
        method: 'PATCH',
        body: JSON.stringify({
          planId: plan?.id,
          cityId: city?.id,
          groupType: field === 'groupType' ? value : undefined,
          mood: field === 'mood' ? value : undefined,
          budgetNow: field === 'budgetBand' ? value : undefined,
        }),
      });
      await loadTripContext();
    } catch (e) {
      Alert.alert(t('error'), e instanceof Error ? e.message : String(e));
    }
  };

  const closeReplaceSheet = () => {
    setReplaceIndex(null);
    setReplaceQuery('');
    setReplaceResults([]);
  };

  useEffect(() => {
    if (replaceIndex == null) return;
    const q = replaceQuery.trim();
    if (!q || !city?.id) {
      setReplaceResults([]);
      return;
    }
    setReplaceBusy(true);
    const handle = setTimeout(() => {
      void apiFetch<{ places: PlanStepPlace[] }>(
        `/v1/search?cityId=${city.id}&q=${encodeURIComponent(q)}`,
      )
        .then((res) => setReplaceResults(res.places ?? []))
        .catch(() => setReplaceResults([]))
        .finally(() => setReplaceBusy(false));
    }, 400);
    return () => clearTimeout(handle);
  }, [replaceQuery, replaceIndex, city?.id]);

  const applyReplacePlace = async (place: PlanStepPlace) => {
    if (!plan?.id || replaceIndex == null) return;
    const idx = replaceIndex;
    const steps = plan.steps.map((s, i) =>
      i === idx ? { ...s, placeId: place.id, place, freeText: place.name } : s,
    );
    closeReplaceSheet();
    setBusy(true);
    try {
      const saved = await persistSteps(
        plan.id,
        steps,
        plan.offlinePayloadJson ?? undefined,
      );
      setPlan(saved);
    } catch (e) {
      Alert.alert(t('error'), e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };

  const onLongPressStation = (idx: number, step: PlanStepView) => {
    const name = step.place?.name || step.freeText || t('planStepGeneric');
    Alert.alert(name, undefined, [
      {
        text: t('planStepDetail'),
        onPress: () =>
          navigation.navigate('PlanStepDetail', {
            step,
            planTitle: plan?.title ?? '',
          }),
      },
      {
        text: t('replacePlace'),
        onPress: () => {
          setReplaceIndex(idx);
          setReplaceQuery('');
          setReplaceResults([]);
        },
      },
      { text: t('cancel'), style: 'cancel' },
    ]);
  };

  const confirmPlan = async () => {
    if (!plan?.id) return;
    setConfirmBusy(true);
    try {
      const payload = {
        ...(plan.offlinePayloadJson ?? {}),
        confirmed: true,
        trackingEnabled: enableTracking,
      };
      let saved = await apiFetch<PlanView>(`/v1/me/plans/${plan.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ offlinePayloadJson: payload }),
      });
      let activatedNow = false;
      if (enableTracking && saved.status !== 'ACTIVE') {
        const startsOn = saved.tripStartsOn ? new Date(saved.tripStartsOn) : null;
        const now = new Date();
        const todayStart = Date.UTC(
          now.getUTCFullYear(),
          now.getUTCMonth(),
          now.getUTCDate(),
        );
        const reached =
          !startsOn ||
          Date.UTC(
            startsOn.getUTCFullYear(),
            startsOn.getUTCMonth(),
            startsOn.getUTCDate(),
          ) <= todayStart;
        if (reached) {
          saved = await apiFetch<PlanView>(`/v1/me/plans/${plan.id}/activate`, {
            method: 'POST',
          });
          activatedNow = true;
        }
      }
      setPlan(saved);
      setShowConfirmSheet(false);
      Alert.alert(
        t('planConfirmed'),
        activatedNow ? t('planConfirmedActiveHint') : t('planConfirmedLaterHint'),
      );
    } catch (e) {
      Alert.alert(t('error'), e instanceof Error ? e.message : String(e));
    } finally {
      setConfirmBusy(false);
    }
  };

  const formatClock = (iso?: string | null) => {
    if (!iso) return null;
    const d = new Date(iso);
    if (!Number.isFinite(d.getTime())) return null;
    return d.toISOString().slice(11, 16);
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.brand} />
      </View>
    );
  }

  if (!plan) {
    return (
      <View style={styles.center}>
        <Text style={styles.muted}>{t('empty')}</Text>
      </View>
    );
  }

  const stepsAll = [...(plan.steps ?? [])].sort(
    (a, b) => a.sortOrder - b.sortOrder,
  );
  const dayIndexes = Array.from(
    new Set(stepsAll.map((s) => s.dayIndex ?? 0)),
  ).sort((a, b) => a - b);
  const multiDay = dayIndexes.length > 1;
  const selectedDay =
    typeof route.params.dayIndex === 'number' ? route.params.dayIndex : null;
  const showDayOverview = multiDay && selectedDay == null && Boolean(plan.id);

  const steps = showDayOverview
    ? []
    : selectedDay != null
      ? stepsAll.filter((s) => (s.dayIndex ?? 0) === selectedDay)
      : stepsAll;

  const hasPrivateTransport = Boolean(
    (plan.offlinePayloadJson as { hasPrivateTransport?: boolean } | null)
      ?.hasPrivateTransport,
  );

  const dayDateLabel = (dayIndex: number) => {
    if (plan.tripStartsOn) {
      const d = new Date(plan.tripStartsOn);
      d.setUTCDate(d.getUTCDate() + dayIndex);
      return d.toISOString().slice(0, 10);
    }
    const first = stepsAll.find((s) => (s.dayIndex ?? 0) === dayIndex);
    if (first?.startsAt) return first.startsAt.slice(0, 10);
    return null;
  };

  const startLocal = plan.dailyStartLocal ?? '10:30';
  const endLocal = plan.dailyEndLocal ?? '22:00';
  const showConfirmCta = Boolean(route.params.planId) && Boolean(plan.id);

  return (
    <View style={styles.screen}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        {showDayOverview ? (
          <>
            <Text style={styles.title}>{plan.title}</Text>
            {plan.summary ? (
              <Text style={styles.summary}>{plan.summary}</Text>
            ) : null}
            <Text style={styles.sectionLabel}>{t('planDaysOverview')}</Text>
            {dayIndexes.map((di) => {
              const daySteps = stepsAll.filter(
                (s) => (s.dayIndex ?? 0) === di && stepKind(s) !== 'RETURN',
              );
              const dateKey = dayDateLabel(di);
              const wx = dateKey ? weatherByDate[dateKey] : undefined;
              const preview = daySteps
                .slice(0, 3)
                .map((s) => s.place?.name || s.freeText)
                .filter(Boolean)
                .join(' · ');
              return (
                <Pressable
                  key={`day-${di}`}
                  style={styles.dayCard}
                  onPress={() =>
                    navigation.push('PlanTimeline', {
                      planId: plan.id,
                      dayIndex: di,
                    })
                  }
                >
                  <View style={styles.dayCardTop}>
                    <Text style={styles.dayCardTitle}>
                      {t('planDayCard', { n: di + 1 })}
                      {dateKey ? ` · ${dateKey}` : ''}
                    </Text>
                    {wx ? (
                      <Text style={styles.weatherChip}>
                        {t(`weather_${wx.label}`, { defaultValue: wx.label })} ·{' '}
                        {Math.round(wx.tempMaxC)}°
                      </Text>
                    ) : null}
                  </View>
                  <Text style={styles.dayCardWindow}>
                    {t('planDayWindow', { start: startLocal, end: endLocal })}
                  </Text>
                  {preview ? (
                    <Text style={styles.dayCardPreview} numberOfLines={2}>
                      {preview}
                    </Text>
                  ) : null}
                  <Text style={styles.link}>{t('planOpenDay')}</Text>
                </Pressable>
              );
            })}
          </>
        ) : (
          <>
            <Text style={styles.title}>{plan.title}</Text>
            {plan.summary ? (
              <Text style={styles.summary}>{plan.summary}</Text>
            ) : null}
            {selectedDay != null ? (
              <View style={styles.dayHeader}>
                <Text style={styles.sectionLabel}>
                  {t('planDayCard', { n: selectedDay + 1 })}
                  {dayDateLabel(selectedDay)
                    ? ` · ${dayDateLabel(selectedDay)}`
                    : ''}{' '}
                  ·{' '}
                  {t('planDayWindow', {
                    start: plan.dailyStartLocal ?? '10:30',
                    end: plan.dailyEndLocal ?? '22:00',
                  })}
                </Text>
                {(() => {
                  const dk = dayDateLabel(selectedDay);
                  const wx = dk ? weatherByDate[dk] : undefined;
                  return wx ? (
                    <Text style={styles.weatherChip}>
                      {t(`weather_${wx.label}`, { defaultValue: wx.label })} ·{' '}
                      {Math.round(wx.tempMaxC)}°
                    </Text>
                  ) : null;
                })()}
                {multiDay && plan.id ? (
                  <Pressable
                    onPress={() =>
                      navigation.navigate('PlanTimeline', { planId: plan.id })
                    }
                  >
                    <Text style={styles.link}>{t('planDaysOverview')}</Text>
                  </Pressable>
                ) : null}
              </View>
            ) : null}

            <View style={styles.dropdownRow}>
              {(Object.keys(CONTEXT_FIELDS) as ContextField[]).map((field) => {
                const cfg = CONTEXT_FIELDS[field];
                const value = String(
                  tripContext?.[field] ?? cfg.options[0],
                );
                return (
                  <Pressable
                    key={field}
                    style={styles.dropdownPill}
                    onPress={() => setPickerField(field)}
                  >
                    <Text style={styles.dropdownLabel} numberOfLines={1}>
                      {t(`${cfg.prefix}_${value}`, { defaultValue: value })}
                    </Text>
                    <Ionicons
                      name="chevron-down"
                      size={14}
                      color={colors.brandDark}
                    />
                  </Pressable>
                );
              })}
            </View>

            <View style={styles.vertical}>
              {steps.map((step, idx) => {
                const kind = stepKind(step);
                const leg = step.whyJson?.leg;
                const isReturn = kind === 'RETURN';
                const photoUrl = step.place?.photos?.[0]?.url;
                const clock = formatClock(step.startsAt);
                return (
                  <View key={step.id} style={styles.stationBlock}>
                    {idx > 0 || leg ? (
                      <Pressable
                        style={styles.legCard}
                        onPress={() => void openLegPicker(idx)}
                      >
                        <View style={styles.rail}>
                          <View style={styles.railDot} />
                          <View style={styles.railLine} />
                        </View>
                        <View style={styles.legBody}>
                          <View style={styles.legTitleRow}>
                            <Ionicons
                              name={transportIcon(leg?.mode)}
                              size={16}
                              color={colors.brandDark}
                            />
                            <Text style={styles.legTitle}>
                              {leg?.name ?? t('planStepTransport')}
                            </Text>
                          </View>
                          <Text style={styles.legMeta}>
                            {leg
                              ? [
                                  `~${leg.estMinutes} ${t('minutesShort')}`,
                                  leg.distanceKm != null
                                    ? `${leg.distanceKm} km`
                                    : null,
                                  !hasPrivateTransport
                                    ? `${leg.estCostMin}–${leg.estCostMax} ${leg.currency ?? 'TND'}`
                                    : null,
                                ]
                                  .filter(Boolean)
                                  .join(' · ')
                              : step.transportNote || '—'}
                          </Text>
                        </View>
                      </Pressable>
                    ) : null}

                    <Pressable
                      style={[styles.station, isReturn && styles.stationReturn]}
                      onPress={() =>
                        navigation.navigate('PlanStepDetail', {
                          step,
                          planTitle: plan.title,
                        })
                      }
                      onLongPress={
                        !isReturn && route.params.planId
                          ? () => onLongPressStation(idx, step)
                          : undefined
                      }
                    >
                      {photoUrl ? (
                        <Image
                          source={{ uri: photoUrl }}
                          style={styles.stationPhoto}
                        />
                      ) : null}
                      <View style={styles.stationBody}>
                        <View style={styles.stationTitleRow}>
                          <View
                            style={[styles.badge, isReturn && styles.badgeReturn]}
                          >
                            <Ionicons
                              name={kindIcon(kind)}
                              size={14}
                              color="#fff"
                            />
                          </View>
                          <Text style={styles.stationTitle} numberOfLines={2}>
                            {isReturn
                              ? t('returnHomeStep')
                              : step.place?.name ||
                                step.freeText ||
                                t('planStepGeneric')}
                          </Text>
                        </View>
                        {clock ? (
                          <View style={styles.clockRow}>
                            <Ionicons
                              name="time-outline"
                              size={13}
                              color={colors.muted}
                            />
                            <Text style={styles.duration}>
                              {clock}
                              {step.durationMin
                                ? ` · ~${step.durationMin} ${t('minutesShort')}`
                                : ''}
                            </Text>
                          </View>
                        ) : step.durationMin ? (
                          <Text style={styles.duration}>
                            {t('stay')}: ~{step.durationMin} {t('minutesShort')}
                          </Text>
                        ) : null}
                        <Text style={styles.openHint}>{t('tapForDetails')}</Text>
                      </View>
                    </Pressable>
                  </View>
                );
              })}
            </View>
          </>
        )}
      </ScrollView>

      {showConfirmCta ? (
        <View style={styles.stickyFooter}>
          <Pressable
            style={[styles.confirmCta, busy && { opacity: 0.6 }]}
            disabled={busy}
            onPress={() => setShowConfirmSheet(true)}
          >
            <Text style={styles.confirmCtaText}>{t('confirmPlan')}</Text>
          </Pressable>
        </View>
      ) : null}

      <Modal visible={askTransport} transparent animationType="fade">
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>{t('transportPrefTitle')}</Text>
            <Text style={styles.modalBody}>{t('transportPrefBody')}</Text>
            <Pressable
              style={[styles.cta, busy && { opacity: 0.6 }]}
              disabled={busy}
              onPress={() => void buildFromPack(true)}
            >
              <Text style={styles.ctaText}>
                {busy ? t('loading') : t('transportPrivate')}
              </Text>
            </Pressable>
            <Pressable
              style={[styles.ctaAlt, busy && { opacity: 0.6 }]}
              disabled={busy}
              onPress={() => void buildFromPack(false)}
            >
              <Text style={styles.ctaAltText}>{t('transportCity')}</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      <Modal visible={!!legPicker} transparent animationType="slide">
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalCard, { maxHeight: '70%' }]}>
            <Text style={styles.modalTitle}>{t('changeTransport')}</Text>
            <ScrollView>
              {legPicker?.options.map((opt) => (
                <Pressable
                  key={opt.systemId}
                  style={[
                    styles.optionRow,
                    opt.recommended && styles.optionRecommended,
                  ]}
                  onPress={() => void applyLegOption(opt)}
                >
                  <Text style={styles.optionTitle}>
                    {opt.recommended ? '★ ' : ''}
                    {opt.name}
                  </Text>
                  <Text style={styles.optionMeta}>
                    {opt.mode} · ~{opt.estMinutes} {t('minutesShort')} ·{' '}
                    {opt.estCostMin}–{opt.estCostMax} {opt.currency}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
            <Pressable onPress={() => setLegPicker(null)}>
              <Text style={styles.linkCenter}>{t('back')}</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      <BottomSheet
        visible={showConfirmSheet}
        onClose={() => setShowConfirmSheet(false)}
      >
        <Text style={styles.modalTitle}>{t('confirmPlanTitle')}</Text>
        <View style={styles.switchRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.switchLabel}>{t('enableTracking')}</Text>
            <Text style={styles.switchHint}>{t('trackingHint')}</Text>
          </View>
          <Switch
            value={enableTracking}
            onValueChange={setEnableTracking}
            trackColor={{ true: colors.brand }}
          />
        </View>
        <Pressable
          style={[styles.cta, confirmBusy && { opacity: 0.6 }]}
          disabled={confirmBusy}
          onPress={() => void confirmPlan()}
        >
          {confirmBusy ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.ctaText}>{t('confirm')}</Text>
          )}
        </Pressable>
        <Pressable onPress={() => setShowConfirmSheet(false)}>
          <Text style={styles.linkCenter}>{t('cancel')}</Text>
        </Pressable>
      </BottomSheet>

      <BottomSheet visible={!!pickerField} onClose={() => setPickerField(null)}>
        {pickerField ? (
          <>
            <Text style={styles.modalTitle}>
              {t(CONTEXT_FIELDS[pickerField].titleKey)}
            </Text>
            {CONTEXT_FIELDS[pickerField].options.map((opt) => (
              <Pressable
                key={opt}
                style={styles.optionRow}
                onPress={() => void applyContextField(pickerField, opt)}
              >
                <Text style={styles.optionTitle}>
                  {t(`${CONTEXT_FIELDS[pickerField].prefix}_${opt}`)}
                </Text>
              </Pressable>
            ))}
            <Pressable onPress={() => setPickerField(null)}>
              <Text style={styles.linkCenter}>{t('cancel')}</Text>
            </Pressable>
          </>
        ) : null}
      </BottomSheet>

      <BottomSheet visible={replaceIndex != null} onClose={closeReplaceSheet}>
        <Text style={styles.modalTitle}>{t('replacePlace')}</Text>
        <TextInput
          style={styles.modalInput}
          value={replaceQuery}
          onChangeText={setReplaceQuery}
          placeholder={t('searchPlaceholder')}
          placeholderTextColor={colors.muted}
          autoFocus
        />
        {replaceBusy ? <ActivityIndicator color={colors.brand} /> : null}
        <ScrollView style={{ maxHeight: 320 }}>
          {replaceResults.map((p) => (
            <Pressable
              key={p.id}
              style={styles.optionRow}
              onPress={() => void applyReplacePlace(p)}
            >
              <Text style={styles.optionTitle}>{p.name}</Text>
              {p.summary ? (
                <Text style={styles.optionMeta} numberOfLines={2}>
                  {p.summary}
                </Text>
              ) : null}
            </Pressable>
          ))}
          {!replaceBusy && replaceQuery.trim() && replaceResults.length === 0 ? (
            <Text style={styles.muted}>{t('empty')}</Text>
          ) : null}
        </ScrollView>
        <Pressable onPress={closeReplaceSheet}>
          <Text style={styles.linkCenter}>{t('cancel')}</Text>
        </Pressable>
      </BottomSheet>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  scroll: { flex: 1 },
  content: { padding: 20, gap: 14, paddingBottom: 24 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  muted: { color: colors.muted },
  title: { fontSize: 26, fontWeight: '800', color: colors.ink },
  summary: { color: colors.muted, lineHeight: 20 },
  dayCard: {
    backgroundColor: colors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
    gap: 6,
    marginBottom: 10,
  },
  dayCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  dayCardTitle: { fontWeight: '800', color: colors.ink, fontSize: 16, flex: 1 },
  dayCardWindow: { color: colors.brandDark, fontWeight: '700' },
  dayCardPreview: { color: colors.muted, fontSize: 13 },
  weatherChip: {
    backgroundColor: colors.chip,
    color: colors.ink,
    fontWeight: '700',
    fontSize: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    overflow: 'hidden',
  },
  dayHeader: { gap: 6, marginBottom: 4 },
  sectionLabel: {
    fontWeight: '800',
    color: colors.ink,
    fontSize: 15,
  },
  dropdownRow: { flexDirection: 'row', gap: 8 },
  dropdownPill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.chip,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  dropdownLabel: {
    color: colors.brandDark,
    fontWeight: '700',
    fontSize: 12,
    flexShrink: 1,
  },
  vertical: { gap: 4 },
  stationBlock: { gap: 4 },
  link: { color: colors.brand, fontWeight: '700', marginTop: 4 },
  linkCenter: {
    textAlign: 'center',
    color: colors.muted,
    fontWeight: '700',
    marginTop: 12,
  },
  legCard: { flexDirection: 'row', gap: 10, paddingLeft: 4 },
  rail: { width: 16, alignItems: 'center' },
  railDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.brand,
    marginTop: 6,
  },
  railLine: {
    flex: 1,
    width: 3,
    backgroundColor: colors.chip,
    minHeight: 28,
    marginTop: 4,
  },
  legBody: {
    flex: 1,
    backgroundColor: colors.chip,
    borderRadius: 12,
    padding: 12,
    gap: 4,
    marginBottom: 8,
  },
  legTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legTitle: { fontWeight: '800', color: colors.brandDark },
  legMeta: { color: colors.ink, fontSize: 13 },
  station: {
    backgroundColor: colors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    marginBottom: 8,
  },
  stationReturn: {
    borderColor: colors.brand,
    backgroundColor: '#f0fdfa',
  },
  stationPhoto: { width: '100%', height: 160 },
  stationBody: { padding: 14, gap: 8 },
  stationTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  badge: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: colors.brand,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeReturn: { backgroundColor: colors.brandDark },
  stationTitle: { fontSize: 18, fontWeight: '800', color: colors.ink, flex: 1 },
  clockRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  duration: { color: colors.muted, fontWeight: '600', fontSize: 12 },
  openHint: { color: colors.brand, fontWeight: '700', fontSize: 12 },
  stickyFooter: {
    padding: 16,
    paddingBottom: 20,
    backgroundColor: colors.bg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  confirmCta: {
    backgroundColor: colors.brand,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
  },
  confirmCtaText: { color: '#fff', fontWeight: '800', fontSize: 16 },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 6,
  },
  switchLabel: { color: colors.ink, fontWeight: '800', fontSize: 15 },
  switchHint: { color: colors.muted, fontSize: 12, marginTop: 2 },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    padding: 20,
  },
  modalCard: {
    backgroundColor: colors.bg,
    borderRadius: 18,
    padding: 20,
    gap: 12,
  },
  modalTitle: { fontSize: 20, fontWeight: '800', color: colors.ink },
  modalInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    color: colors.ink,
    backgroundColor: colors.card,
  },
  modalBody: { color: colors.muted, lineHeight: 20 },
  cta: {
    backgroundColor: colors.brand,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
  ctaText: { color: '#fff', fontWeight: '800' },
  ctaAlt: {
    backgroundColor: colors.card,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.brand,
  },
  ctaAltText: { color: colors.brand, fontWeight: '800' },
  optionRow: {
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 8,
    backgroundColor: colors.card,
  },
  optionRecommended: {
    borderColor: colors.brand,
    backgroundColor: colors.chip,
  },
  optionTitle: { fontWeight: '800', color: colors.ink },
  optionMeta: { color: colors.muted, marginTop: 4, fontSize: 13 },
});
