import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { colors } from '../../theme';
import { GuideProfileScreen } from './GuideProfileScreen';
import { GuideTeamScreen } from './GuideTeamScreen';

export type GuideProfileStackParamList = {
  ProfileHome: undefined;
  GuideTeam: undefined;
};

const Stack = createNativeStackNavigator<GuideProfileStackParamList>();

export function GuideProfileStack() {
  const { t } = useTranslation();
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: colors.bg },
        headerTintColor: colors.brand,
        contentStyle: { backgroundColor: colors.bg },
      }}
    >
      <Stack.Screen
        name="ProfileHome"
        component={GuideProfileScreen}
        options={{ title: t('profile') }}
      />
      <Stack.Screen
        name="GuideTeam"
        component={GuideTeamScreen}
        options={{ title: t('guideTeamTitle') }}
      />
    </Stack.Navigator>
  );
}
