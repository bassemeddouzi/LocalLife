import React from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { guideStyles } from './shared/guideStyles';
import type { GuideAddStackParamList } from './GuideAddStack';

type Props = NativeStackScreenProps<GuideAddStackParamList, 'AddHub'>;

export function GuideAddHubScreen({ navigation }: Props) {
  const { t } = useTranslation();

  const items: Array<{
    title: string;
    sub: string;
    onPress: () => void;
  }> = [
    {
      title: t('guideAddPlace'),
      sub: t('guideAddPlaceSub'),
      onPress: () => navigation.navigate('PlaceForm'),
    },
    {
      title: t('guideAddTip'),
      sub: t('guideAddTipSub'),
      onPress: () => navigation.navigate('TipForm', {}),
    },
    {
      title: t('guideAddTransportScenario'),
      sub: t('guideAddTransportScenarioSub'),
      onPress: () => navigation.navigate('TransportScenarioForm'),
    },
    {
      title: t('guideAddZoneSafety'),
      sub: t('guideAddZoneSafetySub'),
      onPress: () => navigation.navigate('ZoneSafetyForm'),
    },
    {
      title: t('guideAddTransport'),
      sub: t('guideAddTransportSub'),
      onPress: () =>
        navigation.navigate('TipForm', { categoryKey: 'transport' }),
    },
    {
      title: t('guideAddEvent'),
      sub: t('guideAddEventSub'),
      onPress: () => navigation.navigate('EventForm'),
    },
    {
      title: t('guideAddExperience'),
      sub: t('guideAddExperienceSub'),
      onPress: () => navigation.navigate('ExperienceForm'),
    },
    {
      title: t('guideAddBusiness'),
      sub: t('guideAddBusinessSub'),
      onPress: () => navigation.navigate('BusinessForm'),
    },
  ];

  return (
    <ScrollView contentContainerStyle={guideStyles.page}>
      <Text style={guideStyles.h1}>{t('guideAdd')}</Text>
      <Text style={guideStyles.muted}>{t('guideAddHint')}</Text>
      {items.map((item) => (
        <Pressable key={item.title} style={guideStyles.hubItem} onPress={item.onPress}>
          <Text style={guideStyles.hubTitle}>{item.title}</Text>
          <Text style={guideStyles.hubSub}>{item.sub}</Text>
        </Pressable>
      ))}
      <View style={{ height: 24 }} />
    </ScrollView>
  );
}
