import React from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  Image,
  Alert,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { colors } from '../theme';
import type { RootStackParamList } from '../navigation/types';
import type { PlanStepView } from './PlanTimelineScreen';
import { navigateToAiChat } from '../navigation/rootNavigation';

type Nav = NativeStackNavigationProp<RootStackParamList, 'PlanStepDetail'>;

function stepKind(step: PlanStepView): string {
  if (step.kind) return step.kind;
  if (step.whyJson && typeof step.whyJson === 'object' && 'kind' in step.whyJson) {
    return String((step.whyJson as { kind?: string }).kind ?? 'PLACE');
  }
  if (step.transportNote && !step.placeId) return 'TRANSPORT';
  return 'PLACE';
}

export function PlanStepDetailScreen() {
  const { t } = useTranslation();
  const route = useRoute<RouteProp<RootStackParamList, 'PlanStepDetail'>>();
  const navigation = useNavigation<Nav>();
  const step = route.params.step;
  const kind = stepKind(step);
  const place = step.place;

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
    >
      <Text style={styles.planTitle}>{route.params.planTitle}</Text>
      <Text style={styles.kind}>{kind}</Text>
      <Text style={styles.title}>
        {place?.name || step.freeText || t('planStepGeneric')}
      </Text>

      {place?.photos?.[0]?.url ? (
        <Image source={{ uri: place.photos[0].url }} style={styles.hero} />
      ) : null}

      {step.freeText ? (
        <View style={styles.block}>
          <Text style={styles.label}>{t('planStepWhat')}</Text>
          <Text style={styles.body}>{step.freeText}</Text>
        </View>
      ) : null}

      {step.transportNote ? (
        <View style={styles.block}>
          <Text style={styles.label}>{t('planStepTransport')}</Text>
          <Text style={styles.body}>{step.transportNote}</Text>
        </View>
      ) : null}

      {step.durationMin ? (
        <View style={styles.block}>
          <Text style={styles.label}>{t('planStepDuration')}</Text>
          <Text style={styles.body}>
            ~{step.durationMin} {t('minutesShort')}
          </Text>
        </View>
      ) : null}

      {step.whyJson &&
      typeof step.whyJson === 'object' &&
      'reason' in step.whyJson &&
      (step.whyJson as { reason?: string }).reason ? (
        <View style={styles.block}>
          <Text style={styles.label}>{t('reasons')}</Text>
          <Text style={styles.body}>
            {(step.whyJson as { reason?: string }).reason}
          </Text>
        </View>
      ) : null}

      {place ? (
        <View style={styles.block}>
          <Text style={styles.label}>{t('placeSummary')}</Text>
          <Text style={styles.body}>{place.summary}</Text>
          {place.primaryCategory ? (
            <Text style={styles.cat}>{place.primaryCategory.name}</Text>
          ) : null}
        </View>
      ) : null}

      {step.placeId || place?.id ? (
        <Pressable
          style={styles.cta}
          onPress={() =>
            navigation.navigate('PlaceDetail', {
              placeId: (step.placeId || place?.id) as string,
            })
          }
        >
          <Text style={styles.ctaText}>{t('openPlaceDetails')}</Text>
        </Pressable>
      ) : (
        <Text style={styles.muted}>{t('planStepNoPlace')}</Text>
      )}

      {step.placeId || place?.id ? (
        <Pressable
          style={styles.ctaAlt}
          onPress={() =>
            navigation.navigate('RatingTarget', {
              targetType: 'PLACE',
              targetId: (step.placeId || place?.id) as string,
              title: place?.name || step.freeText || t('planStepPlace'),
            })
          }
        >
          <Text style={styles.ctaAltText}>{t('rateThisPlace')}</Text>
        </Pressable>
      ) : null}

      {step.whyJson?.leg?.systemId ? (
        <Pressable
          style={styles.ctaAlt}
          onPress={() =>
            navigation.navigate('RatingTarget', {
              targetType: 'TRANSPORT_SYSTEM',
              targetId: step.whyJson!.leg!.systemId as string,
              title: step.whyJson?.leg?.name || t('planStepTransport'),
            })
          }
        >
          <Text style={styles.ctaAltText}>{t('rateThisTransport')}</Text>
        </Pressable>
      ) : null}

      {step.placeId || place?.id ? (
        <Pressable
          style={styles.ctaAlt}
          onPress={() =>
            navigateToAiChat({
              mode: 'info',
              placeId: (step.placeId || place?.id) as string,
              placeName: place?.name || step.freeText || undefined,
              preset: t('askAboutPlacePreset', {
                name: place?.name || step.freeText || 'this place',
              }),
            })
          }
        >
          <Text style={styles.ctaAltText}>{t('hubAskAiAboutPlace')}</Text>
        </Pressable>
      ) : null}

      {step.whyJson?.leg ? (
        <Pressable
          style={styles.ctaAlt}
          onPress={() => {
            navigation.goBack();
            Alert.alert(t('changeTransport'), t('hubChangeTransportHint'));
          }}
        >
          <Text style={styles.ctaAltText}>{t('changeTransport')}</Text>
        </Pressable>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { padding: 20, gap: 14, paddingBottom: 40 },
  planTitle: { color: colors.muted, fontWeight: '600' },
  kind: {
    alignSelf: 'flex-start',
    backgroundColor: colors.chip,
    color: colors.brandDark,
    fontWeight: '800',
    fontSize: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    overflow: 'hidden',
  },
  title: { fontSize: 26, fontWeight: '800', color: colors.ink },
  hero: {
    width: '100%',
    height: 180,
    borderRadius: 16,
    backgroundColor: colors.border,
  },
  block: {
    backgroundColor: colors.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
    gap: 6,
  },
  label: { fontWeight: '800', color: colors.ink, fontSize: 13 },
  body: { color: colors.ink, lineHeight: 22 },
  cat: { color: colors.brand, fontWeight: '700', marginTop: 4 },
  cta: {
    backgroundColor: colors.brand,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  ctaText: { color: '#fff', fontWeight: '800', fontSize: 16 },
  ctaAlt: {
    backgroundColor: colors.card,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.brand,
  },
  ctaAltText: { color: colors.brand, fontWeight: '800', fontSize: 15 },
  muted: { color: colors.muted, textAlign: 'center', marginTop: 8 },
});
