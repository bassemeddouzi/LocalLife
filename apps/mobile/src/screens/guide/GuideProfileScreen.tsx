import React, { useCallback, useState } from 'react';
import {
  Alert,
  DevSettings,
  I18nManager,
  Modal,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import * as SplashScreen from 'expo-splash-screen';
import { apiFetch } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { useCity } from '../../context/CityContext';
import { colors } from '../../theme';
import { SplashLoading } from '../../components/SplashLoading';
import { LANG_RELOAD_KEY } from '../../i18n/languageReload';
import { guideStyles } from './shared/guideStyles';
import type { GuideProfileStackParamList } from './GuideProfileStack';

type Props = NativeStackScreenProps<GuideProfileStackParamList, 'ProfileHome'>;

type GuideMe = {
  bio?: string | null;
  assignmentLevel?: string | null;
  baseCityId?: string | null;
  baseCity?: { name?: string | null } | null;
  primaryDistrictId?: string | null;
  primaryDistrict?: { name?: string | null } | null;
  hood?: { name?: string | null } | null;
  region?: { name?: string | null } | null;
  country?: { name?: string | null } | null;
  status?: string;
  user?: { displayName?: string };
};

export function GuideProfileScreen({ navigation }: Props) {
  const { i18n, t } = useTranslation();
  const { user, signOut, refreshMe } = useAuth();
  const { city } = useCity();
  const [bio, setBio] = useState('');
  const [displayName, setDisplayName] = useState(user?.displayName ?? '');
  const [zoneLabel, setZoneLabel] = useState('');
  const [status, setStatus] = useState('');
  const [busy, setBusy] = useState(false);
  const [reloadingLang, setReloadingLang] = useState(false);
  const currentLang = i18n.resolvedLanguage?.split('-')[0] ?? i18n.language;

  const load = useCallback(async () => {
    try {
      const me = await apiFetch<GuideMe | null>('/v1/guides/me');
      if (!me) return;
      setBio(me.bio ?? '');
      const level = me.assignmentLevel ?? 'DISTRICT';
      const name =
        me.hood?.name ??
        me.primaryDistrict?.name ??
        me.baseCity?.name ??
        me.region?.name ??
        me.country?.name ??
        city?.name ??
        '—';
      setZoneLabel(`${level} · ${name}`);
      setStatus(me.status ?? '');
      if (me.user?.displayName) setDisplayName(me.user.displayName);
    } catch {
      /* ignore */
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  const switchAppLanguage = async (lng: 'en' | 'fr' | 'ar') => {
    const rtlBefore = I18nManager.isRTL;
    const rtlAfter = lng === 'ar';
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
    if (rtlBefore !== rtlAfter) {
      setReloadingLang(true);
      await AsyncStorage.setItem(LANG_RELOAD_KEY, '1');
      I18nManager.allowRTL(rtlAfter);
      I18nManager.forceRTL(rtlAfter);
      // Keep native splash up so reload is not a white flash.
      await SplashScreen.preventAutoHideAsync().catch(() => undefined);
      // Brief beat so the branded overlay paints before JS restarts.
      setTimeout(() => {
        DevSettings.reload();
      }, 420);
    }
  };

  const save = async () => {
    setBusy(true);
    try {
      await apiFetch('/v1/guides/me', {
        method: 'PATCH',
        body: JSON.stringify({
          bio: bio.trim() || undefined,
          displayName: displayName.trim() || undefined,
        }),
      });
      await refreshMe();
      Alert.alert(t('savedTitle'), t('profileUpdated'));
    } catch (e) {
      Alert.alert('Error', e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <Modal visible={reloadingLang} animationType="fade" transparent={false}>
        <SplashLoading fontsReady caption={t('loading')} />
      </Modal>
    <ScrollView contentContainerStyle={guideStyles.page} keyboardShouldPersistTaps="handled">
      <Text style={guideStyles.h1}>{t('guideProfileTitle')}</Text>
      <Text style={guideStyles.muted}>
        {user?.email} · {status || user?.role}
      </Text>
      <Text style={guideStyles.label}>{t('guideProfileDisplayName')}</Text>
      <TextInput
        style={guideStyles.input}
        value={displayName}
        onChangeText={setDisplayName}
        placeholderTextColor={colors.muted}
      />
      <Text style={guideStyles.label}>{t('guideProfileBio')}</Text>
      <TextInput
        style={[guideStyles.input, { minHeight: 100 }]}
        multiline
        value={bio}
        onChangeText={setBio}
        placeholder={t('guideProfileBioPlaceholder')}
        placeholderTextColor={colors.muted}
      />
      <Text style={guideStyles.label}>{t('locale')}</Text>
      <View style={guideStyles.row}>
        {(['en', 'fr', 'ar'] as const).map((code) => (
          <Pressable
            key={code}
            style={[
              guideStyles.chip,
              currentLang === code && guideStyles.chipOn,
            ]}
            onPress={() => void switchAppLanguage(code)}
          >
            <Text
              style={[
                guideStyles.chipText,
                currentLang === code && guideStyles.chipTextOn,
              ]}
            >
              {code.toUpperCase()}
            </Text>
          </Pressable>
        ))}
      </View>
      <Text style={guideStyles.label}>{t('guideProfileZoneTitle')}</Text>
      <View style={guideStyles.card}>
        <Text style={guideStyles.cardTitle}>{zoneLabel || '—'}</Text>
        <Text style={guideStyles.muted}>
          {t('guideProfileZoneHint')}
        </Text>
      </View>
      <Pressable
        style={[guideStyles.btn, busy && { opacity: 0.6 }]}
        onPress={() => void save()}
        disabled={busy}
      >
        <Text style={guideStyles.btnText}>
          {busy ? `${t('loading')}` : t('guideProfileSave')}
        </Text>
      </Pressable>
      <Pressable
        style={guideStyles.btnSecondary}
        onPress={() => navigation.navigate('GuideTeam')}
      >
        <Text style={guideStyles.btnSecondaryText}>
          {t('guideTeamCta')}
        </Text>
      </Pressable>
      <Pressable style={guideStyles.btnGhost} onPress={() => void signOut()}>
        <Text style={guideStyles.btnGhostText}>{t('logout')}</Text>
      </Pressable>
    </ScrollView>
    </>
  );
}
