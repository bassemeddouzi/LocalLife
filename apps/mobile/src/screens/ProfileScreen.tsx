import React, { useState } from 'react';
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
import { Ionicons } from '@expo/vector-icons';
import { apiFetch } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useCity } from '../context/CityContext';
import { colors } from '../theme';

const LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'fr', label: 'Français' },
  { code: 'ar', label: 'العربية' },
];

export function ProfileScreen() {
  const { t, i18n } = useTranslation();
  const { user, signOut, refreshMe } = useAuth();
  const { locationGranted, requestGps } = useCity();
  const [langOpen, setLangOpen] = useState(false);

  const gpsOn = locationGranted === true;
  const currentLang =
    LANGUAGES.find((l) => l.code === i18n.language) ?? LANGUAGES[0];

  const switchLang = async (lng: string) => {
    setLangOpen(false);
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
      try {
        const { LANG_RELOAD_KEY } = await import('../i18n/languageReload');
        const AsyncStorage = (
          await import('@react-native-async-storage/async-storage')
        ).default;
        await AsyncStorage.setItem(LANG_RELOAD_KEY, '1');
      } catch {
        /* ignore */
      }
      Alert.alert('RTL', 'Reload the app to fully apply layout direction.');
    }
  };

  const onGpsPress = () => {
    void (async () => {
      const ok = await requestGps();
      Alert.alert(t('gpsTitle'), ok ? t('gpsOnHint') : t('gpsOffHint'));
    })();
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.name}>{user?.displayName}</Text>

      <View style={styles.section}>
        <Text style={styles.sectionLabel}>{t('selectLanguage')}</Text>
        <Pressable
          style={styles.dropdown}
          onPress={() => setLangOpen((v) => !v)}
          accessibilityRole="button"
        >
          <Text style={styles.dropdownText}>{currentLang.label}</Text>
          <Ionicons
            name={langOpen ? 'chevron-up' : 'chevron-down'}
            size={18}
            color={colors.muted}
          />
        </Pressable>
        {langOpen ? (
          <View style={styles.dropdownList}>
            {LANGUAGES.map((lng) => (
              <Pressable
                key={lng.code}
                style={[
                  styles.dropdownItem,
                  lng.code === currentLang.code && styles.dropdownItemActive,
                ]}
                onPress={() => void switchLang(lng.code)}
              >
                <Text
                  style={[
                    styles.dropdownItemText,
                    lng.code === currentLang.code &&
                      styles.dropdownItemTextActive,
                  ]}
                >
                  {lng.label}
                </Text>
                {lng.code === currentLang.code ? (
                  <Ionicons name="checkmark" size={16} color={colors.brand} />
                ) : null}
              </Pressable>
            ))}
          </View>
        ) : null}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionLabel}>{t('gpsTitle')}</Text>
        <Pressable
          style={[styles.gpsRow, gpsOn && styles.gpsRowOn]}
          onPress={onGpsPress}
          accessibilityRole="button"
        >
          <Ionicons
            name={gpsOn ? 'locate' : 'locate-outline'}
            size={20}
            color={gpsOn ? '#0f766e' : colors.danger}
          />
          <View style={{ flex: 1 }}>
            <Text style={styles.gpsTitleText}>
              {gpsOn ? t('gpsOn') : t('gpsOff')}
            </Text>
            <Text style={styles.gpsHint}>
              {gpsOn ? t('gpsOnHint') : t('gpsOffHint')}
            </Text>
          </View>
        </Pressable>
      </View>

      <Pressable
        style={styles.linkBtn}
        onPress={() =>
          void Linking.openURL(
            process.env.EXPO_PUBLIC_SUPPORT_FORM_URL ??
              'https://forms.gle/locallife-support-placeholder',
          )
        }
      >
        <Ionicons name="help-buoy-outline" size={18} color={colors.brandDark} />
        <Text style={styles.linkBtnText}>Support form</Text>
      </Pressable>

      <Pressable style={styles.logout} onPress={() => void signOut()}>
        <Text style={styles.logoutText}>{t('logout')}</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, gap: 14, backgroundColor: colors.bg },
  name: { fontSize: 26, fontWeight: '800', color: colors.ink, marginBottom: 4 },
  section: { gap: 8 },
  sectionLabel: {
    fontWeight: '700',
    fontSize: 14,
    color: colors.muted,
  },
  dropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  dropdownText: { fontWeight: '700', color: colors.ink, fontSize: 15 },
  dropdownList: {
    backgroundColor: colors.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  dropdownItemActive: { backgroundColor: colors.chip },
  dropdownItemText: { color: colors.ink, fontSize: 15 },
  dropdownItemTextActive: { fontWeight: '700', color: colors.brandDark },
  gpsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
  },
  gpsRowOn: { backgroundColor: '#ecfdf5', borderColor: '#99f6e4' },
  gpsTitleText: { fontWeight: '700', color: colors.ink },
  gpsHint: { color: colors.muted, fontSize: 12, marginTop: 2 },
  linkBtn: {
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.chip,
    padding: 14,
    borderRadius: 12,
  },
  linkBtnText: { color: colors.brandDark, fontWeight: '700' },
  logout: {
    marginTop: 8,
    backgroundColor: colors.ink,
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  logoutText: { color: '#fff', fontWeight: '700' },
});
