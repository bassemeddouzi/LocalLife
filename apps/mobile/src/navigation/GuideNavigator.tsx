import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useTranslation } from 'react-i18next';
import { colors } from '../theme';
import { tabIcon } from './tabIcons';
import { GuideHomeScreen } from '../screens/guide/GuideHomeScreen';
import { GuideMapScreen } from '../screens/guide/GuideMapScreen';
import { GuideAddStack } from '../screens/guide/GuideAddStack';
import { GuideActivityStack } from '../screens/guide/GuideActivityStack';
import { GuideProfileStack } from '../screens/guide/GuideProfileStack';

const Tab = createBottomTabNavigator();

export function GuideNavigator() {
  const { t } = useTranslation();
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: colors.brand,
        headerStyle: { backgroundColor: colors.bg },
      }}
    >
      <Tab.Screen
        name="GuideHome"
        component={GuideHomeScreen}
        options={{
          title: t('home'),
          tabBarIcon: tabIcon('home-outline', 'home'),
        }}
      />
      <Tab.Screen
        name="GuideMap"
        component={GuideMapScreen}
        options={{
          title: t('guideMapTitle'),
          tabBarIcon: tabIcon('map-outline', 'map'),
        }}
      />
      <Tab.Screen
        name="GuideAdd"
        component={GuideAddStack}
        options={{
          title: t('guideAdd'),
          headerShown: false,
          tabBarIcon: tabIcon('add-circle-outline', 'add-circle'),
        }}
      />
      <Tab.Screen
        name="GuideActivity"
        component={GuideActivityStack}
        options={{
          title: t('guideActivityTitle'),
          headerShown: false,
          tabBarIcon: tabIcon('list-outline', 'list'),
        }}
      />
      <Tab.Screen
        name="GuideProfile"
        component={GuideProfileStack}
        options={{
          title: t('profile'),
          headerShown: false,
          tabBarIcon: tabIcon('person-outline', 'person'),
        }}
      />
    </Tab.Navigator>
  );
}
