import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  Pressable,
  StyleSheet,
  RefreshControl,
  Alert,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { CompositeNavigationProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { apiFetch } from '../api/client';
import { colors } from '../theme';
import type { MainTabParamList, RootStackParamList } from '../navigation/types';

type PlanStep = { id: string };

type ClientPlan = {
  id: string;
  title: string;
  status: string;
  steps?: PlanStep[];
  tripStartsOn?: string | null;
  tripEndsOn?: string | null;
};

type Nav = CompositeNavigationProp<
  BottomTabNavigationProp<MainTabParamList, 'SavedTab'>,
  NativeStackNavigationProp<RootStackParamList>
>;

function formatTripDates(plan: ClientPlan) {
  if (!plan.tripStartsOn) return null;
  const start = new Date(plan.tripStartsOn);
  const startLabel = start.toLocaleDateString(undefined, {
    day: 'numeric',
    month: 'short',
  });
  if (!plan.tripEndsOn || plan.tripEndsOn === plan.tripStartsOn) {
    return startLabel;
  }
  const end = new Date(plan.tripEndsOn);
  const endLabel = end.toLocaleDateString(undefined, {
    day: 'numeric',
    month: 'short',
  });
  return `${startLabel} – ${endLabel}`;
}

export function SavedScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation<Nav>();
  const [plans, setPlans] = useState<ClientPlan[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    const plansRes = await apiFetch<ClientPlan[]>('/v1/me/plans').catch(
      () => [] as ClientPlan[],
    );
    setPlans(plansRes);
  }, []);

  useFocusEffect(
    useCallback(() => {
      void load().catch(() => setPlans([]));
    }, [load]),
  );

  const removePlan = (plan: ClientPlan) => {
    Alert.alert(t('removePlan'), t('removePlanConfirm'), [
      { text: t('cancel'), style: 'cancel' },
      {
        text: t('delete'),
        style: 'destructive',
        onPress: () => {
          void (async () => {
            try {
              await apiFetch(`/v1/me/plans/${plan.id}`, { method: 'DELETE' });
              await load();
            } catch (e) {
              Alert.alert(t('error'), e instanceof Error ? e.message : String(e));
            }
          })();
        },
      },
    ]);
  };

  return (
    <FlatList
      style={styles.screen}
      contentContainerStyle={styles.content}
      data={plans}
      keyExtractor={(item) => item.id}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={async () => {
            setRefreshing(true);
            try {
              await load();
            } finally {
              setRefreshing(false);
            }
          }}
        />
      }
      ListEmptyComponent={
        <View style={styles.emptyWrap}>
          <Ionicons name="map-outline" size={40} color={colors.muted} />
          <Text style={styles.empty}>{t('noPlansYet')}</Text>
        </View>
      }
      renderItem={({ item }) => {
        const dates = formatTripDates(item);
        return (
          <Pressable
            style={styles.card}
            onPress={() =>
              navigation.navigate('PlanTimeline', { planId: item.id })
            }
            onLongPress={() => removePlan(item)}
          >
            <View style={{ flex: 1, gap: 4 }}>
              <View style={styles.rowBetween}>
                <Text style={styles.title} numberOfLines={1}>
                  {item.title}
                </Text>
                <View
                  style={[
                    styles.badge,
                    item.status === 'ACTIVE'
                      ? styles.badgeActive
                      : styles.badgeDraft,
                  ]}
                >
                  <Text
                    style={[
                      styles.badgeText,
                      item.status === 'ACTIVE'
                        ? styles.badgeTextActive
                        : styles.badgeTextDraft,
                    ]}
                  >
                    {item.status === 'ACTIVE' ? t('activePlan') : t('draftPlan')}
                  </Text>
                </View>
              </View>
              <Text style={styles.sub}>
                {item.steps?.length
                  ? `${item.steps.length} ${t('steps')}`
                  : t('planStepGeneric')}
                {dates ? ` · ${dates}` : ''}
              </Text>
            </View>
            <Pressable
              hitSlop={10}
              style={styles.trashBtn}
              onPress={() => removePlan(item)}
              accessibilityRole="button"
              accessibilityLabel={t('removePlan')}
            >
              <Ionicons name="trash-outline" size={18} color={colors.danger} />
            </Pressable>
          </Pressable>
        );
      }}
    />
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { padding: 16, gap: 10, flexGrow: 1 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: colors.card,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border,
  },
  rowBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  title: { fontWeight: '700', color: colors.ink, flex: 1, fontSize: 15 },
  sub: { color: colors.muted, marginTop: 2, fontSize: 13 },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  badgeActive: { backgroundColor: colors.chip },
  badgeDraft: { backgroundColor: colors.border },
  badgeText: { fontSize: 11, fontWeight: '800' },
  badgeTextActive: { color: colors.brandDark },
  badgeTextDraft: { color: colors.muted },
  trashBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyWrap: {
    alignItems: 'center',
    gap: 10,
    marginTop: 60,
  },
  empty: { textAlign: 'center', color: colors.muted },
});
