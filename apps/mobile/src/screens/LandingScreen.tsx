import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ImageBackground,
  Animated,
  Alert,
  I18nManager,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next';
import { apiFetch } from '../api/client';
import { useAuth } from '../context/AuthContext';
import {
  isExpoGo,
  isGoogleConfigured,
  signInWithGoogleNative,
} from '../auth/googleSignIn';
import { colors, fonts, radii, spacing, type } from '../theme';

type AuthResponse = {
  accessToken: string;
  refreshToken: string;
};

type Props = {
  onContinueEmail: () => void;
};

export function LandingScreen({ onContinueEmail }: Props) {
  const { t, i18n } = useTranslation();
  const { signIn } = useAuth();
  const [busy, setBusy] = useState(false);

  const brandOpacity = useRef(new Animated.Value(0)).current;
  const brandY = useRef(new Animated.Value(18)).current;
  const ctaOpacity = useRef(new Animated.Value(0)).current;
  const ctaY = useRef(new Animated.Value(24)).current;
  const wash = useRef(new Animated.Value(0)).current;

  const googleReady = isGoogleConfigured();

  useEffect(() => {
    Animated.parallel([
      Animated.timing(brandOpacity, {
        toValue: 1,
        duration: 700,
        useNativeDriver: true,
      }),
      Animated.timing(brandY, {
        toValue: 0,
        duration: 700,
        useNativeDriver: true,
      }),
      Animated.timing(ctaOpacity, {
        toValue: 1,
        duration: 650,
        delay: 220,
        useNativeDriver: true,
      }),
      Animated.timing(ctaY, {
        toValue: 0,
        duration: 650,
        delay: 220,
        useNativeDriver: true,
      }),
      Animated.timing(wash, {
        toValue: 1,
        duration: 1400,
        useNativeDriver: true,
      }),
    ]).start();
  }, [brandOpacity, brandY, ctaOpacity, ctaY, wash]);

  const onGoogle = async () => {
    if (!googleReady) {
      Alert.alert(t('error'), t('googleNotConfigured'));
      return;
    }
    if (isExpoGo()) {
      Alert.alert(t('googleNeedsDevBuildTitle'), t('googleNeedsDevBuild'));
      return;
    }

    setBusy(true);
    try {
      const result = await signInWithGoogleNative();
      if (!result.ok) {
        if (result.reason === 'cancelled') return;
        if (result.reason === 'expo_go') {
          Alert.alert(t('googleNeedsDevBuildTitle'), t('googleNeedsDevBuild'));
          return;
        }
        if (result.reason === 'config') {
          Alert.alert(t('error'), t('googleNotConfigured'));
          return;
        }
        if (result.reason === 'play_services') {
          Alert.alert(t('error'), t('googlePlayServices'));
          return;
        }
        if (result.reason === 'no_token') {
          Alert.alert(t('error'), t('googleNoToken'));
          return;
        }
        Alert.alert(
          t('error'),
          result.message || t('googleFailed'),
        );
        return;
      }

      const data = await apiFetch<AuthResponse>('/v1/auth/google', {
        method: 'POST',
        body: JSON.stringify({
          idToken: result.idToken,
          locale: i18n.language,
        }),
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
    <ImageBackground
      source={require('../../assets/landing-hero.png')}
      style={styles.root}
      resizeMode="cover"
    >
      <Animated.View
        pointerEvents="none"
        style={[
          styles.wash,
          {
            opacity: wash.interpolate({
              inputRange: [0, 1],
              outputRange: [0.15, 0.35],
            }),
          },
        ]}
      />
      <LinearGradient
        colors={[
          'rgba(10,28,26,0.15)',
          'rgba(10,28,26,0.42)',
          'rgba(8,22,20,0.92)',
        ]}
        locations={[0, 0.45, 1]}
        style={StyleSheet.absoluteFill}
      />
      <View style={styles.content}>
        <Animated.View
          style={{
            opacity: brandOpacity,
            transform: [{ translateY: brandY }],
          }}
        >
          <Text style={styles.brand}>LocalLife</Text>
          <Text style={styles.headline}>{t('landingHeadline')}</Text>
          <Text style={styles.support}>{t('landingSupport')}</Text>
        </Animated.View>

        <Animated.View
          style={[
            styles.ctaGroup,
            {
              opacity: ctaOpacity,
              transform: [{ translateY: ctaY }],
            },
          ]}
        >
          <Pressable
            style={[styles.googleBtn, busy && styles.btnDisabled]}
            onPress={onGoogle}
            disabled={busy}
          >
            {busy ? (
              <ActivityIndicator color={colors.googleText} />
            ) : (
              <Text style={styles.googleText}>{t('continueGoogle')}</Text>
            )}
          </Pressable>
          <Pressable
            style={styles.emailBtn}
            onPress={onContinueEmail}
            disabled={busy}
          >
            <Text style={styles.emailText}>{t('continueEmail')}</Text>
          </Pressable>
        </Animated.View>

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
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  wash: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.sea,
  },
  content: {
    flex: 1,
    justifyContent: 'flex-end',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxl,
    gap: spacing.xl,
  },
  brand: {
    ...type.brand,
    color: colors.onHero,
    marginBottom: spacing.sm,
  },
  headline: {
    ...type.h1,
    color: colors.onHero,
    marginBottom: spacing.sm,
  },
  support: {
    ...type.body,
    color: colors.onHeroMuted,
    maxWidth: 340,
  },
  ctaGroup: { gap: spacing.sm },
  googleBtn: {
    backgroundColor: colors.googleBg,
    paddingVertical: 16,
    borderRadius: radii.md,
    alignItems: 'center',
  },
  googleText: {
    fontFamily: fonts.bodyBold,
    fontSize: 16,
    color: colors.googleText,
  },
  emailBtn: {
    borderWidth: 1.5,
    borderColor: 'rgba(247,250,248,0.55)',
    paddingVertical: 16,
    borderRadius: radii.md,
    alignItems: 'center',
  },
  emailText: {
    fontFamily: fonts.bodyBold,
    fontSize: 16,
    color: colors.onHero,
  },
  btnDisabled: { opacity: 0.65 },
  langs: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.lg,
    marginTop: spacing.sm,
  },
  lang: {
    fontFamily: fonts.bodyMedium,
    color: 'rgba(247,250,248,0.55)',
  },
  langActive: { color: colors.onHero },
});
