import type { NavigatorScreenParams } from '@react-navigation/native';

export type ChatHubMode = 'plan' | 'info' | 'tips' | 'chat';

export type MainTabParamList = {
  HomeTab: undefined;
  ChatTab:
    | {
        preset?: string;
        mode?: ChatHubMode;
        placeId?: string;
        placeName?: string;
      }
    | undefined;
  SavedTab: undefined;
  ProfileTab: undefined;
};

export type RootStackParamList = {
  Tabs: NavigatorScreenParams<MainTabParamList> | undefined;
  Search: { categoryId?: string; q?: string } | undefined;
  Notifications: undefined;
  PlaceDetail: { placeId: string };
  PlanTimeline: { planId?: string; packId?: string; dayIndex?: number };
  PlanStepDetail: {
    planTitle: string;
    step: import('../screens/PlanTimelineScreen').PlanStepView;
  };
  RatingTarget: {
    targetType: 'PLACE' | 'CITY' | 'DISTRICT' | 'ZONE' | 'TRANSPORT_SYSTEM';
    targetId: string;
    title: string;
  };
};
