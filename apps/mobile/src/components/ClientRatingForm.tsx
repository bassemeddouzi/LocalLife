import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { apiFetch } from '../api/client';
import { colors } from '../theme';

export type RatingTargetType =
  | 'PLACE'
  | 'CITY'
  | 'DISTRICT'
  | 'ZONE'
  | 'TRANSPORT_SYSTEM';

type Props = {
  targetType: RatingTargetType;
  targetId: string;
  onSaved?: () => void;
};

export function ClientRatingForm({ targetType, targetId, onSaved }: Props) {
  const { t } = useTranslation();
  const [rating, setRating] = useState(5);
  const [body, setBody] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    setBusy(true);
    try {
      await apiFetch('/v1/ratings', {
        method: 'POST',
        body: JSON.stringify({
          targetType,
          targetId,
          rating,
          body: body.trim() || undefined,
        }),
      });
      Alert.alert(t('ratingThanks'));
      setBody('');
      onSaved?.();
    } catch (e) {
      Alert.alert(t('error'), e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={styles.box}>
      <Text style={styles.label}>{t('yourRating')}</Text>
      <View style={styles.stars}>
        {[1, 2, 3, 4, 5].map((n) => (
          <Pressable key={n} onPress={() => setRating(n)} hitSlop={6}>
            <Text style={[styles.star, n <= rating && styles.starOn]}>★</Text>
          </Pressable>
        ))}
      </View>
      <TextInput
        style={styles.input}
        value={body}
        onChangeText={setBody}
        placeholder={t('ratingCommentPlaceholder')}
        placeholderTextColor={colors.muted}
        multiline
      />
      <Pressable
        style={[styles.btn, busy && { opacity: 0.6 }]}
        disabled={busy}
        onPress={() => void submit()}
      >
        {busy ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.btnText}>{t('submitRating')}</Text>
        )}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    backgroundColor: colors.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
    gap: 10,
  },
  label: { fontWeight: '800', color: colors.ink },
  stars: { flexDirection: 'row', gap: 6 },
  star: { fontSize: 28, color: colors.border },
  starOn: { color: '#eab308' },
  input: {
    minHeight: 80,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    padding: 10,
    color: colors.ink,
    textAlignVertical: 'top',
  },
  btn: {
    backgroundColor: colors.brand,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  btnText: { color: '#fff', fontWeight: '800' },
});
