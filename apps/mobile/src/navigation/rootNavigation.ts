import { createNavigationContainerRef } from '@react-navigation/native';
import type { RootStackParamList } from './types';

export const navigationRef =
  createNavigationContainerRef<RootStackParamList>();

export function navigateToAiChat(params?: {
  preset?: string;
  mode?: 'plan' | 'info' | 'tips' | 'chat';
  placeId?: string;
  placeName?: string;
}) {
  if (!navigationRef.isReady()) return;
  navigationRef.navigate('Tabs', {
    screen: 'ChatTab',
    params: params ?? undefined,
  });
}
