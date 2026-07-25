import React from 'react';
import { ActivityIndicator, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import './src/i18n';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import { CityProvider } from './src/context/CityContext';
import { AuthScreen } from './src/screens/AuthScreen';
import { OnboardingScreen } from './src/screens/OnboardingScreen';
import { MainNavigator } from './src/navigation/MainNavigator';
import { colors } from './src/theme';

function Root() {
  const { ready, user, needsOnboarding } = useAuth();

  if (!ready) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: colors.bg,
        }}
      >
        <ActivityIndicator color={colors.brand} />
      </View>
    );
  }

  if (!user) return <AuthScreen />;
  if (needsOnboarding) return <OnboardingScreen />;
  return <MainNavigator />;
}

export default function App() {
  return (
    <AuthProvider>
      <CityProvider>
        <NavigationContainer>
          <StatusBar style="dark" />
          <Root />
        </NavigationContainer>
      </CityProvider>
    </AuthProvider>
  );
}
