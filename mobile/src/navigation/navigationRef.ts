import { createNavigationContainerRef } from '@react-navigation/native';
import type { NavigationState, NavigatorScreenParams, PartialState } from '@react-navigation/native';

import type { RootStackParamList } from './RootNavigator';
import type { MainStackParamList } from './MainTabs';

export const navigationRef = createNavigationContainerRef<RootStackParamList>();

export function getActiveRouteName(
  state: NavigationState | PartialState<NavigationState> | undefined,
): string | undefined {
  if (!state?.routes?.length) return undefined;
  const index = state.index ?? 0;
  const route = state.routes[index];
  if (route.state) return getActiveRouteName(route.state);
  return route.name;
}

export function navigateToTab(screen: string) {
  if (!navigationRef.isReady()) return;
  navigationRef.navigate('Main', {
    screen: 'MainTabs',
    params: { screen },
  } as NavigatorScreenParams<MainStackParamList>);
}

export function navigateToMainStack<S extends keyof MainStackParamList>(
  screen: S,
  params?: MainStackParamList[S],
) {
  if (!navigationRef.isReady()) return;
  navigationRef.navigate('Main', { screen, params } as NavigatorScreenParams<MainStackParamList>);
}
