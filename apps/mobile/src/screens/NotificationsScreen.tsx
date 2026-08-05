import React, { useCallback, useState } from 'react';
import {
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useFocusEffect } from '@react-navigation/native';
import { apiFetch } from '../api/client';
import { colors } from '../theme';

type NotificationItem = {
  id: string;
  type: string;
  title: string;
  body: string;
  createdAt: string;
  readAt?: string | null;
};

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}

export function NotificationsScreen() {
  const { t } = useTranslation();
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    const rows = await apiFetch<NotificationItem[]>(
      '/v1/me/notifications',
    ).catch(() => [] as NotificationItem[]);
    setItems(rows);
  }, []);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  const markRead = async (item: NotificationItem) => {
    if (item.readAt) return;
    setItems((prev) =>
      prev.map((n) =>
        n.id === item.id ? { ...n, readAt: new Date().toISOString() } : n,
      ),
    );
    try {
      await apiFetch(`/v1/me/notifications/${item.id}/read`, {
        method: 'PATCH',
      });
    } catch {
      // best-effort
    }
  };

  return (
    <FlatList
      style={styles.screen}
      contentContainerStyle={styles.content}
      data={items}
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
        <Text style={styles.empty}>{t('noNotifications')}</Text>
      }
      renderItem={({ item }) => (
        <Pressable
          style={[styles.card, !item.readAt && styles.cardUnread]}
          onPress={() => void markRead(item)}
        >
          <View style={styles.cardHeader}>
            <Text style={styles.title}>{item.title}</Text>
            {!item.readAt ? <View style={styles.dot} /> : null}
          </View>
          <Text style={styles.body}>{item.body}</Text>
          <Text style={styles.date}>{formatDate(item.createdAt)}</Text>
        </Pressable>
      )}
    />
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { padding: 16, gap: 10, flexGrow: 1 },
  card: {
    backgroundColor: colors.card,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 4,
  },
  cardUnread: { borderColor: colors.brand, backgroundColor: colors.chip },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.brand,
  },
  title: { fontWeight: '700', color: colors.ink, flex: 1 },
  body: { color: colors.muted },
  date: { color: colors.muted, fontSize: 12, marginTop: 2 },
  empty: {
    textAlign: 'center',
    color: colors.muted,
    marginTop: 60,
  },
});
