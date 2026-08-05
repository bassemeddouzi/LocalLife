import React from 'react';
import { ScrollView, Text } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { guideStyles } from './shared/guideStyles';
import { StatusBadge } from './shared/StatusBadge';
import type { GuideActivityStackParamList } from './GuideActivityStack';

type Props = NativeStackScreenProps<
  GuideActivityStackParamList,
  'ActivityDetail'
>;

export function GuideActivityDetailScreen({ route }: Props) {
  const { item } = route.params;
  const rejectReason =
    (item.payload.rejectReason as string | undefined) ??
    (item.payload.rejectionReason as string | undefined) ??
    (item.payload.adminNote as string | undefined);

  return (
    <ScrollView contentContainerStyle={guideStyles.page}>
      <Text style={guideStyles.h1}>{item.title}</Text>
      <Text style={guideStyles.muted}>
        {item.kind} · {new Date(item.createdAt).toLocaleString()}
      </Text>
      <StatusBadge status={item.status} />
      {item.subtitle ? <Text style={guideStyles.body}>{item.subtitle}</Text> : null}
      {rejectReason ? (
        <>
          <Text style={guideStyles.h2}>Admin note</Text>
          <Text style={guideStyles.error}>{rejectReason}</Text>
        </>
      ) : null}
      <Text style={guideStyles.h2}>Details</Text>
      <Text style={guideStyles.muted} selectable>
        {JSON.stringify(item.payload, null, 2)}
      </Text>
    </ScrollView>
  );
}
