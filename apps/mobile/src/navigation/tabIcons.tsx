import React from 'react';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme';

type IonName = React.ComponentProps<typeof Ionicons>['name'];

export function tabIcon(name: IonName, focusedName?: IonName) {
  return ({
    color,
    size,
    focused,
  }: {
    color: string;
    size: number;
    focused: boolean;
  }) => (
    <Ionicons
      name={focused && focusedName ? focusedName : name}
      size={size}
      color={color || colors.muted}
    />
  );
}
