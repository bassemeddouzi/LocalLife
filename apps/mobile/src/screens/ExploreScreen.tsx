import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  Pressable,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { apiFetch } from '../api/client';
import { useCity } from '../context/CityContext';
import { colors } from '../theme';
import type { RootStackParamList } from '../navigation/types';

type Place = {
  id: string;
  name: string;
  summary: string;
  primaryCategory?: { name: string } | null;
};

type Nav = NativeStackNavigationProp<RootStackParamList, 'Search'>;

export function ExploreScreen() {
  const { t } = useTranslation();
  const { city } = useCity();
  const navigation = useNavigation<Nav>();
  const route = useRoute<RouteProp<RootStackParamList, 'Search'>>();
  const [q, setQ] = useState(route.params?.q ?? '');
  const [page, setPage] = useState(1);
  const [items, setItems] = useState<Place[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const categoryId = route.params?.categoryId;

  const load = useCallback(
    async (pageNum: number, replace: boolean) => {
      if (!city) return;
      setLoading(true);
      setError(null);
      try {
        if (q.trim() && !categoryId) {
          const params = new URLSearchParams({
            cityId: city.id,
            q: q.trim(),
          });
          const res = await apiFetch<{
            places: Place[];
            events: Array<{ id: string; title: string }>;
          }>(`/v1/search?${params.toString()}`);
          const mapped = (res.places ?? []).map((p) => ({
            ...p,
            summary: p.summary ?? '',
          }));
          setItems(mapped);
          setTotalPages(1);
          setPage(1);
          return;
        }
        const params = new URLSearchParams({
          cityId: city.id,
          page: String(pageNum),
          pageSize: '20',
        });
        if (q.trim()) params.set('q', q.trim());
        if (categoryId) params.set('categoryId', categoryId);
        const res = await apiFetch<{
          data: Place[];
          meta: { totalPages: number };
        }>(`/v1/places?${params.toString()}`, { auth: false });
        setItems((prev) => (replace ? res.data : [...prev, ...res.data]));
        setTotalPages(res.meta.totalPages);
        setPage(pageNum);
      } catch (e) {
        setError(e instanceof Error ? e.message : String(e));
      } finally {
        setLoading(false);
      }
    },
    [city, q, categoryId],
  );

  useEffect(() => {
    void load(1, true);
  }, [load]);

  return (
    <View style={styles.screen}>
      <TextInput
        style={styles.search}
        placeholder={t('searchPlaceholder')}
        placeholderTextColor={colors.muted}
        value={q}
        onChangeText={setQ}
        onSubmitEditing={() => void load(1, true)}
        returnKeyType="search"
        autoFocus
      />
      {error ? <Text style={styles.err}>{error}</Text> : null}
      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 16, gap: 10 }}
        ListEmptyComponent={
          !loading ? (
            <Text style={styles.empty}>{t('empty')}</Text>
          ) : null
        }
        renderItem={({ item }) => (
          <Pressable
            style={styles.card}
            onPress={() =>
              navigation.navigate('PlaceDetail', { placeId: item.id })
            }
          >
            <Text style={styles.title}>{item.name}</Text>
            <Text style={styles.sub} numberOfLines={2}>
              {item.summary}
            </Text>
            {item.primaryCategory ? (
              <Text style={styles.cat}>{item.primaryCategory.name}</Text>
            ) : null}
          </Pressable>
        )}
        onEndReached={() => {
          if (!loading && page < totalPages) void load(page + 1, false);
        }}
        ListFooterComponent={
          loading ? (
            <ActivityIndicator color={colors.brand} style={{ margin: 16 }} />
          ) : null
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  search: {
    margin: 16,
    marginBottom: 0,
    backgroundColor: colors.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 12,
    color: colors.ink,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border,
  },
  title: { fontWeight: '700', color: colors.ink },
  sub: { color: colors.muted, marginTop: 4 },
  cat: { marginTop: 6, color: colors.brand, fontSize: 12, fontWeight: '600' },
  empty: { textAlign: 'center', color: colors.muted, marginTop: 40 },
  err: { color: colors.danger, marginHorizontal: 16 },
});
