import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Pressable,
  Alert,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import { apiFetch } from '../api/client';
import {
  ClientRatingForm,
  type RatingTargetType,
} from '../components/ClientRatingForm';
import { colors } from '../theme';
import type { RootStackParamList } from '../navigation/types';

type RatingRow = {
  id: string;
  rating: number;
  body?: string | null;
  user?: { displayName?: string };
};

export function RatingTargetScreen() {
  const { t } = useTranslation();
  const route = useRoute<RouteProp<RootStackParamList, 'RatingTarget'>>();
  const { targetType, targetId, title } = route.params;
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<{
    average: number | null;
    count: number;
  } | null>(null);
  const [rows, setRows] = useState<RatingRow[]>([]);
  const [detail, setDetail] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiFetch<{
        data: RatingRow[];
        summary: { average: number | null; count: number };
      }>(
        `/v1/ratings?targetType=${targetType}&targetId=${targetId}`,
      );
      setRows(res.data ?? []);
      setSummary(res.summary ?? null);

      if (targetType === 'TRANSPORT_SYSTEM') {
        const sys = await apiFetch<{
          name: string;
          mode: string;
          summary: string;
          howItWorks?: string | null;
        }>(`/v1/transport-systems/${targetId}`, { auth: false });
        setDetail(
          `${sys.mode} · ${sys.summary}${sys.howItWorks ? `\n${sys.howItWorks}` : ''}`,
        );
      } else {
        setDetail(null);
      }
    } catch (e) {
      Alert.alert(t('error'), e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, [targetType, targetId, t]);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.brand} />
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.type}>{targetType.replace('_', ' ')}</Text>
      {detail ? <Text style={styles.detail}>{detail}</Text> : null}
      {summary ? (
        <Text style={styles.summary}>
          {summary.average != null
            ? `★ ${summary.average} · ${summary.count} ${t('reviews')}`
            : t('noRatingsYet')}
        </Text>
      ) : null}

      <Text style={styles.section}>{t('rateAfterTry')}</Text>
      <ClientRatingForm
        targetType={targetType as RatingTargetType}
        targetId={targetId}
        onSaved={() => void load()}
      />

      <Text style={styles.section}>{t('reviews')}</Text>
      {rows.length === 0 ? (
        <Text style={styles.muted}>{t('noRatingsYet')}</Text>
      ) : (
        rows.map((r) => (
          <View key={r.id} style={styles.card}>
            <Text style={styles.rating}>
              ★ {r.rating}
              {r.user?.displayName ? ` · ${r.user.displayName}` : ''}
            </Text>
            {r.body ? <Text style={styles.body}>{r.body}</Text> : null}
          </View>
        ))
      )}
    </ScrollView>
  );
}

/** Compact list entry used on Profile */
export function RateShortcut({
  label,
  targetType,
  targetId,
  onPress,
}: {
  label: string;
  targetType: RatingTargetType;
  targetId: string;
  onPress: () => void;
}) {
  return (
    <Pressable style={styles.shortcut} onPress={onPress}>
      <Text style={styles.shortcutText}>{label}</Text>
      <Text style={styles.shortcutType}>{targetType}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  content: { padding: 20, gap: 12, paddingBottom: 40, backgroundColor: colors.bg },
  title: { fontSize: 24, fontWeight: '800', color: colors.ink },
  type: {
    alignSelf: 'flex-start',
    backgroundColor: colors.chip,
    color: colors.brandDark,
    fontWeight: '800',
    fontSize: 11,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    overflow: 'hidden',
  },
  detail: { color: colors.muted, lineHeight: 20 },
  summary: { fontWeight: '700', color: colors.ink },
  section: { marginTop: 8, fontWeight: '800', fontSize: 16, color: colors.ink },
  muted: { color: colors.muted },
  card: {
    backgroundColor: colors.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 12,
    gap: 4,
  },
  rating: { fontWeight: '700', color: colors.ink },
  body: { color: colors.muted },
  shortcut: {
    backgroundColor: colors.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 12,
    marginBottom: 8,
  },
  shortcutText: { fontWeight: '700', color: colors.ink },
  shortcutType: { color: colors.muted, fontSize: 12, marginTop: 2 },
});
