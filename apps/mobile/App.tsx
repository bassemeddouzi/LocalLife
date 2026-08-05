import React, { useEffect, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { useFonts } from 'expo-font';
import {
  Fraunces_600SemiBold,
  Fraunces_700Bold,
} from '@expo-google-fonts/fraunces';
import {
  DMSans_400Regular,
  DMSans_500Medium,
  DMSans_700Bold,
} from '@expo-google-fonts/dm-sans';
import AsyncStorage from '@react-native-async-storage/async-storage';
import './src/i18n';
import { LANG_RELOAD_KEY } from './src/i18n/languageReload';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import { CityProvider } from './src/context/CityContext';
import { AvatarPrefsProvider } from './src/context/AvatarPrefsContext';
import { LandingScreen } from './src/screens/LandingScreen';
import { AuthScreen } from './src/screens/AuthScreen';
import { OnboardingScreen } from './src/screens/OnboardingScreen';
import { MainNavigator } from './src/navigation/MainNavigator';
import { navigationRef } from './src/navigation/rootNavigation';
import { SplashLoading } from './src/components/SplashLoading';

void SplashScreen.preventAutoHideAsync().catch(() => undefined);

function Root({ fontsReady }: { fontsReady: boolean }) {
  const { ready, user, needsOnboarding } = useAuth();
  const [authGate, setAuthGate] = useState<'landing' | 'email'>('landing');
  const [langReloadHint, setLangReloadHint] = useState(false);

  useEffect(() => {
    void (async () => {
      const flag = await AsyncStorage.getItem(LANG_RELOAD_KEY);
      if (flag) {
        setLangReloadHint(true);
        await AsyncStorage.removeItem(LANG_RELOAD_KEY);
      }
    })();
  }, []);

  useEffect(() => {
    if (fontsReady && ready) {
      void SplashScreen.hideAsync().catch(() => undefined);
    }
  }, [fontsReady, ready]);

  if (!ready) {
    return (
      <SplashLoading
        fontsReady={fontsReady}
        caption={langReloadHint ? 'Updating language…' : undefined}
      />
    );
  }

  if (!user) {
    if (authGate === 'landing') {
      return (
        <LandingScreen onContinueEmail={() => setAuthGate('email')} />
      );
    }
    return <AuthScreen onBack={() => setAuthGate('landing')} />;
  }
  if (needsOnboarding) return <OnboardingScreen />;
  return <MainNavigator />;
}

export default function App() {
  const [fontsLoaded] = useFonts({
    Fraunces_600SemiBold,
    Fraunces_700Bold,
    DMSans_400Regular,
    DMSans_500Medium,
    DMSans_700Bold,
  });

  if (!fontsLoaded) {
    return <SplashLoading fontsReady={false} />;
  }

  return (
    <AuthProvider>
      <CityProvider>
        <AvatarPrefsProvider>
          <View style={styles.root}>
            <NavigationContainer ref={navigationRef}>
              <StatusBar style="light" />
              <Root fontsReady />
            </NavigationContainer>
          </View>
        </AvatarPrefsProvider>
      </CityProvider>
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
});
