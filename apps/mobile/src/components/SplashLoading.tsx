import React, { useEffect, useRef } from 'react';
import {
  Animated,
  Easing,
  Image,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, fonts } from '../theme';

type Props = {
  caption?: string;
  /** When false, skip custom display font (cold start before fonts load). */
  fontsReady?: boolean;
};

/**
 * Branded loading surface — cold start + language RTL reload.
 */
export function SplashLoading({ caption, fontsReady = true }: Props) {
  const logoScale = useRef(new Animated.Value(0.86)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const brandOpacity = useRef(new Animated.Value(0)).current;
  const brandY = useRef(new Animated.Value(14)).current;
  const ring = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(logoOpacity, {
        toValue: 1,
        duration: 480,
        useNativeDriver: true,
      }),
      Animated.spring(logoScale, {
        toValue: 1,
        friction: 7,
        tension: 55,
        useNativeDriver: true,
      }),
      Animated.timing(brandOpacity, {
        toValue: 1,
        duration: 520,
        delay: 160,
        useNativeDriver: true,
      }),
      Animated.timing(brandY, {
        toValue: 0,
        duration: 520,
        delay: 160,
        useNativeDriver: true,
      }),
    ]).start();

    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(ring, {
          toValue: 1,
          duration: 1100,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(ring, {
          toValue: 0,
          duration: 1100,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    );
    pulse.start();
    return () => pulse.stop();
  }, [logoOpacity, logoScale, brandOpacity, brandY, ring]);

  const ringScale = ring.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.18],
  });
  const ringOpacity = ring.interpolate({
    inputRange: [0, 1],
    outputRange: [0.35, 0.08],
  });

  return (
    <View style={styles.root} accessibilityLabel="LocalLife loading">
      <LinearGradient
        colors={['#0a4f4a', '#0d6b63', '#1a6b7a']}
        start={{ x: 0.1, y: 0 }}
        end={{ x: 0.9, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <View style={styles.center}>
        <Animated.View
          style={[
            styles.ring,
            { opacity: ringOpacity, transform: [{ scale: ringScale }] },
          ]}
        />
        <Animated.View
          style={{
            opacity: logoOpacity,
            transform: [{ scale: logoScale }],
          }}
        >
          <Image
            source={require('../../assets/icon.png')}
            style={styles.logo}
            resizeMode="contain"
          />
        </Animated.View>
        <Animated.View
          style={{
            opacity: brandOpacity,
            transform: [{ translateY: brandY }],
            alignItems: 'center',
          }}
        >
          <Text
            style={[
              styles.brand,
              fontsReady ? styles.brandFont : styles.brandFallback,
            ]}
          >
            LocalLife
          </Text>
          {caption ? <Text style={styles.caption}>{caption}</Text> : null}
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.brandDark,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 18,
  },
  ring: {
    position: 'absolute',
    width: 168,
    height: 168,
    borderRadius: 84,
    borderWidth: 2,
    borderColor: 'rgba(247, 250, 248, 0.45)',
  },
  logo: {
    width: 112,
    height: 112,
    borderRadius: 28,
  },
  brand: {
    fontSize: 34,
    letterSpacing: -0.4,
    color: colors.onHero,
    marginTop: 8,
  },
  brandFont: {
    fontFamily: fonts.display,
  },
  brandFallback: {
    fontWeight: '700',
  },
  caption: {
    marginTop: 8,
    fontSize: 14,
    color: colors.onHeroMuted,
  },
});
