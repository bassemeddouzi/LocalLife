import React, { useCallback, useMemo, useState } from 'react';
import {
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { apiFetch } from '../../api/client';
import { guideStyles } from './shared/guideStyles';
import { StatusBadge } from './shared/StatusBadge';
import {
  ActivityItem,
  ActivityKind,
  flattenSubmissions,
  GuideSubmissions,
} from './shared/submissions';
import type { GuideActivityStackParamList } from './GuideActivityStack';

type Props = NativeStackScreenProps<GuideActivityStackParamList, 'ActivityList'>;

export function GuideActivityScreen({ navigation }: Props) {
  const { t } = useTranslation();
  const [items, setItems] = useState<ActivityItem[]>([]);
  const [filter, setFilter] = useState<'all' | ActivityKind>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const data = await apiFetch<GuideSubmissions>(
        '/v1/guides/me/submissions',
      );
      setItems(flattenSubmissions(data));
    } catch {
      setItems([]);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  const filtered = useMemo(() => {
    return items.filter((i) => {
      if (filter !== 'all' && i.kind !== filter) return false;
      if (statusFilter !== 'all') {
        const s = i.status.toUpperCase();
        if (statusFilter === 'PENDING' && (s === 'APPROVED' || s === 'PUBLISHED' || s === 'REJECTED')) {
          return false;
        }
        if (statusFilter === 'APPROVED' && s !== 'APPROVED' && s !== 'PUBLISHED') {
          return false;
        }
        if (statusFilter === 'REJECTED' && s !== 'REJECTED') return false;
      }
      return true;
    });
  }, [items, filter, statusFilter]);

  const filters: Array<{ key: 'all' | ActivityKind; label: string }> = [
    { key: 'all', label: t('all') },
    { key: 'place', label: t('places') },
    { key: 'tip', label: t('tips') },
    { key: 'event', label: t('events') },
    { key: 'experience', label: t('experiences') },
    { key: 'business', label: t('business') },
  ];

  return (
    <ScrollView
      contentContainerStyle={guideStyles.page}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => {
            setRefreshing(true);
            void load().finally(() => setRefreshing(false));
          }}
        />
      }
    >
      <Text style={guideStyles.h1}>{t('guideActivityTitle')}</Text>
      <Text style={guideStyles.muted}>{t('guideActivitySubtitle')}</Text>
      <View style={guideStyles.row}>
        {filters.map((f) => (
          <Pressable
            key={f.key}
            style={[guideStyles.chip, filter === f.key && guideStyles.chipOn]}
            onPress={() => setFilter(f.key)}
          >
            <Text
              style={[
                guideStyles.chipText,
                filter === f.key && guideStyles.chipTextOn,
              ]}
            >
              {f.label}
            </Text>
          </Pressable>
        ))}
      </View>
      <View style={guideStyles.row}>
        {(['all', 'PENDING', 'APPROVED', 'REJECTED'] as const).map((s) => (
          <Pressable
            key={s}
            style={[guideStyles.chip, statusFilter === s && guideStyles.chipOn]}
            onPress={() => setStatusFilter(s)}
          >
            <Text
              style={[
                guideStyles.chipText,
                statusFilter === s && guideStyles.chipTextOn,
              ]}
            >
              {s === 'all' ? t('anyStatus') : t(s.toLowerCase())}
            </Text>
          </Pressable>
        ))}
      </View>
      {filtered.length === 0 ? (
        <Text style={guideStyles.muted}>{t('noSubmissionsYet')}</Text>
      ) : (
        filtered.map((item) => (
          <Pressable
            key={`${item.kind}-${item.id}`}
            style={guideStyles.card}
            onPress={() =>
              navigation.navigate('ActivityDetail', { item })
            }
          >
            <Text style={guideStyles.cardTitle}>
              {item.kind} · {item.title}
            </Text>
            {item.subtitle ? (
              <Text style={guideStyles.muted} numberOfLines={2}>
                {item.subtitle}
              </Text>
            ) : null}
            <StatusBadge status={item.status} />
          </Pressable>
        ))
      )}
    </ScrollView>
  );
}
