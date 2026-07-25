import React from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ScrollView,
  I18nManager,
  Alert,
  Linking,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { apiFetch } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useCity } from '../context/CityContext';
import { API_BASE_URL } from '../api/client';
import { colors } from '../theme';

export function ProfileScreen() {
  const { t, i18n } = useTranslation();
  const { user, signOut, refreshMe } = useAuth();
  const { city } = useCity();

  const switchLang = async (lng: string) => {
    await i18n.changeLanguage(lng);
    try {
      await apiFetch('/v1/auth/me/preferences', {
        method: 'PATCH',
        body: JSON.stringify({ locale: lng }),
      });
      await refreshMe();
    } catch {
      // ignore offline preference sync
    }
    const rtl = lng === 'ar';
    if (I18nManager.isRTL !== rtl) {
      I18nManager.allowRTL(rtl);
      I18nManager.forceRTL(rtl);
      Alert.alert('RTL', 'Reload the app to fully apply layout direction.');
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.name}>{user?.displayName}</Text>
      <Text style={styles.meta}>{user?.email}</Text>
      <Text style={styles.meta}>
        {user?.personaType ?? '—'} · {user?.preference?.budgetBand ?? '—'}
      </Text>
      <Text style={styles.meta}>
        {t('cityPack')}: {city?.contentPackVersion ?? '—'}
      </Text>
      <Text style={styles.meta}>
        {t('apiBase')}: {API_BASE_URL}
      </Text>

      <Text style={styles.section}>{t('locale')}</Text>
      <View style={styles.row}>
        {['en', 'fr', 'ar'].map((lng) => (
          <Pressable
            key={lng}
            style={[
              styles.chip,
              i18n.language === lng && styles.chipOn,
            ]}
            onPress={() => void switchLang(lng)}
          >
            <Text style={styles.chipText}>{lng.toUpperCase()}</Text>
          </Pressable>
        ))}
      </View>

      <Text style={styles.section}>{t('consents')}</Text>
      <Text style={styles.meta}>
        {t('consentAnalytics')}:{' '}
        {user?.preference?.consentAnalytics ? 'ON' : 'OFF'}
      </Text>
      <Text style={styles.meta}>
        {t('consentPersonalization')}:{' '}
        {user?.preference?.consentPersonalization ? 'ON' : 'OFF'}
      </Text>
      <Text style={styles.meta}>
        {t('consentPush')}: {user?.preference?.consentPush ? 'ON' : 'OFF'}
      </Text>

      <Text style={styles.section}>{t('legal')}</Text>
      <Text style={styles.meta}>{t('privacy')}</Text>
      <Text style={styles.meta}>{t('terms')}</Text>
      <Pressable
        style={styles.linkBtn}
        onPress={() =>
          void Linking.openURL(
            process.env.EXPO_PUBLIC_SUPPORT_FORM_URL ??
              'https://forms.gle/locallife-support-placeholder',
          )
        }
      >
        <Text style={styles.linkBtnText}>Support form</Text>
      </Pressable>

      <Pressable style={styles.logout} onPress={() => void signOut()}>
        <Text style={styles.logoutText}>{t('logout')}</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, gap: 8, backgroundColor: colors.bg },
  name: { fontSize: 24, fontWeight: '800', color: colors.ink },
  meta: { color: colors.muted },
  section: {
    marginTop: 16,
    fontWeight: '800',
    fontSize: 16,
    color: colors.ink,
  },
  row: { flexDirection: 'row', gap: 8 },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
  },
  chipOn: { backgroundColor: colors.chip, borderColor: colors.brand },
  chipText: { fontWeight: '700', color: colors.ink },
  linkBtn: {
    marginTop: 8,
    backgroundColor: colors.chip,
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  linkBtnText: { color: colors.brandDark, fontWeight: '700' },
  logout: {
    marginTop: 24,
    backgroundColor: colors.ink,
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  logoutText: { color: '#fff', fontWeight: '700' },
});
