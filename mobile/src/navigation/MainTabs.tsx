import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { CustomTabBar } from './CustomTabBar';
import { ROLES } from '../constants/config';
import { useTheme } from '../hooks/useTheme';
import { useAuthStore } from '../store/authStore';
import { AttendanceHistoryScreen } from '../screens/employee/AttendanceHistoryScreen';
import { CheckInScreen } from '../screens/employee/CheckInScreen';
import { FaceEnrollScreen } from '../screens/employee/FaceEnrollScreen';
import { HomeScreen } from '../screens/employee/HomeScreen';
import { LeaveScreen } from '../screens/employee/LeaveScreen';
import { ProfileScreen } from '../screens/employee/ProfileScreen';
import { SubmitFeedbackFormScreen } from '../screens/employee/SubmitFeedbackFormScreen';
import { TrainingListScreen } from '../screens/employee/TrainingListScreen';
import { HRDashboardScreen } from '../screens/hr/HRDashboardScreen';
import { EmployeeListScreen } from '../screens/hr/EmployeeListScreen';
import { RegisterEmployeeScreen } from '../screens/hr/RegisterEmployeeScreen';
import { FeedbackFormsListScreen } from '../screens/hr/FeedbackFormsListScreen';
import { CreateFeedbackFormScreen } from '../screens/hr/CreateFeedbackFormScreen';
import { FeedbackFormDashboardScreen } from '../screens/hr/FeedbackFormDashboardScreen';
import { FeedbackFormResponsesScreen } from '../screens/hr/FeedbackFormResponsesScreen';
import { GeofenceConfigScreen } from '../screens/super-admin/GeofenceConfigScreen';
import { AttendanceRulesScreen } from '../screens/hr/AttendanceRulesScreen';
import { LateLeaderboardScreen } from '../screens/hr/LateLeaderboardScreen';
import { LateTodayScreen } from '../screens/hr/LateTodayScreen';

const Tab = createBottomTabNavigator();
const MainStack = createNativeStackNavigator();

export type MainStackParamList = {
  MainTabs: { screen?: string } | undefined;
  FaceEnroll: undefined;
  CheckIn: { mode: 'in' | 'out' };
  GeofenceConfig: undefined;
  RegisterEmployee: undefined;
  EmployeeList: undefined;
  FeedbackFormsList: undefined;
  CreateFeedbackForm: undefined;
  FeedbackFormDashboard: { formId: string; title?: string };
  FeedbackFormResponses: { formId: string; title?: string };
  SubmitFeedbackForm: { formId: string; title?: string };
  AttendanceRules: undefined;
  LateLeaderboard: undefined;
  LateToday: undefined;
};

export type EmployeeStackParamList = MainStackParamList;

function MainTabNavigator() {
  const hasRole = useAuthStore((s) => s.hasRole);
  const { colors } = useTheme();

  return (
    <Tab.Navigator
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{
        headerShown: false,
        sceneStyle: { backgroundColor: colors.background },
      }}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Attendance" component={AttendanceHistoryScreen} />
      <Tab.Screen name="Training" component={TrainingListScreen} />
      <Tab.Screen name="Leave" component={LeaveScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
      {hasRole(ROLES.HR) && <Tab.Screen name="HR" component={HRDashboardScreen} />}
    </Tab.Navigator>
  );
}

export function MainTabs() {
  return (
    <MainStack.Navigator screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
      <MainStack.Screen name="MainTabs" component={MainTabNavigator} />
      <MainStack.Screen name="FaceEnroll" component={FaceEnrollScreen} />
      <MainStack.Screen name="CheckIn" component={CheckInScreen} />
      <MainStack.Screen name="GeofenceConfig" component={GeofenceConfigScreen} />
      <MainStack.Screen name="RegisterEmployee" component={RegisterEmployeeScreen} />
      <MainStack.Screen name="EmployeeList" component={EmployeeListScreen} />
      <MainStack.Screen name="FeedbackFormsList" component={FeedbackFormsListScreen} />
      <MainStack.Screen name="CreateFeedbackForm" component={CreateFeedbackFormScreen} />
      <MainStack.Screen name="FeedbackFormDashboard" component={FeedbackFormDashboardScreen} />
      <MainStack.Screen name="FeedbackFormResponses" component={FeedbackFormResponsesScreen} />
      <MainStack.Screen name="SubmitFeedbackForm" component={SubmitFeedbackFormScreen} />
      <MainStack.Screen name="AttendanceRules" component={AttendanceRulesScreen} />
      <MainStack.Screen name="LateLeaderboard" component={LateLeaderboardScreen} />
      <MainStack.Screen name="LateToday" component={LateTodayScreen} />
    </MainStack.Navigator>
  );
}
