import React from 'react';
import { Text, View } from 'react-native';
import { guideStyles, statusColors } from './guideStyles';

export function StatusBadge({ status }: { status: string }) {
  const c = statusColors(status);
  return (
    <View style={[guideStyles.badge, { backgroundColor: c.bg }]}>
      <Text style={[guideStyles.badgeText, { color: c.fg }]}>{status}</Text>
    </View>
  );
}
