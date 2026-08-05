import React from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  TextInput,
  type TextInputProps,
  type StyleProp,
  type ViewStyle,
  I18nManager,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { colors } from '../theme';

type Props = {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  contentContainerStyle?: StyleProp<ViewStyle>;
  /** Extra offset above tab/header */
  keyboardVerticalOffset?: number;
};

/** Keyboard-safe scroll screen for forms (Auth, sheets, etc.). */
export function KeyboardSafeScroll({
  children,
  style,
  contentContainerStyle,
  keyboardVerticalOffset,
}: Props) {
  const insets = useSafeAreaInsets();
  const offset =
    keyboardVerticalOffset ??
    (Platform.OS === 'ios' ? Math.max(insets.top, 12) : 24);

  return (
    <KeyboardAvoidingView
      style={[styles.flex, style]}
      behavior="padding"
      keyboardVerticalOffset={offset}
    >
      <ScrollView
        contentContainerStyle={contentContainerStyle}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
      >
        {children}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

/** Shared text input that respects RTL/LTR. */
export function AppTextInput({ style, ...rest }: TextInputProps) {
  const { i18n } = useTranslation();
  const isRtl = i18n.dir() === 'rtl' || I18nManager.isRTL;
  return (
    <TextInput
      {...rest}
      style={[
        styles.input,
        {
          textAlign: isRtl ? 'right' : 'left',
          writingDirection: isRtl ? 'rtl' : 'ltr',
        },
        style,
      ]}
      placeholderTextColor={
        rest.placeholderTextColor ?? colors.muted
      }
    />
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  input: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: Platform.OS === 'ios' ? 14 : 10,
    color: colors.ink,
    fontSize: 16,
    minHeight: 48,
  },
});
