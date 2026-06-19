import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import type { NavigatorScreenParams } from '@react-navigation/native';

import { useAuthStore } from '../store/authStore';
import { LoginScreen } from '../screens/auth/LoginScreen';
import { MainTabs, type MainStackParamList } from './MainTabs';

export type RootStackParamList = {
  Login: undefined;
  Main: NavigatorScreenParams<MainStackParamList>;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export function RootNavigator() {
  const accessToken = useAuthStore((s) => s.accessToken);

  return (
    <Stack.Navigator
      screenOptions={{ headerShown: false }}
      key={accessToken ? 'main' : 'auth'}
    >
      {accessToken ? (
        <Stack.Screen name="Main" component={MainTabs} />
      ) : (
        <Stack.Screen name="Login" component={LoginScreen} />
      )}
    </Stack.Navigator>
  );
}
