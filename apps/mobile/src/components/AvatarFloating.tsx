import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated,
  Modal,
  PanResponder,
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { apiFetch } from '../api/client';
import { useAvatarPrefs } from '../context/AvatarPrefsContext';
import { navigateToAiChat } from '../navigation/rootNavigation';
import { colors } from '../theme';

type Cue = {
  id: string;
  title: string;
  body?: string | null;
  animationHint?: string;
  deepLink?: string | null;
};

const SIZE = 56;

/** Draggable AI companion — rendered above native stack (root overlay). */
export function AvatarFloating() {
  const { t } = useTranslation();
  const { visible, setVisible, ready } = useAvatarPrefs();
  const { width, height } = useWindowDimensions();
  const startX = Math.max(16, width - SIZE - 20);
  const startY = Math.max(120, height * 0.55);
  const pos = useRef(new Animated.ValueXY({ x: startX, y: startY })).current;
  const [cues, setCues] = useState<Cue[]>([]);
  const [open, setOpen] = useState(false);
  const pulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    pos.setValue({
      x: Math.max(16, width - SIZE - 20),
      y: Math.max(120, height * 0.55),
    });
  }, [width, height, pos]);

  const load = useCallback(async () => {
    try {
      const rows = await apiFetch<Cue[]>('/v1/me/avatar-cues');
      setCues(rows);
    } catch {
      setCues([]);
    }
  }, []);

  useEffect(() => {
    if (!visible) return;
    void load();
    const id = setInterval(() => void load(), 45_000);
    return () => clearInterval(id);
  }, [load, visible]);

  useEffect(() => {
    if (!cues.length) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1.08,
          duration: 700,
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 1,
          duration: 700,
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [cues.length, pulse]);

  const pan = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        pos.setOffset({
          // @ts-expect-error Animated value internals
          x: pos.x._value,
          // @ts-expect-error Animated value internals
          y: pos.y._value,
        });
        pos.setValue({ x: 0, y: 0 });
      },
      onPanResponderMove: Animated.event([null, { dx: pos.x, dy: pos.y }], {
        useNativeDriver: false,
      }),
      onPanResponderRelease: (_, g) => {
        pos.flattenOffset();
        const snapX = g.moveX > width / 2 ? width - SIZE - 16 : 16;
        const snapY = Math.min(Math.max(g.moveY - SIZE / 2, 100), height - 160);
        Animated.spring(pos, {
          toValue: { x: snapX, y: snapY },
          useNativeDriver: false,
          bounciness: 6,
        }).start();
        if (Math.abs(g.dx) < 8 && Math.abs(g.dy) < 8) {
          setOpen(true);
        }
      },
    }),
  ).current;

  if (!ready || !visible) return null;

  return (
    <View
      pointerEvents="box-none"
      style={styles.overlay}
      collapsable={false}
    >
      <Animated.View
        collapsable={false}
        style={[
          styles.fab,
          {
            transform: [
              ...pos.getTranslateTransform(),
              { scale: cues.length ? pulse : 1 },
            ],
          },
        ]}
        {...pan.panHandlers}
      >
        <View style={styles.orb}>
          <Text style={styles.orbText}>LL</Text>
          {cues.length ? (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>
                {cues.length > 9 ? '9+' : String(cues.length)}
              </Text>
            </View>
          ) : null}
        </View>
      </Animated.View>

      <Modal visible={open} transparent animationType="fade">
        <Pressable style={styles.backdrop} onPress={() => setOpen(false)}>
          <View style={styles.sheet}>
            <Text style={styles.sheetTitle}>{t('avatarTitle')}</Text>
            {cues.length === 0 ? (
              <Text style={styles.muted}>{t('avatarQuiet')}</Text>
            ) : (
              cues.map((c) => (
                <View key={c.id} style={styles.cue}>
                  <Text style={styles.cueTitle}>{c.title}</Text>
                  {c.body ? <Text style={styles.muted}>{c.body}</Text> : null}
                </View>
              ))
            )}
            <Pressable
              style={styles.btn}
              onPress={() => {
                setOpen(false);
                navigateToAiChat();
              }}
            >
              <Text style={styles.btnText}>{t('avatarOpenChat')}</Text>
            </Pressable>
            <Pressable
              style={styles.btnGhost}
              onPress={async () => {
                try {
                  await apiFetch('/v1/me/avatar-cues/read', {
                    method: 'POST',
                    body: JSON.stringify({}),
                  });
                  setCues([]);
                } catch {
                  /* ignore */
                }
                setOpen(false);
              }}
            >
              <Text style={styles.btnGhostText}>{t('avatarClear')}</Text>
            </Pressable>
            <Pressable
              style={styles.btnGhost}
              onPress={() => {
                void setVisible(false);
                setOpen(false);
              }}
            >
              <Text style={styles.btnGhostText}>{t('avatarHide')}</Text>
            </Pressable>
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 9999,
    elevation: 9999,
  },
  fab: {
    position: 'absolute',
    left: 0,
    top: 0,
    width: SIZE,
    height: SIZE,
    zIndex: 10000,
    elevation: 10000,
  },
  orb: {
    width: SIZE,
    height: SIZE,
    borderRadius: SIZE / 2,
    backgroundColor: colors.brand,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#fff',
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
  },
  orbText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 16,
    letterSpacing: 0.5,
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#c45c26',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  badgeText: { color: '#fff', fontSize: 11, fontWeight: '700' },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.bg,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    gap: 10,
    paddingBottom: 36,
  },
  sheetTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.ink,
    marginBottom: 4,
  },
  muted: { color: colors.muted, fontSize: 14, lineHeight: 20 },
  cue: {
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
    gap: 4,
  },
  cueTitle: { fontWeight: '600', color: colors.ink, fontSize: 15 },
  btn: {
    backgroundColor: colors.brand,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  btnText: { color: '#fff', fontWeight: '700' },
  btnGhost: { paddingVertical: 10, alignItems: 'center' },
  btnGhostText: { color: colors.muted, fontWeight: '600' },
});
