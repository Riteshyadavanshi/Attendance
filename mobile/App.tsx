import React from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { NavigationContainer } from '@react-navigation/native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';

import { AppSidebar } from './src/components/layout/AppSidebar';
import { FeedbackFormPopup } from './src/components/feedback/FeedbackFormPopup';
import { RootNavigator } from './src/navigation/RootNavigator';
import { buildNavigationTheme } from './src/navigation/navigationTheme';
import { navigationRef, getActiveRouteName } from './src/navigation/navigationRef';
import { useTheme } from './src/hooks/useTheme';
import { useAuthStore } from './src/store/authStore';
import { useSidebarStore } from './src/store/sidebarStore';

const queryClient = new QueryClient();

function AppShell() {
  const { isDark } = useTheme();
  const accessToken = useAuthStore((s) => s.accessToken);
  const isHr = useAuthStore((s) => s.isHr);
  const setActiveRoute = useSidebarStore((s) => s.setActiveRoute);
  const navTheme = buildNavigationTheme(isDark);

  return (
    <NavigationContainer
      ref={navigationRef}
      theme={navTheme}
      onReady={() => {
        if (navigationRef.isReady()) {
          setActiveRoute(getActiveRouteName(navigationRef.getRootState()));
        }
      }}
      onStateChange={(state) => setActiveRoute(getActiveRouteName(state))}
    >
      <StatusBar style={isDark ? 'light' : 'dark'} translucent={false} />
      <RootNavigator />
      {accessToken && isHr() ? <AppSidebar /> : null}
      {accessToken && !isHr() ? <FeedbackFormPopup /> : null}
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <AppShell />
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
