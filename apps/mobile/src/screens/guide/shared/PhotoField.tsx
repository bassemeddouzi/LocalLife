import React, { useState } from 'react';
import {
  Alert,
  Pressable,
  Text,
  TextInput,
  View,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { apiFetch } from '../../../api/client';
import { guideStyles } from './guideStyles';

type Props = {
  value: string;
  onChange: (url: string) => void;
  folder?: string;
};

export function PhotoField({ value, onChange, folder = 'guide' }: Props) {
  const [busy, setBusy] = useState(false);
  const [hint, setHint] = useState<string | null>(null);

  const pickAndUpload = async () => {
    setBusy(true);
    setHint(null);
    try {
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) {
        Alert.alert('Photos', 'Allow photo library access to upload.');
        return;
      }
      const picked = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        quality: 0.85,
      });
      if (picked.canceled || !picked.assets[0]) return;
      const asset = picked.assets[0];
      const contentType = asset.mimeType ?? 'image/jpeg';

      let presign: {
        uploadUrl: string;
        publicUrl: string;
        contentType: string;
      };
      try {
        presign = await apiFetch('/v1/media/presign', {
          method: 'POST',
          body: JSON.stringify({ contentType, folder }),
        });
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        setHint(
          'Upload unavailable (R2 not configured). Paste a public image URL below.',
        );
        Alert.alert('Upload unavailable', msg);
        return;
      }

      const blob = await (await fetch(asset.uri)).blob();
      const put = await fetch(presign.uploadUrl, {
        method: 'PUT',
        headers: { 'Content-Type': presign.contentType },
        body: blob,
      });
      if (!put.ok) {
        throw new Error(`Upload failed (${put.status})`);
      }
      onChange(presign.publicUrl);
      setHint('Photo uploaded.');
    } catch (e) {
      Alert.alert('Photo', e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={{ gap: 8 }}>
      <Text style={guideStyles.label}>Photo</Text>
      <TextInput
        style={guideStyles.input}
        placeholder="https://… image URL"
        autoCapitalize="none"
        value={value}
        onChangeText={onChange}
        placeholderTextColor="#5c6f69"
      />
      <Pressable
        style={[guideStyles.btnSecondary, busy && { opacity: 0.6 }]}
        onPress={() => void pickAndUpload()}
        disabled={busy}
      >
        <Text style={guideStyles.btnSecondaryText}>
          {busy ? 'Uploading…' : 'Pick from gallery'}
        </Text>
      </Pressable>
      {hint ? <Text style={guideStyles.muted}>{hint}</Text> : null}
    </View>
  );
}
