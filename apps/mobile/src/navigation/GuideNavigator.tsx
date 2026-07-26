import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { apiFetch } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useCity } from '../context/CityContext';
import { colors } from '../theme';

const Tab = createBottomTabNavigator();

function GuideHome() {
  const { user, signOut } = useAuth();
  const [status, setStatus] = useState('…');
  useEffect(() => {
    void apiFetch<{ status?: string } | null>('/v1/guides/me')
      .then((p) => setStatus(p?.status ?? 'none'))
      .catch(() => setStatus('error'));
  }, []);
  return (
    <ScrollView contentContainerStyle={styles.page}>
      <Text style={styles.h1}>Guide</Text>
      <Text style={styles.muted}>
        {user?.displayName} · {status}
      </Text>
      <Text style={styles.body}>
        Submit places and tips for Admin moderation. Use the same LocalLife app
        as travelers — your role unlocks Guide tools.
      </Text>
      <Pressable style={styles.btnGhost} onPress={() => void signOut()}>
        <Text style={styles.btnGhostText}>Logout</Text>
      </Pressable>
    </ScrollView>
  );
}

function GuideSubmitPlace() {
  const { city } = useCity();
  const [name, setName] = useState('');
  const [summary, setSummary] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (!city) {
      Alert.alert('City', 'City not loaded');
      return;
    }
    setBusy(true);
    try {
      const place = await apiFetch<{ id: string; verificationStatus: string }>(
        '/v1/places',
        {
          method: 'POST',
          body: JSON.stringify({
            cityId: city.id,
            name,
            summary,
            latitude: 33.81,
            longitude: 10.85,
          }),
        },
      );
      Alert.alert('Submitted', `${place.id} · ${place.verificationStatus}`);
      setName('');
      setSummary('');
    } catch (e) {
      Alert.alert('Error', e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.page}>
      <Text style={styles.h1}>Submit place</Text>
      <TextInput
        style={styles.input}
        placeholder="Name"
        value={name}
        onChangeText={setName}
        placeholderTextColor={colors.muted}
      />
      <TextInput
        style={[styles.input, { minHeight: 90 }]}
        placeholder="Summary"
        multiline
        value={summary}
        onChangeText={setSummary}
        placeholderTextColor={colors.muted}
      />
      <Pressable
        style={[styles.btn, busy && { opacity: 0.6 }]}
        onPress={() => void submit()}
        disabled={busy}
      >
        <Text style={styles.btnText}>Submit for review</Text>
      </Pressable>
    </ScrollView>
  );
}

function GuideSubmitTip() {
  const { city } = useCity();
  const [title, setTitle] = useState('');
  const [summary, setSummary] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    setBusy(true);
    try {
      await apiFetch('/v1/guides/tips', {
        method: 'POST',
        body: JSON.stringify({
          cityId: city?.id,
          title,
          summary,
          categoryKey: 'local_tip',
        }),
      });
      Alert.alert('Submitted', 'Tip pending moderation');
      setTitle('');
      setSummary('');
    } catch (e) {
      Alert.alert('Error', e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.page}>
      <Text style={styles.h1}>Submit tip</Text>
      <TextInput
        style={styles.input}
        placeholder="Title"
        value={title}
        onChangeText={setTitle}
        placeholderTextColor={colors.muted}
      />
      <TextInput
        style={[styles.input, { minHeight: 90 }]}
        placeholder="Summary"
        multiline
        value={summary}
        onChangeText={setSummary}
        placeholderTextColor={colors.muted}
      />
      <Pressable
        style={[styles.btn, busy && { opacity: 0.6 }]}
        onPress={() => void submit()}
        disabled={busy}
      >
        <Text style={styles.btnText}>Submit tip</Text>
      </Pressable>
    </ScrollView>
  );
}

function GuideSubmissions() {
  const [places, setPlaces] = useState<
    Array<{ id: string; name: string; verificationStatus: string }>
  >([]);
  useEffect(() => {
    void apiFetch<{ places: typeof places }>('/v1/guides/me/submissions')
      .then((r) => setPlaces(r.places ?? []))
      .catch(() => setPlaces([]));
  }, []);
  return (
    <ScrollView contentContainerStyle={styles.page}>
      <Text style={styles.h1}>Submissions</Text>
      {places.length === 0 ? (
        <Text style={styles.muted}>No place submissions yet</Text>
      ) : (
        places.map((p) => (
          <View key={p.id} style={styles.card}>
            <Text style={styles.cardTitle}>{p.name}</Text>
            <Text style={styles.muted}>{p.verificationStatus}</Text>
          </View>
        ))
      )}
    </ScrollView>
  );
}

export function GuideNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: colors.brand,
        headerStyle: { backgroundColor: colors.bg },
      }}
    >
      <Tab.Screen name="GuideHome" component={GuideHome} options={{ title: 'Home' }} />
      <Tab.Screen
        name="GuidePlace"
        component={GuideSubmitPlace}
        options={{ title: 'Place' }}
      />
      <Tab.Screen name="GuideTip" component={GuideSubmitTip} options={{ title: 'Tip' }} />
      <Tab.Screen
        name="GuideSubs"
        component={GuideSubmissions}
        options={{ title: 'Subs' }}
      />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  page: { padding: 20, gap: 12, backgroundColor: colors.bg, flexGrow: 1 },
  h1: { fontSize: 24, fontWeight: '800', color: colors.ink },
  muted: { color: colors.muted },
  body: { color: colors.ink, lineHeight: 22 },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 14,
    color: colors.ink,
  },
  btn: {
    backgroundColor: colors.brand,
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  btnText: { color: '#fff', fontWeight: '700' },
  btnGhost: { padding: 12, alignItems: 'center' },
  btnGhostText: { color: colors.brand, fontWeight: '600' },
  card: {
    backgroundColor: colors.card,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardTitle: { fontWeight: '700', color: colors.ink },
});
