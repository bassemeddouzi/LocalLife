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

function BizHome() {
  const { user, signOut } = useAuth();
  return (
    <ScrollView contentContainerStyle={styles.page}>
      <Text style={styles.h1}>Business</Text>
      <Text style={styles.muted}>{user?.displayName}</Text>
      <Text style={styles.body}>
        Update your profile and claim places. No payments in MVP.
      </Text>
      <Pressable style={styles.btnGhost} onPress={() => void signOut()}>
        <Text style={styles.btnGhostText}>Logout</Text>
      </Pressable>
    </ScrollView>
  );
}

function BizProfile() {
  const [displayName, setDisplayName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    void apiFetch<{
      displayName?: string;
      contactEmail?: string;
      contactPhone?: string;
    } | null>('/v1/business/me').then((p) => {
      if (!p) return;
      setDisplayName(p.displayName ?? '');
      setContactEmail(p.contactEmail ?? '');
      setContactPhone(p.contactPhone ?? '');
    });
  }, []);

  const save = async () => {
    setBusy(true);
    try {
      await apiFetch('/v1/business/profile', {
        method: 'POST',
        body: JSON.stringify({ displayName, contactEmail, contactPhone }),
      });
      Alert.alert('Saved', 'Business profile updated');
    } catch (e) {
      Alert.alert('Error', e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.page}>
      <Text style={styles.h1}>Profile</Text>
      <TextInput
        style={styles.input}
        placeholder="Display name"
        value={displayName}
        onChangeText={setDisplayName}
        placeholderTextColor={colors.muted}
      />
      <TextInput
        style={styles.input}
        placeholder="Contact email"
        autoCapitalize="none"
        value={contactEmail}
        onChangeText={setContactEmail}
        placeholderTextColor={colors.muted}
      />
      <TextInput
        style={styles.input}
        placeholder="Contact phone"
        value={contactPhone}
        onChangeText={setContactPhone}
        placeholderTextColor={colors.muted}
      />
      <Pressable
        style={[styles.btn, busy && { opacity: 0.6 }]}
        onPress={() => void save()}
        disabled={busy}
      >
        <Text style={styles.btnText}>Save</Text>
      </Pressable>
    </ScrollView>
  );
}

function BizClaim() {
  const { city } = useCity();
  const [places, setPlaces] = useState<Array<{ id: string; name: string }>>([]);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!city) return;
    void apiFetch<{ data: Array<{ id: string; name: string }> }>(
      `/v1/places?cityId=${city.id}&pageSize=20`,
      { auth: false },
    )
      .then((r) => setPlaces(r.data ?? []))
      .catch(() => setPlaces([]));
  }, [city]);

  const claim = async (placeId: string) => {
    setBusy(true);
    try {
      await apiFetch('/v1/business/claims', {
        method: 'POST',
        body: JSON.stringify({ placeId }),
      });
      Alert.alert('Claimed', 'Pending Admin review');
    } catch (e) {
      Alert.alert('Error', e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.page}>
      <Text style={styles.h1}>Claim place</Text>
      {places.map((p) => (
        <View key={p.id} style={styles.card}>
          <Text style={styles.cardTitle}>{p.name}</Text>
          <Pressable
            style={[styles.btn, busy && { opacity: 0.6 }]}
            disabled={busy}
            onPress={() => void claim(p.id)}
          >
            <Text style={styles.btnText}>Claim</Text>
          </Pressable>
        </View>
      ))}
    </ScrollView>
  );
}

function BizPlaces() {
  const [places, setPlaces] = useState<
    Array<{ id: string; name: string; verificationStatus?: string }>
  >([]);
  useEffect(() => {
    void apiFetch<typeof places>('/v1/business/places')
      .then(setPlaces)
      .catch(() => setPlaces([]));
  }, []);
  return (
    <ScrollView contentContainerStyle={styles.page}>
      <Text style={styles.h1}>My places</Text>
      {places.length === 0 ? (
        <Text style={styles.muted}>No linked places yet</Text>
      ) : (
        places.map((p) => (
          <View key={p.id} style={styles.card}>
            <Text style={styles.cardTitle}>{p.name}</Text>
            <Text style={styles.muted}>{p.verificationStatus ?? ''}</Text>
          </View>
        ))
      )}
    </ScrollView>
  );
}

export function BusinessNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: colors.brand,
        headerStyle: { backgroundColor: colors.bg },
      }}
    >
      <Tab.Screen name="BizHome" component={BizHome} options={{ title: 'Home' }} />
      <Tab.Screen
        name="BizProfile"
        component={BizProfile}
        options={{ title: 'Profile' }}
      />
      <Tab.Screen name="BizClaim" component={BizClaim} options={{ title: 'Claim' }} />
      <Tab.Screen
        name="BizPlaces"
        component={BizPlaces}
        options={{ title: 'Places' }}
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
    marginTop: 8,
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
    gap: 8,
  },
  cardTitle: { fontWeight: '700', color: colors.ink },
});
