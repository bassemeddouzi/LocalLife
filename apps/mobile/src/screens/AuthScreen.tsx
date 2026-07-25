import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  Alert,
  I18nManager,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { apiFetch } from '../config/api';
import * as SecureStore from 'expo-secure-store';

type Props = { onAuthed: () => void };

export function AuthScreen({ onAuthed }: Props) {
  const { t, i18n } = useTranslation();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');

  const submit = async () => {
    try {
      const path =
        mode === 'login' ? '/v1/auth/login' : '/v1/auth/register';
      const body =
        mode === 'login'
          ? { email, password }
          : { email, password, displayName: displayName || 'Traveler' };
      const res = await apiFetch(path, {
        method: 'POST',
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        Alert.alert('Error', JSON.stringify(data.message ?? data));
        return;
      }
      await SecureStore.setItemAsync('accessToken', data.accessToken);
      await SecureStore.setItemAsync('refreshToken', data.refreshToken);
      onAuthed();
    } catch (e) {
      Alert.alert('Network error', String(e));
    }
  };

  const switchLang = async (lng: string) => {
    await i18n.changeLanguage(lng);
    const rtl = lng === 'ar';
    if (I18nManager.isRTL !== rtl) {
      I18nManager.allowRTL(rtl);
      I18nManager.forceRTL(rtl);
      Alert.alert('Language', 'Restart app to fully apply RTL if needed');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>LocalLife</Text>
      <Text style={styles.sub}>{t('placeholder')}</Text>
      {mode === 'register' && (
        <TextInput
          style={styles.input}
          placeholder={t('displayName')}
          value={displayName}
          onChangeText={setDisplayName}
        />
      )}
      <TextInput
        style={styles.input}
        autoCapitalize="none"
        placeholder={t('email')}
        value={email}
        onChangeText={setEmail}
      />
      <TextInput
        style={styles.input}
        secureTextEntry
        placeholder={t('password')}
        value={password}
        onChangeText={setPassword}
      />
      <Pressable style={styles.btn} onPress={submit}>
        <Text style={styles.btnText}>
          {mode === 'login' ? t('login') : t('register')}
        </Text>
      </Pressable>
      <Pressable
        onPress={() => setMode(mode === 'login' ? 'register' : 'login')}
      >
        <Text style={styles.link}>
          {mode === 'login' ? t('register') : t('login')}
        </Text>
      </Pressable>
      <View style={styles.langs}>
        {['en', 'fr', 'ar'].map((lng) => (
          <Pressable key={lng} onPress={() => switchLang(lng)}>
            <Text style={styles.lang}>{lng.toUpperCase()}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 24, gap: 12 },
  title: { fontSize: 28, fontWeight: '700' },
  sub: { marginBottom: 12, opacity: 0.7 },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 12,
  },
  btn: {
    backgroundColor: '#0f766e',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  btnText: { color: '#fff', fontWeight: '600' },
  link: { textAlign: 'center', color: '#0f766e', marginTop: 8 },
  langs: { flexDirection: 'row', justifyContent: 'center', gap: 16, marginTop: 24 },
  lang: { fontWeight: '600' },
});
