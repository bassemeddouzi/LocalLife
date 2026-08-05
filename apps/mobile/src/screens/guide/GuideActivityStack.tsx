import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { colors } from '../../theme';
import { GuideActivityScreen } from './GuideActivityScreen';
import { GuideActivityDetailScreen } from './GuideActivityDetailScreen';
import type { ActivityItem } from './shared/submissions';

export type GuideActivityStackParamList = {
  ActivityList: undefined;
  ActivityDetail: { item: ActivityItem };
};

const Stack = createNativeStackNavigator<GuideActivityStackParamList>();

export function GuideActivityStack() {
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
        name="ActivityList"
        component={GuideActivityScreen}
        options={{ title: t('guideActivityTitle') }}
      />
      <Stack.Screen
        name="ActivityDetail"
        component={GuideActivityDetailScreen}
        options={{ title: t('submissionTitle') }}
      />
    </Stack.Navigator>
  );
}
