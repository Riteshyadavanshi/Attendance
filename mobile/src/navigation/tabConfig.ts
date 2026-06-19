import { ROLES, type Role } from '../constants/config';

export type TabItemDef = {
  name: string;
  label: string;
  icon: string;
  iconFocused: string;
  roles?: Role[];
  bottom?: boolean;
};

export type HrSidebarItem = {
  key: string;
  label: string;
  icon: string;
  tab?: string;
  stackScreen?:
    | 'GeofenceConfig'
    | 'RegisterEmployee'
    | 'EmployeeList'
    | 'FeedbackFormsList'
    | 'AttendanceRules'
    | 'LateLeaderboard'
    | 'LateToday';
};

/** Bottom bar — common screens for all users; HR tab added for HR only */
export const BOTTOM_TABS: TabItemDef[] = [
  { name: 'Home', label: 'Home', icon: 'home-outline', iconFocused: 'home', bottom: true },
  {
    name: 'Attendance',
    label: 'History',
    icon: 'calendar-outline',
    iconFocused: 'calendar',
    bottom: true,
  },
  {
    name: 'Training',
    label: 'Training',
    icon: 'school-outline',
    iconFocused: 'school',
    bottom: true,
  },
  { name: 'Leave', label: 'Leave', icon: 'airplane-outline', iconFocused: 'airplane', bottom: true },
  {
    name: 'Profile',
    label: 'Profile',
    icon: 'person-outline',
    iconFocused: 'person',
    bottom: true,
  },
  {
    name: 'HR',
    label: 'Dashboard',
    icon: 'grid-outline',
    iconFocused: 'grid',
    roles: [ROLES.HR],
    bottom: true,
  },
];

/** Header drawer — HR management only (not common employee screens) */
export const HR_SIDEBAR_ITEMS: HrSidebarItem[] = [
  { key: 'hr-dashboard', label: 'HR Dashboard', icon: 'grid-outline', tab: 'HR' },
  { key: 'employee-list', label: 'All Employees', icon: 'people-outline', stackScreen: 'EmployeeList' },
  {
    key: 'register-employee',
    label: 'Register Employee',
    icon: 'person-add-outline',
    stackScreen: 'RegisterEmployee',
  },
  {
    key: 'feedback-forms',
    label: 'Feedback Forms',
    icon: 'chatbox-ellipses-outline',
    stackScreen: 'FeedbackFormsList',
  },
  {
    key: 'attendance-rules',
    label: 'Work Hours',
    icon: 'time-outline',
    stackScreen: 'AttendanceRules',
  },
  {
    key: 'late-today',
    label: 'Late Today',
    icon: 'alarm-outline',
    stackScreen: 'LateToday',
  },
  {
    key: 'late-leaderboard',
    label: 'Late Leaderboard',
    icon: 'trophy-outline',
    stackScreen: 'LateLeaderboard',
  },
  {
    key: 'geofence',
    label: 'Geofence Settings',
    icon: 'location-outline',
    stackScreen: 'GeofenceConfig',
  },
];

export function visibleBottomTabs(hasRole: (...roles: Role[]) => boolean) {
  return BOTTOM_TABS.filter((tab) => {
    if (!tab.bottom) return false;
    if (!tab.roles) return true;
    return hasRole(...tab.roles);
  });
}

/** @deprecated Use visibleBottomTabs — kept for Metro cache / legacy imports */
export function visibleTabs(hasRole: (...roles: Role[]) => boolean, where: 'bottom' | 'sidebar' = 'bottom') {
  if (where === 'sidebar') {
    return hasRole(ROLES.HR) ? BOTTOM_TABS.filter((t) => t.roles) : [];
  }
  return visibleBottomTabs(hasRole);
}

export function visibleSidebarActions(hasRole: (...roles: Role[]) => boolean) {
  if (!hasRole(ROLES.HR)) return [];
  return HR_SIDEBAR_ITEMS.filter((item) => item.stackScreen);
}

export const TAB_BAR_HEIGHT = 64;
