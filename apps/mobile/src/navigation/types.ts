import type { NavigatorScreenParams } from '@react-navigation/native';

export type MainTabParamList = {
  HomeTab: undefined;
  ExploreTab: { categoryId?: string } | undefined;
  ChatTab: { preset?: string } | undefined;
  SavedTab: undefined;
  ProfileTab: undefined;
};

export type RootStackParamList = {
  Tabs: NavigatorScreenParams<MainTabParamList> | undefined;
  PlaceDetail: { placeId: string };
};
