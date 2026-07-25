import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  Pressable,
  StyleSheet,
  RefreshControl,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { CompositeNavigationProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { apiFetch } from '../api/client';
import { colors } from '../theme';
import type { MainTabParamList, RootStackParamList } from '../navigation/types';

type Favorite = {
  id: string;
  targetType: string;
  targetId: string;
};

type Place = { id: string; name: string; summary: string };

type Nav = CompositeNavigationProp<
  BottomTabNavigationProp<MainTabParamList, 'SavedTab'>,
  NativeStackNavigationProp<RootStackParamList>
>;

export function SavedScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation<Nav>();
  const [items, setItems] = useState<Array<Favorite & { place?: Place }>>([]);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    const favs = await apiFetch<Favorite[]>('/v1/me/favorites');
    const places = await Promise.all(
      favs
        .filter((f) => f.targetType === 'PLACE')
        .map(async (f) => {
          try {
            const place = await apiFetch<Place>(`/v1/places/${f.targetId}`, {
              auth: false,
            });
            return { ...f, place };
          } catch {
            return { ...f };
          }
        }),
    );
    setItems(places);
  }, []);

  useFocusEffect(
    useCallback(() => {
      void load().catch(() => setItems([]));
    }, [load]),
  );

  return (
    <FlatList
      style={{ flex: 1, backgroundColor: colors.bg }}
      contentContainerStyle={{ padding: 16, gap: 10 }}
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
        <Text style={styles.empty}>{t('noFavorites')}</Text>
      }
      renderItem={({ item }) => (
        <Pressable
          style={styles.card}
          onPress={() => {
            if (item.place) {
              navigation.navigate('PlaceDetail', { placeId: item.place.id });
            }
          }}
        >
          <Text style={styles.title}>
            {item.place?.name ?? item.targetId.slice(0, 8)}
          </Text>
          <Text style={styles.sub} numberOfLines={2}>
            {item.place?.summary ?? item.targetType}
          </Text>
        </Pressable>
      )}
    />
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border,
  },
  title: { fontWeight: '700', color: colors.ink },
  sub: { color: colors.muted, marginTop: 4 },
  empty: { textAlign: 'center', color: colors.muted, marginTop: 40 },
});
