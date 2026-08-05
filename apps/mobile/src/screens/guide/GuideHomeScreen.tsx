import React, { useCallback, useState } from 'react';
import {
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { apiFetch } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { useCity } from '../../context/CityContext';
import { guideStyles } from './shared/guideStyles';
import {
  countByStatus,
  flattenSubmissions,
  GuideSubmissions,
} from './shared/submissions';
import { useTranslation } from 'react-i18next';

const STALE_MS = 30 * 24 * 60 * 60 * 1000;

export function GuideHomeScreen() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { city } = useCity();
  const navigation = useNavigation();
  const [status, setStatus] = useState('…');
  const [zoneName, setZoneName] = useState<string | null>(null);
  const [counts, setCounts] = useState({
    pending: 0,
    approved: 0,
    rejected: 0,
    total: 0,
  });
  const [staleCount, setStaleCount] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const profile = await apiFetch<{
        status?: string;
        assignmentLevel?: string | null;
        baseCity?: { name?: string } | null;
        primaryDistrict?: { name?: string } | null;
        hood?: { name?: string } | null;
        region?: { name?: string } | null;
        country?: { name?: string } | null;
      } | null>('/v1/guides/me');
      setStatus(profile?.status ?? 'none');
      if (profile) {
        const level = profile.assignmentLevel ?? 'DISTRICT';
        const name =
          profile.hood?.name ??
          profile.primaryDistrict?.name ??
          profile.baseCity?.name ??
          profile.region?.name ??
          profile.country?.name ??
          city?.name ??
          '—';
        setZoneName(`${level} · ${name}`);
      } else if (city?.name) {
        setZoneName(city.name);
      }

      const subs = await apiFetch<GuideSubmissions>(
        '/v1/guides/me/submissions',
      );
      const flat = flattenSubmissions(subs);
      setCounts(countByStatus(flat));
      const cutoff = Date.now() - STALE_MS;
      setStaleCount(
        flat.filter((item) => new Date(item.createdAt).getTime() < cutoff)
          .length,
      );
    } catch {
      setStatus('error');
    }
  }, [city]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  return (
    <ScrollView
      contentContainerStyle={guideStyles.page}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={() => void onRefresh()} />
      }
    >
      <Text style={guideStyles.h1}>{t('guideHomeTitle')}</Text>
      <Text style={guideStyles.muted}>
        {user?.displayName} · {status}
      </Text>
      <Text style={guideStyles.body}>
        {t('guideHomeZoneLine', { zone: zoneName ?? '—' })}
      </Text>

      {staleCount > 0 ? (
        <Text style={[guideStyles.muted, { color: '#b45309' }]}>
          {t('guideStaleHint', { count: staleCount })}
        </Text>
      ) : null}

      <View style={guideStyles.statRow}>
        <View style={guideStyles.stat}>
          <Text style={guideStyles.statNum}>{counts.pending}</Text>
          <Text style={guideStyles.muted}>{t('pending')}</Text>
        </View>
        <View style={guideStyles.stat}>
          <Text style={guideStyles.statNum}>{counts.approved}</Text>
          <Text style={guideStyles.muted}>{t('approved')}</Text>
        </View>
        <View style={guideStyles.stat}>
          <Text style={guideStyles.statNum}>{counts.rejected}</Text>
          <Text style={guideStyles.muted}>{t('rejected')}</Text>
        </View>
      </View>

      <Text style={guideStyles.h2}>{t('guideShortcuts')}</Text>
      <Pressable
        style={guideStyles.hubItem}
        onPress={() =>
          // @ts-expect-error nested nav
          navigation.navigate('GuideAdd', { screen: 'PlaceForm' })
        }
      >
        <Text style={guideStyles.hubTitle}>{t('guideAddPlaceCta')}</Text>
        <Text style={guideStyles.hubSub}>{t('guideAddPlaceHint')}</Text>
      </Pressable>
      <Pressable
        style={guideStyles.hubItem}
        onPress={() =>
          // @ts-expect-error nested nav
          navigation.navigate('GuideAdd', {
            screen: 'TransportScenarioForm',
          })
        }
      >
        <Text style={guideStyles.hubTitle}>{t('guideTransportTipCta')}</Text>
        <Text style={guideStyles.hubSub}>{t('guideTransportTipHint')}</Text>
      </Pressable>
      <Pressable
        style={guideStyles.hubItem}
        onPress={() =>
          // @ts-expect-error nested nav
          navigation.navigate('GuideActivity')
        }
      >
        <Text style={guideStyles.hubTitle}>{t('guideActivityTitle')}</Text>
        <Text style={guideStyles.hubSub}>
          {t('activityCount', { count: counts.total })}
        </Text>
      </Pressable>
    </ScrollView>
  );
}
