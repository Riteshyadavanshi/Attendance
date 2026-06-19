import { create } from 'zustand';

import { HR_ROLE_ALIASES, ROLES, type Role } from '../constants/config';

export interface AuthUser {
  id: string;
  email: string;
  roles: Role[];
  organization_id: string;
  employee_id: string | null;
  full_name: string | null;
}

interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  user: AuthUser | null;
  setAuth: (accessToken: string, refreshToken: string, user: AuthUser) => void;
  logout: () => void;
  isHr: () => boolean;
  hasRole: (...roles: Role[]) => boolean;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  accessToken: null,
  refreshToken: null,
  user: null,
  setAuth: (accessToken, refreshToken, user) =>
    set({ accessToken, refreshToken, user }),
  logout: () => set({ accessToken: null, refreshToken: null, user: null }),
  isHr: () => {
    const user = get().user;
    if (!user?.roles) return false;
    return user.roles.some((r) => (HR_ROLE_ALIASES as readonly string[]).includes(r));
  },
  hasRole: (...roles) => {
    const user = get().user;
    if (!user?.roles?.length) return false;
    return roles.some((role) => {
      if (role === ROLES.HR) {
        return user.roles.some((r) => (HR_ROLE_ALIASES as readonly string[]).includes(r));
      }
      return user.roles.includes(role);
    });
  },
}));
