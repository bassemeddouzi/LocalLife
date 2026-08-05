import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ScrollView,
  Keyboard,
  Modal,
  I18nManager,
} from 'react-native';
import * as Location from 'expo-location';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { CompositeNavigationProp, RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { apiFetch } from '../api/client';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCity } from '../context/CityContext';
import { useAuth } from '../context/AuthContext';
import { colors } from '../theme';
import type { MainTabParamList, RootStackParamList } from '../navigation/types';
import { AppTipsTour, type TipsStepId } from '../components/AppTipsTour';
import DateTimePicker, {
  type DateTimePickerEvent,
} from '@react-native-community/datetimepicker';

/** Houmt Souk centre — used if GPS permission denied */
const FALLBACK_LAT = 33.875;
const FALLBACK_LNG = 10.857;

function looksLikePlanRequest(text: string): boolean {
  const q = text.trim().toLowerCase();
  return /(?:^|\b)(plan|journée|journee|itinéraire|itineraire)\b|خطة|نهار|اعمل.?plan|نعمل.?plan|نجم نعمل|اعمل لي|اعمللي|خطة للنهار|plan مزيان|مزيان للنهار/.test(
    q,
  );
}

function moodIcon(
  mood?: string,
): React.ComponentProps<typeof Ionicons>['name'] {
  if (mood === 'ADVENTURE') return 'compass-outline';
  if (mood === 'CLASSY') return 'wine-outline';
  return 'leaf-outline';
}

type Citation = {
  entityType: string;
  entityId: string;
  rank?: number;
  title?: string;
};
type ChatBubble = {
  id: string;
  role: 'USER' | 'ASSISTANT';
  content: string;
  citations?: Citation[];
  grounding?: string;
  reasons?: string[];
};

type HubMode =
  | 'menu'
  | 'plan_brief'
  | 'plan_confirm'
  | 'plan_picks'
  | 'info_pick'
  | 'tips'
  | 'chat';

type Candidate = {
  id: string;
  title: string;
  summary: string | null;
  score: number;
  why: string;
  recommended?: boolean;
  bias?: string;
  generated?: boolean;
  tripStartsOn?: string;
  tripEndsOn?: string;
  dailyStartLocal?: string;
  dailyEndLocal?: string;
  steps?: Array<{
    sortOrder: number;
    dayIndex?: number;
    kind?: string;
    freeText: string;
    durationMin: number;
    placeId?: string;
    startsAt?: string;
    transportNote?: string;
    whyJson?: Record<string, unknown>;
  }>;
  stepsPreview?: string[];
};

type HistoryRow = {
  id: string;
  title: string;
  updatedAt: string;
};

type BriefState = {
  groupType: string;
  mood: string;
  budgetBand: string;
  hasPrivateTransport: boolean;
  needsText: string;
  /** one_day = calendar + times; multi = start/end dates only */
  tripMode: 'one_day' | 'multi';
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  dailyStartLocal: string;
  hasBackBy: boolean;
  dailyEndLocal: string;
  hatesCold: boolean;
  hatesHeat: boolean;
  avoidRainOutdoors: boolean;
};

type Nav = CompositeNavigationProp<
  BottomTabNavigationProp<MainTabParamList, 'ChatTab'>,
  NativeStackNavigationProp<RootStackParamList>
>;

const INFO_CATEGORIES = [
  'taxi',
  'louage',
  'pharmacy',
  'food',
  'safety',
  'arrival',
  'other',
] as const;

const GROUP_OPTS = ['SOLO', 'COUPLE', 'FRIENDS', 'FAMILY_KIDS'] as const;
const MOOD_OPTS = ['CALM', 'ADVENTURE', 'CLASSY'] as const;
const BUDGET_OPTS = ['LOW', 'MEDIUM', 'HIGH'] as const;

