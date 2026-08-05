import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { colors } from '../../theme';
import { GuideAddHubScreen } from './GuideAddHubScreen';
import { GuidePlaceForm } from './forms/GuidePlaceForm';
import { GuideTipForm } from './forms/GuideTipForm';
import { GuideEventForm } from './forms/GuideEventForm';
import { GuideBusinessForm } from './forms/GuideBusinessForm';
import { GuideExperienceForm } from './forms/GuideExperienceForm';
import { GuideZoneSafetyForm } from './forms/GuideZoneSafetyForm';
import { GuideTransportScenarioForm } from './forms/GuideTransportScenarioForm';

export type GuideAddStackParamList = {
  AddHub: undefined;
  PlaceForm: undefined;
  TipForm: { categoryKey?: string };
  EventForm: undefined;
  BusinessForm: undefined;
  ExperienceForm: undefined;
  ZoneSafetyForm: undefined;
  TransportScenarioForm: undefined;
};

const Stack = createNativeStackNavigator<GuideAddStackParamList>();

export function GuideAddStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: colors.bg },
        headerTintColor: colors.brand,
        contentStyle: { backgroundColor: colors.bg },
      }}
    >
      <Stack.Screen
        name="AddHub"
        component={GuideAddHubScreen}
        options={{ title: 'Add' }}
      />
      <Stack.Screen
        name="PlaceForm"
        component={GuidePlaceForm}
        options={{ title: 'Place' }}
      />
      <Stack.Screen
        name="TipForm"
        component={GuideTipForm}
        options={{ title: 'Tip' }}
      />
      <Stack.Screen
        name="EventForm"
        component={GuideEventForm}
        options={{ title: 'Event' }}
      />
      <Stack.Screen
        name="BusinessForm"
        component={GuideBusinessForm}
        options={{ title: 'Business' }}
      />
      <Stack.Screen
        name="ExperienceForm"
        component={GuideExperienceForm}
        options={{ title: 'Experience' }}
      />
      <Stack.Screen
        name="ZoneSafetyForm"
        component={GuideZoneSafetyForm}
        options={{ title: 'Zone safety' }}
      />
      <Stack.Screen
        name="TransportScenarioForm"
        component={GuideTransportScenarioForm}
        options={{ title: 'Transport' }}
      />
    </Stack.Navigator>
  );
}
