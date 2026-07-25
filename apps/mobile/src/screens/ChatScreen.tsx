import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { CompositeNavigationProp, RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { apiFetch } from '../api/client';
import { useCity } from '../context/CityContext';
import { useAuth } from '../context/AuthContext';
import { colors } from '../theme';
import type { MainTabParamList, RootStackParamList } from '../navigation/types';

type Citation = { entityType: string; entityId: string; rank?: number };
type ChatBubble = {
  id: string;
  role: 'USER' | 'ASSISTANT';
  content: string;
  citations?: Citation[];
  grounding?: string;
  reasons?: string[];
};

type Nav = CompositeNavigationProp<
  BottomTabNavigationProp<MainTabParamList, 'ChatTab'>,
  NativeStackNavigationProp<RootStackParamList>
>;

export function ChatScreen() {
  const { t, i18n } = useTranslation();
  const { city } = useCity();
  const { user } = useAuth();
  const navigation = useNavigation<Nav>();
  const route = useRoute<RouteProp<MainTabParamList, 'ChatTab'>>();
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatBubble[]>([]);
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const presetUsed = useRef(false);

  const ensureConversation = async () => {
    if (conversationId) return conversationId;
    const conv = await apiFetch<{ id: string }>('/v1/ai/conversations', {
      method: 'POST',
      body: JSON.stringify({
        cityId: city?.id,
        title: 'Mobile chat',
      }),
    });
    setConversationId(conv.id);
    return conv.id;
  };

  const send = async (content: string) => {
    if (!content.trim() || !city) return;
    setBusy(true);
    const optimistic: ChatBubble = {
      id: `u-${Date.now()}`,
      role: 'USER',
      content: content.trim(),
    };
    setMessages((m) => [...m, optimistic]);
    setText('');
    try {
      const id = await ensureConversation();
      const res = await apiFetch<{
        message: {
          id: string;
          content: string;
          citations: Citation[];
        };
        grounding: string;
        reasons: string[];
      }>(`/v1/ai/conversations/${id}/messages`, {
        method: 'POST',
        body: JSON.stringify({
          content: content.trim(),
          cityId: city.id,
          locale: user?.locale ?? i18n.language,
        }),
      });
      setMessages((m) => [
        ...m,
        {
          id: res.message.id,
          role: 'ASSISTANT',
          content: res.message.content,
          citations: res.message.citations,
          grounding: res.grounding,
          reasons: res.reasons,
        },
      ]);
    } catch (e) {
      Alert.alert(t('error'), e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => {
    if (route.params?.preset && !presetUsed.current) {
      presetUsed.current = true;
      void send(route.params.preset);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [route.params?.preset]);

  const report = async (messageId: string) => {
    try {
      await apiFetch('/v1/ai/feedback', {
        method: 'POST',
        body: JSON.stringify({
          messageId,
          reason: 'mobile report',
        }),
      });
      Alert.alert('OK');
    } catch (e) {
      Alert.alert(t('error'), e instanceof Error ? e.message : String(e));
    }
  };

  const newChat = () => {
    setConversationId(null);
    setMessages([]);
    presetUsed.current = false;
  };

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={80}
    >
      <View style={styles.topBar}>
        <Pressable onPress={newChat}>
          <Text style={styles.link}>{t('newChat')}</Text>
        </Pressable>
      </View>
      <FlatList
        data={messages}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 16, gap: 10 }}
        renderItem={({ item }) => (
          <View
            style={[
              styles.bubble,
              item.role === 'USER' ? styles.user : styles.assistant,
            ]}
          >
            <Text
              style={
                item.role === 'USER' ? styles.userText : styles.assistantText
              }
            >
              {item.content}
            </Text>
            {item.grounding ? (
              <Text style={styles.meta}>
                {t('grounding')}: {item.grounding}
              </Text>
            ) : null}
            {item.reasons?.length ? (
              <View style={styles.chips}>
                {item.reasons.map((r) => (
                  <Text key={r} style={styles.chip}>
                    {r}
                  </Text>
                ))}
              </View>
            ) : null}
            {item.citations?.length ? (
              <View style={styles.citations}>
                <Text style={styles.meta}>{t('citations')}</Text>
                {item.citations.slice(0, 5).map((c) => (
                  <Pressable
                    key={`${c.entityType}:${c.entityId}`}
                    onPress={() => {
                      if (c.entityType === 'place') {
                        navigation.navigate('PlaceDetail', {
                          placeId: c.entityId,
                        });
                      }
                    }}
                  >
                    <Text style={styles.cite}>
                      {c.entityType} · {c.entityId.slice(0, 8)}
                    </Text>
                  </Pressable>
                ))}
              </View>
            ) : null}
            {item.role === 'ASSISTANT' ? (
              <Pressable onPress={() => void report(item.id)}>
                <Text style={styles.report}>{t('report')}</Text>
              </Pressable>
            ) : null}
          </View>
        )}
      />
      <View style={styles.composer}>
        <TextInput
          style={styles.input}
          placeholder={t('chatHint')}
          placeholderTextColor={colors.muted}
          value={text}
          onChangeText={setText}
          editable={!busy}
        />
        <Pressable
          style={[styles.send, busy && { opacity: 0.5 }]}
          disabled={busy}
          onPress={() => void send(text)}
        >
          <Text style={styles.sendText}>{t('send')}</Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  topBar: { paddingHorizontal: 16, paddingTop: 8 },
  link: { color: colors.brand, fontWeight: '700' },
  bubble: { borderRadius: 14, padding: 12, gap: 6 },
  user: { alignSelf: 'flex-end', backgroundColor: colors.brand, maxWidth: '85%' },
  assistant: {
    alignSelf: 'flex-start',
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    maxWidth: '92%',
  },
  userText: { color: '#fff' },
  assistantText: { color: colors.ink },
  meta: { fontSize: 12, color: colors.muted },
  chips: { gap: 4 },
  chip: {
    alignSelf: 'flex-start',
    backgroundColor: colors.chip,
    color: colors.brandDark,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    overflow: 'hidden',
    fontSize: 12,
  },
  citations: { gap: 2 },
  cite: { color: colors.brand, fontSize: 12 },
  report: { color: colors.danger, fontSize: 12, marginTop: 4 },
  composer: {
    flexDirection: 'row',
    gap: 8,
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.card,
  },
  input: { flex: 1, padding: 10, color: colors.ink },
  send: {
    backgroundColor: colors.brand,
    borderRadius: 10,
    paddingHorizontal: 14,
    justifyContent: 'center',
  },
  sendText: { color: '#fff', fontWeight: '700' },
});