function ymdLocal(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function parseYmd(s: string): Date {
  const [y, m, d] = s.split('-').map((x) => Number(x));
  return new Date(y, (m || 1) - 1, d || 1, 12, 0, 0, 0);
}

function utcNoonIso(ymd: string): string {
  return `${ymd}T12:00:00.000Z`;
}

function tripWindowFromBrief(brief: BriefState): {
  tripStartsOn: string;
  tripEndsOn: string;
  dayCount: number;
  dailyStartLocal: string;
  dailyEndLocal: string;
} {
  const start = brief.startDate;
  const end = brief.tripMode === 'one_day' ? brief.startDate : brief.endDate;
  const startD = parseYmd(start);
  const endD = parseYmd(end < start ? start : end);
  const dayCount = Math.max(
    1,
    Math.round((endD.getTime() - startD.getTime()) / 86_400_000) + 1,
  );
  return {
    tripStartsOn: utcNoonIso(start),
    tripEndsOn: utcNoonIso(ymdLocal(endD)),
    dayCount: Math.min(14, dayCount),
    dailyStartLocal:
      brief.tripMode === 'one_day' ? brief.dailyStartLocal : '10:00',
    dailyEndLocal:
      brief.tripMode === 'one_day'
        ? brief.hasBackBy
          ? brief.dailyEndLocal
          : '22:00'
        : '22:00',
  };
}

function hmToDate(hm: string): Date {
  const [h, m] = hm.split(':').map((x) => Number(x));
  const d = new Date();
  d.setHours(h || 10, m || 0, 0, 0);
  return d;
}

function dateToHm(d: Date): string {
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

function hourBucket() {
  const h = new Date().getHours();
  if (h < 11) return 'morning';
  if (h >= 18) return 'evening';
  return 'day';
}

export function ChatScreen() {
  const { t, i18n } = useTranslation();
  const { city, locationGranted, requestGps } = useCity();
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<Nav>();
  const route = useRoute<RouteProp<MainTabParamList, 'ChatTab'>>();
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatBubble[]>([]);
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const [lastCoords, setLastCoords] = useState<{
    lat: number;
    lng: number;
    accurate: boolean;
  } | null>(null);
  const [mode, setMode] = useState<HubMode>('menu');
  const [activePlanId, setActivePlanId] = useState<string | null>(null);
  const [briefStep, setBriefStep] = useState(0);
  const [brief, setBrief] = useState<BriefState>(() => {
    const today = ymdLocal(new Date());
    return {
      groupType: 'SOLO',
      mood: 'CALM',
      budgetBand: 'MEDIUM',
      hasPrivateTransport: false,
      needsText: '',
      tripMode: 'one_day',
      startDate: today,
      endDate: today,
      dailyStartLocal: '10:30',
      hasBackBy: true,
      dailyEndLocal: '18:00',
      hatesCold: false,
      hatesHeat: false,
      avoidRainOutdoors: true,
    };
  });
  const [pickerKind, setPickerKind] = useState<
    null | 'startDate' | 'endDate' | 'startTime' | 'endTime'
  >(null);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [weatherLine, setWeatherLine] = useState<string | null>(null);
  const [infoCategory, setInfoCategory] = useState<string | null>(null);
  const [seedPlaceId, setSeedPlaceId] = useState<string | null>(null);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [historyRows, setHistoryRows] = useState<HistoryRow[]>([]);
  const [historyBusy, setHistoryBusy] = useState(false);
  const lastPreset = useRef<string | null>(null);
  const listRef = useRef<FlatList<ChatBubble>>(null);
  const isRtl = i18n.dir() === 'rtl' || I18nManager.isRTL;
  const MODE_KEY = `chatHubMode:${user?.id ?? 'anon'}`;

  const ensureConversation = async () => {
    if (conversationId) return conversationId;
    const conv = await apiFetch<{ id: string }>('/v1/ai/conversations', {
      method: 'POST',
      body: JSON.stringify({
        cityId: city?.id,
        title: 'Mobile chat',
      }),
    });
    setConversationId(conv.id);
    return conv.id;
  };

  const persistMode = useCallback(
    async (next: HubMode) => {
      setMode(next);
      if (next === 'menu') {
        await AsyncStorage.removeItem(MODE_KEY);
      } else {
        await AsyncStorage.setItem(MODE_KEY, next);
      }
    },
    [MODE_KEY],
  );

  const loadBootstrap = useCallback(async () => {
    if (!city?.id) return;
    try {
      const [defaults, active] = await Promise.all([
        apiFetch<{ defaults: Record<string, unknown> }>(
          `/v1/me/plans/brief-defaults?cityId=${city.id}`,
        ),
        apiFetch<{ id: string } | null>('/v1/me/plans/active').catch(() => null),
      ]);
      const d = defaults.defaults ?? {};
      setBrief((b) => ({
        ...b,
        groupType: String(d.groupType ?? b.groupType),
        mood: String(d.mood ?? b.mood),
        budgetBand: String(d.budgetBand ?? b.budgetBand),
        hasPrivateTransport: Boolean(d.hasPrivateTransport ?? b.hasPrivateTransport),
      }));
      setActivePlanId(active?.id ?? null);
    } catch {
      /* ignore */
    }
  }, [city?.id]);

  useEffect(() => {
    void loadBootstrap();
  }, [loadBootstrap]);

  useEffect(() => {
    void (async () => {
      const saved = await AsyncStorage.getItem(MODE_KEY);
      if (
        saved === 'chat' ||
        saved === 'tips' ||
        saved === 'info_pick' ||
        saved === 'plan_brief'
      ) {
        // sticky only for non-terminal modes; plan_picks/confirm reset to menu on reopen
        if (saved === 'chat' || saved === 'tips' || saved === 'info_pick') {
          setMode(saved);
        }
      }
    })();
  }, [MODE_KEY]);

  const menuOrder = useMemo(() => {
    const bucket = hourBucket();
    const items: Array<'plan' | 'info' | 'tips'> = ['plan', 'info', 'tips'];
    if (bucket === 'morning') return ['plan', 'info', 'tips'] as const;
    if (bucket === 'evening') return ['info', 'plan', 'tips'] as const;
    return items;
  }, []);

  const confidenceLabel = (g?: string) => {
    if (g === 'grounded') return t('confidenceGrounded');
    if (g === 'partial') return t('confidencePartial');
    if (g === 'fallback') return t('confidenceLimited');
    return null;
  };

  const resolveChatCoords = async (): Promise<{
    lat: number;
    lng: number;
    accurate: boolean;
  }> => {
    if (lastCoords?.accurate) return lastCoords;
    try {
      let granted = locationGranted === true;
      if (!granted) {
        granted = await requestGps();
      }
      if (!granted) {
        const { status } = await Location.requestForegroundPermissionsAsync();
        granted = status === Location.PermissionStatus.GRANTED;
      }
      if (granted) {
        const last = await Location.getLastKnownPositionAsync();
        if (last?.coords) {
          const coords = {
            lat: last.coords.latitude,
            lng: last.coords.longitude,
            accurate: true,
          };
          setLastCoords(coords);
          void Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Balanced,
          })
            .then((pos) => {
              setLastCoords({
                lat: pos.coords.latitude,
                lng: pos.coords.longitude,
                accurate: true,
              });
            })
            .catch(() => undefined);
          return coords;
        }
        const pos = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        const coords = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accurate: true,
        };
        setLastCoords(coords);
        return coords;
      }
    } catch {
      /* fall through */
    }
    return lastCoords ?? { lat: FALLBACK_LAT, lng: FALLBACK_LNG, accurate: false };
  };

  const send = async (content: string) => {
    if (!content.trim() || !city) return;

    // Plan requests → questions-first hub (not a free-chat text dump)
    if (looksLikePlanRequest(content) && !/\[category:/i.test(content)) {
      setMessages((m) => [
        ...m,
        {
          id: `u-${Date.now()}`,
          role: 'USER',
          content: content.trim(),
        },
        {
          id: `a-handoff-${Date.now()}`,
          role: 'ASSISTANT',
          content: t('hubPlanHandoff'),
          grounding: 'grounded',
        },
      ]);
      setText('');
      setBriefStep(0);
      await persistMode('plan_brief');
      return;
    }

    setBusy(true);
    let outgoing = content.trim();
    // Keep taxi/pharmacy topic sticky in free chat after the user picked a category
    if (infoCategory && !/\[category:[a-z_]+\]/i.test(outgoing)) {
      outgoing = `[category:${infoCategory}] ${outgoing}`;
    }
    const optimistic: ChatBubble = {
      id: `u-${Date.now()}`,
      role: 'USER',
      content: content.trim(),
    };
    setMessages((m) => [...m, optimistic]);
    setText('');
    try {
      const id = await ensureConversation();
      const coords = await resolveChatCoords();
      const res = await apiFetch<{
        message: {
          id: string;
          content: string;
          citations: Citation[];
        };
        grounding: string;
        reasons: string[];
      }>(`/v1/ai/conversations/${id}/messages`, {
        method: 'POST',
        body: JSON.stringify({
          content: outgoing,
          cityId: city.id,
          locale: user?.locale ?? i18n.language,
          smartBrief: brief,
          lat: coords.lat,
          lng: coords.lng,
          gpsAccurate: coords.accurate,
        }),
      });
      setMessages((m) => [
        ...m,
        {
          id: res.message.id,
          role: 'ASSISTANT',
          content: res.message.content,
          citations: (res.message.citations ?? []).filter(
            (c) => c.entityType === 'place',
          ),
          grounding: res.grounding,
          reasons: res.reasons,
        },
      ]);
      await persistMode('chat');
      requestAnimationFrame(() =>
        listRef.current?.scrollToEnd({ animated: true }),
      );
    } catch (e) {
      Alert.alert(t('error'), e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => {
    if (mode === 'chat') {
      void resolveChatCoords();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

  useEffect(() => {
    const modeParam = route.params?.mode;
    if (modeParam === 'plan') void persistMode('plan_brief');
    if (modeParam === 'info') void persistMode('info_pick');
    if (modeParam === 'tips') void persistMode('tips');
    if (modeParam === 'chat') void persistMode('chat');
    if (route.params?.placeName) {
      setSeedPlaceId(route.params.placeId ?? null);
      if (modeParam === 'info' || !modeParam) {
        void persistMode('info_pick');
        setInfoCategory('other');
        setText(
          t('askAboutPlacePreset', {
            name: route.params.placeName,
            defaultValue: `Tell me about ${route.params.placeName}`,
          }),
        );
      }
    }
    const preset = route.params?.preset;
    if (preset && preset !== lastPreset.current) {
      lastPreset.current = preset;
      void persistMode('chat');
      void send(preset);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [route.params?.preset, route.params?.mode, route.params?.placeName]);

  const report = async (messageId: string) => {
    try {
      await apiFetch('/v1/ai/feedback', {
        method: 'POST',
        body: JSON.stringify({ messageId, reason: 'mobile report' }),
      });
      Alert.alert('OK');
    } catch (e) {
      Alert.alert(t('error'), e instanceof Error ? e.message : String(e));
    }
  };

  const addPlaceToActivePlan = async (placeId: string) => {
    if (!activePlanId) {
      setSeedPlaceId(placeId);
      setBriefStep(0);
      await persistMode('plan_brief');
      return;
    }
    try {
      await apiFetch(`/v1/me/plans/${activePlanId}/actions`, {
        method: 'POST',
        body: JSON.stringify({
          action: 'add_step',
          step: { placeId, freeText: t('hubAddedStop'), durationMin: 45 },
        }),
      });
      Alert.alert(t('planCreated'));
      navigation.navigate('PlanTimeline', { planId: activePlanId });
    } catch (e) {
      Alert.alert(t('error'), e instanceof Error ? e.message : String(e));
    }
  };

  const confirmBriefAndFetch = async () => {
    if (!city?.id) return;
    setBusy(true);
    try {
      const win = tripWindowFromBrief(brief);
      try {
        await apiFetch('/v1/me/plans/session-context', {
          method: 'PATCH',
          body: JSON.stringify({
            cityId: city.id,
            groupType: brief.groupType,
            mood: brief.mood,
            budgetNow: brief.budgetBand,
            hasPrivateTransport: brief.hasPrivateTransport,
            maxEndTimeIso:
              brief.tripMode === 'one_day' && brief.hasBackBy
                ? `${win.tripStartsOn.slice(0, 10)}T${win.dailyEndLocal}:00.000Z`
                : undefined,
            contextJson: {
              needsText: brief.needsText,
              tripStartsOn: win.tripStartsOn,
              tripEndsOn: win.tripEndsOn,
              dailyStartLocal: win.dailyStartLocal,
              dailyEndLocal: win.dailyEndLocal,
              tripMode: brief.tripMode,
              dayCount: win.dayCount,
              weatherPrefs: {
                hatesCold: brief.hatesCold,
                hatesHeat: brief.hatesHeat,
                avoidRainOutdoors: brief.avoidRainOutdoors,
              },
              ...(seedPlaceId ? { seedPlaceId } : {}),
            },
          }),
        });
      } catch (ctxErr) {
        console.warn('session-context patch failed', ctxErr);
      }
      try {
        const wx = await apiFetch<{
          current?: { tempC: number; label: string };
          daily?: Array<{ label: string; tempMaxC: number }>;
        }>(`/v1/cities/${city.id}/weather?days=1`);
        const label = wx.current?.label ?? wx.daily?.[0]?.label;
        const temp = wx.current?.tempC ?? wx.daily?.[0]?.tempMaxC;
        if (label) {
          setWeatherLine(
            t('weatherTodayLine', {
              label: t(`weather_${label}`, { defaultValue: label }),
              temp: temp != null ? Math.round(temp) : '—',
            }),
          );
        }
      } catch {
        setWeatherLine(null);
      }
      const coords = await resolveChatCoords();
      const rows = await apiFetch<Candidate[]>('/v1/me/plans/candidates', {
        method: 'POST',
        body: JSON.stringify({
          cityId: city.id,
          lat: coords.lat,
          lng: coords.lng,
        }),
      });
      setCandidates(Array.isArray(rows) ? rows.slice(0, 2) : []);
      await persistMode('plan_picks');
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      Alert.alert(
        t('error'),
        /unauthorized/i.test(msg)
          ? t('sessionExpiredHint', {
              defaultValue:
                'Your session expired. Please sign in again, then confirm your plan.',
            })
          : msg,
      );
    } finally {
      setBusy(false);
    }
  };

  const openCandidate = async (c: Candidate) => {
    if (!city?.id) return;
    if (c.generated && c.steps?.length) {
      setBusy(true);
      try {
        const win = tripWindowFromBrief(brief);
        const created = await apiFetch<{ id: string }>('/v1/me/plans', {
          method: 'POST',
          body: JSON.stringify({
            title: c.title,
            cityId: city.id,
            source: 'CHAT',
            tripStartsOn: c.tripStartsOn ?? win.tripStartsOn,
            tripEndsOn: c.tripEndsOn ?? win.tripEndsOn,
            dailyStartLocal: c.dailyStartLocal ?? win.dailyStartLocal,
            dailyEndLocal: c.dailyEndLocal ?? win.dailyEndLocal,
            steps: c.steps.map((s, i) => ({
              sortOrder: s.sortOrder ?? i,
              dayIndex: s.dayIndex ?? 0,
              placeId: s.placeId,
              freeText: s.freeText,
              durationMin: s.durationMin,
              startsAt: s.startsAt,
              transportNote: s.transportNote,
              whyJson: s.whyJson,
            })),
            offlinePayloadJson: {
              generated: true,
              bias: c.bias,
              why: c.why,
            },
          }),
        });
        setActivePlanId(created.id);
        navigation.navigate('PlanTimeline', { planId: created.id });
      } catch (e) {
        Alert.alert(t('error'), e instanceof Error ? e.message : String(e));
      } finally {
        setBusy(false);
      }
      return;
    }
    navigation.navigate('PlanTimeline', { packId: c.id });
  };

  const loadHistory = async () => {
    setHistoryBusy(true);
    try {
      const rows = await apiFetch<HistoryRow[]>('/v1/ai/conversations');
      setHistoryRows(Array.isArray(rows) ? rows : []);
    } catch (e) {
      Alert.alert(t('error'), e instanceof Error ? e.message : String(e));
    } finally {
      setHistoryBusy(false);
    }
  };

  const openHistoryConversation = async (id: string) => {
    setHistoryBusy(true);
    try {
      const conv = await apiFetch<{
        id: string;
        messages: Array<{
          id: string;
          role: 'USER' | 'ASSISTANT';
          content: string;
          citations?: Citation[];
          toolPayload?: { grounding?: string; reasons?: string[] };
        }>;
      }>(`/v1/ai/conversations/${id}`);
      setConversationId(conv.id);
      setMessages(
        (conv.messages ?? []).map((m) => ({
          id: m.id,
          role: m.role,
          content: m.content,
          citations: (m.citations ?? []).filter((c) => c.entityType === 'place'),
          grounding: m.toolPayload?.grounding,
          reasons: m.toolPayload?.reasons,
        })),
      );
      setHistoryOpen(false);
      await persistMode('chat');
    } catch (e) {
      Alert.alert(t('error'), e instanceof Error ? e.message : String(e));
    } finally {
      setHistoryBusy(false);
    }
  };

  const deleteHistoryConversation = (row: HistoryRow) => {
    Alert.alert(t('chatHistoryDeleteTitle'), t('chatHistoryDeleteBody'), [
      { text: t('cancel'), style: 'cancel' },
      {
        text: t('delete'),
        style: 'destructive',
        onPress: () => {
          void (async () => {
            try {
              await apiFetch(`/v1/ai/conversations/${row.id}`, {
                method: 'DELETE',
              });
              setHistoryRows((rows) => rows.filter((r) => r.id !== row.id));
              if (conversationId === row.id) {
                setConversationId(null);
                setMessages([]);
              }
            } catch (e) {
              Alert.alert(
                t('error'),
                e instanceof Error ? e.message : String(e),
              );
            }
          })();
        },
      },
    ]);
  };

  const newChat = () => {
    setConversationId(null);
    setMessages([]);
    lastPreset.current = null;
    setInfoCategory(null);
    setBriefStep(0);
    setCandidates([]);
    void persistMode('menu');
  };

  const goMenu = () => {
    void persistMode('menu');
  };

  const startPlan = () => {
    setBriefStep(0);
    void persistMode('plan_brief');
  };

  const sendInfoQuestion = () => {
    if (!infoCategory) return;
    const detail = text.trim();
    const composed = `[category:${infoCategory}] ${
      detail || t(`infoPrompt_${infoCategory}`)
    }`;
    void send(composed);
  };

  const onTipsShowMe = (step: TipsStepId) => {
    if (step === 'home') navigation.navigate('HomeTab');
    else if (step === 'plan') {
      if (activePlanId) navigation.navigate('PlanTimeline', { planId: activePlanId });
      else navigation.navigate('HomeTab');
    } else if (step === 'avatar' || step === 'gps') {
      /* stay on chat / user sees header actions */
      Alert.alert(t(`tipsTitle_${step}`), t(`tipsBody_${step}`));
    } else if (step === 'rate') navigation.navigate('ProfileTab');
  };

  const modeChipLabel =
    mode === 'plan_brief' || mode === 'plan_confirm' || mode === 'plan_picks'
      ? t('hubModePlan')
      : mode === 'info_pick'
        ? t('hubModeInfo')
        : mode === 'tips'
          ? t('hubModeTips')
          : mode === 'chat'
            ? t('hubModeChat')
            : null;

  const renderMenu = () => (
    <ScrollView contentContainerStyle={styles.hubPad}>
      <Text style={styles.hubHello}>{t('hubHello')}</Text>
      <Text style={styles.hubSub}>{t('hubWhatDoYouWant')}</Text>
      {activePlanId ? (
        <Pressable
          style={styles.hubPrimary}
          onPress={() =>
            navigation.navigate('PlanTimeline', { planId: activePlanId })
          }
        >
          <Text style={styles.hubPrimaryText}>{t('hubContinuePlan')}</Text>
        </Pressable>
      ) : null}
      {menuOrder.map((key) => (
        <Pressable
          key={key}
          style={styles.hubBtn}
          onPress={() => {
            if (key === 'plan') startPlan();
            else if (key === 'info') void persistMode('info_pick');
            else void persistMode('tips');
          }}
        >
          <Text style={styles.hubBtnText}>
            {key === 'plan'
              ? hourBucket() === 'morning'
                ? t('hubMenuPlanArrival')
                : t('hubMenuPlan')
              : key === 'info'
                ? hourBucket() === 'evening'
                  ? t('hubMenuInfoEvening')
                  : t('hubMenuInfo')
                : t('hubMenuTips')}
          </Text>
        </Pressable>
      ))}
      <Pressable onPress={() => void persistMode('chat')}>
        <Text style={styles.hubLink}>{t('hubFreeChat')}</Text>
      </Pressable>
    </ScrollView>
  );

  const Chip = ({
    label,
    selected,
    onPress,
  }: {
    label: string;
    selected: boolean;
    onPress: () => void;
  }) => (
    <Pressable
      onPress={onPress}
      style={[styles.choiceChip, selected && styles.choiceChipOn]}
    >
      <Text style={[styles.choiceChipText, selected && styles.choiceChipTextOn]}>
        {label}
      </Text>
    </Pressable>
  );

  const renderPlanBrief = () => (
    <ScrollView contentContainerStyle={styles.hubPad}>
      <Text style={styles.hubHello}>{t('planBriefTitle')}</Text>
      <Text style={styles.hubSub}>
        {t('hubBriefStep', { n: briefStep + 1, total: 4 })}
      </Text>
      {briefStep === 0 ? (
        <>
          <Text style={styles.sectionLabel}>{t('planBriefGroup')}</Text>
          <View style={styles.chipRow}>
            {GROUP_OPTS.map((g) => (
              <Chip
                key={g}
                label={t(`group_${g}`)}
                selected={brief.groupType === g}
                onPress={() => setBrief((b) => ({ ...b, groupType: g }))}
              />
            ))}
          </View>
        </>
      ) : null}
      {briefStep === 1 ? (
        <>
          <Text style={styles.sectionLabel}>{t('planBriefMood')}</Text>
          <View style={styles.chipRow}>
            {MOOD_OPTS.map((m) => (
              <Chip
                key={m}
                label={t(`mood_${m}`)}
                selected={brief.mood === m}
                onPress={() => setBrief((b) => ({ ...b, mood: m }))}
              />
            ))}
          </View>
          <Text style={styles.sectionLabel}>{t('planBriefBudget')}</Text>
          <View style={styles.chipRow}>
            {BUDGET_OPTS.map((bgt) => (
              <Chip
                key={bgt}
                label={t(`budget_${bgt}`)}
                selected={brief.budgetBand === bgt}
                onPress={() => setBrief((b) => ({ ...b, budgetBand: bgt }))}
              />
            ))}
          </View>
        </>
      ) : null}
      {briefStep === 2 ? (
        <>
          <Text style={styles.sectionLabel}>{t('transportPrefTitle')}</Text>
          <View style={styles.chipRow}>
            <Chip
              label={t('transportPrivate')}
              selected={brief.hasPrivateTransport}
              onPress={() =>
                setBrief((b) => ({ ...b, hasPrivateTransport: true }))
              }
            />
            <Chip
              label={t('transportCity')}
              selected={!brief.hasPrivateTransport}
              onPress={() =>
                setBrief((b) => ({ ...b, hasPrivateTransport: false }))
              }
            />
          </View>
          <TextInput
            style={styles.needsInput}
            placeholder={t('hubNeedsPlaceholder')}
            placeholderTextColor={colors.muted}
            value={brief.needsText}
            onChangeText={(v) => setBrief((b) => ({ ...b, needsText: v }))}
            multiline
          />
        </>
      ) : null}
      {briefStep === 3 ? (
        <>
          <Text style={styles.sectionLabel}>{t('tripLengthLabel')}</Text>
          <View style={styles.chipRow}>
            <Chip
              label={t('tripModeOneDay')}
              selected={brief.tripMode === 'one_day'}
              onPress={() =>
                setBrief((b) => ({
                  ...b,
                  tripMode: 'one_day',
                  endDate: b.startDate,
                }))
              }
            />
            <Chip
              label={t('tripModeMulti')}
              selected={brief.tripMode === 'multi'}
              onPress={() => {
                const end = parseYmd(brief.startDate);
                end.setDate(end.getDate() + 6);
                setBrief((b) => ({
                  ...b,
                  tripMode: 'multi',
                  endDate: ymdLocal(end),
                }));
              }}
            />
          </View>
          <Text style={styles.sectionLabel}>{t('pickStartDate')}</Text>
          <Pressable
            style={styles.dateBtn}
            onPress={() => setPickerKind('startDate')}
          >
            <Ionicons name="calendar-outline" size={18} color={colors.brand} />
            <Text style={styles.dateBtnText}>{brief.startDate}</Text>
          </Pressable>
          {brief.tripMode === 'multi' ? (
            <>
              <Text style={styles.sectionLabel}>{t('pickEndDate')}</Text>
              <Pressable
                style={styles.dateBtn}
                onPress={() => setPickerKind('endDate')}
              >
                <Ionicons
                  name="calendar-outline"
                  size={18}
                  color={colors.brand}
                />
                <Text style={styles.dateBtnText}>{brief.endDate}</Text>
              </Pressable>
            </>
          ) : (
            <>
              <Text style={styles.sectionLabel}>{t('dailyStartLabel')}</Text>
              <Pressable
                style={styles.dateBtn}
                onPress={() => setPickerKind('startTime')}
              >
                <Ionicons name="time-outline" size={18} color={colors.brand} />
                <Text style={styles.dateBtnText}>{brief.dailyStartLocal}</Text>
              </Pressable>
              <Text style={styles.sectionLabel}>{t('dailyEndLabel')}</Text>
              <View style={styles.chipRow}>
                <Chip
                  label={t('noBackBy')}
                  selected={!brief.hasBackBy}
                  onPress={() => setBrief((b) => ({ ...b, hasBackBy: false }))}
                />
                <Chip
                  label={brief.hasBackBy ? brief.dailyEndLocal : t('pickEndDate')}
                  selected={brief.hasBackBy}
                  onPress={() => {
                    setBrief((b) => ({ ...b, hasBackBy: true }));
                    setPickerKind('endTime');
                  }}
                />
              </View>
            </>
          )}
          <Text style={styles.sectionLabel}>{t('weatherPrefsLabel')}</Text>
          <View style={styles.chipRow}>
            <Chip
              label={t('prefHatesCold')}
              selected={brief.hatesCold}
              onPress={() =>
                setBrief((b) => ({ ...b, hatesCold: !b.hatesCold }))
              }
            />
            <Chip
              label={t('prefHatesHeat')}
              selected={brief.hatesHeat}
              onPress={() =>
                setBrief((b) => ({ ...b, hatesHeat: !b.hatesHeat }))
              }
            />
            <Chip
              label={t('prefAvoidRain')}
              selected={brief.avoidRainOutdoors}
              onPress={() =>
                setBrief((b) => ({
                  ...b,
                  avoidRainOutdoors: !b.avoidRainOutdoors,
                }))
              }
            />
          </View>
          {pickerKind ? (
            <DateTimePicker
              value={
                pickerKind === 'startDate'
                  ? parseYmd(brief.startDate)
                  : pickerKind === 'endDate'
                    ? parseYmd(brief.endDate)
                    : pickerKind === 'startTime'
                      ? hmToDate(brief.dailyStartLocal)
                      : hmToDate(brief.dailyEndLocal)
              }
              mode={
                pickerKind === 'startDate' || pickerKind === 'endDate'
                  ? 'date'
                  : 'time'
              }
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={(event: DateTimePickerEvent, date?: Date) => {
                if (Platform.OS === 'android') setPickerKind(null);
                if (event.type === 'dismissed' || !date) {
                  if (Platform.OS === 'ios') setPickerKind(null);
                  return;
                }
                if (pickerKind === 'startDate') {
                  const s = ymdLocal(date);
                  setBrief((b) => ({
                    ...b,
                    startDate: s,
                    endDate: b.tripMode === 'one_day' ? s : b.endDate < s ? s : b.endDate,
                  }));
                } else if (pickerKind === 'endDate') {
                  setBrief((b) => ({ ...b, endDate: ymdLocal(date) }));
                } else if (pickerKind === 'startTime') {
                  setBrief((b) => ({ ...b, dailyStartLocal: dateToHm(date) }));
                } else if (pickerKind === 'endTime') {
                  setBrief((b) => ({
                    ...b,
                    hasBackBy: true,
                    dailyEndLocal: dateToHm(date),
                  }));
                }
                if (Platform.OS === 'android') setPickerKind(null);
              }}
            />
          ) : null}
          {Platform.OS === 'ios' && pickerKind ? (
            <Pressable onPress={() => setPickerKind(null)}>
              <Text style={styles.link}>{t('donePersonalize')}</Text>
            </Pressable>
          ) : null}
        </>
      ) : null}
      <View style={styles.rowBetween}>
        {briefStep > 0 ? (
          <Pressable onPress={() => setBriefStep((s) => s - 1)}>
            <Text style={styles.link}>{t('back')}</Text>
          </Pressable>
        ) : (
          <Pressable onPress={goMenu}>
            <Text style={styles.link}>{t('hubBackMenu')}</Text>
          </Pressable>
        )}
        <Pressable
          style={styles.hubPrimary}
          onPress={() => {
            if (briefStep < 3) setBriefStep((s) => s + 1);
            else void persistMode('plan_confirm');
          }}
        >
          <Text style={styles.hubPrimaryText}>
            {briefStep < 3 ? t('continue') : t('hubReviewNeeds')}
          </Text>
        </Pressable>
      </View>
    </ScrollView>
  );

  const renderPlanConfirm = () => (
    <ScrollView contentContainerStyle={styles.hubPad}>
      <Text style={styles.hubHello}>{t('hubConfirmTitle')}</Text>
      <View style={styles.confirmCard}>
        <Text style={styles.confirmLine}>
          {t('group_' + brief.groupType)} · {t('mood_' + brief.mood)} ·{' '}
          {t('budget_' + brief.budgetBand)}
        </Text>
        <Text style={styles.confirmLine}>
          {brief.hasPrivateTransport
            ? t('transportPrivate')
            : t('transportCity')}
        </Text>
        <Text style={styles.confirmLine}>
          {brief.tripMode === 'one_day'
            ? `${brief.startDate} · ${brief.dailyStartLocal}${
                brief.hasBackBy ? ` → ${brief.dailyEndLocal}` : ''
              }`
            : `${brief.startDate} → ${brief.endDate}`}
        </Text>
        {(brief.hatesCold || brief.hatesHeat || brief.avoidRainOutdoors) && (
          <Text style={styles.confirmLine}>
            {[
              brief.hatesCold ? t('prefHatesCold') : null,
              brief.hatesHeat ? t('prefHatesHeat') : null,
              brief.avoidRainOutdoors ? t('prefAvoidRain') : null,
            ]
              .filter(Boolean)
              .join(' · ')}
          </Text>
        )}
        {brief.needsText ? (
          <Text style={styles.confirmLine}>{brief.needsText}</Text>
        ) : null}
      </View>
      <Pressable
        style={[styles.hubPrimary, busy && { opacity: 0.5 }]}
        disabled={busy}
        onPress={() => void confirmBriefAndFetch()}
      >
        <Text style={styles.hubPrimaryText}>{t('hubLooksGood')}</Text>
      </Pressable>
      <Pressable
        onPress={() => {
          setBriefStep(0);
          void persistMode('plan_brief');
        }}
      >
        <Text style={styles.hubLink}>{t('hubEditNeeds')}</Text>
      </Pressable>
    </ScrollView>
  );

  const renderPlanPicks = () => (
    <ScrollView contentContainerStyle={styles.hubPad}>
      <Text style={styles.hubHello}>{t('hubBestPlans')}</Text>
      <Text style={styles.hubSub}>{t('hubBestPlansHint')}</Text>
      {weatherLine ? <Text style={styles.meta}>{weatherLine}</Text> : null}
      {candidates.length === 0 ? (
        <Text style={styles.meta}>{t('empty')}</Text>
      ) : (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.picksStrip}
        >
          {candidates.map((c) => (
            <Pressable
              key={c.id}
              style={[
                styles.candidateCardH,
                c.recommended && styles.candidateRec,
              ]}
              onPress={() => void openCandidate(c)}
              disabled={busy}
            >
              <View style={styles.candidateIconWrap}>
                <Ionicons
                  name={moodIcon(brief.mood)}
                  size={22}
                  color={colors.brand}
                />
              </View>
              {c.recommended ? (
                <Text style={styles.badge}>{t('hubRecommended')}</Text>
              ) : null}
              <Text style={styles.candidateTitle} numberOfLines={2}>
                {c.title}
              </Text>
              {c.summary ? (
                <Text style={styles.candidateSum} numberOfLines={3}>
                  {c.summary}
                </Text>
              ) : null}
              {c.stepsPreview?.length ? (
                <Text style={styles.candidateSum} numberOfLines={2}>
                  {c.stepsPreview.slice(0, 3).join(' · ')}
                </Text>
              ) : null}
              <Text style={styles.candidateWhy} numberOfLines={2}>
                {c.why}
              </Text>
              <Text style={styles.link}>{t('openPlan')}</Text>
            </Pressable>
          ))}
        </ScrollView>
      )}
      <Pressable
        onPress={() => {
          setBriefStep(0);
          void persistMode('plan_brief');
        }}
      >
        <Text style={styles.hubLink}>{t('hubChangeNeeds')}</Text>
      </Pressable>
      <Pressable onPress={goMenu}>
        <Text style={styles.hubLink}>{t('hubBackMenu')}</Text>
      </Pressable>
    </ScrollView>
  );

  const renderInfoPick = () => (
    <ScrollView contentContainerStyle={styles.hubPad}>
      <Text style={styles.hubHello}>{t('hubMenuInfo')}</Text>
      <Text style={styles.hubSub}>{t('hubInfoHint')}</Text>
      <View style={styles.chipRow}>
        {INFO_CATEGORIES.map((c) => (
          <Chip
            key={c}
            label={t(`infoChip_${c}`)}
            selected={infoCategory === c}
            onPress={() => setInfoCategory(c)}
          />
        ))}
      </View>
      <TextInput
        style={styles.needsInput}
        placeholder={t('hubInfoDetailPlaceholder')}
        placeholderTextColor={colors.muted}
        value={text}
        onChangeText={setText}
      />
      <Pressable
        style={[styles.hubPrimary, (!infoCategory || busy) && { opacity: 0.5 }]}
        disabled={!infoCategory || busy}
        onPress={sendInfoQuestion}
      >
        <Text style={styles.hubPrimaryText}>{t('send')}</Text>
      </Pressable>
      <Pressable onPress={goMenu}>
        <Text style={styles.hubLink}>{t('hubBackMenu')}</Text>
      </Pressable>
    </ScrollView>
  );

  const showComposer = mode === 'chat';
  const showMessages = mode === 'chat' || messages.length > 0;

  useEffect(() => {
    const sub = Keyboard.addListener('keyboardDidShow', () => {
      listRef.current?.scrollToEnd({ animated: true });
    });
    return () => sub.remove();
  }, []);

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior="padding"
      keyboardVerticalOffset={Platform.OS === 'ios' ? 88 : 12}
    >
      <View style={styles.topBar}>
        <View style={styles.topBarLeft}>
          <Pressable
            style={styles.historyBtn}
            onPress={() => {
              setHistoryOpen(true);
              void loadHistory();
            }}
            accessibilityLabel={t('chatHistory')}
          >
            <Ionicons name="time-outline" size={18} color={colors.brand} />
          </Pressable>
          <Pressable onPress={newChat}>
            <Text style={styles.link}>{t('newChat')}</Text>
          </Pressable>
        </View>
        {modeChipLabel ? (
          <View style={styles.modeChipRow}>
            <Text style={styles.modeChip}>{modeChipLabel}</Text>
            <Pressable onPress={goMenu}>
              <Text style={styles.link}>{t('hubChange')}</Text>
            </Pressable>
          </View>
        ) : null}
      </View>

      <Modal
        visible={historyOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setHistoryOpen(false)}
      >
        <Pressable
          style={styles.historyBackdrop}
          onPress={() => setHistoryOpen(false)}
        >
          <Pressable style={styles.historyCard} onPress={(e) => e.stopPropagation()}>
            <Text style={styles.historyTitle}>{t('chatHistory')}</Text>
            {historyBusy ? (
              <Text style={styles.meta}>{t('loading')}</Text>
            ) : historyRows.length === 0 ? (
              <Text style={styles.meta}>{t('chatHistoryEmpty')}</Text>
            ) : (
              <ScrollView style={{ maxHeight: 320 }}>
                {historyRows.map((row) => (
                  <View key={row.id} style={styles.historyRow}>
                    <Pressable
                      style={styles.historyRowMain}
                      onPress={() => void openHistoryConversation(row.id)}
                    >
                      <Text style={styles.historyRowTitle} numberOfLines={1}>
                        {row.title || t('newChat')}
                      </Text>
                      <Text style={styles.historyRowDate}>
                        {new Date(row.updatedAt).toLocaleString()}
                      </Text>
                    </Pressable>
                    <Pressable
                      onPress={() => deleteHistoryConversation(row)}
                      hitSlop={8}
                    >
                      <Ionicons
                        name="trash-outline"
                        size={18}
                        color={colors.danger}
                      />
                    </Pressable>
                  </View>
                ))}
              </ScrollView>
            )}
            <Pressable onPress={() => setHistoryOpen(false)}>
              <Text style={styles.hubLink}>{t('hubBackMenu')}</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>

      {mode === 'menu' ? renderMenu() : null}
      {mode === 'plan_brief' ? renderPlanBrief() : null}
      {mode === 'plan_confirm' ? renderPlanConfirm() : null}
      {mode === 'plan_picks' ? renderPlanPicks() : null}
      {mode === 'info_pick' ? renderInfoPick() : null}
      {mode === 'tips' ? (
        <View style={styles.hubPad}>
          <AppTipsTour
            onShowMe={onTipsShowMe}
            onTryPlan={startPlan}
            onAskSomething={() => void persistMode('info_pick')}
            onBackMenu={goMenu}
          />
        </View>
      ) : null}

      {showMessages && mode === 'chat' ? (
        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 16, gap: 10, paddingBottom: 24 }}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="interactive"
          ListHeaderComponent={
            messages.length === 0 ? (
              <Text style={styles.hubSub}>{t('hubFreeChatHint')}</Text>
            ) : null
          }
          renderItem={({ item }) => {
            const placeCites = (item.citations ?? []).filter(
              (c) => c.entityType === 'place',
            );
            return (
              <View
                style={[
                  styles.bubble,
                  item.role === 'USER' ? styles.user : styles.assistant,
                ]}
              >
                <Text
                  style={
                    item.role === 'USER' ? styles.userText : styles.assistantText
                  }
                >
                  {item.content}
                </Text>
                {confidenceLabel(item.grounding) ? (
                  <Text style={styles.meta}>
                    {confidenceLabel(item.grounding)}
                  </Text>
                ) : null}
                {placeCites.length ? (
                  <View style={styles.citations}>
                    {placeCites.slice(0, 3).map((c) => (
                      <Pressable
                        key={`${c.entityType}:${c.entityId}`}
                        style={styles.placeBtn}
                        onPress={() =>
                          navigation.navigate('PlaceDetail', {
                            placeId: c.entityId,
                          })
                        }
                      >
                        <Text style={styles.cite}>
                          {t('openPlaceNamed', {
                            name: c.title || t('openPlaceDetails'),
                          })}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                ) : null}
                {item.role === 'ASSISTANT' ? (
                  <View style={styles.assistantActions}>
                    {placeCites[0] ? (
                      <Pressable
                        onPress={() =>
                          void addPlaceToActivePlan(placeCites[0].entityId)
                        }
                      >
                        <Text style={styles.savePlan}>{t('hubAddToPlan')}</Text>
                      </Pressable>
                    ) : null}
                    <Pressable onPress={goMenu}>
                      <Text style={styles.savePlan}>{t('hubBackMenu')}</Text>
                    </Pressable>
                    <Pressable onPress={() => void report(item.id)}>
                      <Text style={styles.report}>{t('report')}</Text>
                    </Pressable>
                  </View>
                ) : null}
              </View>
            );
          }}
        />
      ) : null}

      {showComposer ? (
        <View
          style={[
            styles.composer,
            { paddingBottom: Math.max(insets.bottom, 16) },
          ]}
        >
          <View
            style={[
              styles.inputRow,
              { flexDirection: isRtl ? 'row-reverse' : 'row' },
            ]}
          >
            <TextInput
              style={[
                styles.input,
                { textAlign: isRtl ? 'right' : 'left', writingDirection: isRtl ? 'rtl' : 'ltr' },
              ]}
              placeholder={t('chatHint')}
              placeholderTextColor={colors.muted}
              value={text}
              onChangeText={setText}
              editable={!busy}
              multiline
              blurOnSubmit={false}
              scrollEnabled
            />
            <Pressable
              style={[styles.send, (busy || !text.trim()) && { opacity: 0.45 }]}
              disabled={busy || !text.trim()}
              onPress={() => void send(text)}
              accessibilityLabel={t('send')}
            >
              <Ionicons
                name="send"
                size={16}
                color="#fff"
                style={{ transform: [{ scaleX: isRtl ? -1 : 1 }] }}
              />
            </Pressable>
          </View>
        </View>
      ) : null}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  topBar: {
    paddingHorizontal: 16,
    paddingTop: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  topBarLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  historyBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.chip,
    alignItems: 'center',
    justifyContent: 'center',
  },
  historyBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'flex-start',
    paddingTop: 72,
    paddingHorizontal: 16,
  },
  historyCard: {
    backgroundColor: colors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
    gap: 10,
  },
  historyTitle: { fontSize: 16, fontWeight: '800', color: colors.ink },
  historyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  historyRowMain: { flex: 1, gap: 2 },
  historyRowTitle: { color: colors.ink, fontWeight: '700' },
  historyRowDate: { color: colors.muted, fontSize: 11 },
  link: { color: colors.brand, fontWeight: '700' },
  modeChipRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  modeChip: {
    backgroundColor: colors.chip,
    color: colors.brandDark,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    overflow: 'hidden',
    fontSize: 12,
    fontWeight: '700',
  },
  hubPad: { padding: 16, gap: 12, paddingBottom: 40 },
  dateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: colors.chip,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  dateBtnText: { color: colors.ink, fontWeight: '700', fontSize: 15 },
  hubHello: { fontSize: 22, fontWeight: '800', color: colors.ink },
  hubSub: { color: colors.muted, lineHeight: 20, marginBottom: 4 },
  hubPrimary: {
    backgroundColor: colors.brand,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  hubPrimaryText: { color: '#fff', fontWeight: '800' },
  hubBtn: {
    backgroundColor: colors.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: 14,
    paddingHorizontal: 14,
  },
  hubBtnText: { color: colors.ink, fontWeight: '700', fontSize: 15 },
  hubLink: {
    color: colors.brand,
    fontWeight: '700',
    textAlign: 'center',
    marginTop: 8,
  },
  sectionLabel: { color: colors.ink, fontWeight: '700', marginTop: 4 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  choiceChip: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: colors.card,
  },
  choiceChipOn: { backgroundColor: colors.brand, borderColor: colors.brand },
  choiceChipText: { color: colors.ink, fontWeight: '700', fontSize: 13 },
  choiceChipTextOn: { color: '#fff' },
  needsInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 12,
    minHeight: 72,
    color: colors.ink,
    backgroundColor: colors.card,
    textAlignVertical: 'top',
  },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    gap: 12,
  },
  confirmCard: {
    backgroundColor: colors.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
    gap: 8,
  },
  confirmLine: { color: colors.ink, fontWeight: '600' },
  candidateCard: {
    backgroundColor: colors.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
    gap: 6,
  },
  picksStrip: { gap: 12, paddingVertical: 4, paddingRight: 8 },
  candidateCardH: {
    width: 260,
    backgroundColor: colors.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
    gap: 6,
  },
  candidateIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: colors.chip,
    alignItems: 'center',
    justifyContent: 'center',
  },
  candidateRec: { borderColor: colors.brand, borderWidth: 2 },
  badge: {
    alignSelf: 'flex-start',
    backgroundColor: colors.chip,
    color: colors.brandDark,
    fontSize: 11,
    fontWeight: '800',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    overflow: 'hidden',
  },
  candidateTitle: { fontSize: 17, fontWeight: '800', color: colors.ink },
  candidateSum: { color: colors.muted },
  candidateWhy: { color: colors.brandDark, fontWeight: '600', fontSize: 13 },
  bubble: { borderRadius: 14, padding: 12, gap: 6 },
  user: { alignSelf: 'flex-end', backgroundColor: colors.brand, maxWidth: '85%' },
  assistant: {
    alignSelf: 'flex-start',
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    maxWidth: '92%',
  },
  userText: { color: '#fff' },
  assistantText: { color: colors.ink },
  meta: { fontSize: 12, color: colors.muted },
  citations: { gap: 6, marginTop: 4 },
  placeBtn: {
    alignSelf: 'flex-start',
    backgroundColor: colors.chip,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  cite: { color: colors.brand, fontSize: 13, fontWeight: '700' },
  assistantActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 4,
  },
  savePlan: { color: colors.brand, fontSize: 12, fontWeight: '700' },
  report: { color: colors.danger, fontSize: 12 },
  composer: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.card,
    paddingHorizontal: 12,
    paddingTop: 10,
  },
  inputRow: {
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.bg,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    paddingLeft: 12,
    paddingRight: 6,
    paddingVertical: 4,
    minHeight: 48,
    maxHeight: 120,
  },
  input: {
    flex: 1,
    minHeight: 40,
    maxHeight: 96,
    paddingVertical: 8,
    paddingRight: 4,
    color: colors.ink,
    fontSize: 15,
  },
  send: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.brand,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  sendText: { color: '#fff', fontWeight: '800' },
});
