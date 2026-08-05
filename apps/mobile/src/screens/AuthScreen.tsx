import React, { useState } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Alert,
  I18nManager,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useTranslation } from 'react-i18next';
import { apiFetch } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { colors, fonts, radii, spacing, type } from '../theme';
import {
  AppTextInput,
  KeyboardSafeScroll,
} from '../components/KeyboardSafe';

type AuthResponse = {
  accessToken: string;
  refreshToken: string;
};

type Props = {
  onBack?: () => void;
};

export function AuthScreen({ onBack }: Props) {
  const { t, i18n } = useTranslation();
  const { signIn } = useAuth();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [busy, setBusy] = useState(false);
  const isRtl = i18n.dir() === 'rtl' || I18nManager.isRTL;

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
    <KeyboardSafeScroll
      style={styles.container}
      contentContainerStyle={styles.scroll}
      keyboardVerticalOffset={PlatformOffset()}
    >
      <StatusBar style="dark" />
      {onBack ? (
        <Pressable onPress={onBack} style={styles.back}>
          <Text style={styles.backText}>{t('back')}</Text>
        </Pressable>
      ) : null}
      <Text style={[styles.brand, isRtl && styles.alignEnd]}>LocalLife</Text>
      <Text style={[styles.sub, isRtl && styles.alignEnd]}>{t('welcomeSub')}</Text>
      {mode === 'register' ? (
        <Text style={[styles.hint, isRtl && styles.alignEnd]}>
          {t('registerHint')}
        </Text>
      ) : (
        <Text style={[styles.hint, isRtl && styles.alignEnd]}>
          {t('loginHint')}
        </Text>
      )}
      {mode === 'register' ? (
        <AppTextInput
          placeholder={t('displayName')}
          value={displayName}
          onChangeText={setDisplayName}
        />
      ) : null}
      <AppTextInput
        autoCapitalize="none"
        keyboardType="email-address"
        placeholder={t('email')}
        value={email}
        onChangeText={setEmail}
      />
      <AppTextInput
        secureTextEntry
        placeholder={t('password')}
        value={password}
        onChangeText={setPassword}
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
      <View style={[styles.langs, isRtl && { flexDirection: 'row-reverse' }]}>
        {['en', 'fr', 'ar'].map((lng) => (
          <Pressable key={lng} onPress={() => void switchLang(lng)}>
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
    </KeyboardSafeScroll>
  );
}

function PlatformOffset() {
  return 24;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  scroll: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: spacing.lg,
    gap: spacing.md,
    paddingBottom: 48,
  },
  back: { marginBottom: spacing.sm, alignSelf: 'flex-start' },
  backText: {
    fontFamily: fonts.bodyMedium,
    color: colors.brand,
    fontSize: 15,
  },
  brand: {
    ...type.brand,
    fontSize: 36,
    color: colors.brandDark,
  },
  alignEnd: { textAlign: 'right', writingDirection: 'rtl' },
  sub: {
    ...type.body,
    color: colors.muted,
    marginBottom: spacing.xs,
  },
  hint: {
    ...type.bodySm,
    color: colors.muted,
    marginBottom: spacing.sm,
  },
  btn: {
    backgroundColor: colors.brand,
    padding: 16,
    borderRadius: radii.md,
    alignItems: 'center',
  },
  btnDisabled: { opacity: 0.6 },
  btnText: {
    color: '#fff',
    fontFamily: fonts.bodyBold,
    fontSize: 16,
  },
  link: {
    textAlign: 'center',
    color: colors.brand,
    fontFamily: fonts.bodyMedium,
    marginTop: spacing.xs,
  },
  langs: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.lg,
    marginTop: spacing.lg,
  },
  lang: {
    fontFamily: fonts.bodyMedium,
    color: colors.muted,
  },
  langActive: { color: colors.brandDark },
});
