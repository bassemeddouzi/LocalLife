import React from 'react';
import { Text, View, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { API_BASE_URL } from '../config/api';

function Placeholder({ labelKey }: { labelKey: string }) {
  const { t } = useTranslation();
  return (
    <View style={styles.box}>
      <Text style={styles.h1}>{t(labelKey)}</Text>
      <Text style={styles.p}>{t('placeholder')}</Text>
      <Text style={styles.meta}>
        {t('apiBase')}: {API_BASE_URL}
      </Text>
    </View>
  );
}

const Tab = createBottomTabNavigator();

export function MainTabs() {
  const { t } = useTranslation();
  return (
    <Tab.Navigator screenOptions={{ headerShown: true }}>
      <Tab.Screen name="Home" options={{ title: t('home') }}>
        {() => <Placeholder labelKey="home" />}
      </Tab.Screen>
      <Tab.Screen name="Explore" options={{ title: t('explore') }}>
        {() => <Placeholder labelKey="explore" />}
      </Tab.Screen>
      <Tab.Screen name="Chat" options={{ title: t('chat') }}>
        {() => <Placeholder labelKey="chat" />}
      </Tab.Screen>
      <Tab.Screen name="Saved" options={{ title: t('saved') }}>
        {() => <Placeholder labelKey="saved" />}
      </Tab.Screen>
      <Tab.Screen name="Profile" options={{ title: t('profile') }}>
        {() => <Placeholder labelKey="profile" />}
      </Tab.Screen>
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  box: { flex: 1, padding: 24, justifyContent: 'center', gap: 8 },
  h1: { fontSize: 24, fontWeight: '700' },
  p: { opacity: 0.7 },
  meta: { marginTop: 16, fontSize: 12, opacity: 0.5 },
});
