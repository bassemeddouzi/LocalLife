import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  Alert,
  I18nManager,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { apiFetch } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { colors } from '../theme';

type AuthResponse = {
  accessToken: string;
  refreshToken: string;
};

export function AuthScreen() {
  const { t, i18n } = useTranslation();
  const { signIn } = useAuth();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('guide@locallife.local');
  const [password, setPassword] = useState('Guide123!');
  const [displayName, setDisplayName] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    setBusy(true);
    try {
      const path = mode === 'login' ? '/v1/auth/login' : '/v1/auth/register';
      const body =
        mode === 'login'
          ? { email, password }
          : {
              email,
              password,
              displayName: displayName || 'Traveler',
              locale: i18n.language,
            };
      const data = await apiFetch<AuthResponse>(path, {
        method: 'POST',
        body: JSON.stringify(body),
        auth: false,
      });
      await signIn(data.accessToken, data.refreshToken);
    } catch (e) {
      Alert.alert(t('error'), e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };

  const switchLang = async (lng: string) => {
    await i18n.changeLanguage(lng);
    const rtl = lng === 'ar';
    if (I18nManager.isRTL !== rtl) {
      I18nManager.allowRTL(rtl);
      I18nManager.forceRTL(rtl);
      Alert.alert('RTL', 'Reload the app to fully apply layout direction.');
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <Text style={styles.brand}>LocalLife</Text>
      <Text style={styles.sub}>{t('welcomeSub')}</Text>
      {mode === 'register' ? (
        <TextInput
          style={styles.input}
          placeholder={t('displayName')}
          value={displayName}
          onChangeText={setDisplayName}
          placeholderTextColor={colors.muted}
        />
      ) : null}
      <TextInput
        style={styles.input}
        autoCapitalize="none"
        keyboardType="email-address"
        placeholder={t('email')}
        value={email}
        onChangeText={setEmail}
        placeholderTextColor={colors.muted}
      />
      <TextInput
        style={styles.input}
        secureTextEntry
        placeholder={t('password')}
        value={password}
        onChangeText={setPassword}
        placeholderTextColor={colors.muted}
      />
      <Pressable
        style={[styles.btn, busy && styles.btnDisabled]}
        onPress={submit}
        disabled={busy}
      >
        <Text style={styles.btnText}>
          {busy
            ? t('loading')
            : mode === 'login'
              ? t('login')
              : t('register')}
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
            <Text
              style={[
                styles.lang,
                i18n.language === lng && styles.langActive,
              ]}
            >
              {lng.toUpperCase()}
            </Text>
          </Pressable>
        ))}
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
    gap: 12,
    backgroundColor: colors.bg,
  },
  brand: { fontSize: 34, fontWeight: '800', color: colors.brandDark },
  sub: { color: colors.muted, marginBottom: 8 },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 14,
    color: colors.ink,
  },
  btn: {
    backgroundColor: colors.brand,
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  btnDisabled: { opacity: 0.6 },
  btnText: { color: '#fff', fontWeight: '700' },
  link: { textAlign: 'center', color: colors.brand, marginTop: 4 },
  langs: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
    marginTop: 20,
  },
  lang: { fontWeight: '600', color: colors.muted },
  langActive: { color: colors.brandDark },
});
