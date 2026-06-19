/**
 * On a physical Android phone (Expo Go), use your PC's LAN IP — not localhost or 10.0.2.2.
 * Set EXPO_PUBLIC_API_BASE_URL in mobile/.env (see .env.example).
 */
export const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_BASE_URL ?? 'http://192.168.0.102:8080';

/** Seed office coordinates (Connaught Place, Delhi) for dev fallback */
export const DEV_OFFICE_COORDS = { latitude: 28.6139, longitude: 77.2090, accuracy: 15 };

export const ROLES = {
  EMPLOYEE: 'employee',
  HR: 'hr',
} as const;

/** Legacy backend role names treated as HR in the app */
export const HR_ROLE_ALIASES = ['hr', 'hr_manager', 'head_hr', 'super_admin'] as const;

export type Role = (typeof ROLES)[keyof typeof ROLES] | (typeof HR_ROLE_ALIASES)[number];

export function isHrRole(roles: string[]): boolean {
  return roles.some((r) => (HR_ROLE_ALIASES as readonly string[]).includes(r));
}
