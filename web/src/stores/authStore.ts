import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import { clearAuthCookie, setAuthCookie } from '@/lib/auth-cookie';
import { hasRole, isHrRole } from '@/lib/roles';
import type { Role } from '@/lib/constants';

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
  hydrated: boolean;
  setHydrated: (v: boolean) => void;
  setAuth: (accessToken: string, refreshToken: string, user: AuthUser) => void;
  logout: () => void;
  isHr: () => boolean;
  hasRole: (...roles: Role[]) => boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      accessToken: null,
      refreshToken: null,
      user: null,
      hydrated: false,
      setHydrated: (v) => set({ hydrated: v }),
      setAuth: (accessToken, refreshToken, user) => {
        setAuthCookie(accessToken);
        set({ accessToken, refreshToken, user, hydrated: true });
      },
      logout: () => {
        clearAuthCookie();
        set({ accessToken: null, refreshToken: null, user: null });
      },
      isHr: () => {
        const user = get().user;
        return user?.roles ? isHrRole(user.roles) : false;
      },
      hasRole: (...roles) => {
        const user = get().user;
        return hasRole(user?.roles, ...roles);
      },
    }),
    {
      name: 'hr-attendance-auth',
      partialize: (s) => ({
        accessToken: s.accessToken,
        refreshToken: s.refreshToken,
        user: s.user,
      }),
      onRehydrateStorage: () => (state) => {
        if (state?.accessToken) setAuthCookie(state.accessToken);
        useAuthStore.getState().setHydrated(true);
      },
    },
  ),
);
