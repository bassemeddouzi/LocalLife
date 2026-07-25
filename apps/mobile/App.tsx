import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import * as SecureStore from 'expo-secure-store';
import './src/i18n';
import { AuthScreen } from './src/screens/AuthScreen';
import { MainTabs } from './src/navigation/MainTabs';

export default function App() {
  const [ready, setReady] = useState(false);
  const [authed, setAuthed] = useState(false);

  useEffect(() => {
    void (async () => {
      const token = await SecureStore.getItemAsync('accessToken');
      setAuthed(Boolean(token));
      setReady(true);
    })();
  }, []);

  if (!ready) {
    return null;
  }

  return (
    <NavigationContainer>
      <StatusBar style="auto" />
      {authed ? (
        <MainTabs />
      ) : (
        <AuthScreen onAuthed={() => setAuthed(true)} />
      )}
    </NavigationContainer>
  );
}
