import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { HomeScreen } from '../screens/HomeScreen';
import { ExploreScreen } from '../screens/ExploreScreen';
import { ChatScreen } from '../screens/ChatScreen';
import { SavedScreen } from '../screens/SavedScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { PlaceDetailScreen } from '../screens/PlaceDetailScreen';
import type { MainTabParamList, RootStackParamList } from './types';
import { colors } from '../theme';
import { useAuth } from '../context/AuthContext';
import { GuideNavigator } from './GuideNavigator';
import { BusinessNavigator } from './BusinessNavigator';

const Tab = createBottomTabNavigator<MainTabParamList>();
const Stack = createNativeStackNavigator<RootStackParamList>();

function ClientTabs() {
  const { t } = useTranslation();
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: true,
        tabBarActiveTintColor: colors.brand,
        headerStyle: { backgroundColor: colors.bg },
      }}
    >
      <Tab.Screen
        name="HomeTab"
        component={HomeScreen}
        options={{ title: t('home') }}
      />
      <Tab.Screen
        name="ExploreTab"
        component={ExploreScreen}
        options={{ title: t('explore') }}
      />
      <Tab.Screen
        name="ChatTab"
        component={ChatScreen}
        options={{ title: t('chat') }}
      />
      <Tab.Screen
        name="SavedTab"
        component={SavedScreen}
        options={{ title: t('saved') }}
      />
      <Tab.Screen
        name="ProfileTab"
        component={ProfileScreen}
        options={{ title: t('profile') }}
      />
    </Tab.Navigator>
  );
}

function ClientNavigator() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="Tabs"
        component={ClientTabs}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="PlaceDetail"
        component={PlaceDetailScreen}
        options={{ title: 'Place' }}
      />
    </Stack.Navigator>
  );
}

export function MainNavigator() {
  const { user } = useAuth();
  if (user?.role === 'GUIDE') return <GuideNavigator />;
  if (user?.role === 'BUSINESS') return <BusinessNavigator />;
  return <ClientNavigator />;
}
