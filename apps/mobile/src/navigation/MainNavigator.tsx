import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { HomeScreen } from '../screens/HomeScreen';
import { ExploreScreen } from '../screens/ExploreScreen';
import { ChatScreen } from '../screens/ChatScreen';
import { SavedScreen } from '../screens/SavedScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { PlaceDetailScreen } from '../screens/PlaceDetailScreen';
import { PlanTimelineScreen } from '../screens/PlanTimelineScreen';
import { PlanStepDetailScreen } from '../screens/PlanStepDetailScreen';
import { RatingTargetScreen } from '../screens/RatingTargetScreen';
import { NotificationsScreen } from '../screens/NotificationsScreen';
import type { MainTabParamList, RootStackParamList } from './types';
import { colors } from '../theme';
import { useAuth } from '../context/AuthContext';
import { GuideNavigator } from './GuideNavigator';
import { BusinessNavigator } from './BusinessNavigator';
import { tabIcon } from './tabIcons';

const Tab = createBottomTabNavigator<MainTabParamList>();
const Stack = createNativeStackNavigator<RootStackParamList>();

function HeaderActions() {
  const { t } = useTranslation();
  const navigation = useNavigation();

  const goTo = (screen: 'Search' | 'Notifications') => {
    const parent = navigation.getParent();
    if (parent) parent.navigate(screen as never);
    else (navigation as any).navigate(screen, {});
  };

  return (
    <View style={styles.actions}>
      <Pressable
        onPress={() => goTo('Notifications')}
        style={styles.iconBtn}
        accessibilityRole="button"
        accessibilityLabel={t('notifications')}
        hitSlop={6}
      >
        <Ionicons name="notifications-outline" size={18} color={colors.muted} />
      </Pressable>

      <Pressable
        onPress={() => goTo('Search')}
        style={styles.searchBtn}
        accessibilityRole="button"
        accessibilityLabel={t('search')}
        hitSlop={8}
      >
        <Ionicons name="search" size={18} color={colors.brandDark} />
        <Text style={styles.searchBtnText}>{t('search')}</Text>
      </Pressable>
    </View>
  );
}

function ClientTabs() {
  const { t } = useTranslation();
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: true,
        tabBarActiveTintColor: colors.brand,
        headerStyle: { backgroundColor: colors.bg },
        headerTitle: 'LocalLife',
        headerTitleStyle: styles.headerTitle,
        headerRight: () => <HeaderActions />,
      }}
    >
      <Tab.Screen
        name="HomeTab"
        component={HomeScreen}
        options={{
          title: t('home'),
          tabBarIcon: tabIcon('home-outline', 'home'),
        }}
      />
      <Tab.Screen
        name="ChatTab"
        component={ChatScreen}
        options={{
          title: t('aiSupport'),
          tabBarLabel: t('aiSupport'),
          tabBarIcon: tabIcon('chatbubble-ellipses-outline', 'chatbubble-ellipses'),
        }}
      />
      <Tab.Screen
        name="SavedTab"
        component={SavedScreen}
        options={{
          title: t('savePlan'),
          tabBarLabel: t('savePlan'),
          tabBarIcon: tabIcon('bookmark-outline', 'bookmark'),
        }}
      />
      <Tab.Screen
        name="ProfileTab"
        component={ProfileScreen}
        options={{
          title: t('profile'),
          tabBarIcon: tabIcon('person-outline', 'person'),
        }}
      />
    </Tab.Navigator>
  );
}

function ClientNavigator() {
  const { t } = useTranslation();
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="Tabs"
        component={ClientTabs}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="Search"
        component={ExploreScreen}
        options={{
          title: t('search'),
          headerRight: () => <HeaderActions />,
        }}
      />
      <Stack.Screen
        name="PlaceDetail"
        component={PlaceDetailScreen}
        options={{ title: 'Place' }}
      />
      <Stack.Screen
        name="PlanTimeline"
        component={PlanTimelineScreen}
        options={{ title: t('planTimeline') }}
      />
      <Stack.Screen
        name="PlanStepDetail"
        component={PlanStepDetailScreen}
        options={{ title: t('planStepDetail') }}
      />
      <Stack.Screen
        name="RatingTarget"
        component={RatingTargetScreen}
        options={{ title: t('rateAndComment') }}
      />
      <Stack.Screen
        name="Notifications"
        component={NotificationsScreen}
        options={{ title: t('notifications') }}
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

const styles = StyleSheet.create({
  headerTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: colors.brandDark,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginRight: 10,
  },
  iconBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  searchBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: colors.chip,
  },
  searchBtnText: {
    color: colors.brandDark,
    fontWeight: '700',
    fontSize: 13,
  },
});
